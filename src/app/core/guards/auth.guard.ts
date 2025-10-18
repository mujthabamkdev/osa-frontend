import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is already authenticated, allow access
  if (authService.isAuthenticated()) {
    return true;
  }

  // If no token, redirect to login
  if (!authService.hasValidToken()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Validate token and handle result
  return authService.validateToken().pipe(
    map((isValid) => {
      if (isValid) {
        return true;
      } else {
        // Token is invalid, redirect to login
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: state.url },
        });
        return false;
      }
    }),
    catchError(() => {
      // On error, assume token might still be valid and allow access
      // This prevents logout on temporary network issues
      return of(true);
    })
  );
};
