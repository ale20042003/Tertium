import { Lead } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useLeads() {
  const [leads, setLeads] = useLocalStorageState<Lead[]>('gym_leads', []);

  const addLead = (data: Omit<Lead, 'id' | 'createdAt'>) => {
    setLeads(prev => [...prev, { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  };

  const updateLead = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  };

  const deleteLead = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  return { leads, addLead, updateLead, deleteLead };
}
