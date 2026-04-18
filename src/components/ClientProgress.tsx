import React, { useState, useMemo } from 'react';
import { Plus, Trash2, TrendingDown, Scale, Target } from 'lucide-react';
import { Client, BodyMeasurement } from '../types';
import { useAppContext } from '../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ClientProgressProps {
  client: Client;
}

export const ClientProgress: React.FC<ClientProgressProps> = ({ client }) => {
  const { addBodyMeasurement, deleteBodyMeasurement } = useAppContext();
  
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    waist: '',
    thigh: '',
    chest: '',
    bicep: '',
    calf: ''
  });

  const [activeMetric, setActiveMetric] = useState<keyof BodyMeasurement>('weight');

  const metricLabels: Partial<Record<keyof BodyMeasurement, string>> = {
    weight: 'Peso (kg)',
    waist: 'Girovita (cm)',
    thigh: 'Coscia (cm)',
    chest: 'Petto (cm)',
    bicep: 'Bicipite (cm)',
    calf: 'Polpaccio (cm)'
  };

  const handleAddMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Controlla se almeno un campo è valorizzato
    if (!Object.values(formData).some(v => v !== '')) {
      alert("Inserisci almeno un valore");
      return;
    }

    const payload: Omit<BodyMeasurement, 'id' | 'date'> = {};
    if (formData.weight) payload.weight = parseFloat(formData.weight);
    if (formData.height) payload.height = parseFloat(formData.height);
    if (formData.waist) payload.waist = parseFloat(formData.waist);
    if (formData.thigh) payload.thigh = parseFloat(formData.thigh);
    if (formData.chest) payload.chest = parseFloat(formData.chest);
    if (formData.bicep) payload.bicep = parseFloat(formData.bicep);
    if (formData.calf) payload.calf = parseFloat(formData.calf);

    addBodyMeasurement(client.id, payload);
    setFormData({
      weight: '', height: '', waist: '', thigh: '', chest: '', bicep: '', calf: ''
    });
  };

  const measurements = useMemo(() => {
    const list = [...(client.measurements || [])];
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [client.measurements]);

  const reversedMeasurements = useMemo(() => {
    return [...measurements].reverse();
  }, [measurements]);

  const chartData = useMemo(() => {
    return measurements
      .filter(m => m[activeMetric] !== undefined)
      .map(m => ({
        date: new Date(m.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
        value: m[activeMetric]
      }));
  }, [measurements, activeMetric]);

  // SOLUZIONE: Trasformato in una funzione di renderizzazione diretta per non far perdere il focus
  const renderInput = (name: keyof typeof formData, label: string, placeholder: string) => (
    <div>
      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">{label}</label>
      <input
        type="number"
        step="0.1"
        min="0"
        value={formData[name]}
        onChange={e => {
          if (e.target.value.includes('-')) return; // BLOCCO NUMERI NEGATIVI
          setFormData({ ...formData, [name]: e.target.value });
        }}
        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white placeholder:text-neutral-600 focus:outline-none focus:border-lime-400 transition-colors"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="px-6 space-y-8 animate-in fade-in duration-300">
      
      {/* Form di Inserimento */}
      <div className="bg-neutral-900 rounded-3xl p-5 border border-neutral-800">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-lime-400" />
          <h2 className="text-xl font-bold text-white">Nuova Misurazione</h2>
        </div>
        
        <form onSubmit={handleAddMeasurement} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {renderInput('weight', 'Peso (kg)', 'es. 75.5')}
            {renderInput('height', 'Altezza (cm)', 'es. 180')}
            {renderInput('waist', 'Girovita (cm)', 'es. 85')}
            {renderInput('chest', 'Petto (cm)', 'es. 100')}
            {renderInput('thigh', 'Coscia (cm)', 'es. 60')}
            {renderInput('bicep', 'Bicipite (cm)', 'es. 35')}
            {renderInput('calf', 'Polpaccio (cm)', 'es. 40')}
          </div>
          
          <button 
            type="submit"
            className="w-full py-3 bg-lime-400 text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-lime-500 transition-colors"
          >
            <Plus className="w-5 h-5" /> Registra Misure
          </button>
        </form>
      </div>

      {/* Grafico */}
      {measurements.length > 0 && (
        <div className="bg-neutral-900 rounded-3xl p-5 border border-neutral-800">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-lime-400" />
              <h2 className="text-xl font-bold text-white">Andamento</h2>
            </div>
            <select
              value={activeMetric}
              onChange={(e) => setActiveMetric(e.target.value as keyof BodyMeasurement)}
              className="bg-neutral-950 border border-neutral-800 text-sm font-bold text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-lime-400"
            >
              {Object.entries(metricLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                  <XAxis dataKey="date" stroke="#737373" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#737373" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val} domain={['auto', 'auto']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '12px' }}
                    itemStyle={{ color: '#a3e635' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name={metricLabels[activeMetric as keyof typeof metricLabels]} 
                    stroke="#a3e635" 
                    strokeWidth={3} 
                    dot={{ fill: '#a3e635', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6, fill: '#fff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-neutral-500">
                <p>Nessun dato per questa metrica.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Storico Dati List */}
      {reversedMeasurements.length > 0 && (
        <div className="bg-neutral-900 rounded-3xl p-5 border border-neutral-800">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-lime-400" />
            <h2 className="text-xl font-bold text-white">Cronologia</h2>
          </div>
          
          <div className="space-y-3">
            {reversedMeasurements.map(m => (
              <div key={m.id} className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-bold text-white">{new Date(m.date).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                  <button 
                    onClick={() => {
                      if (window.confirm("Sei sicuro di voler eliminare questa misurazione?")) {
                        deleteBodyMeasurement(client.id, m.id);
                      }
                    }}
                    className="text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-y-2 gap-x-1 text-sm">
                  {m.weight && <div><span className="text-neutral-500">Peso:</span> <span className="font-bold text-lime-400">{m.weight}kg</span></div>}
                  {m.height && <div><span className="text-neutral-500">Alt.:</span> <span className="font-bold text-white">{m.height}cm</span></div>}
                  {m.waist && <div><span className="text-neutral-500">Vita:</span> <span className="font-bold text-white">{m.waist}cm</span></div>}
                  {m.chest && <div><span className="text-neutral-500">Petto:</span> <span className="font-bold text-white">{m.chest}cm</span></div>}
                  {m.thigh && <div><span className="text-neutral-500">Coscia:</span> <span className="font-bold text-white">{m.thigh}cm</span></div>}
                  {m.bicep && <div><span className="text-neutral-500">Bic.:</span> <span className="font-bold text-white">{m.bicep}cm</span></div>}
                  {m.calf && <div><span className="text-neutral-500">Polp.:</span> <span className="font-bold text-white">{m.calf}cm</span></div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};