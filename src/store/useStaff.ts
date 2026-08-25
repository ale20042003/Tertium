import { StaffMember } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useStaff() {
  const [staff, setStaff] = useLocalStorageState<StaffMember[]>('gym_staff', []);

  const addStaff = (data: Omit<StaffMember, 'id'>) => {
    setStaff(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  };

  const updateStaff = (updated: StaffMember) => {
    setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const deleteStaff = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
  };

  return { staff, addStaff, updateStaff, deleteStaff };
}
