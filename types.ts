
export interface Member {
  id: string;
  name: string;
  full_name?: string;
  role: string;
  company: string;
  image?: string;
  avatar_url?: string;
  status: 'active' | 'inactive';
  registration_date?: string; // Alineado con Supabase
  email: string;
  phone?: string;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  capacity: number;
  price: number;
  images: string[]; // Cambiado de image: string a images: string[]
  type: 'desk' | 'office' | 'meeting' | 'studio';
  popular?: boolean;
  features?: string[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface Reservation {
  id: string;
  space_id: string;
  member_id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'completed' | 'cancelled';
  reference_code: string;
  notes?: string;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  is_active: boolean;
}

export interface MembershipTier {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'daily' | 'monthly' | 'annual';
  features: string[];
  is_active: boolean;
}

export interface Membership {
  id: string;
  profile_id: string;
  tier_id: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  tier?: MembershipTier; // For joined queries
}

export interface Payment {
  id: string;
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
  profile_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface CommunityEvent {
  id: string;
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
