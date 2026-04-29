import React, { useState } from 'react';
import { Users, Dumbbell, LogOut, Menu, X, Ticket, LineChart } from 'lucide-react';
import { Clients } from './Clients';
import { Exercises } from './Exercises';
import { Subscriptions } from './Subscriptions';
import { Reports } from './Reports';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'clients' | 'exercises' | 'subscriptions' | 'reports'>('clients');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'clients', label: 'Clienti', icon: Users },
    { id: 'exercises', label: 'Esercizi', icon: Dumbbell },
    { id: 'subscriptions', label: 'Abbonamenti', icon: Ticket },
    { id: 'reports', label: 'Report', icon: LineChart },
  ] as const;

  return (
    // Aggiunto h-screen per evitare che i contenuti lunghi spacchino la sidebar
    <div className="h-screen bg-neutral-50 flex flex-col md:flex-row overflow-hidden">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-neutral-200 p-4 flex justify-between items-center z-20 flex-shrink-0">
        <div className="flex items-center gap-2 font-bold text-lg text-neutral-900">
          <Dumbbell className="w-6 h-6 text-blue-600" />
          Gym Manager
        </div>
        <div className="flex items-center gap-2">
          {/* Nuovo tasto Logout rapido per mobile */}
          <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar (fissa su PC, drawer su mobile) */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out 
        md:relative md:translate-x-0 md:h-full
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:flex items-center gap-3 font-bold text-xl text-neutral-900 border-b border-neutral-100 flex-shrink-0">
          <Dumbbell className="w-7 h-7 text-blue-600" />
          Gym Manager
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4 md:mt-0 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-neutral-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Questo blocco rimarrà sempre incollato in basso */}
        <div className="p-4 border-t border-neutral-100 flex-shrink-0 bg-white">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Esci
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      {/* Aggiunto overflow-y-auto qui in modo che SOLO questa parte scorra, non tutta la pagina */}
      <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'clients' && <Clients />}
          {activeTab === 'exercises' && <Exercises />}
          {activeTab === 'subscriptions' && <Subscriptions />}
          {activeTab === 'reports' && <Reports />}
        </div>
      </main>
    </div>
  );
};