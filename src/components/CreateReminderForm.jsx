import { useState, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import {
  FaPaperPlane,
  FaSpinner,
  FaChevronDown,
} from "react-icons/fa";
import NotificationModal from './NotificationModal';
import { getContacts } from "../services/reminderService";
import TemplatePreview from './TemplatePreview';

export default function CreateReminderForm() {
  // --- LA CORRECCIÓN ESTÁ AQUÍ ---
  // Seleccionamos cada pieza del estado de forma individual para evitar bucles de renderizado.
  const createSchedule = useChatStore((state) => state.createSchedule);
  const templates = useChatStore((state) => state.templates);
  // --- FIN DE LA CORRECCIÓN ---

  const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phoneNumbers: [],
    scheduleType: "once",
    sendAt: "",
    recurringDays: [],
    recurringTime: "09:00",
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [error, setError] = useState(""); // Declaración del estado de error que faltaba

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contacts = await getContacts();
        setContactList(contacts);
      } catch (error) {
        console.error("No se pudieron cargar los contactos", error);
        setNotification({ show: true, message: 'No se pudieron cargar los contactos.', type: 'error' });
      }
    };
    fetchContacts();
  }, []);
  
  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    const template = approvedTemplates.find(t => t.name === templateName);
    setSelectedTemplate(template || null);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneNumberChange = (number) => {
    setFormData((prev) => {
      const newNumbers = prev.phoneNumbers.includes(number)
        ? prev.phoneNumbers.filter((n) => n !== number)
        : [...prev.phoneNumbers, number];
      return { ...prev, phoneNumbers: newNumbers };
    });
  };

  const handleSelectAll = () => {
    const allNumbers = contactList.map((c) => c.number);
    setFormData((prev) => ({ ...prev, phoneNumbers: allNumbers }));
  };

  const handleDayChange = (day) => {
    setFormData((prev) => {
      const newDays = prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day];
      return { ...prev, recurringDays: newDays.sort((a, b) => a - b) };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedTemplate) {
      setNotification({ show: true, message: "Debes seleccionar una plantilla.", type: 'error' });
      setLoading(false);
      return;
    }
    if (formData.phoneNumbers.length === 0) {
      setNotification({ show: true, message: "Debes seleccionar al menos un número.", type: 'error' });
      setLoading(false);
      return;
    }
  
    const schedulePayload = {
      name: formData.name,
      templateName: selectedTemplate.name,
      phoneNumbers: formData.phoneNumbers,
      scheduleType: formData.scheduleType,
    };
  
    if (formData.scheduleType === 'once') {
      if (!formData.sendAt) {
        setError("Debes especificar una fecha y hora para envíos únicos.");
        setLoading(false);
        return;
      }
      schedulePayload.sendAt = formData.sendAt;
    } else {
      if (formData.recurringDays.length === 0) {
        setError("Debes seleccionar al menos un día para envíos recurrentes.");
        setLoading(false);
        return;
      }
      const [hour, minute] = formData.recurringTime.split(":");
      schedulePayload.cronExpression = `${minute} ${hour} * * ${formData.recurringDays.join(",")}`;
    }
  
    try {
      await createSchedule(schedulePayload);
      setNotification({ show: true, message: "¡Envío programado exitosamente!", type: 'success' });
      setFormData({ name: "", phoneNumbers: [], scheduleType: "once", sendAt: "", recurringDays: [], recurringTime: "09:00" });
      setSelectedTemplate(null);
      if (document.getElementById('template')) {
        document.getElementById('template').value = "";
      }
    } catch (err) {
       setNotification({ show: true, message: err.message || "Error al programar el envío.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { label: "L", value: 1, title: "Lunes" }, { label: "M", value: 2, title: "Martes" },
    { label: "X", value: 3, title: "Miércoles" }, { label: "J", value: 4, title: "Jueves" },
    { label: "V", value: 5, title: "Viernes" }, { label: "S", value: 6, title: "Sábado" },
    { label: "D", value: 0, title: "Domingo" },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 transform transition-all hover:shadow-xl">
      {notification.show && (
        <NotificationModal {...notification} onClose={() => setNotification({ ...notification, show: false })} />
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Programar Envío de Plantilla</h3>
        <p className="text-gray-500 mt-1">
          Selecciona una plantilla, elige los destinatarios y programa el envío.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Columna Izquierda: Formulario */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">
              Detalles del Envío
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Campaña</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Números de Destino</label>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-left">
                    <span className="text-gray-700 truncate">
                        {formData.phoneNumbers.length === 0 && "Seleccionar números"}
                        {formData.phoneNumbers.length === 1 && `${formData.phoneNumbers.length} número seleccionado`}
                        {formData.phoneNumbers.length > 1 && `${formData.phoneNumbers.length} números seleccionados`}
                    </span>
                    <FaChevronDown className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                        <ul className="max-h-60 overflow-y-auto p-2">
                            {contactList.map((contact) => (
                                <li key={contact.id} className="p-2 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => handlePhoneNumberChange(contact.number)}>
                                    <div className="flex items-center"><input type="checkbox" checked={formData.phoneNumbers.includes(contact.number)} readOnly className="h-4 w-4 text-red-600 border-gray-300 rounded" />
                                        <div className="ml-3">
                                            <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                            <p className="text-xs text-gray-500">{contact.number}</p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        <div className="p-2 border-t"><button type="button" onClick={handleSelectAll} className="w-full text-center text-sm font-semibold text-red-600 hover:text-red-800">Seleccionar Todos</button></div>
                    </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Plantilla</label>
              <select id="template" name="template" onChange={handleTemplateChange} defaultValue="" required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="" disabled>-- Escoge una plantilla aprobada --</option>
                {approvedTemplates.map(template => (
                  <option key={template.id} value={template.name}>
                    {template.name} ({template.language})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-4 pt-4">
              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Programación del Envío</h4>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setFormData((f) => ({ ...f, scheduleType: "once" }))} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${formData.scheduleType === "once" ? "bg-white text-red-600 shadow" : "text-gray-600"}`}>Una Sola Vez</button>
                <button type="button" onClick={() => setFormData((f) => ({ ...f, scheduleType: "recurring" }))} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${formData.scheduleType === "recurring" ? "bg-white text-red-600 shadow" : "text-gray-600"}`}>Recurrente</button>
              </div>
              {formData.scheduleType === 'once' ? (
                <div className="animate-fade-in"><label htmlFor="sendAt" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label><input type="datetime-local" name="sendAt" id="sendAt" value={formData.sendAt} onChange={handleChange} className="w-full md:w-2/3 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Días</label><div className="flex flex-wrap gap-2">{daysOfWeek.map((day) => (<button type="button" key={day.value} title={day.title} onClick={() => handleDayChange(day.value)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all transform hover:scale-110 ${formData.recurringDays.includes(day.value) ? "bg-red-600 text-white shadow-md" : "bg-gray-200 text-gray-700"}`}>{day.label}</button>))}</div></div>
                    <div><label htmlFor="recurringTime" className="block text-sm font-medium text-gray-700 mb-1">Hora</label><input type="time" name="recurringTime" id="recurringTime" value={formData.recurringTime} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg" /></div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:pt-12">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 text-center">Vista Previa</h4>
            <div className="bg-[#ECE5DD] p-4 rounded-lg min-h-[400px] flex items-center justify-center">
              <TemplatePreview template={selectedTemplate} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 py-3 px-6 shadow-lg text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? <><FaSpinner className="animate-spin" /> Programando...</> : <><FaPaperPlane /> Programar Envío</>}
          </button>
        </div>
      </form>
    </div>
  );
}