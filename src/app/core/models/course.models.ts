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