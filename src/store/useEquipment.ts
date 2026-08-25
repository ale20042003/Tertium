import { Equipment } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useEquipment() {
  const [equipment, setEquipment] = useLocalStorageState<Equipment[]>('gym_equipment', []);

  const addEquipment = (data: Omit<Equipment, 'id'>) => {
    setEquipment(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  };

  const updateEquipment = (updated: Equipment) => {
    setEquipment(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const deleteEquipment = (id: string) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
  };

  return { equipment, addEquipment, updateEquipment, deleteEquipment };
}
