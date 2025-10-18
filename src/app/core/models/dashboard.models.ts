export interface DashboardStats {
  totalCourses: number;
  activeStudents: number;
  activeTeachers: number;
  totalEnrollments: number;
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
  attachments?: any[];
  quizzes?: any[];
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
