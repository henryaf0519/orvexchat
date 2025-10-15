import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate } from '../services/templateService';
import MainSidebar from '../components/MainSidebar';
import CreateTemplateForm from '../components/CreateTemplateForm';
import TemplatesList from '../components/TemplatesList';
import TemplatePreview from '../components/TemplatePreview';
import MainHeader from '../components/MainHeader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Función de ayuda para convertir un archivo a un string base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

// Estado inicial para el formulario, para poder reiniciarlo fácilmente
const initialFormState = {
  name: '', category: 'MARKETING', language: 'es',
  headerType: 'NONE', headerText: '', headerBase64: null, headerExample: '',
  bodyText: '', bodyExamples: [''], footerText: '', buttons: [],
};

export default function TemplatesPage() {
  const [view, setView] = useState('create');
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = () => {
    setIsLoading(true);
    getTemplates()
      .then(setTemplates)
      .catch(err => toast.error(err.message || "Error al cargar plantillas."))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (view === 'list') {
      fetchTemplates();
      setSelectedTemplate(null);
    }
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.bodyText) {
      toast.error("El nombre y el cuerpo de la plantilla son obligatorios.");
      return;
    }
    setIsSubmitting(true);
    toast.info('Creando plantilla...');

    let finalHeaderBase64 = null;
    if (formData.headerType === 'IMAGE' && formData.headerBase64 instanceof File) {
      try {
        finalHeaderBase64 = await fileToBase64(formData.headerBase64);
      } catch (error) {
        toast.error("Error al procesar el archivo de imagen.");
        setIsSubmitting(false);
        return;
      }
    }
    
    const components = [];
    if (formData.headerType !== 'NONE') {
        const headerComponent = { type: 'HEADER', format: formData.headerType };
        if (formData.headerType === 'TEXT') {
            headerComponent.text = formData.headerText;
            if (formData.headerText.includes('{{')) {
                headerComponent.example = { header_text: [formData.headerExample] };
            }
        } else if (finalHeaderBase64) {
            headerComponent.example = { header_base64: finalHeaderBase64 };
        }
        components.push(headerComponent);
    }

    const bodyComponent = { type: 'BODY', text: formData.bodyText };
    if (formData.bodyText.includes('{{')) {
      const variableCount = (formData.bodyText.match(/\{\{\d+\}\}/g) || []).length;
      const examples = formData.bodyExamples.slice(0, variableCount).filter(Boolean);
      if(examples.length !== variableCount) {
        toast.error('Debes proveer un ejemplo para cada variable del cuerpo.');
        setIsSubmitting(false);
        return;
      }
      bodyComponent.example = { body_text: [examples] };
    }
    components.push(bodyComponent);

    if (formData.footerText) {
      components.push({ type: 'FOOTER', text: formData.footerText });
    }

    if (formData.buttons.length > 0) {
      const formattedButtons = formData.buttons.map(({ ...rest }) => rest);
      components.push({ type: 'BUTTONS', buttons: formattedButtons });
    }

    const templateData = {
      name: formData.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
      language: formData.language,
      category: formData.category,
      components,
    };

    try {
      const result = await createTemplate(templateData);
      toast.success(`Plantilla "${result.name}" creada con éxito!`);
      setFormData(initialFormState); // Reinicia el formulario
      setView('list');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <MainSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              Gestor de Plantillas
            </h1>
            <div className="flex bg-gray-200 p-1 rounded-lg">
              <button onClick={() => setView('create')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'create' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>Crear Nueva</button>
              <button onClick={() => setView('list')} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'list' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>Mis Plantillas</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2">
              {view === 'create' ? (
                <CreateTemplateForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  handleSubmit={handleSubmit} 
                  isLoading={isSubmitting} 
                />
              ) : (
                <TemplatesList 
                  templates={templates} 
                  isLoading={isLoading} 
                  onSelectTemplate={setSelectedTemplate} 
                />
              )}
            </div>
             <div className="lg:sticky lg:top-6 flex justify-center">
              <TemplatePreview 
                data={view === 'create' ? formData : null} 
                template={view === 'list' ? selectedTemplate : null} 
              />
            </div>
          </div>
        </main>
      </div>
      <ToastContainer position="bottom-right" autoClose={5000} />
    </div>
  );
}