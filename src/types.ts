export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  videoUrl?: string;
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
  phone?: string;
  password?: string;
  isRegistered?: boolean;
  workoutPlan: WorkoutDay[];
  pastPlans?: PastWorkoutPlan[];
  measurements?: BodyMeasurement[];
  birthDate?: string; // YYYY-MM-DD
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