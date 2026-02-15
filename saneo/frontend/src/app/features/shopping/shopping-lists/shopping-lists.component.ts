import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';
import { ShoppingList } from '../../../core/models/shopping.model';
import { ShoppingService } from '../services/shopping.service';

@Component({
  selector: 'app-shopping-lists',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <header class="flex items-center justify-between gap-4">
        <div>
          <h2 class="page-title">Listes de courses</h2>
          <p class="page-subtitle">Gère et complète tes listes.</p>
        </div>
        <button
          type="button"
          (click)="generateAuto()"
          [disabled]="generating"
          class="btn-primary"
        >
          {{ generating ? 'Génération...' : 'Générer auto' }}
        </button>
      </header>

      <div class="card p-4">
        <label class="text-sm text-gray-700 mr-2">Filtrer par statut:</label>
        <select
          [(ngModel)]="selectedStatus"
          (ngModelChange)="loadLists()"
          class="field"
        >
          <option value="">Tous</option>
          <option value="active">Active</option>
          <option value="completed">Terminée</option>
          <option value="draft">Brouillon</option>
          <option value="archived">Archivée</option>
        </select>
      </div>

      <p *ngIf="loading" class="text-gray-600">Chargement des listes...</p>
      <p *ngIf="error" class="text-red-600">{{ error }}</p>

      <div *ngIf="!loading && lists.length === 0" class="card p-6 text-gray-600">
        Aucune liste disponible.
      </div>

      <div *ngIf="lists.length > 0" class="space-y-3">
        <article *ngFor="let list of lists" class="card-lift p-4 flex items-center justify-between gap-4">
          <div>
            <p class="font-semibold text-gray-900">{{ list.title }}</p>
            <p class="text-sm text-gray-600">
              {{ list.status_display }} - {{ list.checked_items }}/{{ list.total_items }}
              ({{ list.completion_percentage }}%)
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            <a [routerLink]="['/shopping', list.id]" class="btn-link">Ouvrir</a>

            <button
              *ngIf="list.status === 'active'"
              type="button"
              (click)="completeFromList(list.id)"
              [disabled]="isProcessing(list.id)"
              class="btn-primary px-3 py-1.5"
            >
              {{ isProcessing(list.id) ? '...' : 'Terminer' }}
            </button>

            <button
              *ngIf="list.status === 'completed'"
              type="button"
              (click)="archiveFromList(list.id)"
              [disabled]="isProcessing(list.id)"
              class="btn-secondary px-3 py-1.5"
            >
              {{ isProcessing(list.id) ? '...' : 'Archiver' }}
            </button>

            <button
              *ngIf="list.status === 'draft' || list.status === 'archived'"
              type="button"
              (click)="activateFromList(list.id)"
              [disabled]="isProcessing(list.id)"
              class="btn-secondary px-3 py-1.5"
            >
              {{ isProcessing(list.id) ? '...' : 'Activer' }}
            </button>

            <button
              type="button"
              (click)="deleteFromList(list.id)"
              [disabled]="isProcessing(list.id)"
              class="btn-danger px-3 py-1.5"
            >
              {{ isProcessing(list.id) ? '...' : 'Supprimer' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
})
export class ShoppingListsComponent implements OnInit {
  loading = true;
  generating = false;
  error = '';
  selectedStatus: '' | 'draft' | 'active' | 'completed' | 'archived' = 'active';
  lists: ShoppingList[] = [];
  private readonly processingListIds = new Set<number>();

  constructor(
    private readonly shoppingService: ShoppingService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadLists();
  }

  loadLists(): void {
    this.loading = true;
    this.error = '';

    this.shoppingService.getLists(this.selectedStatus).subscribe({
      next: (response) => {
        this.lists = response.results;
      },
      error: () => {
        this.error = 'Impossible de charger les listes de courses.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  generateAuto(): void {
    if (this.generating) {
      return;
    }

    this.generating = true;
    this.error = '';

    this.shoppingService.generateAutoList().subscribe({
      next: (response) => {
        if (!response.list_created) {
          this.notificationService.show('Pas besoin de faire des courses.', 'info');
          this.loadLists();
          return;
        }

        this.notificationService.show('Liste automatique générée.', 'success');
        this.loadLists();
      },
      error: () => {
        this.error = 'Impossible de générer la liste automatique.';
        this.notificationService.show(this.error, 'error');
      },
      complete: () => {
        this.generating = false;
      },
    });
  }

  completeFromList(listId: number): void {
    this.processingListIds.add(listId);
    this.shoppingService.completeList(listId, false).subscribe({
      next: () => {
        this.notificationService.show('Liste marquée comme terminée.', 'success');
        this.loadLists();
      },
      error: () => {
        this.notificationService.show("Impossible de terminer cette liste.", 'error');
      },
      complete: () => {
        this.processingListIds.delete(listId);
      },
    });
  }

  archiveFromList(listId: number): void {
    this.processingListIds.add(listId);
    this.shoppingService.archiveList(listId).subscribe({
      next: () => {
        this.notificationService.show('Liste archivée.', 'success');
        this.loadLists();
      },
      error: () => {
        this.notificationService.show("Impossible d'archiver cette liste.", 'error');
      },
      complete: () => {
        this.processingListIds.delete(listId);
      },
    });
  }

  activateFromList(listId: number): void {
    this.processingListIds.add(listId);
    this.shoppingService.activateList(listId).subscribe({
      next: () => {
        this.notificationService.show('Liste activée.', 'success');
        this.loadLists();
      },
      error: () => {
        this.notificationService.show("Impossible d'activer cette liste.", 'error');
      },
      complete: () => {
        this.processingListIds.delete(listId);
      },
    });
  }

  deleteFromList(listId: number): void {
    if (!confirm('Supprimer cette liste ?')) {
      return;
    }

    this.processingListIds.add(listId);
    this.shoppingService.deleteList(listId).subscribe({
      next: () => {
        this.notificationService.show('Liste supprimée.', 'success');
        this.loadLists();
      },
      error: () => {
        this.notificationService.show("Impossible de supprimer cette liste.", 'error');
      },
      complete: () => {
        this.processingListIds.delete(listId);
      },
    });
  }

  isProcessing(listId: number): boolean {
    return this.processingListIds.has(listId);
  }
}
