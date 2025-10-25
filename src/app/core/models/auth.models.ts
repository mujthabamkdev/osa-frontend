import type { User, UserRole } from './user.models';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token?: string;
  token_type?: string;
  refresh_token?: string;
  token?: string;
  user?: User;
}

export interface RegistrationResponse {
  message: string;
  user_id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface TokenPayload {
  sub: string;
  exp: number;
}

export type { UserRole };
