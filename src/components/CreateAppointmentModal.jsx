import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave, FaUserTie, FaEnvelope, FaClock, FaCalendarAlt, FaUser, FaPhone } from 'react-icons/fa';

// Lista mock de estilistas (luego vendrá de tu API)
const STYLISTS = [
  { id: 'over_otalora', name: 'Over Otalora' },
  { id: 'daniel_soto', name: 'Daniel Soto' },
  { id: 'jorge_diaz', name: 'Jorge Díaz' }
];
const START_HOUR = 5;
const END_HOUR = 20;
const TIME_SLOTS = [];
for (let i = START_HOUR; i <= END_HOUR; i++) {
  const hour = i < 10 ? `0${i}` : i;
  TIME_SLOTS.push(`${hour}:00`);
}
const formatTimeLabel = (timeStr) => {
    if (!timeStr) return '';
    const [hour, minute] = timeStr.split(':');
    const h = parseInt(hour, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  };

export default function CreateAppointmentModal({ isOpen, onClose, onCreate, initialDate }) {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    stylistId: '',
    clientName: '',
    clientPhone: '', 
    clientEmail: ''
  });

  // ... (useEffect se mantiene igual) ...
  useEffect(() => {
    if (isOpen && initialDate) {
        const dateStr = initialDate.toISOString().split('T')[0];
        let clickedHour = initialDate.getHours();
        if (clickedHour < START_HOUR) clickedHour = START_HOUR;
        if (clickedHour > END_HOUR) clickedHour = END_HOUR;
        const formattedHour = clickedHour < 10 ? `0${clickedHour}` : clickedHour;
        const timeStr = `${formattedHour}:00`;
        setFormData(prev => ({ ...prev, date: dateStr, time: timeStr }));
    } else if (!isOpen) {
        setFormData({ date: '', time: '', stylistId: '', clientName: '', clientPhone: '', clientEmail: '' });
    }
  }, [isOpen, initialDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Obtener nombre del estilista
    const selectedStylist = STYLISTS.find(s => s.id === formData.stylistId);
    const stylistName = selectedStylist ? selectedStylist.name : 'Sin asignar';

    onCreate({
        ...formData,
        stylistName
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        
        {/* Header ... */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">✨ Nueva Cita</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors"><FaTimes size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Fecha y Hora ... (Igual que antes) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3 text-slate-400" />
                <input type="date" required className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-medium" 
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hora</label>
              <div className="relative">
                <FaClock className="absolute left-3 top-3 text-slate-400" />
                <select required className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-medium cursor-pointer"
                  value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})}>
                  <option value="">--:--</option>
                  {TIME_SLOTS.map((time) => (<option key={time} value={time}>{formatTimeLabel(time)}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* Nombre y Teléfono */}
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Cliente</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" placeholder="Ej: Henry" required className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-medium"
                    value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
                <div className="relative">
                  <FaPhone className="absolute left-3 top-3 text-slate-400" />
                  <input type="tel" placeholder="3001234567" required className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-medium"
                    value={formData.clientPhone} onChange={e => setFormData({...formData, clientPhone: e.target.value})} />
                </div>
             </div>
          </div>

          {/* Email y Estilista ... (Igual que antes) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-3 text-slate-400" />
              <input type="email" placeholder="cliente@ejemplo.com" required className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-medium"
                value={formData.clientEmail} onChange={e => setFormData({...formData, clientEmail: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estilista</label>
            <div className="relative">
              <FaUserTie className="absolute left-3 top-3 text-slate-400" />
              <select required className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-sm font-medium cursor-pointer"
                value={formData.stylistId} onChange={e => setFormData({...formData, stylistId: e.target.value})}>
                <option value="">Seleccionar profesional...</option>
                {STYLISTS.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 px-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex justify-center items-center gap-2"><FaSave /> Guardar Cita</button>
          </div>

        </form>
      </div>
    </div>
  );
}