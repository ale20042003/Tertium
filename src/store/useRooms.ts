import { Room } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useRooms() {
  const [rooms, setRooms] = useLocalStorageState<Room[]>('gym_rooms', () => [
    { id: crypto.randomUUID(), name: 'Sala Pesi', type: 'pesi' },
  ]);

  const addRoom = (data: Omit<Room, 'id'>) => {
    setRooms(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  };

  const updateRoom = (updated: Room) => {
    setRooms(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const deleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  return { rooms, addRoom, updateRoom, deleteRoom };
}
