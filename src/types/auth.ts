 export interface User {
  id: string;
  name: string;
  email: string;
  provider: string;
  role: 'adopter' | 'admin';
  token?: string;
  avatar?: string;
}

export type AuthMode = 'login' | 'register';
