import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has token and is logged in
  if (authService.hasValidToken()) {
    return true;
  }

  router.navigate(["/auth/login"], { queryParams: { returnUrl: state.url } });
  return false;
};
