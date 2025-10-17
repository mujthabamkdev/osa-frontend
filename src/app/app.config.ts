import { ApplicationConfig, APP_INITIALIZER } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";
import { loadingInterceptor } from "./core/interceptors/loading.interceptor";
import { errorInterceptor } from "./core/interceptors/error.interceptor";
import { AuthService } from "./core/services/auth.service";
import { firstValueFrom } from "rxjs";

// Initialize auth service on app startup
function initializeAuth(authService: AuthService) {
  return () => {
    // Validate token without aggressive logout on errors
    if (authService.hasValidToken()) {
      return firstValueFrom(authService.validateToken()).catch(() => {
        // If validation fails, continue anyway - auth guard will handle it
        return Promise.resolve();
      });
    }
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, loadingInterceptor, errorInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
};
