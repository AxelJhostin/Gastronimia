import { Usuario, LoginCredentials, RegisterDTO } from '@/types/auth';

let mockUsuarios: Usuario[] = [
  { id: '1', nombre: 'Admin General', email: 'admin@gastro.com', rol: 'ADMIN' },
];

export const authService = {
  login: async (credentials: LoginCredentials): Promise<Usuario> => {
    await new Promise((res) => setTimeout(res, 300));
    const user = mockUsuarios.find((u) => u.email === credentials.email);
    if (!user) throw new Error('Credenciales inválidas');
    return user;
  },

  register: async (data: RegisterDTO): Promise<Usuario> => {
    await new Promise((res) => setTimeout(res, 300));
    const existe = mockUsuarios.some((u) => u.email === data.email);
    if (existe) throw new Error('El correo electrónico ya está registrado');

    const nuevoUsuario: Usuario = {
      id: String(Date.now()),
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
    };

    mockUsuarios.push(nuevoUsuario);
    return nuevoUsuario;
  },
};