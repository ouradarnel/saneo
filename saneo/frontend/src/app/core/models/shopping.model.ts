export interface ShoppingList {
  id: number;
  title: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  status_display: string;
  is_auto_generated: boolean;
  notes: string;
  total_items: number;
  checked_items: number;
  completion_percentage: number;
  estimated_total_cost: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface ShoppingListItem {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  category_name: string;
  suggested_quantity: string;
  actual_quantity: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  priority_display: string;
  reason: 'below_threshold' | 'out_of_stock' | 'expiring_soon' | 'manual';
  reason_display: string;
  estimated_cost: string | null;
  actual_cost: string | null;
  is_checked: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ShoppingListDetail extends ShoppingList {
  items: ShoppingListItem[];
}

export interface GenerateAutoResponse {
  message: string;
  list_created: boolean;
  item_count: number;
  list: ShoppingListDetail | null;
}
