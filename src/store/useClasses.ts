import { ClassBooking, GymClass } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useClasses() {
  const [gymClasses, setGymClasses] = useLocalStorageState<GymClass[]>('gym_classes', []);
  const [classBookings, setClassBookings] = useLocalStorageState<ClassBooking[]>('gym_class_bookings', []);

  const addGymClass = (data: Omit<GymClass, 'id'>) => {
    setGymClasses(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  };

  const updateGymClass = (updated: GymClass) => {
    setGymClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteGymClass = (id: string) => {
    setGymClasses(prev => prev.filter(c => c.id !== id));
    setClassBookings(prev => prev.filter(b => b.classId !== id));
  };

  // Prenota un cliente su un'occorrenza di un corso in una data specifica.
  // Se il corso è pieno, il cliente entra in lista d'attesa.
  const bookClass = (classId: string, clientId: string, date: string) => {
    setClassBookings(prev => {
      const alreadyBooked = prev.some(
        b => b.classId === classId && b.clientId === clientId && b.date === date && b.status !== 'cancellata'
      );
      if (alreadyBooked) return prev;

      const gymClass = gymClasses.find(c => c.id === classId);
      const confirmedCount = prev.filter(b => b.classId === classId && b.date === date && b.status === 'confermata').length;
      const isFull = gymClass ? confirmedCount >= gymClass.capacity : false;

      const newBooking: ClassBooking = {
        id: crypto.randomUUID(),
        classId,
        clientId,
        date,
        status: isFull ? 'waitlist' : 'confermata',
        createdAt: new Date().toISOString(),
      };
      return [...prev, newBooking];
    });
  };

  // Se libera un posto e sblocca la lista d'attesa, promuove il primo in attesa.
  const cancelBooking = (bookingId: string) => {
    setClassBookings(prev => {
      const booking = prev.find(b => b.id === bookingId);
      if (!booking) return prev;

      let updated = prev.map(b => b.id === bookingId ? { ...b, status: 'cancellata' as const } : b);

      if (booking.status === 'confermata') {
        const waitlisted = updated
          .filter(b => b.classId === booking.classId && b.date === booking.date && b.status === 'waitlist')
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
        if (waitlisted) {
          updated = updated.map(b => b.id === waitlisted.id ? { ...b, status: 'confermata' as const } : b);
        }
      }
      return updated;
    });
  };

  const markAttendance = (bookingId: string, attended: boolean) => {
    setClassBookings(prev => prev.map(b => b.id === bookingId ? { ...b, attended } : b));
  };

  return { gymClasses, classBookings, addGymClass, updateGymClass, deleteGymClass, bookClass, cancelBooking, markAttendance };
}
