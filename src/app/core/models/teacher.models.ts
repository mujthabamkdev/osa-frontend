export interface TeacherOverview {
  total_students: number;
  total_subjects: number;
  total_courses: number;
  upcoming_live_classes: number;
  pending_questions: number;
}

export interface TeacherStudent {
  id: number;
  email: string;
  full_name: string | null;
  course_id: number;
  course_title: string;
}

export interface TeacherSubject {
  id: number;
  name: string;
  course_id: number;
  course_title: string;
}

export interface Exam {
  id: number;
  title: string;
  description: string;
  course_id: number;
  subject_id: number | null;
  teacher_id: number;
  scheduled_date: string | null;
  duration_minutes: number | null;
  max_score: number | null;
  is_published: boolean;
  created_at: string;
}

export interface ExamCreateRequest {
  title: string;
  description?: string;
  course_id: number;
  subject_id?: number | null;
  scheduled_date?: string | null;
  duration_minutes?: number | null;
  max_score?: number | null;
}

export interface ExamResult {
  id: number;
  exam_id: number;
  student_id: number;
  score: number;
  max_score: number | null;
  status: string | null;
  feedback: string | null;
  published_at: string | null;
  created_at: string;
}

export interface ExamResultPayload {
  student_id: number;
  score: number;
  max_score?: number | null;
  status?: string | null;
  feedback?: string | null;
  published_at?: string | null;
}

export interface TeacherLiveClass {
  id: number;
  course_id: number;
  teacher_id: number;
  title: string;
  description: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link: string | null;
  chapter_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface LiveClassCreateRequest {
  course_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  meeting_link?: string | null;
  chapter_id?: number | null;
}

export interface LessonQuestion {
  id: number;
  lesson_id: number;
  question: string;
  student_id: number | null;
  asked_by?: number | null;
  is_anonymous: boolean;
  created_at: string;
  answer: string | null;
  answered_by: number | null;
  answered_at: string | null;
}

export interface LessonAnswerPayload {
  answer: string;
}

export interface LessonQuestionPayload {
  question: string;
  is_anonymous?: boolean;
}

export interface LessonAnswer {
  id: number;
  question_id: number;
  teacher_id: number;
  answer: string;
  created_at: string;
}

export interface StudentProgressEntry {
  session_id: number;
  session_title: string;
  subject_name: string;
  completed: boolean;
  score: number | null;
  completed_at: string | null;
}

export interface StudentReport {
  student_id: number;
  student_email: string;
  student_name: string | null;
  progress: StudentProgressEntry[];
  exams: ExamResult[];
}

export interface StudentExamResult {
  exam_id: number;
  title: string;
  description: string;
  scheduled_date: string | null;
  score: number | null;
  max_score: number | null;
  status: string | null;
  feedback: string | null;
  published_at: string | null;
  course_id: number;
  course_title: string;
}
