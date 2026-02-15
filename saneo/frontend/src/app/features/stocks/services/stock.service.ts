import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaginatedResponse } from '../../../core/models/common.model';
import {
  ConsumeBatchResponse,
  ExpiryAlert,
  StockBatch,
  StockBatchCreatePayload,
} from '../../../core/models/stock.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class StockService {
  constructor(private readonly api: ApiService) {}

  getBatches(): Observable<PaginatedResponse<StockBatch>> {
    return this.api.get<PaginatedResponse<StockBatch>>('/stocks/batches/');
  }

  createBatch(payload: StockBatchCreatePayload): Observable<StockBatch> {
    return this.api.post<StockBatch>('/stocks/batches/', payload);
  }

  updateBatch(batchId: number, payload: Partial<StockBatchCreatePayload>): Observable<StockBatch> {
    return this.api.patch<StockBatch>(`/stocks/batches/${batchId}/`, payload);
  }

  deleteBatch(batchId: number): Observable<void> {
    return this.api.delete<void>(`/stocks/batches/${batchId}/`);
  }

  consumeBatch(batchId: number, quantity: number, note = 'Consommation'): Observable<ConsumeBatchResponse> {
    return this.api.post<ConsumeBatchResponse>(`/stocks/batches/${batchId}/consume/`, {
      quantity,
      note,
    });
  }

  getUnreadAlerts(): Observable<ExpiryAlert[]> {
    return this.api.get<ExpiryAlert[]>('/stocks/alerts/unread/');
  }

  markAlertRead(alertId: number): Observable<{ status: string }> {
    return this.api.post<{ status: string }>(`/stocks/alerts/${alertId}/mark_read/`, {});
  }
}
