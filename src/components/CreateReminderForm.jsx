import { useState, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { FaPaperPlane, FaSpinner, FaChevronDown, FaFilter, FaTimes } from "react-icons/fa"; 
import NotificationModal from './NotificationModal';
import { getContacts } from "../services/reminderService";
import TemplatePreview from './TemplatePreview';

export default function CreateReminderForm() {
  const createSchedule = useChatStore((state) => state.createSchedule);
  const templates = useChatStore((state) => state.templates);
  const userData = useChatStore((state) => state.userData);
  
  // ✅ OBTENER ETAPAS DEL STORE
  const stages = useChatStore((state) => state.stages);
  const fetchStages = useChatStore((state) => state.fetchStages);

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
  
  const [errors, setErrors] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactList, setContactList] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

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
    
    if (!stages || stages.length === 0) {
        fetchStages();
    }
  }, [stages, fetchStages]);
  
  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const handleTemplateChange = (e) => {
    const templateName = e.target.value;
    const template = approvedTemplates.find(t => t.name === templateName);
    setSelectedTemplate(template || null);
    clearError('template');
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearError(name);
  };

  const handlePhoneNumberChange = (contact) => {
    setFormData((prev) => {
      const isSelected = prev.phoneNumbers.some(p => p.number === contact.number);
      const newPhoneNumbers = isSelected
        ? prev.phoneNumbers.filter((p) => p.number !== contact.number)
        : [...prev.phoneNumbers, { name: contact.name, number: contact.number }];
      return { ...prev, phoneNumbers: newPhoneNumbers };
    });
    clearError('phoneNumbers');
  };

  const handleSelectAll = () => {
    const allContacts = contactList.map((c) => ({ name: c.name, number: c.number }));
    setFormData((prev) => ({ ...prev, phoneNumbers: allContacts }));
    clearError('phoneNumbers');
  };

  // ✅ FILTRO DINÁMICO
  const handleSelectByStage = (stageId) => {
    const contactsInStage = contactList.filter(c => (c.stage || 'Nuevo') === stageId);
    
    setFormData((prev) => {
        const currentNumbers = new Set(prev.phoneNumbers.map(p => p.number));
        const newSelection = [...prev.phoneNumbers];

        contactsInStage.forEach(contact => {
            if (!currentNumbers.has(contact.number)) {
                newSelection.push({ name: contact.name, number: contact.number });
                currentNumbers.add(contact.number);
            }
        });

        return { ...prev, phoneNumbers: newSelection };
    });
    clearError('phoneNumbers');
  };

  const handleDeselectAll = () => {
      setFormData(prev => ({ ...prev, phoneNumbers: [] }));
  };

  const handleDayChange = (day) => {
    setFormData((prev) => {
      const newDays = prev.recurringDays.includes(day)
        ? prev.recurringDays.filter((d) => d !== day)
        : [...prev.recurringDays, day];
      return { ...prev, recurringDays: newDays.sort((a, b) => a - b) };
    });
    clearError('recurringDays');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "El nombre de la campaña es requerido.";
    if (!selectedTemplate) newErrors.template = "Debe seleccionar una plantilla.";
    if (formData.phoneNumbers.length === 0) newErrors.phoneNumbers = "Debe seleccionar al menos un destinatario.";
    if (formData.scheduleType === 'once' && !formData.sendAt) {
      newErrors.sendAt = "La fecha y hora son requeridas para envíos únicos.";
    }
    if (formData.scheduleType === 'recurring' && formData.recurringDays.length === 0) {
      newErrors.recurringDays = "Debe seleccionar al menos un día para envíos recurrentes.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.values(validationErrors).map(msg => `<li>${msg}</li>`).join('');
      setNotification({
        show: true,
        message: `<h4>Por favor, completa los campos requeridos:</h4><ul class="list-disc pl-5 mt-2">${errorMessages}</ul>`,
        type: 'error'
      });
      return;
    }
    
    setLoading(true);

    const schedulePayload = {
      name: formData.name,
      templateName: selectedTemplate.name,
      templateId: selectedTemplate.id,
      phoneNumbers: formData.phoneNumbers,
      scheduleType: formData.scheduleType,
      waba_id: userData.waba_id,     
      number_id: userData.number_id,
    };
  
    if (formData.scheduleType === 'once') {
      schedulePayload.sendAt = formData.sendAt;
    } else {
      const [hour, minute] = formData.recurringTime.split(":");
      schedulePayload.cronExpression = `${minute} ${hour} * * ${formData.recurringDays.join(",")}`;
    }
  
    try {
      await createSchedule(schedulePayload);
      setNotification({ show: true, message: "¡Envío programado exitosamente!", type: 'success' });
      setFormData({ name: "", phoneNumbers: [], scheduleType: "once", sendAt: "", recurringDays: [], recurringTime: "09:00" });
      setSelectedTemplate(null);
      setErrors({});
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

  // Helper para generar color RGBA desde Hex
  const hexToRgba = (hex, alpha) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt("0x" + hex[1] + hex[1]);
      g = parseInt("0x" + hex[2] + hex[2]);
      b = parseInt("0x" + hex[3] + hex[3]);
    } else if (hex.length === 7) {
      r = parseInt("0x" + hex[1] + hex[2]);
      g = parseInt("0x" + hex[3] + hex[4]);
      b = parseInt("0x" + hex[5] + hex[6]);
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8">
      {notification.show && (
        <NotificationModal {...notification} onClose={() => setNotification({ ...notification, show: false })} />
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Programar Envío de Plantilla</h3>
        <p className="text-gray-500 mt-1">
          Completa todos los campos para configurar tu campaña de mensajería.
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Detalles del Envío</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Campaña</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange}
                       className={`w-full px-4 py-2 bg-gray-50 border rounded-lg shadow-sm focus:outline-none transition ${errors.name ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-red-500'}`} />
              </div>
              
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios (CRM)</label>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`w-full flex items-center justify-between px-4 py-2 bg-gray-50 border rounded-lg shadow-sm text-left ${errors.phoneNumbers ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}>
                    <span className="text-gray-700 truncate">
                        {formData.phoneNumbers.length === 0 && "Seleccionar contactos"}
                        {formData.phoneNumbers.length === 1 && `1 contacto seleccionado`}
                        {formData.phoneNumbers.length > 1 && `${formData.phoneNumbers.length} contactos seleccionados`}
                    </span>
                    <FaChevronDown className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl flex flex-col z-50">
                        
                        <div className="p-2 bg-gray-50 border-b grid grid-cols-2 gap-2">
                            <button type="button" onClick={handleSelectAll} className="text-xs font-semibold text-blue-600 hover:bg-blue-100 p-1.5 rounded border border-blue-200 transition-colors">
                                Seleccionar Todos
                            </button>
                            <button type="button" onClick={handleDeselectAll} className="text-xs font-semibold text-red-500 hover:bg-red-100 p-1.5 rounded border border-red-200 transition-colors flex items-center justify-center gap-1">
                                <FaTimes size={10}/> Limpiar
                            </button>
                        </div>

                         {/* ✅ FILTROS DINÁMICOS */}
                        <div className="p-2 border-b">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                <FaFilter size={8} /> Agregar por Etapa CRM
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {stages.map(stage => (
                                    <button
                                        key={stage.id}
                                        type="button"
                                        onClick={() => handleSelectByStage(stage.id)}
                                        className="text-[10px] px-2 py-1 rounded-full font-medium border transition-transform hover:scale-105 flex items-center gap-1"
                                        // ✅ ESTILOS DINÁMICOS
                                        style={{
                                            backgroundColor: "white",
                                            color: stage.color,
                                            borderColor: stage.color 
                                        }}
                                        title={`Agregar todos los "${stage.name}"`}
                                    >
                                        <span 
                                            className="w-1.5 h-1.5 rounded-full inline-block" 
                                            style={{ backgroundColor: stage.color }}
                                        ></span>
                                        {stage.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <ul className="max-h-60 overflow-y-auto p-2">
                            {contactList.map((contact) => {
                                 const stageInfo = stages.find(s => s.id === (contact.stage || 'Nuevo')) || stages[0];
                                 return (
                                <li key={contact.id} className="p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors" onClick={() => handlePhoneNumberChange(contact)}>
                                    <div className="flex items-center">
                                      <input type="checkbox" checked={formData.phoneNumbers.some(p => p.number === contact.number)} readOnly className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                                        <div className="ml-3 flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                                                {/* ✅ Badge Dinámico */}
                                                <span 
                                                    className="text-[9px] px-2 py-0.5 rounded-full font-semibold"
                                                    style={{
                                                        backgroundColor: hexToRgba(stageInfo.color, 0.1),
                                                        color: stageInfo.color,
                                                        border: `1px solid ${hexToRgba(stageInfo.color, 0.2)}`
                                                    }}
                                                >
                                                    {stageInfo.name}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{contact.number}</p>
                                        </div>
                                    </div>
                                </li>
                            )})}
                        </ul>
                        <div className="p-2 bg-gray-50 border-t text-center">
                            <span className="text-xs text-gray-500">
                                {formData.phoneNumbers.length} de {contactList.length} seleccionados
                            </span>
                        </div>
                    </div>
                )}
              </div>
            </div>
            
            {/* (El resto del JSX del formulario se mantiene igual) */}
            <div>
              <label htmlFor="template" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Plantilla</label>
              <select id="template" name="template" onChange={handleTemplateChange} defaultValue=""
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-lg shadow-sm focus:outline-none transition ${errors.template ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 focus:ring-2 focus:ring-red-500'}`}>
                <option value="" disabled>-- Escoge una plantilla aprobada --</option>
                {approvedTemplates.map(template => ( <option key={template.id} value={template.name}>{template.name} ({template.language})</option> ))}
              </select>
            </div>
            
            <div className="space-y-4 pt-4">
              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Programación</h4>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => { setFormData((f) => ({ ...f, scheduleType: "once" })); clearError('recurringDays'); }} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${formData.scheduleType === "once" ? "bg-white text-red-600 shadow" : "text-gray-600"}`}>Una Vez</button>
                <button type="button" onClick={() => { setFormData((f) => ({ ...f, scheduleType: "recurring" })); clearError('sendAt'); }} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all ${formData.scheduleType === "recurring" ? "bg-white text-red-600 shadow" : "text-gray-600"}`}>Recurrente</button>
              </div>
              {formData.scheduleType === 'once' ? (
                <div className="animate-fade-in">
                  <label htmlFor="sendAt" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                  <input type="datetime-local" name="sendAt" id="sendAt" value={formData.sendAt} onChange={handleChange}
                         className={`w-full md:w-2/3 px-4 py-2 bg-gray-50 border rounded-lg ${errors.sendAt ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`} />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Días</label>
                        <div className={`flex flex-wrap gap-2 p-2 rounded-lg ${errors.recurringDays ? 'border border-red-500 ring-1 ring-red-500' : ''}`}>
                            {daysOfWeek.map((day) => (<button type="button" key={day.value} title={day.title} onClick={() => handleDayChange(day.value)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all transform hover:scale-110 ${formData.recurringDays.includes(day.value) ? "bg-red-600 text-white shadow-md" : "bg-gray-200 text-gray-700"}`}>{day.label}</button>))}
                        </div>
                    </div>
                    <div>
                        <label htmlFor="recurringTime" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                        <input type="time" name="recurringTime" id="recurringTime" value={formData.recurringTime} onChange={handleChange} className="w-full px-4 py-2 bg-gray-50 border rounded-lg" />
                    </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:pt-12">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 text-center">Vista Previa</h4>
            <div className="bg-[#ECE5DD] p-4 rounded-lg min-h-[400px] flex items-center justify-center"><TemplatePreview template={selectedTemplate} /></div>
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 py-3 px-6 shadow-lg text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
            {loading ? <><FaSpinner className="animate-spin" /> Programando...</> : <><FaPaperPlane /> Programar Envío</>}
          </button>
        </div>
      </form>
    </div>
  );
}