import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Location, ProductListItem } from '../../../core/models/product.model';
import { StockBatchCreatePayload, StockBatch } from '../../../core/models/stock.model';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../products/services/product.service';
import { StockService } from '../services/stock.service';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <h2 class="page-title">Stocks (avancé)</h2>
          <p class="page-subtitle">Gestion des lots. La consommation quotidienne se fait dans Produits.</p>
        </div>
        <a routerLink="/stocks/alerts" class="btn-secondary">
          Voir alertes
        </a>
      </header>

      <p *ngIf="loading" class="text-gray-600">Chargement des lots...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <form class="card p-4 space-y-3" (ngSubmit)="createBatch()">
        <div class="grid md:grid-cols-4 gap-3">
          <select
            [(ngModel)]="newBatch.product"
            name="product"
            class="field"
            required
          >
            <option [ngValue]="null">Produit</option>
            <option *ngFor="let product of products" [ngValue]="product.id">{{ product.name }}</option>
          </select>
          <input
            type="number"
            step="0.01"
            min="0"
            [(ngModel)]="newBatch.quantity"
            name="quantity"
            class="field"
            placeholder="Quantité"
            required
          />
          <input
            type="date"
            [(ngModel)]="newBatch.expiry_date"
            name="expiry_date"
            class="field"
            placeholder="Péremption (optionnel)"
          />
          <button type="submit" class="btn-primary">
            Ajouter lot
          </button>
        </div>

        <button
          type="button"
          (click)="showAdvancedCreate = !showAdvancedCreate"
          class="btn-link text-sm"
        >
          {{ showAdvancedCreate ? 'Masquer options avancées' : 'Afficher options avancées' }}
        </button>

        <div *ngIf="showAdvancedCreate" class="grid md:grid-cols-2 gap-3">
          <select
            [(ngModel)]="newBatch.location"
            name="location"
            class="field"
          >
            <option [ngValue]="null">Emplacement</option>
            <option *ngFor="let location of locations" [ngValue]="location.id">
              {{ location.name_display }}
            </option>
          </select>
          <input
            type="date"
            [(ngModel)]="newBatch.purchase_date"
            name="purchase_date"
            class="field"
            required
          />
        </div>
      </form>

      <div *ngIf="!loading && batches.length === 0" class="card p-6 text-gray-600">
        Aucun lot de stock trouvé.
      </div>

      <div *ngIf="batches.length > 0" class="md:hidden space-y-3">
        <article *ngFor="let batch of batches" class="card p-4 space-y-3">
          <div>
            <p class="font-semibold text-gray-900">{{ batch.product_name }}</p>
            <p class="text-xs text-gray-500" *ngIf="batch.location_name">{{ batch.location_name }}</p>
          </div>

          <p class="text-sm text-gray-700">Quantité: <span class="font-semibold">{{ batch.quantity }} {{ batch.product_unit }}</span></p>
          <p class="text-sm text-gray-700">
            Péremption:
            <span *ngIf="batch.expiry_date; else noExpiryMobile" [class.text-red-600]="batch.is_expired">
              {{ batch.expiry_date }}
              <span *ngIf="batch.days_until_expiry !== null" class="text-xs text-gray-500">
                ({{ batch.days_until_expiry }}j)
              </span>
            </span>
            <ng-template #noExpiryMobile>-</ng-template>
          </p>

          <div class="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="editQuantities[batch.id]"
              class="w-24 field px-2 py-1"
              placeholder="Qté"
            />
            <button
              type="button"
              (click)="updateBatchQuantity(batch.id)"
              [disabled]="isUpdating(batch.id)"
              class="btn-secondary px-2 py-1"
            >
              {{ isUpdating(batch.id) ? '...' : 'Save' }}
            </button>
            <button
              type="button"
              (click)="deleteBatch(batch.id)"
              [disabled]="isDeleting(batch.id)"
              class="btn-danger px-2 py-1"
            >
              {{ isDeleting(batch.id) ? '...' : 'Delete' }}
            </button>
          </div>
        </article>
      </div>

      <div *ngIf="batches.length > 0" class="card overflow-x-auto hidden md:block">
        <table class="min-w-[760px] text-sm">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="text-left px-4 py-3">Produit</th>
              <th class="text-left px-4 py-3">Quantité</th>
              <th class="text-left px-4 py-3">Péremption</th>
              <th class="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let batch of batches" class="border-t border-gray-100">
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ batch.product_name }}</p>
                <p class="text-xs text-gray-500" *ngIf="batch.location_name">{{ batch.location_name }}</p>
              </td>
              <td class="px-4 py-3">{{ batch.quantity }} {{ batch.product_unit }}</td>
              <td class="px-4 py-3">
                <span *ngIf="batch.expiry_date; else noExpiry" [class.text-red-600]="batch.is_expired">
                  {{ batch.expiry_date }}
                  <span *ngIf="batch.days_until_expiry !== null" class="text-xs text-gray-500">
                    ({{ batch.days_until_expiry }}j)
                  </span>
                </span>
                <ng-template #noExpiry>-</ng-template>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="editQuantities[batch.id]"
                    class="w-24 field px-2 py-1"
                    placeholder="Qté"
                  />
                  <button
                    type="button"
                    (click)="updateBatchQuantity(batch.id)"
                    [disabled]="isUpdating(batch.id)"
                    class="btn-secondary px-2 py-1"
                  >
                    {{ isUpdating(batch.id) ? '...' : 'Save' }}
                  </button>
                  <button
                    type="button"
                    (click)="deleteBatch(batch.id)"
                    [disabled]="isDeleting(batch.id)"
                    class="btn-danger px-2 py-1"
                  >
                    {{ isDeleting(batch.id) ? '...' : 'Delete' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class StockListComponent implements OnInit {
  loading = true;
  error = '';
  showAdvancedCreate = false;
  batches: StockBatch[] = [];
  products: ProductListItem[] = [];
  locations: Location[] = [];
  editQuantities: Record<number, string | number> = {};
  private readonly updatingBatchIds = new Set<number>();
  private readonly deletingBatchIds = new Set<number>();
  newBatch: {
    product: number | null;
    quantity: number;
    location: number | null;
    purchase_date: string;
    expiry_date: string;
  } = {
    product: null,
    quantity: 1,
    location: null,
    purchase_date: new Date().toISOString().slice(0, 10),
    expiry_date: '',
  };

  constructor(
    private readonly stockService: StockService,
    private readonly productService: ProductService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadLookups();
  }

  loadBatches(): void {
    this.loading = true;
    this.error = '';

    this.stockService.getBatches().subscribe({
      next: (response) => {
        this.batches = response.results;
        this.editQuantities = {};
        for (const batch of this.batches) {
          this.editQuantities[batch.id] = batch.quantity;
        }
      },
      error: () => {
        this.error = 'Impossible de charger les lots de stock.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  createBatch(): void {
    if (!this.newBatch.product || this.newBatch.quantity <= 0) {
      this.error = 'Produit et quantité valide sont requis.';
      this.notificationService.show(this.error, 'error');
      return;
    }

    if (this.newBatch.expiry_date && this.newBatch.expiry_date < this.newBatch.purchase_date) {
      this.error = "La date de péremption doit être postérieure ou égale à la date d'achat.";
      this.notificationService.show(this.error, 'error');
      return;
    }

    const payload: StockBatchCreatePayload = {
      product: this.newBatch.product,
      quantity: this.newBatch.quantity,
      location: this.newBatch.location,
      expiry_date: this.newBatch.expiry_date || null,
      purchase_date: this.newBatch.purchase_date,
      purchase_price: null,
      supplier: '',
      notes: '',
    };

    this.stockService.createBatch(payload).subscribe({
      next: () => {
        this.notificationService.show('Lot ajouté avec succès.', 'success');
        this.newBatch.quantity = 1;
        this.newBatch.expiry_date = '';
        this.loadBatches();
      },
      error: () => {
        this.error = "Impossible d'ajouter le lot.";
        this.notificationService.show(this.error, 'error');
      },
    });
  }

  updateBatchQuantity(batchId: number): void {
    const rawValue = this.editQuantities[batchId];
    const quantity = Number(String(rawValue ?? '').replace(',', '.'));
    if (Number.isNaN(quantity) || quantity < 0) {
      this.error = 'Quantité invalide pour la mise à jour.';
      this.notificationService.show(this.error, 'error');
      return;
    }

    this.updatingBatchIds.add(batchId);
    this.stockService.updateBatch(batchId, { quantity }).subscribe({
      next: () => {
        this.notificationService.show('Lot mis à jour.', 'success');
        this.loadBatches();
      },
      error: () => {
        this.error = 'Impossible de mettre à jour ce lot.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.updatingBatchIds.delete(batchId);
      },
    });
  }

  deleteBatch(batchId: number): void {
    if (!confirm('Supprimer ce lot ?')) {
      return;
    }

    this.deletingBatchIds.add(batchId);
    this.stockService.deleteBatch(batchId).subscribe({
      next: () => {
        this.notificationService.show('Lot supprimé.', 'success');
        this.loadBatches();
      },
      error: () => {
        this.error = 'Impossible de supprimer ce lot.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.deletingBatchIds.delete(batchId);
      },
    });
  }

  isUpdating(batchId: number): boolean {
    return this.updatingBatchIds.has(batchId);
  }

  isDeleting(batchId: number): boolean {
    return this.deletingBatchIds.has(batchId);
  }

  private loadLookups(): void {
    this.productService.list().subscribe({
      next: (productsResponse) => {
        this.products = productsResponse.results;
      },
    });

    this.productService.getLocations().subscribe({
      next: (locationsResponse) => {
        this.locations = locationsResponse.results;
      },
    });
  }
}
