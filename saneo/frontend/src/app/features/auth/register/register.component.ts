import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="max-w-md mx-auto card p-6">
      <h2 class="page-title text-2xl mb-2">Créer un compte</h2>
      <p class="text-sm text-gray-600 mb-6">Inscription rapide pour commencer.</p>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nom d'utilisateur</label>
          <input formControlName="username" type="text" class="field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input formControlName="email" type="email" class="field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
          <input formControlName="password" type="password" class="field" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
          <input formControlName="password2" type="password" class="field" />
        </div>

        <p *ngIf="error" class="text-sm text-red-600">{{ error }}</p>

        <button
          type="submit"
          [disabled]="form.invalid || loading"
          class="w-full btn-primary"
        >
          {{ loading ? 'Création...' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="text-sm text-gray-600 mt-4">
        Déjà inscrit ?
        <a routerLink="/auth/login" class="btn-link">Se connecter</a>
      </p>
    </section>
  `,
})
export class RegisterComponent {
  loading = false;
  error = '';

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password2: ['', [Validators.required]],
    first_name: [''],
    last_name: [''],
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

    const value = this.form.getRawValue();
    if (value.password !== value.password2) {
      this.error = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.authService.register(value).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.formatApiError(err);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private formatApiError(err: HttpErrorResponse): string {
    if (err.status === 0) {
      return "Impossible de joindre le serveur. Vérifie que l'API est lancée et accessible.";
    }

    const payload = err.error;
    if (!payload) {
      return "Impossible de créer le compte pour l'instant.";
    }

    if (payload instanceof ProgressEvent) {
      return "Erreur réseau pendant l'inscription. Vérifie la connexion et la configuration serveur.";
    }

    if (typeof payload.error === 'string') {
      return payload.error;
    }

    if (typeof payload.detail === 'string') {
      return payload.detail;
    }

    if (typeof payload === 'object') {
      const messages = Object.entries(payload)
        .map(([field, value]) => {
          const text = Array.isArray(value) ? value.join(', ') : String(value);
          return `${field}: ${text}`;
        })
        .join(' | ');

      if (messages) {
        return messages;
      }
    }

    return "Impossible de créer le compte pour l'instant.";
  }
}
