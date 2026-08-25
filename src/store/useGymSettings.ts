import { GymSettings } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

const defaultSettings: GymSettings = {
  name: 'La Mia Palestra',
  address: '',
  phone: '',
  openingHours: [
    { day: 1, open: '08:00', close: '22:00' },
    { day: 2, open: '08:00', close: '22:00' },
    { day: 3, open: '08:00', close: '22:00' },
    { day: 4, open: '08:00', close: '22:00' },
    { day: 5, open: '08:00', close: '22:00' },
    { day: 6, open: '09:00', close: '13:00' },
  ],
};

export function useGymSettings() {
  const [gymSettings, setGymSettings] = useLocalStorageState<GymSettings>('gym_settings', defaultSettings);

  const updateGymSettings = (updated: GymSettings) => {
    setGymSettings(updated);
  };

  return { gymSettings, updateGymSettings };
}
