export interface User {
  id: number;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
}

export interface UserResponse {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}