export interface StockSummary {
  total_products: number;
  total_batches: number;
  products_below_threshold: number;
  products_out_of_stock: number;
  batches_expiring_soon: number;
  batches_expired: number;
  total_value: string;
}
