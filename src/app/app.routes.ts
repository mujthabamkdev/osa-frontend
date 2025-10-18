// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/user-management.component').then(
            (m) => m.UserManagementComponent
          ),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./features/admin/course/course-management.component').then(
            (m) => m.CourseManagementComponent
          ),
      },
    ],
  },
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['teacher', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/teacher/dashboard/teacher-dashboard.component').then(
            (m) => m.TeacherDashboardComponent
          ),
      },
      {
        path: 'courses',
        loadComponent: () =>
          import('./features/teacher/courses/course-management.component').then(
            (m) => m.TeacherCourseManagementComponent
          ),
      },
    ],
  },
  {
    path: 'student',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['student', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/student-dashboard.component').then(
            (m) => m.StudentDashboardComponent
          ),
      },
      {
        path: 'courses',
        loadChildren: () =>
          import('./features/student/courses/courses.routes').then((m) => m.coursesRoutes),
      },
    ],
  },
  {
    path: 'parent',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['parent', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/parent/dashboard/parent-dashboard.component').then(
            (m) => m.ParentDashboardComponent
          ),
      },
    ],
  },
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./shared/components/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent
      ),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
  {
    path: '**',
    redirectTo: '/not-found',
  },
];
