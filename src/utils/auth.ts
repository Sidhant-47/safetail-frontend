
import type { User } from '../types/auth';

const AUTH_STORAGE_KEY = 'safetail_auth_user_v1';
const API_URL = 'http://localhost:8080/api/auth';

interface AuthResponse {
  message: string;
  userId?: string;
  fullName?: string;
  email?: string;
  role?: 'adopter' | 'admin';
  token?: string;
}

async function postAuth(
  endpoint: string,
  body: Record<string, string>
): Promise<AuthResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Cannot connect to Safetail server. Make sure the backend is running.'
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || 'Authentication failed. Please try again.'
    );
  }

  return data as AuthResponse;
}

function saveUser(user: User): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function getCurrentUser(): User | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as User) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: User | null): void {
  if (user) {
    saveUser(user);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function toUser(data: AuthResponse): User {
  if (
    !data.userId ||
    !data.fullName ||
    !data.email ||
    !data.role ||
    !data.token
  ) {
    throw new Error('The server returned an incomplete login response.');
  }

  return {
    id: data.userId,
    name: data.fullName,
    email: data.email,
    provider: 'local',
    role: data.role,
    token: data.token,
  };
}

export async function loginWithLocal(
  email: string,
  password: string
): Promise<User> {
  const data = await postAuth('login', {
    email: email.trim().toLowerCase(),
    password,
  });

  const user = toUser(data);
  saveUser(user);
  return user;
}

export async function registerWithLocal(
  name: string,
  email: string,
  password: string
): Promise<User> {
  await postAuth('register', {
    fullName: name.trim(),
    email: email.trim().toLowerCase(),
    password,
  });

  return loginWithLocal(email, password);
}

export async function loginWithGoogle(
  credential: string
): Promise<User> {
  const data = await postAuth('google', { credential });

  const user = toUser(data);
  user.provider = 'google';

  saveUser(user);
  return user;
}

export function logoutUser(): void {
  setCurrentUser(null);
}
