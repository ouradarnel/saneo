import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../../core/models/common.model';
import {
  GenerateAutoResponse,
  ShoppingList,
  ShoppingListDetail,
  ShoppingListItem,
} from '../../../core/models/shopping.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ShoppingService {
  constructor(private readonly api: ApiService) {}

  getLists(status: '' | 'draft' | 'active' | 'completed' | 'archived' = ''): Observable<PaginatedResponse<ShoppingList>> {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.api.get<PaginatedResponse<ShoppingList>>(`/shopping/lists/${query}`);
  }

  getListById(listId: number): Observable<ShoppingListDetail> {
    return this.api.get<ShoppingListDetail>(`/shopping/lists/${listId}/`);
  }

  generateAutoList(): Observable<GenerateAutoResponse> {
    return this.api.post<GenerateAutoResponse>('/shopping/lists/generate_auto/', {});
  }

  completeList(
    listId: number,
    autoUpdateStock = false
  ): Observable<{ status: string; stock_updated: boolean; batches_created: number }> {
    return this.api.post<{ status: string; stock_updated: boolean; batches_created: number }>(
      `/shopping/lists/${listId}/complete/`,
      {
      auto_update_stock: autoUpdateStock,
      }
    );
  }

  archiveList(listId: number): Observable<{ status: string }> {
    return this.api.post<{ status: string }>(`/shopping/lists/${listId}/archive/`, {});
  }

  activateList(listId: number): Observable<{ status: string }> {
    return this.api.post<{ status: string }>(`/shopping/lists/${listId}/activate/`, {});
  }

  deleteList(listId: number): Observable<void> {
    return this.api.delete<void>(`/shopping/lists/${listId}/`);
  }

  toggleItem(itemId: number): Observable<ShoppingListItem> {
    return this.api.post<ShoppingListItem>(`/shopping/items/${itemId}/toggle_check/`, {});
  }

  setActual(
    itemId: number,
    payload: { actual_quantity?: number; actual_cost?: number }
  ): Observable<ShoppingListItem> {
    return this.api.post<ShoppingListItem>(`/shopping/items/${itemId}/set_actual/`, payload);
  }
}
