// src/app/app.component.ts - FIXED VERSION
import { Component, inject, OnInit, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet, Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs";
import { AuthService } from "./core/services/auth.service";
import { LoadingService } from "./core/services/loading.service";
import { environment } from "../environments/environment";
import { ThemeService } from "./core/services/theme.service";
import { NotificationService } from "./core/services/notification.service";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly loadingService = inject(LoadingService);
  readonly notificationService = inject(NotificationService);
  readonly themeService = inject(ThemeService);
  readonly router = inject(Router);

  readonly appName = environment.appName;
  readonly version = environment.version;

  readonly showNavbar = signal(false);

  ngOnInit(): void {
    // Listen to route changes to determine if navbar should be shown
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const hideNavbarRoutes = [
          "/auth/login",
          "/auth/register",
          "/unauthorized",
        ];
        this.showNavbar.set(
          !hideNavbarRoutes.some((route) => event.url.includes(route))
        );
      });
  }

  navigateHome(): void {
    const user = this.authService.user();
    const role = user?.role || this.authService.userRole();

    if (role) {
      const dashboardRoutes: Record<string, string> = {
        admin: "/admin/dashboard",
        teacher: "/teacher/dashboard",
        student: "/student/dashboard",
        parent: "/parent/dashboard"
      };
      this.router.navigate([dashboardRoutes[role] || "/"]);
    } else {
      // If no user/role found, navigate to login
      this.router.navigate(["/login"]);
    }
  }

  getNotificationClass(type: string): string {
    const classes: Record<string, string> = {
      success: "alert-success",
      error: "alert-danger",
      warning: "alert-warning",
      info: "alert-info"
    };
    return classes[type] || "alert-info";
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      success: "bi-check-circle",
      error: "bi-exclamation-triangle",
      warning: "bi-exclamation-triangle",
      info: "bi-info-circle"
    };
    return icons[type] || "bi-info-circle";
  }

  logout(): void {
    this.authService.logout();
  }
}
