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
  template: `
    <!-- Global Loading Overlay -->
    @if (loadingService.loading()) {
    <div class="loading-overlay">
      <div
        class="spinner-border text-primary"
        style="width: 3rem; height: 3rem;"
      >
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    }

    <!-- Navigation Bar -->
    @if (showNavbar()) {
    <nav class="navbar navbar-expand-lg navbar-dark custom-navbar sticky-top">
      <div class="container-fluid px-4">
        <a
          class="navbar-brand fw-bold d-flex align-items-center"
          href="#"
          (click)="navigateHome(); $event.preventDefault()"
        >
          <div class="brand-icon">
            <i class="bi bi-mortarboard"></i>
          </div>
          <span class="brand-text ms-2">{{ appName }}</span>
        </a>

        <!-- Mobile menu toggle -->
        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <!-- Main Navigation -->
          <ul class="navbar-nav me-auto">
            @if (authService.isAdmin()) {
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/admin/dashboard"
                routerLinkActive="active"
              >
                <i class="bi bi-speedometer2 me-1"></i>
                Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/admin/users"
                routerLinkActive="active"
              >
                <i class="bi bi-people me-1"></i>
                Users
              </a>
            </li>
            } @if (authService.isTeacher()) {
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/teacher/dashboard"
                routerLinkActive="active"
              >
                <i class="bi bi-speedometer2 me-1"></i>
                Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/teacher/courses"
                routerLinkActive="active"
              >
                <i class="bi bi-book me-1"></i>
                My Courses
              </a>
            </li>
            } @if (authService.isStudent()) {
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/student/dashboard"
                routerLinkActive="active"
              >
                <i class="bi bi-speedometer2 me-1"></i>
                Dashboard
              </a>
            </li>
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/student/courses"
                routerLinkActive="active"
              >
                <i class="bi bi-book me-1"></i>
                Courses
              </a>
            </li>
            } @if (authService.isParent()) {
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/parent/dashboard"
                routerLinkActive="active"
              >
                <i class="bi bi-speedometer2 me-1"></i>
                Dashboard
              </a>
            </li>
            }
          </ul>

          <!-- User Menu -->
          <ul class="navbar-nav">
            <!-- Theme Toggle -->
            <li class="nav-item">
              <button
                class="btn btn-outline-light btn-sm me-2"
                (click)="themeService.toggleTheme()"
              >
                <i
                  class="bi"
                  [class]="
                    themeService.theme() === 'dark' ? 'bi-sun' : 'bi-moon'
                  "
                ></i>
              </button>
            </li>

            <!-- User Dropdown -->
            @if (authService.user(); as user) {
            <li class="nav-item dropdown">
              <a
                class="nav-link dropdown-toggle d-flex align-items-center"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
              >
                <div
                  class="avatar-sm bg-light rounded-circle d-flex align-items-center justify-content-center me-2"
                >
                  <i class="bi bi-person text-dark"></i>
                </div>
                <span class="d-none d-md-inline">{{ user.email }}</span>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <h6 class="dropdown-header">{{ user.role | titlecase }}</h6>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" href="#"
                    ><i class="bi bi-person me-2"></i>Profile</a
                  >
                </li>
                <li>
                  <a class="dropdown-item" href="#"
                    ><i class="bi bi-gear me-2"></i>Settings</a
                  >
                </li>
                <li>
                  <a class="dropdown-item" href="#"
                    ><i class="bi bi-question-circle me-2"></i>Help</a
                  >
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a
                    class="dropdown-item text-danger"
                    href="#"
                    (click)="logout()"
                  >
                    <i class="bi bi-box-arrow-right me-2"></i>
                    Logout
                  </a>
                </li>
              </ul>
            </li>
            }
          </ul>
        </div>
      </div>
    </nav>
    }

    <!-- Main Content -->
    <main class="main-content" [class.with-navbar]="showNavbar()">
      <router-outlet></router-outlet>
    </main>

    <!-- Notifications -->
    <div class="notification-container">
      @for (notification of notificationService.allNotifications(); track
      notification.id) {
      <div
        class="alert alert-dismissible fade show"
        [class]="getNotificationClass(notification.type)"
        role="alert"
      >
        <i class="bi me-2" [class]="getNotificationIcon(notification.type)"></i>
        {{ notification.message }}
        <button
          type="button"
          class="btn-close"
          (click)="notificationService.remove(notification.id)"
        ></button>
      </div>
      }
    </div>

    <!-- Footer (only for auth pages) -->
    @if (!showNavbar()) {
    <footer class="text-center py-3 bg-light border-top">
      <div class="container">
        <small class="text-muted">
          © 2024 {{ appName }}. All rights reserved. | Version {{ version }}
        </small>
      </div>
    </footer>
    }
  `,
  styles: [
    `
      :host {
        --navbar-height: 70px;
      }

      .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
      }

      /* Modern Navbar Styling */
      .custom-navbar {
        background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        padding: 0.75rem 0 !important;
        height: var(--navbar-height);
        display: flex;
        align-items: center;
      }

      .navbar-brand {
        font-size: 1.4rem;
        font-weight: 700;
        letter-spacing: -0.5px;
        transition: all 0.3s ease;
        color: white !important;
        display: flex;
        align-items: center;
      }

      .navbar-brand:hover {
        transform: translateY(-2px);
        opacity: 0.9;
        cursor: pointer;
      }

      .brand-icon {
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        transition: all 0.3s ease;
      }

      .navbar-brand:hover .brand-icon {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
      }

      .brand-text {
        white-space: nowrap;
      }

      /* Navigation Links */
      .navbar-nav .nav-link {
        color: rgba(255, 255, 255, 0.85) !important;
        font-weight: 500;
        margin: 0 0.5rem;
        padding: 0.5rem 0.75rem !important;
        border-radius: 6px;
        transition: all 0.3s ease;
        position: relative;
      }

      .navbar-nav .nav-link:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white !important;
        transform: translateY(-1px);
      }

      .navbar-nav .nav-link.active {
        background: rgba(255, 255, 255, 0.2);
        color: white !important;
      }

      .navbar-nav .nav-link i {
        font-size: 1rem;
      }

      /* Theme Toggle Button */
      .btn-outline-light {
        color: rgba(255, 255, 255, 0.85);
        border-color: rgba(255, 255, 255, 0.3);
        transition: all 0.3s ease;
      }

      .btn-outline-light:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.5);
        color: white;
      }

      .btn-outline-light:focus {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.5);
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
      }

      /* User Dropdown */
      .nav-item.dropdown .nav-link {
        display: flex;
        align-items: center;
        padding: 0.5rem !important;
      }

      .avatar-sm {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
      }

      .nav-item.dropdown:hover .avatar-sm {
        background: rgba(255, 255, 255, 0.3);
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.08);
      }

      .avatar-sm i {
        font-size: 1.1rem;
      }

      .dropdown-menu {
        border: none;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        border-radius: 8px;
        margin-top: 0.5rem;
      }

      .dropdown-header {
        font-weight: 600;
        color: #0d6efd;
        padding: 0.75rem 1rem;
      }

      .dropdown-item {
        padding: 0.65rem 1rem;
        transition: all 0.2s ease;
        color: #333;
      }

      .dropdown-item:hover {
        background: #f8f9fa;
        color: #0d6efd;
        transform: translateX(2px);
      }

      .dropdown-item.text-danger:hover {
        background: #ffe5e5;
        color: #dc3545;
      }

      .dropdown-divider {
        margin: 0.5rem 0;
        opacity: 0.3;
      }

      /* Responsive */
      @media (max-width: 991px) {
        .custom-navbar {
          padding: 0.5rem 0 !important;
        }

        .navbar-brand {
          font-size: 1.2rem;
        }

        .brand-text {
          display: none;
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          font-size: 1.1rem;
        }

        .navbar-nav {
          margin-top: 1rem;
        }

        .navbar-nav .nav-link {
          padding: 0.65rem 0 !important;
          margin: 0.3rem 0 !important;
        }
      }

      @media (max-width: 576px) {
        .navbar-nav .nav-link span {
          display: none;
        }
      }

      .main-content {
        min-height: calc(100vh - var(--navbar-height));
        padding-top: 0;
      }

      .main-content.with-navbar {
        padding-top: 0;
      }

      .notification-container {
        position: fixed;
        top: calc(var(--navbar-height) + 20px);
        right: 20px;
        z-index: 1050;
        max-width: 350px;
      }

      .notification-container .alert {
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-radius: 8px;
        border: none;
      }

      @media (max-width: 768px) {
        .notification-container {
          top: calc(var(--navbar-height) + 10px);
          right: 10px;
          left: 10px;
          max-width: none;
        }
      }
    `,
  ],
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
        parent: "/parent/dashboard",
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
      info: "alert-info",
    };
    return classes[type] || "alert-info";
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      success: "bi-check-circle",
      error: "bi-exclamation-triangle",
      warning: "bi-exclamation-triangle",
      info: "bi-info-circle",
    };
    return icons[type] || "bi-info-circle";
  }

  logout(): void {
    this.authService.logout();
  }
}
