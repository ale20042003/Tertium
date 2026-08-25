import { Product, Sale } from '../types';
import { useLocalStorageState } from './useLocalStorageState';

export function useProducts() {
  const [products, setProducts] = useLocalStorageState<Product[]>('gym_products', []);
  const [sales, setSales] = useLocalStorageState<Sale[]>('gym_sales', []);

  const addProduct = (data: Omit<Product, 'id'>) => {
    setProducts(prev => [...prev, { ...data, id: crypto.randomUUID() }]);
  };

  const updateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Vende `quantity` unità di un prodotto: valida lo stock disponibile, lo decrementa e registra la vendita.
  const sellProduct = (productId: string, quantity: number, clientId?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || quantity <= 0 || product.stock < quantity) return false;

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: p.stock - quantity } : p));
    const sale: Sale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      productId,
      clientId,
      quantity,
      unitPrice: product.price,
      total: product.price * quantity,
    };
    setSales(prev => [sale, ...prev]);
    return true;
  };

  const deleteSale = (id: string) => {
    setSales(prev => prev.filter(s => s.id !== id));
  };

  return { products, sales, addProduct, updateProduct, deleteProduct, sellProduct, deleteSale };
}
