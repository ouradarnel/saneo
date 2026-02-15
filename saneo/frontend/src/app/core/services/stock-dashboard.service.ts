import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StockSummary } from '../models/dashboard.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StockDashboardService {
  constructor(private readonly api: ApiService) {}

  getSummary(): Observable<StockSummary> {
    return this.api.get<StockSummary>('/stocks/dashboard/summary/');
  }
}
