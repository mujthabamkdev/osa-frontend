export interface AdminSettings {
  feature_flags: Record<string, boolean>;
  role_permissions: Record<string, Record<string, boolean>>;
}

export interface AdminSettingsUpdate {
  feature_flags?: Record<string, boolean>;
  role_permissions?: Record<string, Record<string, boolean>>;
}
