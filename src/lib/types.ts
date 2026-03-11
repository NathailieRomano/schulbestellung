export interface Teacher {
  id: string
  name: string
  campus: 'schoenau' | 'zulg'
  token: string | null
  created_at: string
}

export interface Order {
  id: string
  teacher_id: string
  status: 'draft' | 'submitted'
  submitted_at: string | null
  updated_at: string
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  article_number: string
  article_name: string
  category: string
  subcategory: string
  quantity: number
  note: string | null
  created_at: string
}

export interface TeacherWithOrder extends Teacher {
  order?: Order
  item_count?: number
}
