export interface StockBatch {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  quantity: string;
  location: number | null;
  location_name: string | null;
  expiry_date: string | null;
  purchase_date: string;
  purchase_price: string | null;
  supplier: string;
  notes: string;
  is_expired: boolean;
  days_until_expiry: number | null;
  created_at: string;
  updated_at: string;
}

export interface StockBatchCreatePayload {
  product: number;
  quantity: number;
  location: number | null;
  expiry_date: string | null;
  purchase_date: string;
  purchase_price: number | null;
  supplier: string;
  notes: string;
}

export interface ConsumeBatchResponse {
  message: string;
  remaining: string;
  movement: {
    id: number;
    quantity: string;
    type: 'IN' | 'OUT' | 'ADJUST';
    date: string;
  };
}

export interface ExpiryAlert {
  id: number;
  batch: number;
  product_name: string;
  batch_quantity: string;
  expiry_date: string | null;
  days_until_expiry: number | null;
  alert_type: 'EXPIRING_SOON' | 'EXPIRED';
  alert_type_display: string;
  alert_date: string;
  is_read: boolean;
  email_sent: boolean;
}
