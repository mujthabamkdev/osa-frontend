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
