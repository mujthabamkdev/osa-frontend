import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-account-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly apiService = inject(ApiService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  readonly currentUser = computed(() => this.authService.user());
  readonly isEditMode = signal(false);
  readonly isLoading = signal(false);

  readonly profileForm: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]]
  });

  readonly avatarLetter = computed(() => {
    const email = this.currentUser()?.email ?? '';
    return email ? email.charAt(0).toUpperCase() : '?';
  });

  readonly canEditName = computed(() => {
    const user = this.currentUser();
    return user && (this.authService.isParent() || this.authService.isTeacher());
  });

  ngOnInit(): void {
    // Initialize form with current user data
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        full_name: user.full_name || ''
      });
    }
  }

  toggleEditMode(): void {
    this.isEditMode.update(edit => !edit);
    if (!this.isEditMode()) {
      // Reset form when canceling edit
      const user = this.currentUser();
      if (user) {
        this.profileForm.patchValue({
          full_name: user.full_name || ''
        });
      }
    }
  }

  saveName(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    this.isLoading.set(true);
    const formValue = this.profileForm.value;

    this.apiService.updateUser(user.id, { full_name: formValue.full_name }).subscribe({
      next: (updatedUser) => {
        // Update the current user in auth service
        this.authService['currentUserSignal'].set(updatedUser);
        this.isEditMode.set(false);
        this.isLoading.set(false);
        this.notificationService.add({
          id: Date.now(),
          type: 'success',
          message: 'Your name has been updated successfully.'
        });
      },
      error: (error) => {
        this.isLoading.set(false);
        this.notificationService.add({
          id: Date.now(),
          type: 'error',
          message: 'Failed to update your name. Please try again.'
        });
        console.error('Error updating user name:', error);
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      const control = this.profileForm.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'This field is required';
    }
    if (control?.hasError('minlength')) {
      return 'Name must be at least 2 characters long';
    }
    if (control?.hasError('maxlength')) {
      return 'Name cannot exceed 100 characters';
    }
    return '';
  }
}
