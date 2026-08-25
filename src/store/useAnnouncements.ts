import { Announcement } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useLocalStorageState<Announcement[]>('gym_announcements', []);

  const addAnnouncement = (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    setAnnouncements(prev => [{ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...prev]);
  };

  const updateAnnouncement = (updated: Announcement) => {
    setAnnouncements(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return { announcements, addAnnouncement, updateAnnouncement, deleteAnnouncement };
}
