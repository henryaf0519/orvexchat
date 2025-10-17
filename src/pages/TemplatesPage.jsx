import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../services/templateService';
import MainSidebar from '../components/MainSidebar';
import CreateTemplateForm from '../components/CreateTemplateForm';
import TemplatesList from '../components/TemplatesList';
import TemplatePreview from '../components/TemplatePreview';
import MainHeader from '../components/MainHeader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmationModal from '../components/ConfirmationModal';

// Función de ayuda para convertir un archivo a un string base64
const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result);
  reader.onerror = error => reject(error);
});

// Estado inicial para el formulario
const initialFormState = {
  name: '', category: 'MARKETING', language: 'es_CO',
  headerType: 'NONE', headerText: '', headerBase64: null, headerExample: '', headerImageUrl: null,
  bodyText: '', bodyExamples: [''], footerText: '', buttons: [],
};

// Transforma los datos de la API al formato que usa el formulario
const transformApiToFormData = (template) => {
  const components = template.components.reduce((acc, comp) => {
    acc[comp.type] = comp;
    return acc;
  }, {});

  const headerComponent = components.HEADER;
  // ✅ CAMBIO: La URL ahora es el handle de la imagen, que es lo que necesitamos reenviar.
  const imageHandle = (headerComponent?.format === 'IMAGE' && headerComponent.example?.header_handle?.[0])
    ? headerComponent.example.header_handle[0]
    : null;

  return {
    id: template.id,
    name: template.name,
    category: template.category,
    language: template.language,
    headerType: headerComponent?.format || 'NONE',
    headerText: headerComponent?.text || '',
    headerExample: headerComponent?.example?.header_text?.[0] || '',
    headerBase64: null, 
    headerImageUrl: imageHandle, // <- Guardamos el HANDLE existente
    bodyText: components.BODY?.text || '',
    bodyExamples: components.BODY?.example?.body_text?.[0] || [''],
    footerText: components.FOOTER?.text || '',
    buttons: components.BUTTONS?.buttons || [],
  };
};

export default function TemplatesPage() {
  const [view, setView] = useState('list');
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
      setEditingTemplateId(null);
      setFormData(initialFormState);
    }
  }, [view]);

  const handleEdit = (template) => {
    const formDataFromApi = transformApiToFormData(template);
    setFormData(formDataFromApi);
    setEditingTemplateId(template.id);
    setView('create');
  };

  const handleDeleteRequest = (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setTemplateToDelete(template);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    try {
      await deleteTemplate(templateToDelete.name); 
      toast.success(`Plantilla "${templateToDelete.name}" eliminada.`);
      fetchTemplates(); 
    } catch (error) {
      toast.error(error.message || "No se pudo eliminar la plantilla.");
    } finally {
      setIsDeleteModalOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.bodyText) {
      toast.error("El nombre y el cuerpo de la plantilla son obligatorios.");
      return;
    }
    setIsSubmitting(true);
    toast.info(editingTemplateId ? 'Actualizando plantilla...' : 'Creando plantilla...');

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
    
    // La lógica de construcción de componentes ahora es más inteligente para la actualización
    const buildComponents = () => {
      const components = [];
      // HEADER
      if (formData.headerType !== 'NONE') {
          const headerComponent = { type: 'HEADER', format: formData.headerType };
          if (formData.headerType === 'TEXT') {
              headerComponent.text = formData.headerText;
              if (formData.headerText.includes('{{')) {
                  headerComponent.example = { header_text: [formData.headerExample] };
              }
          } else if (formData.headerType === 'IMAGE') {
              if (finalHeaderBase64) {
                  // Si se subió una imagen NUEVA, enviamos el base64
                  headerComponent.example = { header_base64: finalHeaderBase64 };
              } else if (formData.headerImageUrl) {
                  // ✅ CAMBIO CLAVE: Si NO hay imagen nueva PERO SÍ había una antes,
                  // reenviamos el "handle" que guardamos previamente.
                  headerComponent.example = { header_handle: [formData.headerImageUrl] };
              }
          }
          components.push(headerComponent);
      }

      // BODY
      const bodyComponent = { type: 'BODY', text: formData.bodyText };
      if (formData.bodyText.includes('{{')) {
        const variableCount = (formData.bodyText.match(/\{\{\d+\}\}/g) || []).length;
        const examples = formData.bodyExamples.slice(0, variableCount).filter(Boolean);
        if(examples.length !== variableCount) {
          throw new Error('Debes proveer un ejemplo para cada variable del cuerpo.');
        }
        bodyComponent.example = { body_text: [examples] };
      }
      components.push(bodyComponent);

      // FOOTER
      if (formData.footerText) {
        components.push({ type: 'FOOTER', text: formData.footerText });
      }

      // BUTTONS
      if (formData.buttons.length > 0) {
        const formattedButtons = formData.buttons.map(({ ...rest }) => rest);
        components.push({ type: 'BUTTONS', buttons: formattedButtons });
      }

      return components;
    };

    try {
      const components = buildComponents();

      if (editingTemplateId) {
        // Para actualizar, solo necesitamos los componentes
        const updatePayload = { components };
        await updateTemplate(editingTemplateId, updatePayload);
        toast.success(`Plantilla "${formData.name}" actualizada con éxito!`);
      } else {
        // Para crear, necesitamos toda la estructura
        const createPayload = {
          name: formData.name.toLowerCase().replace(/[^a-z0-9_]/g, ''),
          language: formData.language,
          category: formData.category,
          components,
        };
        const result = await createTemplate(createPayload);
        toast.success(`Plantilla "${result.name}" creada con éxito!`);
      }
      
      setFormData(initialFormState);
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
              <button onClick={() => { setView('create'); setEditingTemplateId(null); setFormData(initialFormState); }} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${view === 'create' ? 'bg-white shadow' : 'text-gray-600 hover:bg-gray-300'}`}>
                {editingTemplateId ? 'Editar Plantilla' : 'Crear Nueva'}
              </button>
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
                  isEditing={!!editingTemplateId}
                />
              ) : (
                <TemplatesList 
                  templates={templates} 
                  isLoading={isLoading} 
                  onSelectTemplate={setSelectedTemplate}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
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
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la plantilla "${templateToDelete?.name}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}