// src/app/core/interceptors/auth.interceptor.ts
import { inject } from "@angular/core";
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
  HttpHandlerFn,
} from "@angular/common/http";
import { Observable, catchError, throwError, switchMap, of } from "rxjs";
import { AuthService } from "../services/auth.service";

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isAuthEndpoint = req.url.includes("/auth/");

  if (token && !isAuthEndpoint) {
    req = addTokenHeader(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isAuthEndpoint && !isRefreshing) {
        return handle401Error(req, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function addTokenHeader(
  request: HttpRequest<unknown>,
  token: string
): HttpRequest<unknown> {
  return request.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
}

function handle401Error(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;

    return authService.refreshToken().pipe(
      switchMap((tokenResponse: any): Observable<HttpEvent<unknown>> => {
        isRefreshing = false;
        const newToken = tokenResponse.access_token || tokenResponse.token;
        return next(addTokenHeader(request, newToken));
      }),
      catchError((error): Observable<never> => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      })
    );
  }

  authService.logout();
  return throwError(() => new Error("Authentication failed"));
}
