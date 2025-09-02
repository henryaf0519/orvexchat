// src/components/CreateReminderForm.jsx
import { useState, useEffect } from 'react'; // Añadimos useEffect
import { useChatStore } from '../store/chatStore';
import { FaPaperPlane, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaChevronDown } from 'react-icons/fa';

// --- VALORES QUEMADOS (TEMPORAL) ---
// Más adelante, esto vendrá de un servicio.
const mockContactList = [
  { id: '1', name: 'Cliente Principal', number: '573196372542' },
  { id: '2', name: 'Proveedor A', number: '573001112233' },
  { id: '3', name: 'Socio Comercial', number: '573214445566' },
  { id: '4', name: 'Equipo de Ventas', number: '573157778899' },
];
// ------------------------------------

export default function CreateReminderForm() {
  const createSchedule = useChatStore((state) => state.createSchedule);
  
  // ✅ 1. 'phoneNumbers' ahora es un array para los números seleccionados
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    phoneNumbers: [], 
    scheduleType: 'once',
    sendAt: '',
    recurringDays: [],
    recurringTime: '09:00',
  });

  // Estado para manejar la visibilidad del menú desplegable
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  // ✅ 2. Nueva función para manejar la selección de números
  const handlePhoneNumberChange = (number) => {
    setFormData((prev) => {
        const newNumbers = prev.phoneNumbers.includes(number)
            ? prev.phoneNumbers.filter(n => n !== number)
            : [...prev.phoneNumbers, number];
        return { ...prev, phoneNumbers: newNumbers };
    });
  };

  const handleSelectAll = () => {
    const allNumbers = mockContactList.map(c => c.number);
    setFormData(prev => ({ ...prev, phoneNumbers: allNumbers }));
  };
  
  const handleDayChange = (day) => {
    setFormData((prev) => {
      const newDays = prev.recurringDays.includes(day)
        ? prev.recurringDays.filter(d => d !== day)
        : [...prev.recurringDays, day];
      return { ...prev, recurringDays: newDays.sort((a, b) => a - b) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // ✅ 3. El array 'phoneNumbers' ya está listo para ser enviado
    const { phoneNumbers, recurringDays, recurringTime, ...rest } = formData;

    if (phoneNumbers.length === 0) {
      setError('Debes seleccionar al menos un número de teléfono de destino.');
      setLoading(false);
      return;
    }
    
    let finalData = { ...rest, phoneNumbers };

    if (finalData.scheduleType === 'once') {
      if (!finalData.sendAt) {
        setError('Debes especificar una fecha y hora para envíos únicos.');
        setLoading(false);
        return;
      }
      finalData.sendAt = `${finalData.sendAt}:00.000Z`;
    } else {
      if (recurringDays.length === 0) {
        setError('Debes seleccionar al menos un día para envíos recurrentes.');
        setLoading(false);
        return;
      }
      const [hour, minute] = recurringTime.split(':');
      const cronExpression = `${minute} ${hour} * * ${recurringDays.join(',')}`;
      finalData.cronExpression = cronExpression;
      delete finalData.sendAt;
    }

    try {
      await createSchedule(finalData);
      setSuccess('¡Recordatorio creado exitosamente!');
      setFormData({
        name: '', message: '', phoneNumbers: [], scheduleType: 'once',
        sendAt: '', recurringDays: [], recurringTime: '09:00',
      });
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };
  
  const daysOfWeek = [
      { label: 'L', value: 1, title: 'Lunes' }, { label: 'M', value: 2, title: 'Martes' }, 
      { label: 'X', value: 3, title: 'Miércoles' }, { label: 'J', value: 4, title: 'Jueves' }, 
      { label: 'V', value: 5, title: 'Viernes' }, { label: 'S', value: 6, title: 'Sábado' },
      { label: 'D', value: 0, title: 'Domingo' }
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 transform transition-all hover:shadow-xl">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Programar Nuevo Envío</h3>
        <p className="text-gray-500 mt-1">Completa los detalles para tu campaña de mensajería.</p>
      </div>

      {error && (
        <div className="flex items-center bg-red-50 text-red-700 p-3 rounded-lg mb-4 border border-red-200">
          <FaExclamationTriangle className="mr-3" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center bg-green-50 text-green-700 p-3 rounded-lg mb-4 border border-green-200">
          <FaCheckCircle className="mr-3" /> {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Detalles del Mensaje</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Campaña</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" />
                </div>
                
                {/* ✅ 4. Nuevo componente de selección de números */}
                <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Números de Destino</label>
                    <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-left">
                        <span className="text-gray-700">
                            {formData.phoneNumbers.length === 0 && "Seleccionar números"}
                            {formData.phoneNumbers.length === 1 && `${formData.phoneNumbers.length} número seleccionado`}
                            {formData.phoneNumbers.length > 1 && `${formData.phoneNumbers.length} números seleccionados`}
                        </span>
                        <FaChevronDown className={`text-gray-500 transition-transform ${isDropdownOpen ? 'transform rotate-180' : ''}`} />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                            <ul className="max-h-60 overflow-y-auto p-2">
                                {mockContactList.map(contact => (
                                    <li key={contact.id} className="p-2 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => handlePhoneNumberChange(contact.number)}>
                                        <div className="flex items-center">
                                            <input type="checkbox" checked={formData.phoneNumbers.includes(contact.number)} readOnly className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                                <p className="text-xs text-gray-500">{contact.number}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            <div className="p-2 border-t border-gray-200">
                                <button type="button" onClick={handleSelectAll} className="w-full text-center text-sm font-semibold text-red-600 hover:text-red-800">
                                    Seleccionar Todos
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Contenido del Mensaje</label>
              <textarea name="message" id="message" value={formData.message} onChange={handleChange} required rows="4" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"></textarea>
            </div>
        </div>

        {/* ... (el resto del formulario para la programación se mantiene igual) ... */}
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Programación del Envío</h4>
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setFormData(f => ({...f, scheduleType: 'once'}))} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${formData.scheduleType === 'once' ? 'bg-white text-red-600 shadow' : 'text-gray-600'}`}>
                    Una Sola Vez
                </button>
                <button type="button" onClick={() => setFormData(f => ({...f, scheduleType: 'recurring'}))} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${formData.scheduleType === 'recurring' ? 'bg-white text-red-600 shadow' : 'text-gray-600'}`}>
                    Recurrente
                </button>
            </div>

            {formData.scheduleType === 'once' ? (
              <div className="animate-fade-in">
                  <label htmlFor="sendAt" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora Exacta</label>
                  <input type="datetime-local" name="sendAt" id="sendAt" value={formData.sendAt} onChange={handleChange} className="w-full md:w-1/2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Días de la Semana</label>
                      <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map(day => (
                              <button
                                  type="button"
                                  key={day.value}
                                  title={day.title}
                                  onClick={() => handleDayChange(day.value)}
                                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 transform hover:scale-110 ${
                                      formData.recurringDays.includes(day.value)
                                      ? 'bg-red-600 text-white shadow-md'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                              >
                                  {day.label}
                              </button>
                          ))}
                      </div>
                  </div>
                  <div>
                      <label htmlFor="recurringTime" className="block text-sm font-medium text-gray-700 mb-1">Hora de Envío</label>
                      <input type="time" name="recurringTime" id="recurringTime" value={formData.recurringTime} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" />
                  </div>
              </div>
            )}
        </div>

        <div className="flex justify-end pt-4">
            <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300">
            {loading ? (
                <>
                  <FaSpinner className="animate-spin" /> Programando...
                </>
            ) : (
                <>
                  <FaPaperPlane /> Programar Envío
                </>
            )}
            </button>
        </div>
      </form>
    </div>
  );
}