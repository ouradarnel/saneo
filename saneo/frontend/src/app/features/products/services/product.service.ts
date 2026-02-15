import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResponse } from '../../../core/models/common.model';
import {
  Category,
  Location,
  ProductConsumeStockResponse,
  ProductDetail,
  ProductListItem,
  ProductUpsertPayload,
} from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private readonly api: ApiService) {}

  list(search = ''): Observable<PaginatedResponse<ProductListItem>> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.api.get<PaginatedResponse<ProductListItem>>(`/products/${query}`);
  }

  getById(id: number): Observable<ProductDetail> {
    return this.api.get<ProductDetail>(`/products/${id}/`);
  }

  create(payload: ProductUpsertPayload): Observable<ProductDetail> {
    return this.api.post<ProductDetail>('/products/', payload);
  }

  update(id: number, payload: ProductUpsertPayload): Observable<ProductDetail> {
    return this.api.put<ProductDetail>(`/products/${id}/`, payload);
  }

  consumeStock(productId: number, quantity: number, note = 'Consommation'): Observable<ProductConsumeStockResponse> {
    return this.api.post<ProductConsumeStockResponse>(`/products/${productId}/consume_stock/`, {
      quantity,
      note,
    });
  }

  getCategories(): Observable<Category[]> {
    return this.api
      .get<PaginatedResponse<Category>>('/products/categories/')
      .pipe(map((response) => response.results));
  }

  getLocations(): Observable<PaginatedResponse<Location>> {
    return this.api.get<PaginatedResponse<Location>>('/products/locations/');
  }
}
