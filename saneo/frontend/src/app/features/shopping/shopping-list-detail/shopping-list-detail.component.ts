import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { ShoppingListDetail, ShoppingListItem } from '../../../core/models/shopping.model';
import { ShoppingService } from '../services/shopping.service';

@Component({
  selector: 'app-shopping-list-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-4">
        <div class="min-w-0">
          <h2 class="page-title">{{ list?.title || 'Liste de courses' }}</h2>
          <p class="text-gray-600" *ngIf="list">
            {{ list.status_display }} - {{ list.checked_items }}/{{ list.total_items }} ({{ list.completion_percentage }}%)
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            (click)="completeList()"
            [disabled]="!list || list.status === 'completed' || completing"
            class="btn-primary"
          >
            {{ completing ? 'Finalisation...' : 'Marquer terminée' }}
          </button>
          <a routerLink="/shopping" class="btn-secondary">Retour</a>
        </div>
      </header>

      <p *ngIf="loading" class="text-gray-600">Chargement de la liste...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <div *ngIf="list" class="card p-4">
        <label class="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            [(ngModel)]="autoUpdateStock"
            [disabled]="list.status === 'completed' || completing"
          />
          Mettre à jour automatiquement les stocks lors de la finalisation
        </label>
      </div>

      <div *ngIf="list && list.items.length === 0" class="card p-6 text-gray-600">
        Aucun item dans cette liste.
      </div>

      <div *ngIf="list && list.items.length > 0" class="md:hidden space-y-3">
        <article *ngFor="let item of list.items" class="card p-4 space-y-3" [class.opacity-60]="item.is_checked">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="font-medium text-gray-900">{{ item.product_name }}</p>
              <p class="text-xs text-gray-500">{{ item.category_name }}</p>
            </div>
            <input
              type="checkbox"
              [checked]="item.is_checked"
              [disabled]="isToggling(item.id)"
              (change)="toggleItem(item.id)"
            />
          </div>

          <p class="text-sm text-gray-700">Quantité: {{ item.suggested_quantity }} {{ item.product_unit }}</p>

          <div class="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="actualInputs[item.id].quantity"
              placeholder="Qté"
              class="w-20 field px-2 py-1"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              [(ngModel)]="actualInputs[item.id].cost"
              placeholder="Prix"
              class="w-20 field px-2 py-1"
            />
            <button
              type="button"
              (click)="saveActual(item.id)"
              [disabled]="isSavingActual(item.id)"
              class="btn-secondary px-2 py-1"
            >
              {{ isSavingActual(item.id) ? '...' : 'Save' }}
            </button>
          </div>

          <span
            class="inline-flex px-2 py-1 text-xs rounded-full"
            [class.bg-red-100]="item.priority === 'urgent'"
            [class.text-red-700]="item.priority === 'urgent'"
            [class.bg-orange-100]="item.priority === 'high'"
            [class.text-orange-700]="item.priority === 'high'"
            [class.bg-yellow-100]="item.priority === 'normal'"
            [class.text-yellow-800]="item.priority === 'normal'"
            [class.bg-yellow-50]="item.priority === 'low'"
            [class.text-yellow-700]="item.priority === 'low'"
          >
            {{ item.priority_display }}
          </span>
        </article>
      </div>

      <div *ngIf="list && list.items.length > 0" class="card overflow-x-auto hidden md:block">
        <table class="min-w-[880px] text-sm">
          <thead class="bg-gray-100 text-gray-700">
            <tr>
              <th class="text-left px-4 py-3">Fait</th>
              <th class="text-left px-4 py-3">Produit</th>
              <th class="text-left px-4 py-3">Quantité</th>
              <th class="text-left px-4 py-3">Achat réel</th>
              <th class="text-left px-4 py-3">Priorité</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of list.items" class="border-t border-gray-100" [class.opacity-60]="item.is_checked">
              <td class="px-4 py-3">
                <input
                  type="checkbox"
                  [checked]="item.is_checked"
                  [disabled]="isToggling(item.id)"
                  (change)="toggleItem(item.id)"
                />
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-900">{{ item.product_name }}</p>
                <p class="text-xs text-gray-500">{{ item.category_name }}</p>
              </td>
              <td class="px-4 py-3">{{ item.suggested_quantity }} {{ item.product_unit }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="actualInputs[item.id].quantity"
                    placeholder="Qté"
                    class="w-20 field px-2 py-1"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    [(ngModel)]="actualInputs[item.id].cost"
                    placeholder="Prix"
                    class="w-20 field px-2 py-1"
                  />
                  <button
                    type="button"
                    (click)="saveActual(item.id)"
                    [disabled]="isSavingActual(item.id)"
                    class="btn-secondary px-2 py-1"
                  >
                    {{ isSavingActual(item.id) ? '...' : 'Save' }}
                  </button>
                </div>
              </td>
              <td class="px-4 py-3">
                <span
                  class="px-2 py-1 text-xs rounded-full"
                  [class.bg-red-100]="item.priority === 'urgent'"
                  [class.text-red-700]="item.priority === 'urgent'"
                  [class.bg-orange-100]="item.priority === 'high'"
                  [class.text-orange-700]="item.priority === 'high'"
                  [class.bg-yellow-100]="item.priority === 'normal'"
                  [class.text-yellow-800]="item.priority === 'normal'"
                  [class.bg-yellow-50]="item.priority === 'low'"
                  [class.text-yellow-700]="item.priority === 'low'"
                >
                  {{ item.priority_display }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class ShoppingListDetailComponent implements OnInit {
  loading = true;
  error = '';
  completing = false;
  autoUpdateStock = true;
  list: ShoppingListDetail | null = null;
  private readonly togglingItemIds = new Set<number>();
  private readonly savingActualItemIds = new Set<number>();
  actualInputs: Record<number, { quantity: string; cost: string }> = {};

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly shoppingService: ShoppingService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadList();
  }

  loadList(): void {
    this.loading = true;
    this.error = '';

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.error = 'ID de liste invalide.';
      this.loading = false;
      return;
    }

    this.shoppingService.getListById(id).subscribe({
      next: (list) => {
        this.list = list;
        this.actualInputs = {};
        for (const item of list.items) {
          this.actualInputs[item.id] = {
            quantity: item.actual_quantity ?? '',
            cost: item.actual_cost ?? '',
          };
        }
      },
      error: () => {
        this.error = 'Impossible de charger cette liste.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  toggleItem(itemId: number): void {
    if (!this.list || this.togglingItemIds.has(itemId)) {
      return;
    }

    this.togglingItemIds.add(itemId);
    this.shoppingService.toggleItem(itemId).subscribe({
      next: (updatedItem) => {
        this.applyUpdatedItem(updatedItem);
        this.recalculateStats();
      },
      error: () => {
        this.error = 'Impossible de mettre à jour cet item.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.togglingItemIds.delete(itemId);
      },
    });
  }

  completeList(): void {
    if (!this.list) {
      return;
    }

    this.completing = true;
    this.shoppingService.completeList(this.list.id, this.autoUpdateStock).subscribe({
      next: (response) => {
        const message = response.stock_updated
          ? `Liste terminée. ${response.batches_created} lot(s) ajouté(s) au stock.`
          : 'Liste marquée comme terminée.';
        this.notificationService.show(message, 'success');
        this.router.navigate(['/shopping']);
      },
      error: () => {
        this.error = 'Impossible de terminer cette liste.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.completing = false;
      },
    });
  }

  isToggling(itemId: number): boolean {
    return this.togglingItemIds.has(itemId);
  }

  saveActual(itemId: number): void {
    if (this.savingActualItemIds.has(itemId)) {
      return;
    }

    const input = this.actualInputs[itemId];
    if (!input) {
      return;
    }

    const payload: { actual_quantity?: number; actual_cost?: number } = {};

    const quantityValue = input.quantity?.trim();
    if (quantityValue) {
      const parsedQuantity = Number(quantityValue.replace(',', '.'));
      if (!Number.isNaN(parsedQuantity) && parsedQuantity >= 0) {
        payload.actual_quantity = parsedQuantity;
      }
    }

    const costValue = input.cost?.trim();
    if (costValue) {
      const parsedCost = Number(costValue.replace(',', '.'));
      if (!Number.isNaN(parsedCost) && parsedCost >= 0) {
        payload.actual_cost = parsedCost;
      }
    }

    this.savingActualItemIds.add(itemId);
    this.shoppingService.setActual(itemId, payload).subscribe({
      next: (updatedItem) => {
        this.applyUpdatedItem(updatedItem);
        this.recalculateStats();
        this.notificationService.show('Quantité/prix réel mis à jour.', 'success');
      },
      error: () => {
        this.error = 'Impossible de sauvegarder la quantité/prix réel.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.savingActualItemIds.delete(itemId);
      },
    });
  }

  isSavingActual(itemId: number): boolean {
    return this.savingActualItemIds.has(itemId);
  }

  private applyUpdatedItem(updatedItem: ShoppingListItem): void {
    if (!this.list) {
      return;
    }

    const itemIndex = this.list.items.findIndex((item) => item.id === updatedItem.id);
    if (itemIndex === -1) {
      return;
    }

    this.list.items[itemIndex] = {
      ...this.list.items[itemIndex],
      ...updatedItem,
    };
  }

  private recalculateStats(): void {
    if (!this.list) {
      return;
    }

    const checkedItems = this.list.items.filter((item) => item.is_checked).length;
    this.list.checked_items = checkedItems;
    this.list.total_items = this.list.items.length;
    this.list.completion_percentage = this.list.total_items
      ? Math.round((checkedItems / this.list.total_items) * 100)
      : 0;
  }
}
