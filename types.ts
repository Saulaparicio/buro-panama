export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  brand_color?: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  plan_id?: string;
}

export interface Member {
  id: string;
  tenant_id: string;
  name: string;
  full_name?: string; // Legacy support
  membership_level?: string; // For display
  role: string;
  company: string;
  image?: string;
  avatar_url?: string;
  status: 'active' | 'inactive';
  registration_date?: string;
  email: string;
  phone?: string;
  credits: number; // For room usage tokens
  created_at?: string;
  settings?: any;
}

export interface Space {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  capacity: number;
  price: number;
  images: string[];
  type: 'desk' | 'office' | 'meeting' | 'studio';
  popular?: boolean;
  features?: string[];
  map_top?: number;
  map_left?: number;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Reservation {
  id: string;
  tenant_id: string;
  space_id: string;
  member_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'completed' | 'cancelled' | 'pending';
  reference_code: string;
  notes?: string;
}

export interface Benefit {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  is_active: boolean;
}

export interface MembershipTier {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'daily' | 'monthly' | 'annual';
  features: string[];
  is_active: boolean;
  monthly_credits: number;
  hot_desk_days?: number;
  private_desk_days?: number;
  parking_days?: number;
  meeting_room_hours?: number;
  is_popular?: boolean;
  highlighted?: boolean;
}

export interface Membership {
  id: string;
  tenant_id: string;
  profile_id: string;
  tier_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  tier?: MembershipTier;
}

export interface Payment {
  id: string;
  tenant_id: string;
  profile_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'stripe' | 'cash' | 'transfer' | 'card';
  description?: string;
  reference_id?: string;
  created_at: string;
}

export interface Post {
  id: string;
  tenant_id: string;
  profile_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  created_at: string;
  profile?: {
    name: string;
    avatar_url: string;
  };
}

export interface CommunityEvent {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  image_url?: string;
  capacity?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  rsvps_count?: number;
}

export interface Guest {
  id: string;
  tenant_id: string;
  host_id: string;
  full_name: string;
  email: string;
  visit_date: string;
  visit_time: string;
  status: 'pending' | 'arrived' | 'departed' | 'cancelled';
  notes?: string;
  created_at: string;
  host?: Member;
}

export interface Quote {
  id: string;
  tenant_id: string;
  client_name: string;
  client_email: string;
  items: Array<{
    description: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  notes?: string;
  valid_until?: string;
  created_at: string;
}
