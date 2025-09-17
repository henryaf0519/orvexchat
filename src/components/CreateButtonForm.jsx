import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { FaPlus, FaTrash, FaSave, FaSpinner, FaPaperPlane } from 'react-icons/fa';
import NotificationModal from './NotificationModal';
import { createInteractiveButton, getInteractiveButtons } from '../services/reminderService';
import InteractivePreview from "./InteractivePreview";


// Límite de caracteres para los títulos de botones y opciones de lista
const MAX_TITLE_LENGTH = 24;

export default function CreateButtonForm({ onButtonCreated }) {
    const [name, setName] = useState("");
    const [bodyText, setBodyText] = useState("Hola, ¡bienvenido a Afiliamos! 👋 \nEstamos aquí para ayudarte.");
    const [headerText, setHeaderText] = useState("Nuestros Servicios");
    const [listButtonText, setListButtonText] = useState("Ver Servicios");
    const [options, setOptions] = useState([
        { id: "opcion_1", title: "Seguridad Social" },
        { id: "opcion_2", title: "Pólizas Incapacidad" },
    ]);
    
    const [existingIDs, setExistingIDs] = useState(new Set());
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    // Obtener las plantillas existentes desde el store de Zustand
    const templates = useChatStore((state) => state.templates);

    // useEffect para cargar todos los IDs existentes y evitar duplicados
    useEffect(() => {
        const fetchExistingIDs = async () => {
            const allIDs = new Set();
            
            // 1. IDs de plantillas de botones existentes
            templates.forEach(template => {
                if (template.buttons) {
                    template.buttons.forEach(btn => allIDs.add(btn.id));
                }
            });

            // 2. IDs de botones/listas interactivas ya creadas desde la API
            try {
                const interactiveButtons = await getInteractiveButtons();
                interactiveButtons.forEach(button => {
                    if (button.interactive?.action?.buttons) {
                        button.interactive.action.buttons.forEach(btn => allIDs.add(btn.reply.id));
                    }
                    if (button.interactive?.action?.sections) {
                        button.interactive.action.sections.forEach(section => {
                            section.rows.forEach(row => allIDs.add(row.id));
                        });
                    }
                });
            } catch (error) {
                console.error("Error al obtener botones interactivos:", error);
            }
            
            setExistingIDs(allIDs);
        };

        fetchExistingIDs();
    }, [templates]);

    // Función de validación mejorada
    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'El nombre de la plantilla es obligatorio.';

        options.forEach((opt, index) => {
            const title = opt.title.trim();
            const id = opt.id.trim();

            if (!title) {
                newErrors[`title_${index}`] = 'El título de la opción es obligatorio.';
            } else if (title.length > MAX_TITLE_LENGTH) {
                newErrors[`title_${index}`] = `El título no puede exceder los ${MAX_TITLE_LENGTH} caracteres.`;
            }

            if (!id) {
                newErrors[`id_${index}`] = 'El ID es obligatorio y se genera a partir del título.';
            } else if (existingIDs.has(id)) {
                newErrors[`id_${index}`] = `El ID '${id}' ya existe. Elige un título diferente.`;
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        const newTitle = value;
        const newId = newTitle.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        
        newOptions[index] = { id: newId, title: newTitle };
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) {
            setOptions([...options, { id: '', title: '' }]);
        }
    };

    const removeOption = (index) => {
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }

        setLoading(true);
        let interactivePayload;

        if (options.length <= 3) {
            // Crear payload para botones
            interactivePayload = {
                type: 'button',
                body: { text: bodyText },
                action: {
                    buttons: options.map(opt => ({
                        type: 'reply',
                        reply: { id: opt.id, title: opt.title }
                    }))
                }
            };
        } else {
            // Crear payload para lista
            interactivePayload = {
                type: 'list',
                header: { type: 'text', text: headerText || "Elige una opción" },
                body: { text: bodyText },
                action: {
                    button: listButtonText,
                    sections: [{
                        title: "Nuestros Servicios", // Este título podría ser dinámico también
                        rows: options.map(opt => ({ id: opt.id, title: opt.title }))
                    }]
                }
            };
        }
        
        const finalPayload = { name, interactive: interactivePayload };

        try {
            await createInteractiveButton(finalPayload);
            setNotification({ show: true, message: "Plantilla interactiva creada con éxito!", type: 'success' });
            if (onButtonCreated) {
                onButtonCreated();
            }
        } catch (error) {
            setNotification({ show: true, message: error.message || "Error al crear la plantilla.", type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-lg">
            {notification.show && <NotificationModal {...notification} onClose={() => setNotification({ ...notification, show: false })} />}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">Define tu Mensaje Interactivo</h4>
                    
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Plantilla (ID Interno)</label>
                        <input type="text" name="name" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                        <label htmlFor="bodyText" className="block text-sm font-medium text-gray-700 mb-1">Texto del Mensaje (Body)</label>
                        <textarea name="bodyText" id="bodyText" value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows="4" required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
                    </div>
                    
                    {options.length > 3 && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in space-y-4">
                             <h5 className="font-semibold text-blue-800">Opciones de Lista</h5>
                             <div>
                                 <label htmlFor="headerText" className="block text-sm font-medium text-gray-700 mb-1">Texto de la Cabecera (Opcional)</label>
                                 <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" />
                             </div>
                            <div>
                                <label htmlFor="listButtonText" className="block text-sm font-medium text-gray-700 mb-1">Texto del Botón Principal</label>
                                <input type="text" value={listButtonText} onChange={(e) => setListButtonText(e.target.value)} required className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Opciones (Hasta 10)</label>
                        {options.map((opt, index) => (
                            <div key={index} className="flex items-start gap-2 mb-3">
                                <div className="flex-grow">
                                    <input 
                                      type="text" 
                                      placeholder={`Título de la opción ${index + 1}`} 
                                      value={opt.title} 
                                      onChange={(e) => handleOptionChange(index, e.target.value)} 
                                      maxLength={MAX_TITLE_LENGTH}
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                                    />
                                     <div className='flex justify-between'>
                                     <span className="text-xs text-gray-400 mt-1 pl-1">ID: {opt.id || "..."}</span>
                                     <span className={`text-xs mt-1 pr-1 ${opt.title.length > MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                                      {opt.title.length}/{MAX_TITLE_LENGTH}
                                     </span>
                                     </div>
                                    {errors[`title_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`title_${index}`]}</p>}
                                    {errors[`id_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`id_${index}`]}</p>}
                                </div>
                                <button type="button" onClick={() => removeOption(index)} className="p-2 mt-1 text-red-500 hover:text-red-700"><FaTrash /></button>
                            </div>
                        ))}
                        {options.length < 10 && (
                            <button type="button" onClick={addOption} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1 mt-2">
                                <FaPlus /> Añadir Opción
                            </button>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
                            {loading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
                            {loading ? "Guardando..." : "Guardar Plantilla"}
                        </button>
                    </div>
                </form>
                
                <div className="space-y-4 lg:pt-12">
                    <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 text-center">
                        Vista Previa Interactiva
                    </h4>
                    <div className="bg-[#ECE5DD] p-4 rounded-lg min-h-[550px] flex items-center justify-center">
                        <InteractivePreview 
                            type={options.length > 3 ? 'list' : 'button'}
                            header={headerText}
                            body={bodyText} 
                            options={options}
                            listButtonText={listButtonText}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

