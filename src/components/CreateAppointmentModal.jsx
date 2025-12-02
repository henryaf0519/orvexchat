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
  // Estado del formulario
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    stylistId: '',
    clientName: '',
    clientPhone: '', 
    clientEmail: ''
  });

  // Estado para manejar los errores visuales
  const [errors, setErrors] = useState({});
  // Estado para animación de "shake" (opcional, para dar feedback táctil visual)
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen && initialDate) {
        const dateStr = initialDate.toISOString().split('T')[0];
        let clickedHour = initialDate.getHours();
        if (clickedHour < START_HOUR) clickedHour = START_HOUR;
        if (clickedHour > END_HOUR) clickedHour = END_HOUR;
        
        const formattedHour = clickedHour < 10 ? `0${clickedHour}` : clickedHour;
        const timeStr = `${formattedHour}:00`;

        setFormData(prev => ({ ...prev, date: dateStr, time: timeStr }));
        setErrors({}); // Limpiar errores al abrir
    } else if (!isOpen) {
        // Reset completo al cerrar
        setFormData({ date: '', time: '', stylistId: '', clientName: '', clientPhone: '', clientEmail: '' });
        setErrors({});
    }
  }, [isOpen, initialDate]);

  // Manejador de cambios (limpia el error en cuanto el usuario escribe)
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Si había error en este campo, lo quitamos
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Validación profesional
  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = true;
    if (!formData.time) newErrors.time = true;
    if (!formData.clientName) newErrors.clientName = true;
    if (!formData.clientPhone) newErrors.clientPhone = true;
    if (!formData.clientEmail) newErrors.clientEmail = true;
    if (!formData.stylistId) newErrors.stylistId = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 1. Validar antes de enviar
    if (!validate()) {
      // Activar efecto de "vibración" si hay error
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      return;
    }

    const selectedStylist = STYLISTS.find(s => s.id === formData.stylistId);
    const stylistName = selectedStylist ? selectedStylist.name : 'Sin asignar';

    onCreate({ ...formData, stylistName });
  };

  if (!isOpen) return null;

  // --- HELPER PARA CLASES DINÁMICAS ---
  // Devuelve las clases CSS según si hay error o no
  const getInputClasses = (hasError) => `
    w-full pl-9 pr-3 py-2.5 rounded-xl border outline-none text-sm font-semibold transition-all duration-200
    ${hasError 
      ? 'bg-red-50 border-red-500 text-red-900 placeholder-red-400 focus:ring-2 focus:ring-red-200' 
      : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
    }
  `;
  
  const getIconClass = (hasError) => `
    absolute left-3 top-3.5 transition-colors duration-200
    ${hasError ? 'text-red-500' : 'text-slate-400'}
  `;

  const getLabelClass = (hasError) => `
    block text-xs font-bold uppercase mb-1.5 transition-colors duration-200 ml-1
    ${hasError ? 'text-red-500' : 'text-slate-500'}
  `;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Contenedor Modal con animación condicional de 'shake' si falla */}
      <div className={`
          bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]
          ${isShaking ? 'animate-shake' : ''} 
      `}>
        
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center flex-shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              ✨ Nueva Cita
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Diligencia todos los campos requeridos</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Fila 1: Fecha y Hora */}
            <div className="grid grid-cols-2 gap-5">
              {/* FECHA */}
              <div>
                <label className={getLabelClass(errors.date)}>
                    {errors.date ? 'Fecha requerida' : 'Fecha'}
                </label>
                <div className="relative group">
                  <FaCalendarAlt className={getIconClass(errors.date)} />
                  <input 
                    type="date"
                    className={getInputClasses(errors.date)}
                    value={formData.date}
                    onChange={e => handleChange('date', e.target.value)}
                  />
                  {errors.date && <FaExclamationCircle className="absolute right-3 top-3.5 text-red-500 animate-pulse" />}
                </div>
              </div>

              {/* HORA */}
              <div>
                <label className={getLabelClass(errors.time)}>
                    {errors.time ? 'Hora requerida' : 'Hora'}
                </label>
                <div className="relative">
                  <FaClock className={getIconClass(errors.time)} />
                  <select 
                    className={`${getInputClasses(errors.time)} appearance-none cursor-pointer`}
                    value={formData.time}
                    onChange={e => handleChange('time', e.target.value)}
                  >
                    <option value="">--:--</option>
                    {TIME_SLOTS.map((time) => (
                      <option key={time} value={time}>{formatTimeLabel(time)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fila 2: Cliente y Teléfono */}
            <div className="grid grid-cols-2 gap-5">
               <div>
                  <label className={getLabelClass(errors.clientName)}>Nombre Cliente</label>
                  <div className="relative">
                    <FaUser className={getIconClass(errors.clientName)} />
                    <input 
                      type="text" 
                      placeholder="Nombre Cliente"
                      className={getInputClasses(errors.clientName)}
                      value={formData.clientName}
                      onChange={e => handleChange('clientName', e.target.value)}
                    />
                  </div>
               </div>
               <div>
                  <label className={getLabelClass(errors.clientPhone)}>Teléfono</label>
                  <div className="relative">
                    <FaPhone className={getIconClass(errors.clientPhone)} />
                    <input 
                      type="tel" 
                      placeholder="300..."
                      className={getInputClasses(errors.clientPhone)}
                      value={formData.clientPhone}
                      onChange={e => handleChange('clientPhone', e.target.value)}
                    />
                  </div>
               </div>
            </div>

            {/* Email */}
            <div>
              <label className={getLabelClass(errors.clientEmail)}>Email (Notificación)</label>
              <div className="relative">
                <FaEnvelope className={getIconClass(errors.clientEmail)} />
                <input 
                  type="email" 
                  placeholder="cliente@ejemplo.com"
                  className={getInputClasses(errors.clientEmail)}
                  value={formData.clientEmail}
                  onChange={e => handleChange('clientEmail', e.target.value)}
                />
              </div>
            </div>

            {/* Estilista */}
            <div>
              <label className={getLabelClass(errors.stylistId)}>Profesional</label>
              <div className="relative">
                <FaUserTie className={getIconClass(errors.stylistId)} />
                <select 
                  className={`${getInputClasses(errors.stylistId)} appearance-none cursor-pointer`}
                  value={formData.stylistId}
                  onChange={e => handleChange('stylistId', e.target.value)}
                >
                  <option value="">Seleccionar estilista...</option>
                  {STYLISTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {/* Flecha select custom */}
                <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 ${errors.stylistId ? 'text-red-500' : 'text-slate-500'}`}>
                   <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>

            {/* Footer con acciones */}
            <div className="pt-6 flex gap-3 border-t border-slate-100 mt-2">
              <button 
                type="button" 
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-800 transition-all text-sm"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="flex-1 py-3 px-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex justify-center items-center gap-2 text-sm"
              >
                <FaSave size={16} /> 
                Confirmar Cita
              </button>
            </div>

          </form>
        </div>
      </div>
      
      {/* Estilo inline para la animación de 'shake' si no tienes configurado tailwind.config.js */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>

    </div>
  );
}