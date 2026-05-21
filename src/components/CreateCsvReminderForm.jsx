    import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../store/chatStore";
import { FaPaperPlane, FaSpinner, FaUpload, FaFileCsv } from "react-icons/fa";
import NotificationModal from './NotificationModal';
import TemplatePreview from './TemplatePreview';
import { getTemplates } from '../services/templateService';

export default function CreateCsvReminderForm() {
    // 🌟 Acciones y datos del store
    const setTemplates = useChatStore((state) => state.setTemplates);
    const templates = useChatStore((state) => state.templates);
    const userData = useChatStore((state) => state.userData);
    const sendImmediateMessage = useChatStore((state) => state.sendImmediateMessage);

    const approvedTemplates = templates.filter(t => t.status === 'APPROVED');

    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchTemplatesFromService = async () => {
            if (!setTemplates || templates.length > 0) return; // Evita doble carga si ya existen
            
            setIsLoadingTemplates(true);
            try {
                const fetchedTemplates = await getTemplates(); 
                setTemplates(fetchedTemplates);
            } catch (error) {
                console.error("🚨 [TEMPLATES] FALLO al obtener plantillas:", error);
                setNotification({ show: true, message: "Error al cargar plantillas.", type: 'error' });
            } finally {
                setIsLoadingTemplates(false);
            }
        };

        fetchTemplatesFromService();
    }, [setTemplates, templates.length]); 

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

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            // Validar que sea un CSV
            if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
                setErrors({ file: "Por favor, sube un archivo con formato .csv válido." });
                setFile(null);
                return;
            }
            setFile(selectedFile);
            clearError('file');
        }
    };

    const removeFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!selectedTemplate) newErrors.template = "Selecciona una plantilla.";
        if (!file) newErrors.file = "Debes subir un archivo CSV.";
        return newErrors;
    };

    // Función auxiliar para parsear el CSV básico
    const parseCSV = (csvText) => {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length === 0) throw new Error("El archivo CSV está vacío.");

        // Asumimos que los números están en la primera columna o extraemos todo lo que parezca un número.
        // Adaptar según la estructura exacta de tu CSV.
        const contacts = [];
        lines.forEach((line, index) => {
            // Saltamos la cabecera si la hay (opcional, aquí asumo que la primera línea puede ser 'telefono', 'numero', etc.)
            if (index === 0 && isNaN(parseInt(line.charAt(0)))) return; 
            
            const columns = line.split(',');
            const number = columns[0].replace(/[^0-9]/g, ''); // Limpiar caracteres no numéricos del primer valor
            
            if (number) {
                contacts.push({ number, name: columns[1] || number }); // Si hay una segunda columna, la usamos como nombre
            }
        });

        if (contacts.length === 0) throw new Error("No se encontraron números válidos en el CSV.");
        return contacts;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validateForm();
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) return;
        
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const csvText = event.target.result;
                const parsedContacts = parseCSV(csvText);

                const payload = {
                    templateName: selectedTemplate.name,
                    templateId: selectedTemplate.id,
                    waba_id: userData?.waba_id, 
                    number_id: userData?.number_id,
                    phoneNumbers: parsedContacts,
                };
            
                console.log("🚀 PAYLOAD INMEDIATO (CSV):", JSON.stringify(payload, null, 2));
                
                await sendImmediateMessage(payload);
                setNotification({ show: true, message: `¡Se enviaron mensajes a ${parsedContacts.length} contactos exitosamente!`, type: 'success' });
                
                // Limpiar formulario
                setSelectedTemplate(null);
                removeFile();
                const templateSelect = document.getElementById('template-csv');
                if (templateSelect) templateSelect.value = "";
                
            } catch (err) {
                setNotification({ show: true, message: err.message || "Ocurrió un error al procesar el archivo.", type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = () => {
            setNotification({ show: true, message: "Error al leer el archivo CSV.", type: 'error' });
            setLoading(false);
        };

        // Leer el archivo subido
        reader.readAsText(file);
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8">
            {notification.show && <NotificationModal {...notification} onClose={() => setNotification({ ...notification, show: false })} />}
            
            <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Envío Inmediato Masivo (CSV)</h3>
                <p className="text-sm text-gray-500 mt-1">Sube un archivo .csv con los números en la primera columna para disparar los mensajes en este momento.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div className="space-y-6">
                        <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Configuración</h4>
                        
                        {/* Selección de Plantilla */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plantilla</label>
                            <div className="relative">
                                {isLoadingTemplates && (
                                    <FaSpinner className="animate-spin absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600" />
                                )}
                                <select 
                                    id="template-csv" 
                                    onChange={handleTemplateChange} 
                                    defaultValue="" 
                                    className={`w-full px-4 py-2 bg-gray-50 border rounded-lg ${errors.template ? 'border-red-500 ring-1 ring-red-500' : ''}`}
                                    disabled={isLoadingTemplates}
                                >
                                    <option value="" disabled>-- {isLoadingTemplates ? 'Cargando plantillas...' : 'Selecciona una plantilla'} --</option>
                                    {approvedTemplates.map(t => (<option key={t.id} value={t.name}>{t.name}</option>))}
                                </select>
                            </div>
                            {errors.template && <p className="text-xs text-red-500 mt-1">{errors.template}</p>}
                        </div>

                        {/* Subida de CSV */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Archivo de Contactos (CSV)</label>
                            
                            {!file ? (
                                <div 
                                    className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${errors.file ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <div className="space-y-1 text-center">
                                        <FaUpload className="mx-auto h-8 w-8 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <span className="relative rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                Seleccionar archivo
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">Solo formato CSV (máx. 5MB)</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-1 flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
                                    <div className="flex items-center space-x-3 truncate">
                                        <FaFileCsv className="text-green-600 text-xl flex-shrink-0" />
                                        <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                                    </div>
                                    <button 
                                        type="button" 
                                        onClick={removeFile}
                                        className="text-xs text-red-500 hover:text-red-700 font-semibold px-2"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            )}
                            
                            <input 
                                type="file" 
                                accept=".csv" 
                                ref={fileInputRef}
                                onChange={handleFileChange} 
                                className="hidden" 
                            />
                            {errors.file && <p className="text-xs text-red-500 mt-1">{errors.file}</p>}
                        </div>
                    </div>

                    {/* Preview (Ocupa el mismo componente que usas en el otro form) */}
                    <div className="flex items-center justify-center bg-[#ECE5DD] rounded-lg p-4 min-h-[400px]">
                        <TemplatePreview template={selectedTemplate} />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 shadow-lg transition-transform active:scale-95 text-sm font-bold uppercase tracking-wide"
                    >
                        {loading ? <FaSpinner className="animate-spin"/> : <FaPaperPlane/>} 
                        {loading ? 'Procesando envío...' : 'Enviar Ahora'}
                    </button>
                </div>
            </form>
        </div>
    );
}