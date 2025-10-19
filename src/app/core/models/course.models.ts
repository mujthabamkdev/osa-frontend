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
  status: 'not-started' | 'in-progress' | 'completed';
  lastAccessed: string;
  instructor?: string;
  levels: CourseLevel[];
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  teacher_id?: number;
}

export interface CourseResponse {
  id: number;
  title: string;
  description: string;
  teacher_id: number;
  created_at: string;
}

export interface CourseSubject {
  id: number;
  course_id: number;
  name: string;
  description: string;
  instructor_id?: number | null;
  order_in_course: number;
  lessons?: CourseLesson[];
}

export interface CourseSubjectPayload {
  course_id: number;
  name: string;
  description?: string;
  instructor_id?: number | null;
  order_in_course: number;
}

export interface CourseLesson {
  id: number;
  subject_id: number;
  title: string;
  description?: string | null;
  scheduled_date?: string | null;
  order_in_subject: number;
  contents?: CourseLessonContent[];
}

export interface CourseLessonPayload {
  subject_id: number;
  title: string;
  description?: string | null;
  scheduled_date?: string | null;
  order_in_subject: number;
}

export interface CourseLessonContent {
  id: number;
  lesson_id: number;
  title: string;
  content_type: string;
  content_url?: string | null;
  content_text?: string | null;
  order_in_lesson: number;
}

export interface CourseLessonContentPayload {
  lesson_id: number;
  title: string;
  content_type: string;
  content_url?: string | null;
  content_text?: string | null;
  order_in_lesson: number;
}

export interface CourseDetails extends CourseResponse {
  description: string;
  teacher?: {
    id: number;
    email: string;
    full_name?: string | null;
  } | null;
  subjects: CourseSubject[];
  live_classes?: Array<{
    id: number;
    title: string;
    description: string;
    scheduled_date: string;
    start_time: string;
    end_time: string;
    meeting_link?: string | null;
  }>;
}
