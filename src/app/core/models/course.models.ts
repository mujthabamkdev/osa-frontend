export interface Course {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  created_at: string;
}

export interface CourseLevel {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order: number;
  created_at: string;
}

export interface CourseClass {
  id: number;
  course_id: number;
  level_id: number;
  title: string;
  description: string;
  order: number;
  attachments?: CourseAttachment[];
  quizzes?: CourseQuiz[];
  created_at: string;
}

export interface CourseAttachment {
  id: number;
  course_id: number;
  level_id?: number;
  class_id?: number;
  title: string;
  description: string;
  file_url: string;
  file_type: string;
  source: string;
  file_size?: number;
  duration?: number;
  uploaded_at: string;
}

export interface CourseQuiz {
  id: number;
  level_id?: number;
  class_id?: number;
  title: string;
  description?: string;
  passing_score: number;
  created_at: string;
}

export interface EnrolledCourseWithLevels {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: "not-started" | "in-progress" | "completed";
  lastAccessed: string;
  instructor?: string;
  levels: CourseLevel[];
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
