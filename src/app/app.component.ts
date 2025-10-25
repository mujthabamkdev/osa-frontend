// src/app/app.component.ts - FIXED VERSION
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { LoadingService } from './core/services/loading.service';
import { environment } from '../environments/environment';
import { ThemeService } from './core/services/theme.service';
import { NotificationService } from './core/services/notification.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly loadingService = inject(LoadingService);
  readonly notificationService = inject(NotificationService);
  readonly themeService = inject(ThemeService);
  readonly router = inject(Router);
  readonly destroyRef = inject(DestroyRef);

  readonly appName = environment.appName;
  readonly version = environment.version;

  readonly showNavbar = signal(false);
  readonly isMobileMenuOpen = signal(false);

  ngOnInit(): void {
    // Listen to route changes to determine if navbar should be shown
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event: NavigationEnd) => {
        const hideNavbarRoutes = ['/auth/login', '/auth/register', '/unauthorized'];
        this.showNavbar.set(!hideNavbarRoutes.some((route) => event.url.includes(route)));
      });
  }

  getNotificationClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'alert-success',
      error: 'alert-danger',
      warning: 'alert-warning',
      info: 'alert-info',
    };
    return classes[type] || 'alert-info';
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'bi-check-circle',
      error: 'bi-exclamation-triangle',
      warning: 'bi-exclamation-triangle',
      info: 'bi-info-circle',
    };
    return icons[type] || 'bi-info-circle';
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
