import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, map, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);
const RETRY_ONCE = new HttpContextToken<boolean>(() => false);

let refreshRequest$: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const accessToken = authService.getAccessToken();

  const authRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  return next(authRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      const skipRefresh = request.context.get(SKIP_AUTH_REFRESH);
      const alreadyRetried = request.context.get(RETRY_ONCE);
      const isAuthRequest = request.url.includes('/auth/login/') || request.url.includes('/auth/register/');

      if (skipRefresh || alreadyRetried || isAuthRequest || error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = authService.getRefreshToken();
      if (!refreshToken) {
        authService.clearSession();
        router.navigate(['/auth/login']);
        return throwError(() => error);
      }

      if (!refreshRequest$) {
        refreshRequest$ = authService.refreshAccessToken().pipe(
          map((tokens) => tokens.access),
          shareReplay(1),
          finalize(() => {
            refreshRequest$ = null;
          })
        );
      }

      return refreshRequest$.pipe(
        switchMap((newAccessToken) =>
          next(
            request.clone({
              context: request.context.set(RETRY_ONCE, true),
              setHeaders: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            })
          )
        ),
        catchError((refreshError) => {
          authService.clearSession();
          router.navigate(['/auth/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
