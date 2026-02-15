import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { BehaviorSubject, catchError, finalize, map, Observable, of, tap, throwError } from 'rxjs';
import {
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  User,
} from '../models/auth.model';
import { environment } from '../../../environments/environment';
import { SKIP_AUTH_REFRESH } from '../interceptors/auth.interceptor';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly accessTokenKey = 'access_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly baseUrl = environment.apiUrl;

  private readonly tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem(this.accessTokenKey)
  );

  readonly token$ = this.tokenSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(payload: LoginRequest): Observable<AuthTokens> {
    return this.http
      .post<AuthTokens>(`${this.baseUrl}/auth/login/`, payload)
      .pipe(tap((tokens) => this.storeTokens(tokens)));
  }

  register(payload: RegisterRequest): Observable<RegisterResponse> {
    return this.http
      .post<RegisterResponse>(`${this.baseUrl}/auth/register/`, payload)
      .pipe(tap((response) => this.storeTokens(response)));
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/profile/`);
  }

  refreshAccessToken(): Observable<AuthTokens> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<Partial<AuthTokens>>(
        `${this.baseUrl}/auth/refresh/`,
        { refresh: refreshToken },
        { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) }
      )
      .pipe(
        map((response) => {
          if (!response.access) {
            throw new Error('Invalid refresh response');
          }
          const refreshedTokens: AuthTokens = {
            access: response.access,
            refresh: response.refresh || refreshToken,
          };
          this.storeTokens(refreshedTokens);
          return refreshedTokens;
        })
      );
  }

  logout(): Observable<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return of(void 0);
    }

    return this.http
      .post<{ message: string }>(
        `${this.baseUrl}/auth/logout/`,
        { refresh: refreshToken },
        { context: new HttpContext().set(SKIP_AUTH_REFRESH, true) }
      )
      .pipe(
        catchError(() => of({ message: 'logout local only' })),
        finalize(() => this.clearSession()),
        map(() => void 0)
      );
  }

  isAuthenticated(): boolean {
    return !!this.tokenSubject.value;
  }

  getAccessToken(): string | null {
    return this.tokenSubject.value;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  clearSession(): void {
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    this.tokenSubject.next(null);
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.accessTokenKey, tokens.access);
    localStorage.setItem(this.refreshTokenKey, tokens.refresh);
    this.tokenSubject.next(tokens.access);
  }
}
