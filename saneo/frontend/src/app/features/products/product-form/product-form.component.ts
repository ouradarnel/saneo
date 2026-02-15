import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Category,
  Location,
  ProductUpsertPayload,
} from '../../../core/models/product.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <section class="space-y-6 max-w-2xl">
      <header>
        <h2 class="page-title">{{ isEdit ? 'Modifier un produit' : 'Nouveau produit' }}</h2>
        <p class="page-subtitle">Renseigne les informations principales du produit.</p>
      </header>

      <p *ngIf="loading" class="text-gray-600">Chargement...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="onSubmit()" class="card p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nom</label>
          <input formControlName="name" class="field" />
          <p *ngIf="isFieldInvalid('name')" class="text-xs text-red-600 mt-1">Le nom est requis.</p>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <select formControlName="category" class="field">
              <option [ngValue]="null">Sélectionner</option>
              <option *ngFor="let category of categories" [ngValue]="category.id">{{ category.name_display }}</option>
            </select>
            <p *ngIf="isFieldInvalid('category')" class="text-xs text-red-600 mt-1">La catégorie est requise.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
            <input
              type="text"
              value="Pièce"
              disabled
              class="field bg-gray-100 text-gray-600"
            />
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Seuil minimal</label>
            <input type="number" formControlName="threshold" class="field" />
            <p *ngIf="isFieldInvalid('threshold')" class="text-xs text-red-600 mt-1">
              Le seuil doit être supérieur ou égal à 0.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Emplacement par défaut</label>
            <select formControlName="default_location" class="field">
              <option [ngValue]="null">Aucun</option>
              <option *ngFor="let location of locations" [ngValue]="location.id">{{ location.name_display }}</option>
            </select>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Marque</label>
            <input formControlName="brand" class="field" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
            <input formControlName="barcode" class="field" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea formControlName="notes" rows="3" class="field"></textarea>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" formControlName="auto_add_to_list" />
          Ajouter automatiquement à la liste de courses
        </label>

        <div class="flex items-center gap-3">
          <button
            type="submit"
            [disabled]="form.invalid || saving"
            class="btn-primary"
          >
            {{ saving ? 'Enregistrement...' : (isEdit ? 'Mettre à jour' : 'Créer') }}
          </button>
          <span *ngIf="form.invalid" class="text-xs text-gray-500">Complète les champs requis.</span>
          <a routerLink="/products" class="btn-secondary">Annuler</a>
        </div>
      </form>
    </section>
  `,
})
export class ProductFormComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  isEdit = false;
  productId: number | null = null;

  categories: Category[] = [];
  locations: Location[] = [];

  readonly form = this.formBuilder.group({
    name: ['', [Validators.required]],
    category: [null as number | null, [Validators.required]],
    default_location: [null as number | null],
    threshold: [1, [Validators.required, Validators.min(0)]],
    barcode: [''],
    brand: [''],
    notes: [''],
    auto_add_to_list: [true],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly productService: ProductService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.productId = idParam ? Number(idParam) : null;
    this.isEdit = this.productId !== null && !Number.isNaN(this.productId);

    this.loadLookups();
  }

  onSubmit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      this.error = 'Le formulaire est incomplet.';
      this.notificationService.show(this.error, 'error');
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.category === null) {
      this.error = 'La catégorie est obligatoire.';
      return;
    }

    const payload: ProductUpsertPayload = {
      name: raw.name || '',
      category: raw.category,
      default_location: raw.default_location ?? null,
      threshold: Number(raw.threshold ?? 0),
      barcode: raw.barcode || '',
      brand: raw.brand || '',
      notes: raw.notes || '',
      auto_add_to_list: Boolean(raw.auto_add_to_list),
    };
    this.saving = true;
    this.error = '';

    const request$ = this.isEdit && this.productId
      ? this.productService.update(this.productId, payload)
      : this.productService.create(payload);

    request$.subscribe({
      next: () => {
        this.notificationService.show(
          this.isEdit ? 'Produit mis à jour.' : 'Produit créé avec succès.',
          'success'
        );
        this.router.navigate(['/products']);
      },
      error: (err: HttpErrorResponse) => {
        this.error = this.formatApiError(err);
        this.notificationService.show(this.error, 'error');
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      },
    });
  }

  private loadLookups(): void {
    this.productService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: () => {
        this.error = 'Impossible de charger les catégories.';
        this.loading = false;
      },
    });

    this.productService.getLocations().subscribe({
      next: (locationsResponse) => {
        this.locations = locationsResponse.results;

        if (!this.isEdit || !this.productId) {
          this.loading = false;
          return;
        }

        this.productService.getById(this.productId).subscribe({
          next: (product) => {
            this.form.patchValue({
              name: product.name,
              category: product.category,
              default_location: product.default_location,
              threshold: Number(product.threshold),
              barcode: product.barcode || '',
              brand: product.brand || '',
              notes: product.notes || '',
              auto_add_to_list: product.auto_add_to_list,
            });
          },
          error: () => {
            this.error = 'Impossible de charger le produit.';
          },
          complete: () => {
            this.loading = false;
          },
        });
      },
      error: () => {
        this.error = 'Impossible de charger les emplacements.';
        this.loading = false;
      },
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private formatApiError(err: HttpErrorResponse): string {
    const payload = err.error;
    if (!payload) {
      return "Impossible d'enregistrer le produit.";
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

    return "Impossible d'enregistrer le produit.";
  }
}
