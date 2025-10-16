// src/app/features/admin/users/user-management.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { User, CreateUserRequest } from '../../../core/models/user.models';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <button class="btn btn-primary" (click)="showCreateModal.set(true)">
          <i class="bi bi-plus-circle me-1"></i>
          Add User
        </button>
      </div>

      <!-- Users Table -->
      <div class="card">
        <div class="card-body">
          @if (loading()) {
            <div class="text-center py-4">
              <div class="spinner-border text-primary"></div>
            </div>
          } @else {
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (user of users(); track user.id) {
                    <tr>
                      <td>{{ user.email }}</td>
                      <td>
                        <span class="badge bg-primary">{{ user.role | titlecase }}</span>
                      </td>
                      <td>
                        <span class="badge" [class]="user.is_active ? 'bg-success' : 'bg-danger'">
                          {{ user.is_active ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>{{ user.created_at | date:'short' }}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary" (click)="editUser(user)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-outline-danger" (click)="deleteUser(user)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>

      <!-- Create User Modal -->
      @if (showCreateModal()) {
        <div class="modal show d-block" style="background: rgba(0,0,0,0.5)">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Create New User</h5>
                <button type="button" class="btn-close" (click)="showCreateModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <form (ngSubmit)="createUser()" #userForm="ngForm">
                  <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input 
                      type="email" 
                      class="form-control"
                      [ngModel]="newUser().email"
                      (ngModelChange)="updateEmail($event)"
                      name="email" 
                      required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Password</label>
                    <input 
                      type="password" 
                      class="form-control"
                      [ngModel]="newUser().password"
                      (ngModelChange)="updatePassword($event)"
                      name="password" 
                      required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Role</label>
                    <select 
                      class="form-select"
                      [ngModel]="newUser().role"
                      (ngModelChange)="updateRole($event)"
                      name="role" 
                      required>
                      <option value="">Select Role</option>
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="parent">Parent</option>
                    </select>
                  </div>
                  <div class="d-flex justify-content-end gap-2">
                    <button type="button" class="btn btn-secondary" (click)="showCreateModal.set(false)">
                      Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" [disabled]="userForm.invalid">
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UserManagementComponent implements OnInit {
  readonly apiService = inject(ApiService);
  
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly showCreateModal = signal(false);
  readonly newUser = signal<CreateUserRequest>({ 
    email: '', 
    password: '', 
    role: 'student' 
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
          { id: 1, email: 'admin@example.com', role: 'admin', is_active: true, created_at: '2024-01-15' },
          { id: 2, email: 'teacher@example.com', role: 'teacher', is_active: true, created_at: '2024-01-20' }
        ]);
      }
    });
  }

  createUser(): void {
    this.apiService.createUser(this.newUser()).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.newUser.set({ email: '', password: '', role: 'student' });
        this.loadUsers();
      },
      error: (err) => console.error(err)
    });
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.email}?`)) {
      this.apiService.deleteUser(user.id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => console.error(err)
      });
    }
  }

  updateEmail(email: string): void {
    this.newUser.update(user => ({ ...user, email }));
  }

  updatePassword(password: string): void {
    this.newUser.update(user => ({ ...user, password }));
  }

  updateRole(role: any): void {
    this.newUser.update(user => ({ ...user, role }));
  }
}