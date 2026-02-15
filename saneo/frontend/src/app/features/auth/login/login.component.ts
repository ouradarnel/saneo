import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="max-w-md mx-auto card p-6">
      <h2 class="page-title text-2xl mb-2">Connexion</h2>
      <p class="text-sm text-gray-600 mb-6">Accède à ton espace SANEO.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
          <input
            formControlName="username"
            type="text"
            class="field"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input
            formControlName="password"
            type="password"
            class="field"
          />
        </div>

        <p *ngIf="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          [disabled]="form.invalid || loading"
          class="w-full btn-primary"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

      <p class="text-sm text-gray-600 mt-4">
        Pas de compte ?
        <a routerLink="/auth/register" class="btn-link">Créer un compte</a>
      </p>
    </section>
  `,
})
export class LoginComponent {
  loading = false;
  error = '';

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.error = 'Identifiants invalides.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
