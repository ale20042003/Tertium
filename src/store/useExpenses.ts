import { Expense } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useExpenses() {
  const [expenses, setExpenses] = useLocalStorageState<Expense[]>('gym_expenses', []);

  const addExpense = (data: Omit<Expense, 'id'>) => {
    setExpenses(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  };

  const updateExpense = (updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  return { expenses, addExpense, updateExpense, deleteExpense };
}
