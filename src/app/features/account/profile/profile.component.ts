import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-account-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);

  readonly currentUser = computed(() => this.authService.user());
  readonly avatarLetter = computed(() => {
    const email = this.currentUser()?.email ?? '';
    return email ? email.charAt(0).toUpperCase() : '?';
  });
}
