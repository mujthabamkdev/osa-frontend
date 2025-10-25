export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: number;
  email: string;
  full_name?: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name?: string | null;
  role: UserRole;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  full_name?: string | null;
  role?: UserRole;
  is_active?: boolean;
}

export type UserResponse = User;
