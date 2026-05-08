import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Stylist = {
  id: string
  owner_id: string
  name: string
  color: string
  bg_color: string
  commission_rate: number
  active: boolean
  created_at: string
}

export type Client = {
  id: string
  owner_id: string
  name: string
  email: string
  phone: string
  tier: string
  points: number
  total_spend: number
  visits: number
  last_visit: string | null
  referrals: number
  notes: string
  created_at: string
}

export type Appointment = {
  id: string
  owner_id: string
  client_id: string | null
  staff_id: string | null
  service_name: string
  start_time: string
  duration: number
  price: number
  status: string
  notes: string
  loyalty_points: number
  created_at: string
  clients?: { name: string }
  staff?: { name: string; color: string }
}

export type Product = {
  id: string
  owner_id: string
  name: string
  brand: string
  type: string
  qty: number
  reorder_at: number
  cost: number
  price: number
  margin: number
  created_at: string
}

export type Service = {
  id: string
  owner_id: string
  name: string
  price: number
  duration: number
  commission_rate: number
  active: boolean
}

export type Transaction = {
  id: string
  owner_id: string
  client_id: string | null
  subtotal: number
  discount_pct: number
  discount_amt: number
  tax: number
  total: number
  payment_method: string
  created_at: string
}

export type Expense = {
  id: string
  owner_id: string
  category: string
  vendor: string
  amount: number
  type: string
  date: string
}
