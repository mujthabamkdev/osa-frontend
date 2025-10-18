// src/app/features/admin/users/user-management.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { User, CreateUserRequest } from '../../../core/models/user.models';

@Component({
  templateUrl: './user-management.component.html',
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class UserManagementComponent implements OnInit {
  readonly apiService = inject(ApiService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly showCreateModal = signal(false);
  readonly newUser = signal<CreateUserRequest>({
    email: '',
    password: '',
    role: 'student',
  });

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
      error: () => {
        this.loading.set(false);
        // Mock data
        this.users.set([
          {
            id: 1,
            email: 'admin@example.com',
            role: 'admin',
            is_active: true,
            created_at: '2024-01-15',
          },
          {
            id: 2,
            email: 'teacher@example.com',
            role: 'teacher',
            is_active: true,
            created_at: '2024-01-20',
          },
        ]);
      },
    });
  }

  createUser(): void {
    this.apiService.createUser(this.newUser()).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newUser.set({ email: '', password: '', role: 'student' });
        this.loadUsers();
      },
      error: (err) => console.error(err),
    });
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.email}?`)) {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error(err),
      });
    }
  }

  updateEmail(email: string): void {
    this.newUser.update((user) => ({ ...user, email }));
  }

  updatePassword(password: string): void {
    this.newUser.update((user) => ({ ...user, password }));
  }

  updateRole(role: any): void {
    this.newUser.update((user) => ({ ...user, role }));
  }
}
