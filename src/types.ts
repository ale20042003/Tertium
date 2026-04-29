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

export interface PaymentInstallment {
  id: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paid: boolean;
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
}