import type { UserRole } from './user.models';

export interface ScheduleConfig {
  max_lessons_per_day: number;
}

export interface AdminSettings {
  feature_flags: Record<string, boolean>;
  role_permissions: Record<string, Record<string, boolean>>;
  schedule_config: ScheduleConfig;
}

export interface AdminSettingsUpdate {
  feature_flags?: Record<string, boolean>;
  role_permissions?: Record<string, Record<string, boolean>>;
  schedule_config?: ScheduleConfig;
}

export interface PendingUser {
  id: number;
  email: string;
  full_name?: string | null;
  role: UserRole;
  created_at: string;
}

export interface CourseAssignmentPayload {
  course_id: number;
  class_id?: number | null;
}

export interface ApproveUserPayload {
  course_assignments?: CourseAssignmentPayload[];
  child_ids?: number[];
  activate?: boolean;
}

export interface AdminEnrollmentSummary {
  id: number;
  course_id: number;
  course_title: string;
  class_id?: number | null;
  class_name?: string | null;
  enrolled_at: string;
}

export interface StudentAdmin {
  id: number;
  email: string;
  full_name?: string | null;
  created_at: string;
  enrollments: AdminEnrollmentSummary[];
}

export interface UpdateStudentEnrollmentsPayload {
  course_assignments: CourseAssignmentPayload[];
}

export interface ParentChildSummary {
  id: number;
  email: string;
  full_name?: string | null;
}

export interface AdminParent {
  id: number;
  email: string;
  full_name?: string | null;
  created_at: string;
  children: ParentChildSummary[];
}

export interface UpdateParentChildrenPayload {
  child_ids: number[];
}
