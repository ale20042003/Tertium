export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  videoUrl?: string;
}

export interface Subscription {
  id: string;
  name: string;
  durationMonths: number;
  durationDays?: number;
  cost: number;
  defaultInstallments?: number; // numero di rate predefinito
}

export type PaymentMethod = 'contanti' | 'carta' | 'bonifico' | 'pos' | 'altro';

export interface PaymentInstallment {
  id: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paid: boolean;
  method?: PaymentMethod;
}

export interface ClientPayment {
  totalCost: number;
  amountPaid: number;
  installments: PaymentInstallment[];
}

export interface ExerciseLog {
  id: string;
  week: number;
  weight: number;
  date: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  logs?: ExerciseLog[];
}

export interface WorkoutDay {
  id: string;
  name: string; // e.g., "Giorno 1", "Lunedì"
  exercises: WorkoutExercise[];
}

export interface PastWorkoutPlan {
  id: string;
  name: string;
  date: string;
  workoutPlan: WorkoutDay[];
}

export interface BodyMeasurement {
  id: string;
  date: string; // ISO string
  weight?: number;
  height?: number;
  waist?: number;
  thigh?: number;
  chest?: number;
  bicep?: number;
  calf?: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string; // <--- AGGIUNGI QUESTA RIGA
  password?: string;
  isRegistered?: boolean;
  workoutPlan: WorkoutDay[];
  pastPlans?: PastWorkoutPlan[];
  measurements?: BodyMeasurement[];
  subscriptionId?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  payment?: ClientPayment;
  birthDate?: string; // YYYY-MM-DD
  medicalCertificateExpiry?: string; // YYYY-MM-DD
  nutritionPlan?: NutritionPlan;
}

// ─── Piano Alimentare ───────────────────────────────────────────
export interface NutritionMeal {
  id: string;
  name: string; // es. Colazione, Pranzo, Cena
  time?: string; // 'HH:MM'
  items: string; // testo libero, es. "Petto di pollo 150g, riso 80g, verdure"
}

export interface NutritionPlan {
  id: string;
  title: string;
  dailyCalories?: number;
  dailyProtein?: number;
  dailyCarbs?: number;
  dailyFat?: number;
  meals: NutritionMeal[];
  notes?: string;
  updatedAt: string; // ISO
}

// ─── Personale ────────────────────────────────────────────────
export interface StaffPermissions {
  clients?: boolean;
  classes?: boolean;
  gymAccess?: boolean;
  equipment?: boolean;
  leads?: boolean;
  shop?: boolean;
  finance?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string; // es. Istruttore, Personal Trainer, Segreteria, Manutenzione
  active: boolean;
  hourlyRate?: number;
  hireDate?: string; // YYYY-MM-DD
  notes?: string;
  accountEnabled?: boolean;
  password?: string;
  permissions?: StaffPermissions;
}

// ─── Sale ─────────────────────────────────────────────────────
export interface Room {
  id: string;
  name: string;
  type: 'pesi' | 'corso' | 'altro';
  capacity?: number;
}

// ─── Corsi & Prenotazioni ─────────────────────────────────────
export interface ClassSlot {
  dayOfWeek: number; // 0 = Domenica ... 6 = Sabato
  startTime: string; // 'HH:MM'
}

export interface GymClass {
  id: string;
  name: string;
  description?: string;
  staffId?: string;
  roomId?: string;
  capacity: number;
  durationMinutes: number;
  color: string;
  schedule: ClassSlot[];
}

export type BookingStatus = 'confermata' | 'waitlist' | 'cancellata';

export interface ClassBooking {
  id: string;
  classId: string;
  clientId: string;
  date: string; // YYYY-MM-DD (data dell'occorrenza)
  status: BookingStatus;
  attended?: boolean;
  createdAt: string; // ISO
}

// ─── Sala Pesi / Accessi ──────────────────────────────────────
export interface CheckIn {
  id: string;
  clientId: string;
  dateTime: string; // ISO
  type: 'sala_pesi' | 'corso';
  classBookingId?: string;
}

// ─── Attrezzature ─────────────────────────────────────────────
export type EquipmentStatus = 'operativo' | 'manutenzione' | 'guasto' | 'dismesso';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  status: EquipmentStatus;
  purchaseDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  notes?: string;
}

// ─── Spese ────────────────────────────────────────────────────
export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  recurring?: boolean;
}

// ─── Lead / Prospect ──────────────────────────────────────────
export type LeadStatus = 'nuovo' | 'contattato' | 'prova_fissata' | 'convertito' | 'perso';

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: LeadStatus;
  createdAt: string; // ISO
  trialDate?: string;
  notes?: string;
}

// ─── Impostazioni palestra ────────────────────────────────────
export interface OpeningHour {
  day: number; // 0-6
  open: string; // 'HH:MM'
  close: string; // 'HH:MM'
}

export interface GymSettings {
  name: string;
  address?: string;
  phone?: string;
  openingHours: OpeningHour[];
}

// ─── Bacheca / Annunci ─────────────────────────────────────────
export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string; // ISO
  pinned?: boolean;
}

// ─── Negozio: Prodotti & Vendite ────────────────────────────────
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost?: number;
  stock: number;
  active: boolean;
}

export interface Sale {
  id: string;
  date: string; // ISO
  productId: string;
  clientId?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}