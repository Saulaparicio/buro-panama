
import { Member, Space, Reservation, Benefit } from './types';

export const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'Carlos Méndez', role: 'Senior Full Stack Developer', company: 'TechNova Solutions', image: 'https://picsum.photos/seed/carlos/200', status: 'active', registration_date: '2023-01-15', email: 'carlos@technova.com' },
  { id: '2', name: 'Ana Sofía Rodríguez', role: 'Directora Creativa', company: 'Studio Bloom', image: 'https://picsum.photos/seed/ana/200', status: 'active', registration_date: '2023-06-12', email: 'ana.r@bloom.com' },
  { id: '3', name: 'Ricardo Varela', role: 'Consultor Financiero', company: 'Varela & Co.', image: 'https://picsum.photos/seed/ricardo/200', status: 'active', registration_date: '2022-11-20', email: 'r.varela@varela.co' },
  { id: '4', name: 'Elena Lasso', role: 'Growth Marketing Lead', company: 'Startup Hub Panama', image: 'https://picsum.photos/seed/elena/200', status: 'active', registration_date: '2023-03-05', email: 'elena@startup.com' },
  { id: '5', name: 'Juan Diego Pérez', role: 'Arquitecto de Software', company: 'Blue Grid', image: 'https://picsum.photos/seed/juan/200', status: 'active', registration_date: '2023-08-21', email: 'juan@bluegrid.com' },
];

export const MOCK_SPACES: Space[] = [
  { 
    id: 's1', 
    name: 'Sala Creativa A', 
    type: 'meeting', 
    capacity: 6, 
    price: 25, 
    popular: true, 
    features: ['wifi', 'videocam', 'coffee'], 
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&q=80&w=800'
    ], 
    description: 'Espacio amplio con luz natural, ideal para sesiones de brainstorming y presentaciones ejecutivas.',
    location: { lat: 8.9912, lng: -79.5029, address: 'San Francisco, Calle 74' }
  },
  { 
    id: 's2', 
    name: 'Escritorio Hot-Desk', 
    type: 'desk', 
    capacity: 1, 
    price: 10, 
    features: ['wifi', 'print'], 
    images: ['https://images.unsplash.com/photo-1590608897129-79da98d15969?auto=format&fit=crop&q=80&w=800'], 
    description: 'Un lugar flexible en nuestra zona común. Perfecto para nómadas digitales que buscan inspiración.',
    location: { lat: 8.9830, lng: -79.5210, address: 'Obarrio, Calle 50' }
  },
  { 
    id: 's3', 
    name: 'Oficina Ejecutiva 101', 
    type: 'office', 
    capacity: 2, 
    price: 45, 
    features: ['wifi', 'lock'], 
    images: ['https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800'], 
    description: 'Privacidad total y mobiliario ergonómico premium para reuniones confidenciales o trabajo enfocado.',
    location: { lat: 8.9815, lng: -79.5195, address: 'Marbella, World Trade Center' }
  },
];

export const MOCK_RESERVATIONS: Reservation[] = [
  { 
    id: 'r1', 
    space_id: 's3', 
    member_id: '1', 
    start_time: '2023-10-12T10:00:00', 
    end_time: '2023-10-12T12:00:00', 
    status: 'confirmed', 
    reference_code: '#BUR-8821' 
  },
];

export const MOCK_BENEFITS: Benefit[] = [
  { id: 'b1', category: 'Gastronomía', title: '20% en Café Local', description: 'Descuento exclusivo en toda la carta para miembros de BURÓ.', image: 'https://picsum.photos/seed/coffee/600/400', is_active: true },
  { id: 'b2', category: 'Bienestar', title: 'Gimnasio Partner', description: 'Membresía Platinum con acceso ilimitado a clases a precio preferencial.', image: 'https://picsum.photos/seed/gym/600/400', is_active: true },
];
