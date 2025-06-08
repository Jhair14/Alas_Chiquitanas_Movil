import asyncio
import websockets
import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Set, List
import ssl
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class WebSocketServer:
    def __init__(self):
        # Store connected clients with their user info
        self.connected_clients: Dict[str, dict] = {}
        # Store user sessions
        self.user_sessions: Dict[str, Set[str]] = {}
        # Store message history
        self.message_history: Dict[str, List[dict]] = {}
        
    async def register_client(self, websocket, client_id: str):
        """Register a new client connection"""
        self.connected_clients[client_id] = {
            'websocket': websocket,
            'user_id': None,
            'user_name': None,
            'entity': None,
            'connected_at': datetime.now(),
            'authenticated': False
        }
        logger.info(f"🟢 Client registered: {client_id} from {websocket.remote_address}")
    
    async def authenticate_user(self, client_id: str, user_data: dict):
        """Authenticate a user and update their session"""
        if client_id not in self.connected_clients:
            return False
        
        user_id = user_data.get('user_id')
        user_name = user_data.get('user_name')
        entity = user_data.get('entity', '')
        
        if not user_id or not user_name:
            return False
        
        # Update client info
        self.connected_clients[client_id].update({
            'user_id': user_id,
            'user_name': user_name,
            'entity': entity,
            'authenticated': True
        })
        
        # Track user sessions
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = set()
        self.user_sessions[user_id].add(client_id)
        
        # Send message history to newly authenticated user
        if client_id in self.connected_clients:
            for zone, messages in self.message_history.items():
                history_msg = {
                    "type": "chat_history",
                    "zone": zone,
                    "messages": messages
                }
                await self.connected_clients[client_id]['websocket'].send(json.dumps(history_msg))
        
        logger.info(f"✅ User authenticated: {user_name} ({user_id}) - Client: {client_id}")
        return True
    
    async def unregister_client(self, client_id: str):
        """Unregister a client and clean up sessions"""
        if client_id in self.connected_clients:
            client_info = self.connected_clients[client_id]
            user_id = client_info.get('user_id')
            
            # Remove from user sessions
            if user_id and user_id in self.user_sessions:
                self.user_sessions[user_id].discard(client_id)
                if not self.user_sessions[user_id]:
                    del self.user_sessions[user_id]
            
            del self.connected_clients[client_id]
            logger.info(f"🔴 Client unregistered: {client_id}")
    
    async def broadcast_message(self, message_data: dict, sender_client_id: str = None):
        """Broadcast message to all authenticated clients"""
        if not all(k in message_data for k in ["user_name", "message"]):
            logger.error("❌ Invalid message format")
            return False
        
        broadcast_data = {
            "type": "chat_message",
            "user_id": message_data.get("user_id"),
            "user_name": message_data["user_name"],
            "entity": message_data.get("entity", ""),
            "message": message_data["message"],
            "timestamp": datetime.now().isoformat()
        }
        
        # Store message in history
        zone = message_data.get("zone", "default")
        if zone not in self.message_history:
            self.message_history[zone] = []
        self.message_history[zone].append(broadcast_data)
        
        # Keep only last 100 messages per zone
        if len(self.message_history[zone]) > 100:
            self.message_history[zone] = self.message_history[zone][-100:]
        
        message_json = json.dumps(broadcast_data)
        logger.info(f"📤 Broadcasting message from {message_data['user_name']}")
        
        # Send to all authenticated clients
        disconnected_clients = []
        for client_id, client_info in self.connected_clients.items():
            if client_info['authenticated']:
                try:
                    await client_info['websocket'].send(message_json)
                except websockets.exceptions.ConnectionClosed:
                    disconnected_clients.append(client_id)
                except Exception as e:
                    logger.error(f"Error sending to client {client_id}: {e}")
                    disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            await self.unregister_client(client_id)
        
        return True
    
    async def send_to_user(self, user_id: str, message_data: dict):
        """Send message to specific user (all their active sessions)"""
        if user_id not in self.user_sessions:
            return False
        
        message_json = json.dumps(message_data)
        sent_count = 0
        
        for client_id in self.user_sessions[user_id].copy():
            if client_id in self.connected_clients:
                try:
                    await self.connected_clients[client_id]['websocket'].send(message_json)
                    sent_count += 1
                except:
                    await self.unregister_client(client_id)
        
        return sent_count > 0
    
    async def handle_client(self, websocket, path):
        """Handle individual client connections"""
        client_id = str(uuid.uuid4())
        await self.register_client(websocket, client_id)
        
        try:
            # Send welcome message
            welcome_msg = {
                "type": "connection_established",
                "client_id": client_id,
                "message": "Connected to WebSocket server"
            }
            await websocket.send(json.dumps(welcome_msg))
            
            # Handle incoming messages
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.process_message(client_id, data)
                except json.JSONDecodeError:
                    logger.error(f"Invalid JSON from client {client_id}")
                    error_msg = {
                        "type": "error",
                        "message": "Invalid JSON format"
                    }
                    await websocket.send(json.dumps(error_msg))
                except Exception as e:
                    logger.error(f"Error processing message from {client_id}: {e}")
        
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Connection closed for client {client_id}")
        except Exception as e:
            logger.error(f"Unexpected error for client {client_id}: {e}")
        finally:
            await self.unregister_client(client_id)
    
    async def process_message(self, client_id: str, data: dict):
        """Process incoming messages from clients"""
        message_type = data.get("type")
        
        if message_type == "authenticate":
            success = await self.authenticate_user(client_id, data)
            response = {
                "type": "auth_response",
                "success": success,
                "message": "Authentication successful" if success else "Authentication failed"
            }
            if client_id in self.connected_clients:
                await self.connected_clients[client_id]['websocket'].send(json.dumps(response))
        
        elif message_type == "chat_message":
            client_info = self.connected_clients.get(client_id)
            if not client_info or not client_info['authenticated']:
                error_msg = {
                    "type": "error",
                    "message": "Not authenticated"
                }
                await self.connected_clients[client_id]['websocket'].send(json.dumps(error_msg))
                return
            
            # Add user info to message
            message_data = {
                "user_id": client_info['user_id'],
                "user_name": client_info['user_name'],
                "entity": client_info['entity'],
                "message": data.get("message", "")
            }
            await self.broadcast_message(message_data, client_id)
        
        elif message_type == "ping":
            # Respond to ping for connection health check
            pong_msg = {
                "type": "pong",
                "timestamp": datetime.now().isoformat()
            }
            if client_id in self.connected_clients:
                await self.connected_clients[client_id]['websocket'].send(json.dumps(pong_msg))
        
        else:
            logger.warning(f"Unknown message type: {message_type} from client {client_id}")

# Global server instance
server_instance = WebSocketServer()

async def main():
    # Configuration
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT', 8000))
    
    # SSL Configuration (optional but recommended for production)
    ssl_context = None
    if os.getenv('SSL_CERT_PATH') and os.getenv('SSL_KEY_PATH'):
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain(
            os.getenv('SSL_CERT_PATH'),
            os.getenv('SSL_KEY_PATH')
        )
        logger.info("🔒 SSL enabled")
    
    logger.info(f"🚀 Starting WebSocket server on {HOST}:{PORT}")
    
    # Start the server
    async with websockets.serve(
        server_instance.handle_client,
        HOST,
        PORT,
        ssl=ssl_context,
        ping_interval=30,  # Send ping every 30 seconds
        ping_timeout=10,   # Wait 10 seconds for pong
        close_timeout=10   # Wait 10 seconds before force closing
    ):
        logger.info(f"✅ WebSocket server ready on ws{'s' if ssl_context else ''}://{HOST}:{PORT}")
        
        # Keep the server running
        try:
            await asyncio.Future()  # Run forever
        except KeyboardInterrupt:
            logger.info("👋 Server stopped by user")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("\n👋 Server stopped")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")
        raise