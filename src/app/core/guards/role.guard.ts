import { inject } from "@angular/core";
import { Router, CanActivateFn, ActivatedRouteSnapshot } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data["roles"] || route.data["role"]) as
    | string
    | string[];
  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  // First, try to get user from signal
  let user = authService.user();

  // If user signal is not populated, try to decode from token
  if (!user) {
    const token = authService.getToken();
    if (token) {
      // Try to extract role from JWT token payload
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const userRole = payload.role;
        if (userRole && rolesArray.includes(userRole)) {
          return true;
        }
      } catch (e) {
        console.error("Failed to decode token:", e);
      }
    }
    router.navigate(["/unauthorized"]);
    return false;
  }

  // If user signal is populated, check roles
  if (rolesArray.includes(user.role)) {
    return true;
  }

  router.navigate(["/unauthorized"]);
  return false;
};
