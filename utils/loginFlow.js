const { isValidLogin } = require('./authUtils');

function fakeApiLogin(ci, password) {
  if (ci === '1234567' && password === 'mypassword') {
    return Promise.resolve({ token: 'mock-token-123' });
  }
  return Promise.reject(new Error('Invalid credentials'));
}

async function loginUser(ci, password) {
  if (!isValidLogin(ci, password)) {
    throw new Error('Validation failed');
  }
  // Use fakeApiLogin for testing
  return await fakeApiLogin(ci, password);
}

module.exports = { loginUser };