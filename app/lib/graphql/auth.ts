import { gql } from '@apollo/client';


export const AUTENTICAR_USUARIO = gql`
  mutation AutenticarUsuario($input: inputAutenticar) {
    autenticarUsuario(input: $input) {
      token
    }
  }
`;

export const OBTENER_USUARIO = gql`
  query ObtenerUsuario($token: String) {
    obtenerUsuario(token: $token) {
      id
      nombre
      apellido
      ci
      email
      rol
      entidad_perteneciente
      genero
    }
  }
`;


export const GET_TODOS_LOS_REPORTES = gql`
  query {
    obtenerReportes {
      id
      nombre_lugar
      gravedad_incendio
      comentario_adicional
      ubicacion {
        coordinates
      }
    }
  }
`;


