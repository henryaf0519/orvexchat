// src/components/CreateReminderForm.jsx
import { useState } from 'react';
import { useChatStore } from '../store/chatStore';

export default function CreateReminderForm() {
  const createSchedule = useChatStore((state) => state.createSchedule);
  const [formData, setFormData] = useState({
    name: '',
    message: '',
    phoneNumbers: '',
    scheduleType: 'once',
    sendAt: '',
    cronExpression: '0 9 * * 1-5',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const { phoneNumbers, ...rest } = formData;
    const numbersArray = phoneNumbers.split(',').map(num => num.trim()).filter(Boolean);

    if (numbersArray.length === 0) {
      setError('Debes añadir al menos un número de teléfono.');
      setLoading(false);
      return;
    }
    
    const finalData = { ...rest, phoneNumbers: numbersArray };

    if (finalData.scheduleType === 'once') {
      delete finalData.cronExpression;
      if (!finalData.sendAt) {
        setError('Debes especificar una fecha y hora para envíos únicos.');
        setLoading(false);
        return;
      }
      // Asegurarse de que la fecha esté en formato ISO
      finalData.sendAt = new Date(finalData.sendAt).toISOString();
    } else {
      delete finalData.sendAt;
       if (!finalData.cronExpression) {
        setError('Debes especificar una expresión CRON para envíos recurrentes.');
        setLoading(false);
        return;
      }
    }

    try {
      await createSchedule(finalData);
      setSuccess('¡Recordatorio creado exitosamente!');
      setFormData({
        name: '', message: '', phoneNumbers: '', scheduleType: 'once',
        sendAt: '', cronExpression: '0 9 * * 1-5',
      });
      setTimeout(() => setSuccess(''), 3000); // Ocultar mensaje después de 3 segundos
    } catch (err) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Programar Nuevo Recordatorio</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-500 text-sm">{success}</p>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del Recordatorio</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
            </div>
            <div>
                <label htmlFor="phoneNumbers" className="block text-sm font-medium text-gray-700">Números de Teléfono (separados por coma)</label>
                <input type="text" name="phoneNumbers" id="phoneNumbers" value={formData.phoneNumbers} onChange={handleChange} required placeholder="573001234567,573017654321" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
            </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700">Mensaje</label>
          <textarea name="message" id="message" value={formData.message} onChange={handleChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"></textarea>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Tipo de Envío</label>
                <select name="scheduleType" value={formData.scheduleType} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm">
                    <option value="once">Una sola vez</option>
                    <option value="recurring">Recurrente (Cron)</option>
                </select>
            </div>
            {formData.scheduleType === 'once' ? (
            <div>
                <label htmlFor="sendAt" className="block text-sm font-medium text-gray-700">Fecha y Hora de Envío</label>
                <input type="datetime-local" name="sendAt" id="sendAt" value={formData.sendAt} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
            </div>
            ) : (
            <div>
                <label htmlFor="cronExpression" className="block text-sm font-medium text-gray-700">Expresión CRON</label>
                <input type="text" name="cronExpression" id="cronExpression" value={formData.cronExpression} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm" />
            </div>
            )}
        </div>

        <div className="flex justify-end">
            <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50">
            {loading ? 'Programando...' : 'Programar Envío'}
            </button>
        </div>
      </form>
    </div>
  );
}