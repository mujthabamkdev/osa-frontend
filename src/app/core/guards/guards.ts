import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

// Auth Guard
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isAuthenticated()) {
    return true;
  } else {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
};

// Role Guard
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRole = route.data?.['role'] as UserRole;
  const requiredRoles = route.data?.['roles'] as UserRole[];
  if (!requiredRole && !requiredRoles) return true;
  if (requiredRole && authService.hasRole(requiredRole)) return true;
  if (requiredRoles && authService.hasAnyRole(requiredRoles)) return true;
  router.navigate(['/unauthorized']);
  return false;
};

// Guest Guard
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) return true;
  const role = authService.userRole();
  const dashboardRoutes: Record<string, string> = {
    admin: '/admin/dashboard',
    teacher: '/teacher/dashboard',
    student: '/student/dashboard',
    parent: '/parent/dashboard'
  };
  router.navigate([dashboardRoutes[role!] ?? '/']);
  return false;
};
