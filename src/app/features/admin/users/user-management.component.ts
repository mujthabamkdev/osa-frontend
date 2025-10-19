import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserRole,
} from '../../../core/models/user.models';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserManagementComponent implements OnInit {
  private readonly apiService = inject(ApiService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(false);
  readonly formSaving = signal(false);

  readonly showUserModal = signal(false);
  readonly modalMode = signal<'create' | 'edit'>('create');
  readonly editingUserId = signal<number | null>(null);

  readonly userForm = signal<CreateUserRequest>({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    is_active: true,
  });

  readonly modalTitle = computed(() =>
    this.modalMode() === 'create' ? 'Create New User' : 'Edit User'
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);
    this.apiService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load users', error);
        this.loading.set(false);
        this.users.set([]);
      },
    });
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.editingUserId.set(null);
    this.userForm.set({
      email: '',
      password: '',
      full_name: '',
      role: 'student',
      is_active: true,
    });
    this.showUserModal.set(true);
  }

  editUser(user: User): void {
    this.modalMode.set('edit');
    this.editingUserId.set(user.id);
    this.userForm.set({
      email: user.email,
      password: '',
      full_name: user.full_name ?? '',
      role: user.role,
      is_active: user.is_active,
    });
    this.showUserModal.set(true);
  }

  saveUser(): void {
    if (this.formSaving()) {
      return;
    }
    const mode = this.modalMode();
    if (mode === 'create') {
      this.createUser();
    } else {
      this.updateUser();
    }
  }

  private createUser(): void {
    this.formSaving.set(true);
    this.apiService.createUser(this.userForm()).subscribe({
      next: () => {
        this.formSaving.set(false);
        this.showUserModal.set(false);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Failed to create user', error);
        this.formSaving.set(false);
      },
    });
  }

  private updateUser(): void {
    const userId = this.editingUserId();
    if (!userId) {
      return;
    }
    const form = this.userForm();
    const payload: UpdateUserRequest = {
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      is_active: form.is_active,
    };
    if (form.password && form.password.trim().length) {
      payload.password = form.password.trim();
    }

    this.formSaving.set(true);
    this.apiService.updateUser(userId, payload).subscribe({
      next: () => {
        this.formSaving.set(false);
        this.showUserModal.set(false);
        this.loadUsers();
      },
      error: (error) => {
        console.error('Failed to update user', error);
        this.formSaving.set(false);
      },
    });
  }

  toggleUserStatus(user: User): void {
    this.apiService.toggleUserStatus(user.id).subscribe({
      next: (updated) => {
        this.users.update((current) =>
          current.map((existing) => (existing.id === updated.id ? updated : existing))
        );
      },
      error: (error) => console.error('Failed to toggle user status', error),
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Delete user ${user.email}? This action cannot be reversed.`)) {
      return;
    }
    this.apiService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (error) => console.error('Failed to delete user', error),
    });
  }

  updateUserField<K extends keyof CreateUserRequest>(key: K, value: CreateUserRequest[K]): void {
    this.userForm.update((form) => {
      if (key === 'role') {
        return { ...form, role: value as UserRole };
      }
      if (key === 'is_active') {
        return { ...form, is_active: Boolean(value) };
      }
      return { ...form, [key]: value } as CreateUserRequest;
    });
  }
}
