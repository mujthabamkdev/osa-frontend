// src/app/core/models/school.models.ts

export interface Class {
  id: number;
  course_id: number;
  year: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateClassRequest {
  course_id: number;
  year: number;
  name: string;
  is_active?: boolean;
}

export interface Subject {
  id: number;
  class_id: number;
  name: string;
  description?: string;
  instructor_id?: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateSubjectRequest {
  class_id: number;
  name: string;
  description?: string;
  instructor_id?: number;
  is_active?: boolean;
}

export interface Session {
  id: number;
  subject_id: number;
  title: string;
  description?: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateSessionRequest {
  subject_id: number;
  title: string;
  description?: string;
  order: number;
  is_active?: boolean;
}

export interface SessionContent {
  id: number;
  session_id: number;
  title: string;
  content_type: 'video' | 'document' | 'audio' | 'text';
  content_url?: string;
  content_text?: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateSessionContentRequest {
  session_id: number;
  title: string;
  content_type: 'video' | 'document' | 'audio' | 'text';
  content_url?: string;
  content_text?: string;
  order: number;
  is_active?: boolean;
}

export interface Timetable {
  id: number;
  class_id: number;
  subject_id: number;
  day_of_week: number; // 0-6 (Monday-Sunday)
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface CreateTimetableRequest {
  class_id: number;
  subject_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active?: boolean;
}

export interface ClassProgress {
  id: number;
  student_id: number;
  session_id: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress_percentage: number;
  last_accessed_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface CreateClassProgressRequest {
  student_id: number;
  session_id: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  progress_percentage?: number;
}
