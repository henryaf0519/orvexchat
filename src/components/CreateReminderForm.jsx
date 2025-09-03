import { useState, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import {
  FaPaperPlane,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChevronDown,
  FaImage,
} from "react-icons/fa";
import NotificationModal from './NotificationModal';

const WhatsAppPreview = ({ text, image }) => (
  <div className="w-full max-w-[320px] mx-auto bg-[#E1F7CB] p-2 rounded-lg shadow-md border border-gray-200">
    {image && (
      <img
        src={image}
        alt="Vista previa"
        className="rounded-md mb-2 w-full h-auto object-cover"
      />
    )}
    {/* Usamos whitespace-pre-wrap para respetar saltos de línea y que el texto no se corte */}
    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
      {/* Mostramos el texto si existe, o un placeholder si hay imagen pero no texto */}
      {text || (image && "Aquí va el texto que acompaña la imagen...")}
    </p>
    <div className="text-xs text-right text-gray-500 mt-1">
      {new Date().toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </div>
  </div>
);

const mockContactList = [
  { id: "1", name: "Cliente Principal", number: "573196372542" },
  { id: "2", name: "Proveedor A", number: "573001112233" },
  { id: "3", name: "Socio Comercial", number: "573214445566" },
  { id: "4", name: "Equipo de Ventas", number: "573157778899" },
];

export default function CreateReminderForm() {
  const createSchedule = useChatStore((state) => state.createSchedule);

  const [formData, setFormData] = useState({
    name: "",
    textMessage: "", // Cambiado de 'message' a 'textMessage' para coincidir con el DTO
    phoneNumbers: [],
    scheduleType: "once",
    sendAt: "",
    recurringDays: [],
    recurringTime: "09:00",
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
   const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success', // 'success' o 'error'
  });

  useEffect(() => {
    // Limpia la URL del objeto cuando el componente se desmonta para evitar memory leaks
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
    }
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
    const allNumbers = mockContactList.map((c) => c.number);
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
    setSuccess("");
    setLoading(true);
  
    if (formData.phoneNumbers.length === 0) {
      setNotification({ show: true, message: "Debes seleccionar al menos un número.", type: 'error' });
      setLoading(false);
      return;
    }
    const schedulePayload = {
      name: formData.name,
      textMessage: formData.textMessage,
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
  
    const finalData = {
      ...schedulePayload,
      imageFile: imageFile, 
    };
  
    try {
      await createSchedule(finalData);
      setNotification({ show: true, message: "¡Recordatorio creado exitosamente!", type: 'success' });
      setFormData({
        name: "",
        textMessage: "",
        phoneNumbers: [],
        scheduleType: "once",
        sendAt: "",
        recurringDays: [],
        recurringTime: "09:00",
      });
      setImageFile(null);
      setImagePreview('');
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
       setNotification({ show: true, message: err.message || "Error desconocido", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const daysOfWeek = [
    { label: "L", value: 1, title: "Lunes" },
    { label: "M", value: 2, title: "Martes" },
    { label: "X", value: 3, title: "Miércoles" },
    { label: "J", value: 4, title: "Jueves" },
    { label: "V", value: 5, title: "Viernes" },
    { label: "S", value: 6, title: "Sábado" },
    { label: "D", value: 0, title: "Domingo" },
  ];

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 mb-8 transform transition-all hover:shadow-xl">
      {notification.show && (
        <NotificationModal
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Programar Nuevo Envío</h3>
        <p className="text-gray-500 mt-1">
          Completa los detalles para tu campaña de mensajería.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Columna Izquierda: Formulario */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">
              Detalles del Mensaje
            </h4>
            
            {/* ... (campos de Nombre y Números de Destino como los tenías) ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Campaña
                </label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Números de Destino</label>
                <button type="button" onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-left">
                    <span className="text-gray-700">
                        {formData.phoneNumbers.length === 0 && "Seleccionar números"}
                        {formData.phoneNumbers.length === 1 && `${formData.phoneNumbers.length} número seleccionado`}
                        {formData.phoneNumbers.length > 1 && `${formData.phoneNumbers.length} números seleccionados`}
                    </span>
                    <FaChevronDown className={`text-gray-500 transition-transform ${ isDropdownOpen ? "transform rotate-180" : "" }`} />
                </button>
                {isDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                        <ul className="max-h-60 overflow-y-auto p-2">
                            {mockContactList.map((contact) => (
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
              <label htmlFor="textMessage" className="block text-sm font-medium text-gray-700 mb-1">
                Contenido del Mensaje (Caption)
              </label>
              <textarea name="textMessage" id="textMessage" value={formData.textMessage} onChange={handleChange} rows="4" className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"></textarea>
            </div>

            <div>
              <label htmlFor="imageFile" className="block text-sm font-medium text-gray-700 mb-1">
                Imagen (Opcional)
              </label>
              <div className="mt-2 flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-4 border-gray-300 border-dashed hover:bg-gray-100 hover:border-gray-400 rounded-lg cursor-pointer transition-colors">
                  <div className="flex flex-col items-center justify-center pt-7">
                    <FaImage className="w-8 h-8 text-gray-400" />
                    <p className="pt-1 text-sm text-gray-500 tracking-wider">
                      {imageFile ? imageFile.name : 'Selecciona o arrastra una imagen'}
                    </p>
                  </div>
                  <input type="file" id="imageFile" className="opacity-0" accept="image/png, image/jpeg" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <h4 className="text-lg font-semibold text-gray-600 border-b pb-2">
                Programación del Envío
              </h4>
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button type="button" onClick={() => setFormData((f) => ({ ...f, scheduleType: "once" }))} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${ formData.scheduleType === "once" ? "bg-white text-red-600 shadow" : "text-gray-600" }`}>
                  Una Sola Vez
                </button>
                <button type="button" onClick={() => setFormData((f) => ({ ...f, scheduleType: "recurring" }))} className={`w-1/2 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${ formData.scheduleType === "recurring" ? "bg-white text-red-600 shadow" : "text-gray-600" }`}>
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
                            {daysOfWeek.map((day) => (
                                <button type="button" key={day.value} title={day.title} onClick={() => handleDayChange(day.value)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 transform hover:scale-110 ${ formData.recurringDays.includes(day.value) ? "bg-red-600 text-white shadow-md" : "bg-gray-200 text-gray-700 hover:bg-gray-300" }`}>
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

          </div>

          <div className="space-y-4 lg:pt-12">
            <h4 className="text-lg font-semibold text-gray-600 border-b pb-2 text-center">
              Vista Previa
            </h4>
            <div className="bg-[#ECE5DD] p-4 rounded-lg min-h-[400px] flex items-center justify-center">
              <WhatsAppPreview text={formData.textMessage} image={imagePreview} />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 py-3 px-6 border border-transparent shadow-lg text-base font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed transform hover:-translate-y-1 transition-all duration-300"
          >
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