export interface Category {
  id: number;
  name: string;
  name_display: string;
  icon: string;
  color: string;
  product_count: number;
}

export interface Location {
  id: number;
  name: string;
  name_display: string;
  description: string;
}

export type ProductUnit = 'piece';

export interface ProductListItem {
  id: number;
  name: string;
  category: number;
  category_name: string;
  unit: ProductUnit;
  unit_display: string;
  default_location: number | null;
  location_name: string | null;
  threshold: string;
  total_stock: string;
  is_below_threshold: boolean;
  needs_restock: boolean;
  brand: string;
  auto_add_to_list: boolean;
}

export interface ProductDetail extends ProductListItem {
  barcode: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ProductUpsertPayload {
  name: string;
  category: number;
  default_location: number | null;
  threshold: number;
  barcode: string;
  brand: string;
  notes: string;
  auto_add_to_list: boolean;
}

export interface ProductConsumeStockResponse {
  message: string;
  consumed: string;
  remaining_total_stock: string;
  movements_created: number;
}
