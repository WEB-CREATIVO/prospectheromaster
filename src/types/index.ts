export type OperationType = 'sale' | 'rent'
export type PropertyType =
  | 'apartment' | 'house' | 'villa' | 'penthouse' | 'studio'
  | 'duplex' | 'chalet' | 'townhouse' | 'commercial' | 'land' | 'garage' | 'storage'
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'inactive'
export type LeadStatus =
  | 'new' | 'contacted' | 'qualified' | 'proposal'
  | 'visit_scheduled' | 'closed_won' | 'closed_lost'
export type ConversationStatus = 'active' | 'closed' | 'archived'
export type MessageRole = 'user' | 'assistant' | 'system'

export interface AgencyConfig {
  id: string
  name: string
  slug?: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  welcome_message: string
  ai_persona: string
  contact_email?: string
  contact_phone?: string
  address?: string
  city?: string
  website?: string
  currency: string
  language: string
  timezone: string
  lead_capture_enabled: boolean
  lead_capture_trigger: number
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  reference: string
  title: string
  description?: string
  operation_type: OperationType
  property_type: PropertyType
  price: number
  currency: string
  price_per_m2?: number
  area_m2?: number
  useful_area_m2?: number
  bedrooms: number
  bathrooms: number
  floor?: number
  total_floors?: number
  address: string
  city: string
  neighborhood?: string
  province?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  year_built?: number
  has_elevator: boolean
  has_parking: boolean
  has_storage_room: boolean
  has_terrace: boolean
  has_garden: boolean
  has_pool: boolean
  has_air_conditioning: boolean
  has_heating: boolean
  has_furnished: boolean
  has_security: boolean
  energy_certificate?: string
  orientation?: string
  community_fee?: number
  ibi_fee?: number
  features: string[]
  virtual_tour_url?: string
  video_url?: string
  status: PropertyStatus
  highlight: boolean
  views_count: number
  primary_image_url?: string
  created_at: string
  updated_at: string
}

export interface PropertyImage {
  id: string
  property_id: string
  url: string
  storage_path?: string
  alt_text?: string
  image_analysis?: string
  detected_features?: Record<string, unknown>
  is_primary: boolean
  sort_order: number
  created_at: string
}

export interface PropertyWithImages extends Property {
  images: PropertyImage[]
}

export interface Conversation {
  id: string
  session_id: string
  visitor_name?: string
  visitor_email?: string
  visitor_phone?: string
  channel: string
  status: ConversationStatus
  converted: boolean
  conversion_type?: string
  converted_at?: string
  summary?: string
  sentiment?: string
  interest_level?: number
  detected_intent: Record<string, unknown>
  metadata: Record<string, unknown>
  started_at: string
  ended_at?: string
  last_message_at: string
  message_count: number
}

export interface Message {
  id: string
  conversation_id: string
  role: MessageRole
  content: string
  content_type: string
  properties_shown: string[]
  tokens_input?: number
  tokens_output?: number
  model?: string
  latency_ms?: number
  metadata: Record<string, unknown>
  created_at: string
}

export interface Lead {
  id: string
  conversation_id?: string
  name?: string
  email?: string
  phone?: string
  interest_type?: OperationType | 'both'
  property_id?: string
  budget_min?: number
  budget_max?: number
  bedrooms_needed?: number
  city_preference?: string
  property_type_preference?: string
  notes?: string
  ai_summary?: string
  status: LeadStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  source: string
  assigned_to?: string
  next_action?: string
  next_action_date?: string
  created_at: string
  updated_at: string
  property?: Property
  conversation?: Conversation
}

// Chat types
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  properties?: Property[]
  isTyping?: boolean
}

export interface SearchFilters {
  query?: string
  operation_type?: OperationType
  property_type?: PropertyType
  city?: string
  neighborhood?: string
  min_price?: number
  max_price?: number
  min_bedrooms?: number
  max_bedrooms?: number
  min_area?: number
  has_parking?: boolean
  has_elevator?: boolean
  has_pool?: boolean
  has_terrace?: boolean
}

export interface SearchResult {
  properties: Property[]
  total_count: number
  filters_applied: SearchFilters
}

export interface AnalyticsData {
  today: {
    conversations: number
    leads: number
    conversions: number
    messages: number
  }
  week: {
    conversations: number
    leads: number
    conversions: number
    conversion_rate: number
  }
  top_properties: Array<{ property: Property; views: number }>
  daily_stats: Array<{
    date: string
    conversations: number
    leads: number
    conversions: number
  }>
}
