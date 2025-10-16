// src/app/core/models/auth.models.ts
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
  access_token: string;
  token_type: string;
}

export interface TokenPayload {
  sub: string;
  exp: number;
}

export type UserRole = "admin" | "teacher" | "student" | "parent";

// src/app/core/models/user.models.ts
export interface User {
  id: number;
  email: string;
  role: "admin" | "teacher" | "student" | "parent";
  is_active: boolean;
  created_at: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: "admin" | "teacher" | "student" | "parent";
}

export interface UserResponse {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// src/app/core/models/course.models.ts
export interface Course {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  created_at: string;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
}

export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  created_at: string;
}

// src/app/core/models/enrollment.models.ts
export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  enrolled_at: string;
  progress: number;
  status: "active" | "completed" | "dropped";
}

export interface EnrollmentRequest {
  course_id: number;
}

// src/app/core/models/dashboard.models.ts
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  activeStudents: number;
  activeTeachers: number;
  totalEnrollments: number;
}

export interface TeacherStats {
  total_courses: number;
  total_students: number;
  active_courses: number;
  pending_assignments: number;
}

export interface ParentChildInfo {
  childId: number;
  name: string;
  courses: Course[];
  overall_progress: number;
  recent_activity: string;
}
