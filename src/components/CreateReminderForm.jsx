import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { FaPaperPlane, FaSpinner, FaChevronDown, FaFilter, FaTimes, FaLayerGroup } from "react-icons/fa";
import NotificationModal from './NotificationModal';
// 🌟 ASUMIMOS estas funciones de servicio están importadas correctamente
import { getTemplates } from '../services/templateService';
import { getContacts } from "../services/reminderService";
import TemplatePreview from './TemplatePreview';

export default function CreateReminderForm() {
    const createSchedule = useChatStore((state) => state.createSchedule);
    
    // 🌟 EXTRAEMOS TODAS LAS ACCIONES Y DATOS DEL STORE
    const setTemplates = useChatStore((state) => state.setTemplates);
    const fetchStages = useChatStore((state) => state.fetchStages);

    const templates = useChatStore((state) => state.templates);
    const userData = useChatStore((state) => state.userData);
    const stages = useChatStore((state) => state.stages);

    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');


    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: "", phoneNumbers: [], selectedStageId: null, 
        scheduleType: "once", sendAt: "", recurringDays: [], recurringTime: "09:00",
    });
    
    const [errors, setErrors] = useState({});
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [contactList, setContactList] = useState([]);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });


    useEffect(() => {  
        const fetchTemplatesFromService = async () => {
            if (!setTemplates) {
                console.error("🚨 STORE ERROR: La acción 'setTemplates' NO está disponible. No se cargarán plantillas.");
                return;
            }
            
            setIsLoadingTemplates(true);
            
            try {
                const fetchedTemplates = await getTemplates(); 
                setTemplates(fetchedTemplates);
            } catch (error) {
                console.error("🚨 [TEMPLATES] FALLO al obtener plantillas:", error);
                setNotification({ show: true, message: "Error al cargar plantillas: " + (error.message || "Error desconocido"), type: 'error' });
            } finally {
                setIsLoadingTemplates(false);
            }
        };

        const fetchInitialData = async () => {
            try {
                const contacts = await getContacts();
                setContactList(contacts);
            } catch (error) {
                console.error("🚨 [CONTACTS] Error cargando contactos", error);
            }
            
            // Cargar plantillas
            await fetchTemplatesFromService();
            fetchStages(); 
        };     
        fetchInitialData();

    }, []); 


    useEffect(() => {
    }, [approvedTemplates]);
  
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
            
            return { ...prev, selectedStageId: null, phoneNumbers: newPhoneNumbers };
        });
        clearError('phoneNumbers');
    };

    const handleSelectAll = () => {
        const allContacts = contactList.map((c) => ({ name: c.name, number: c.number }));
        setFormData((prev) => ({ ...prev, selectedStageId: null, phoneNumbers: allContacts }));
        clearError('phoneNumbers');
    };

    const handleSelectByStage = (stageId, stageName) => {
        setFormData((prev) => ({
            ...prev,
            selectedStageId: stageId,
            phoneNumbers: [] 
        }));
        
        setIsDropdownOpen(false);
        clearError('phoneNumbers');
    };

    const handleDeselectAll = () => {
        setFormData(prev => ({ ...prev, selectedStageId: null, phoneNumbers: [] }));
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
        if (!formData.name.trim()) newErrors.name = "El nombre es requerido.";
        if (!selectedTemplate) newErrors.template = "Selecciona una plantilla.";
        
        if (formData.phoneNumbers.length === 0 && !formData.selectedStageId) {
            newErrors.phoneNumbers = "Selecciona destinatarios (manuales o por etapa).";
        }
        
        if (formData.scheduleType === 'once' && !formData.sendAt) {
            newErrors.sendAt = "Fecha requerida.";
        }
        if (formData.scheduleType === 'recurring' && formData.recurringDays.length === 0) {
            newErrors.recurringDays = "Selecciona días.";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return;
        
        setLoading(true);

        const isDynamic = !!formData.selectedStageId;

        const schedulePayload = {
            name: formData.name,
            templateName: selectedTemplate.name,
            templateId: selectedTemplate.id,
            scheduleType: formData.scheduleType,
            waba_id: userData.waba_id, 
            number_id: userData.number_id,
            
            targetType: isDynamic ? 'dynamic_stage' : 'static_list',
            targetStageId: isDynamic ? formData.selectedStageId : null, 
            phoneNumbers: isDynamic ? [] : formData.phoneNumbers,
        };
    
        if (formData.scheduleType === 'once') {
            schedulePayload.sendAt = formData.sendAt;
        } else {
            const [hour, minute] = formData.recurringTime.split(":");
            schedulePayload.cronExpression = `${minute} ${hour} * * ${formData.recurringDays.join(",")}`;
        }
    
        try {
            console.log("🚀 PAYLOAD FINAL:", JSON.stringify(schedulePayload, null, 2));
            await createSchedule(schedulePayload);
            setNotification({ show: true, message: "¡Envío programado!", type: 'success' });
            
            setFormData({ 
                name: "", phoneNumbers: [], selectedStageId: null, 
                scheduleType: "once", sendAt: "", recurringDays: [], recurringTime: "09:00" 
            });
            setSelectedTemplate(null);
            const templateSelect = document.getElementById('template');
            if (templateSelect) templateSelect.value = "";
            
        } catch (err) {
            setNotification({ show: true, message: err.message, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Helpers visuales
    const daysOfWeek = [
        { label: "L", value: 1, title: "Lunes" }, 
        { label: "M", value: 2, title: "Martes" },
        { label: "X", value: 3, title: "Miércoles" }, 
        { label: "J", value: 4, title: "Jueves" },
        { label: "V", value: 5, title: "Viernes" }, 
        { label: "S", value: 6, title: "Sábado" },
        { label: "D", value: 0, title: "Domingo" }
    ];
    
    const hexToRgba = (hex, alpha) => {
        let r=0,g=0,b=0;
        if(hex && hex.length===7){
            r=parseInt(hex.slice(1,3),16); g=parseInt(hex.slice(3,5),16); b=parseInt(hex.slice(5,7),16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    };

    const getSelectedLabel = () => {
        if (formData.selectedStageId) {
            const stage = stages.find(s => s.id === formData.selectedStageId);
            return (
                <span className="flex items-center gap-2 text-blue-600 font-semibold">
                    <FaLayerGroup /> Etapa: {stage ? stage.name : formData.selectedStageId}
                </span>
            );
        }
        if (formData.phoneNumbers.length === 0) return "Seleccionar destinatarios";
        return `${formData.phoneNumbers.length} contactos manuales`;
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8">
            {notification.show && <NotificationModal {...notification} onClose={() => setNotification({ ...notification, show: false })} />}
            
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Programar Envío</h3>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Detalles</h4>
                        
                        {/* Nombre Campaña */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Campaña</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2 bg-gray-50 border rounded-lg ${errors.name ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
                        </div>
                        
                        {/* Selector Destinatarios */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destinatarios (CRM)</label>
                            <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className={`w-full flex items-center justify-between px-4 py-2 bg-gray-50 border rounded-lg text-left ${errors.phoneNumbers ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'}`}>
                                <span className="truncate text-sm">{getSelectedLabel()}</span>
                                <FaChevronDown className="text-gray-500" />
                            </button>
                            
                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-xl flex flex-col z-50">
                                    
                                    {/* Botones Manuales */}
                                    <div className="p-2 bg-gray-50 border-b grid grid-cols-2 gap-2">
                                        <button type="button" onClick={handleSelectAll} className="text-xs text-blue-600 hover:bg-blue-100 p-1.5 rounded border border-blue-200">Todos (Manual)</button>
                                        <button type="button" onClick={handleDeselectAll} className="text-xs text-red-500 hover:bg-red-100 p-1.5 rounded border border-red-200"><FaTimes className="inline"/> Limpiar</button>
                                    </div>

                                    {/* FILTROS DINÁMICOS (Las Etapas) */}
                                    <div className="p-2 border-b bg-blue-50/50">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                                            <FaFilter size={8} /> Enviar a Etapa Completa
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            {stages.map(stage => (
                                                <button
                                                    key={stage.id}
                                                    type="button"
                                                    title={`ID Real: ${stage.id} | Nombre: ${stage.name}`}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleSelectByStage(stage.id, stage.name);
                                                    }}
                                                    className={`text-[10px] px-2 py-1 rounded-full font-medium border transition-transform hover:scale-105 flex items-center gap-1 ${formData.selectedStageId === stage.id ? 'ring-2 ring-blue-400 shadow-md' : ''}`}
                                                    style={{
                                                        backgroundColor: formData.selectedStageId === stage.id ? stage.color : "white",
                                                        color: formData.selectedStageId === stage.id ? "white" : stage.color,
                                                        borderColor: stage.color 
                                                    }}
                                                >
                                                    {stage.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Lista de Contactos (Para selección manual) */}
                                    <ul className={`max-h-60 overflow-y-auto p-2 ${formData.selectedStageId ? 'opacity-40 pointer-events-none' : ''}`}>
                                        {formData.selectedStageId && (
                                            <li className="p-2 text-center text-xs text-blue-600 bg-blue-50 rounded mb-1">Modo Etapa Activo: {formData.selectedStageId}</li>
                                        )}
                                        {contactList.map((contact) => (
                                            <li key={contact.id} className="p-2 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => handlePhoneNumberChange(contact)}>
                                                <div className="flex items-center text-sm">
                                                    <input type="checkbox" checked={formData.phoneNumbers.some(p => p.number === contact.number)} readOnly className="mr-2" />
                                                    <span>{contact.name}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        
                        {/* Selección de Plantilla */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla</label>
                            <div className="relative">
                                {isLoadingTemplates && (
                                    <FaSpinner className="animate-spin absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600" />
                                )}
                                <select 
                                    id="template" 
                                    onChange={handleTemplateChange} 
                                    defaultValue="" 
                                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg ${errors.template ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    disabled={isLoadingTemplates}
                                >
                                    <option value="" disabled>-- {isLoadingTemplates ? 'Cargando plantillas...' : 'Selecciona'} --</option>
                                    {approvedTemplates.map(t => (<option key={t.id} value={t.name}>{t.name}</option>))}
                                </select>
                            </div>
                        </div>
                        
                        {/* Programación */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Cuándo enviar</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg mb-2">
                                <button type="button" onClick={() => setFormData(f=>({...f, scheduleType:"once"}))} className={`w-1/2 py-1 text-sm rounded ${formData.scheduleType==="once"?"bg-white shadow":"text-gray-500"}`}>Una vez</button>
                                <button type="button" onClick={() => setFormData(f=>({...f, scheduleType:"recurring"}))} className={`w-1/2 py-1 text-sm rounded ${formData.scheduleType==="recurring"?"bg-white shadow":"text-gray-500"}`}>Recurrente</button>
                            </div>
                            
                            {/* UI COMPLETA DE RECURRENCIA */}
                            {formData.scheduleType === 'once' ? (
                                <input type="datetime-local" value={formData.sendAt} onChange={handleChange} name="sendAt" className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.sendAt ? 'border-red-500 ring-1 ring-red-500' : ''}`} />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Días de envío</label>
                                        <div className={`flex flex-wrap gap-1 ${errors.recurringDays ? 'border border-red-500 p-1 rounded' : ''}`}>
                                            {daysOfWeek.map((day) => (
                                                <button 
                                                    type="button" 
                                                    key={day.value} 
                                                    onClick={() => handleDayChange(day.value)} 
                                                    className={`w-8 h-8 rounded-full font-bold text-xs transition-all ${formData.recurringDays.includes(day.value) ? "bg-red-600 text-white shadow-md scale-110" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"}`}
                                                >
                                                    {day.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Hora</label>
                                        <input 
                                            type="time" 
                                            name="recurringTime" 
                                            value={formData.recurringTime} 
                                            onChange={handleChange} 
                                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded text-sm focus:ring-2 focus:ring-red-500 focus:outline-none" 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="flex items-center justify-center bg-[#ECE5DD] rounded-lg p-4 min-h-[400px]">
                        <TemplatePreview template={selectedTemplate} />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={loading} className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-transform active:scale-95">
                        {loading ? <FaSpinner className="animate-spin"/> : <FaPaperPlane/>} 
                        {formData.scheduleType === 'once' ? 'Programar Envío' : 'Crear Campaña Recurrente'}
                    </button>
                </div>
            </form>
        </div>
    );
}