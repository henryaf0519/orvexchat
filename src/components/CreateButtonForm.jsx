import React, { useState, useEffect, useRef } from 'react';
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
    
    const [options, setOptions] = useState([]);
    
    const nextOptionIndex = useRef(1);
    const [existingIDs, setExistingIDs] = useState(new Set());
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    const templates = useChatStore((state) => state.templates);

    // Se ejecuta una sola vez para cargar datos y establecer el estado inicial
    useEffect(() => {
        const fetchExistingDataAndSetInitial = async () => {
            const allIDs = new Set();
            let maxOptionNum = 0;

            const processId = (id) => {
                if (id) {
                    allIDs.add(id);
                    if (id.startsWith('opcion_')) {
                        const num = parseInt(id.split('_')[1], 10);
                        if (!isNaN(num) && num > maxOptionNum) {
                            maxOptionNum = num;
                        }
                    }
                }
            };
            
            try {
                const interactiveButtons = await getInteractiveButtons();
                interactiveButtons.forEach(button => {
                    if (button.interactive?.action?.buttons) {
                        button.interactive.action.buttons.forEach(btn => processId(btn.reply.id));
                    }
                    if (button.interactive?.action?.sections) {
                        button.interactive.action.sections.forEach(section => {
                            section.rows.forEach(row => processId(row.id));
                        });
                    }
                });
            } catch (error) {
                console.error("Error al obtener botones interactivos:", error);
            }
            
            setExistingIDs(allIDs);
            
            let currentIndex = maxOptionNum + 1;
            nextOptionIndex.current = currentIndex; // Guarda el primer ID seguro para usar si el form está vacío
            
            const initialOptions = [
                { title: "Seguridad Social" },
                { title: "Pólizas Incapacidad" },
            ].map(opt => {
                const newId = `opcion_${currentIndex}`;
                currentIndex++;
                return { ...opt, id: newId };
            });

            setOptions(initialOptions);
            setIsInitialLoad(false);
        };

        fetchExistingDataAndSetInitial();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const validate = () => {
        const newErrors = {};
        if (!name.trim()) newErrors.name = 'El nombre de la plantilla es obligatorio.';

        const currentIdsInForm = new Set();
        options.forEach((opt, index) => {
            const title = opt.title.trim();
            const id = opt.id ? opt.id.trim() : "";

            if (!title) newErrors[`title_${index}`] = 'El título es obligatorio.';
            if (title.length > MAX_TITLE_LENGTH) newErrors[`title_${index}`] = `Máximo ${MAX_TITLE_LENGTH} caracteres.`;
            if (!id) newErrors[`id_${index}`] = 'El ID es obligatorio.';
            
            if (currentIdsInForm.has(id)) {
                 newErrors[`id_${index}`] = `El ID '${id}' está duplicado en el formulario.`;
            }
            currentIdsInForm.add(id);

            if (existingIDs.has(id)) {
                newErrors[`id_${index}`] = `El ID '${id}' ya existe en otra plantilla.`;
            }
        });
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleOptionChange = (index, newTitle) => {
        const newOptions = [...options];
        newOptions[index].title = newTitle;
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length < 10) {
            let maxInForm = 0;
            options.forEach(opt => {
                if (opt.id && opt.id.startsWith('opcion_')) {
                    const num = parseInt(opt.id.split('_')[1], 10);
                    if (!isNaN(num) && num > maxInForm) {
                        maxInForm = num;
                    }
                }
            });

            // Si el formulario no está vacío, el siguiente número es el máximo + 1.
            // Si está vacío, usamos el contador global que sabe cuál es el siguiente ID seguro.
            const nextBaseNum = options.length > 0 ? maxInForm + 1 : nextOptionIndex.current;
            
            let nextNum = nextBaseNum;
            let newId = `opcion_${nextNum}`;
            
            // Bucle de seguridad para saltar IDs ya existentes (en DB o en el form)
            while (existingIDs.has(newId) || options.some(opt => opt.id === newId)) {
                nextNum++;
                newId = `opcion_${nextNum}`;
            }
            
            setOptions([...options, { id: newId, title: '' }]);
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
            interactivePayload = {
                type: 'list',
                header: { type: 'text', text: headerText || "Elige una opción" },
                body: { text: bodyText },
                action: {
                    button: listButtonText,
                    sections: [{
                        title: "Nuestros Servicios",
                        rows: options.map(opt => ({ id: opt.id, title: opt.title }))
                    }]
                }
            };
        }
        
        const finalPayload = { name, interactive: interactivePayload };

        try {
            await createInteractiveButton(finalPayload);
            setNotification({ show: true, message: "Plantilla creada con éxito!", type: 'success' });
            if (onButtonCreated) onButtonCreated();
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
                            <div key={opt.id} className="flex items-start gap-2 mb-3">
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
                                     <span className={`text-xs mt-1 pr-1 ${opt.title.length >= MAX_TITLE_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
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
                       { !isInitialLoad && <InteractivePreview 
                            type={options.length > 3 ? 'list' : 'button'}
                            header={headerText}
                            body={bodyText} 
                            options={options}
                            listButtonText={listButtonText}
                        /> }
                    </div>
                </div>
            </div>
        </div>
    );
}