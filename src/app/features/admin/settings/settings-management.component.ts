import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AdminSettings } from '../../../core/models/admin.models';

interface SummarySettings {
  feature_flags: Record<string, boolean>;
  role_permissions: Record<string, Record<string, boolean>>;
}

@Component({
  selector: 'app-admin-settings',
  templateUrl: './settings-management.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isDirty = signal(false);

  readonly settings = signal<AdminSettings | null>(null);
  readonly localSettings = signal<SummarySettings | null>(null);

  readonly featureKeys = computed(() => Object.keys(this.localSettings()?.feature_flags ?? {}));
  readonly roles = computed(() => Object.keys(this.localSettings()?.role_permissions ?? {}));
  readonly permissionKeys = computed(() => {
    const current = this.localSettings();
    if (!current) {
      return {} as Record<string, string[]>;
    }
    return Object.fromEntries(
      Object.entries(current.role_permissions).map(([role, permissions]) => [
        role,
        Object.keys(permissions),
      ]),
    );
  });

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading.set(true);
    this.apiService.getAdminSettings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.localSettings.set(this.cloneSettings(settings));
        this.isDirty.set(false);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load admin settings', error);
        this.loading.set(false);
      },
    });
  }

  updateFeatureFlag(key: string, enabled: boolean): void {
    this.localSettings.update((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        feature_flags: {
          ...current.feature_flags,
          [key]: enabled,
        },
      };
    });
    this.isDirty.set(true);
  }

  updateRolePermission(role: string, key: string, enabled: boolean): void {
    this.localSettings.update((current) => {
      if (!current) {
        return current;
      }
      const rolePermissions = current.role_permissions[role] ?? {};
      return {
        ...current,
        role_permissions: {
          ...current.role_permissions,
          [role]: {
            ...rolePermissions,
            [key]: enabled,
          },
        },
      };
    });
    this.isDirty.set(true);
  }

  saveSettings(): void {
    const draft = this.localSettings();
    if (!draft || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.apiService
      .updateAdminSettings({
        feature_flags: draft.feature_flags,
        role_permissions: draft.role_permissions,
      })
      .subscribe({
        next: (updated) => {
          this.settings.set(updated);
          this.localSettings.set(this.cloneSettings(updated));
          this.isDirty.set(false);
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Failed to update admin settings', error);
          this.saving.set(false);
        },
      });
  }

  resetSettings(): void {
    if (this.saving()) {
      return;
    }
    this.saving.set(true);
    this.apiService.resetAdminSettings().subscribe({
      next: (defaults) => {
        this.settings.set(defaults);
        this.localSettings.set(this.cloneSettings(defaults));
        this.isDirty.set(false);
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Failed to reset admin settings', error);
        this.saving.set(false);
      },
    });
  }

  formatKey(value: string): string {
    return value
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private cloneSettings(settings: AdminSettings): SummarySettings {
    return {
      feature_flags: { ...settings.feature_flags },
      role_permissions: Object.fromEntries(
        Object.entries(settings.role_permissions).map(([role, permissions]) => [
          role,
          { ...permissions },
        ]),
      ),
    };
  }
}
