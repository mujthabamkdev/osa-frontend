import { CourseAttachment, CourseQuiz } from './course.models';
export interface DashboardTotals {
  users: number;
  activeUsers: number;
  students: number;
  teachers: number;
  parents: number;
  admins: number;
  courses: number;
  enrollments: number;
}

export interface DashboardActive {
  students: number;
  teachers: number;
}

export interface DashboardStats {
  totals: DashboardTotals;
  active: DashboardActive;
  unansweredQuestions: number;
  systemHealth: string;
  generatedAt: string;
}

export interface StudentStats {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalProgress: number;
  hoursStudied: number;
}

export interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  lastAccessed: string;
  instructor?: string;
  levels?: CourseLevel[];
  totalLevels?: number;
  completedLevels?: number;
  active_class_id?: number;
  active_class_title?: string;
  active_class_year?: number;
}

export interface CourseLevel {
  id: number;
  course_id: number;
  title: string;
  description: string;
  order: number;
  progress?: number;
  classes?: CourseClass[];
  created_at: string;
}

export interface CourseClass {
  id: number;
  course_id: number;
  level_id: number;
  title: string;
  description: string;
  order: number;
  progress?: number;
  completed?: boolean;
  attachments?: CourseAttachment[];
  quizzes?: CourseQuiz[];
  created_at: string;
}

export interface StudentProgress {
  course_id: number;
  course_title: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  last_accessed: string;
  active_class_id?: number;
  active_class_title?: string;
  active_class?: {
    id: number | null;
    name?: string | null;
    year?: number | null;
  } | null;
  // Optional fields for flexibility
  id?: number;
  title?: string;
  description?: string;
  teacher_id?: number;
  enrolled_at?: string;
}

export interface TeacherStats {
  totalCourses: number;
  totalStudents: number;
  averageProgress: number;
}

export interface ParentChild {
  id: number;
  name: string;
  enrolledCourses: number;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  course_id?: number;
  created_at: string;
  updated_at: string;
}
