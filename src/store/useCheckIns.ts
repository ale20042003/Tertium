import { CheckIn } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useCheckIns() {
  const [checkIns, setCheckIns] = useLocalStorageState<CheckIn[]>('gym_checkins', []);

  const checkInClient = (clientId: string, type: CheckIn['type'] = 'sala_pesi', classBookingId?: string) => {
    const newCheckIn: CheckIn = {
      id: crypto.randomUUID(),
      clientId,
      dateTime: new Date().toISOString(),
      type,
      classBookingId,
    };
    setCheckIns(prev => [newCheckIn, ...prev]);
  };

  const deleteCheckIn = (id: string) => {
    setCheckIns(prev => prev.filter(c => c.id !== id));
  };

  return { checkIns, checkInClient, deleteCheckIn };
}
