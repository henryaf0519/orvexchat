import React, { useState, useEffect } from "react";
import MainSidebar from "../components/MainSidebar";
import MyCalendar from "../components/MyCalendar";
import EventModal from "../components/EventModal";
import CreateAppointmentModal from "../components/CreateAppointmentModal";
import { toast } from "react-toastify";
import { FaSyncAlt, FaCalendarCheck } from "react-icons/fa";

import { getAppointments, createAppointment, cancelAppointment } from "../services/appointmentService";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal de "Ver Detalles"
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Modal de "Crear Cita"
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDateForCreate, setSelectedDateForCreate] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await getAppointments();
      setAppointments(data);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las citas. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers para Ver Detalles ---
  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsEventModalOpen(true);
  };

  const closeEventModal = () => {
    setIsEventModalOpen(false);
    setTimeout(() => setSelectedEvent(null), 200);
  };

  // --- Handlers para Crear Cita ---
  
  const handleCreateButtonClick = () => {
    setSelectedDateForCreate(new Date()); 
    setIsCreateModalOpen(true);
  };

  const handleDateSelect = (date) => {
    setSelectedDateForCreate(date);
    setIsCreateModalOpen(true);
  };
  const handleCreateSubmit = async (formData) => {
    try {
      // 1. Notificar al usuario que el proceso inició (Google Calendar tarda unos segundos)
      const toastId = toast.loading("Conectando con Google Calendar...");
      
      // 2. Llamada real al Backend (esperamos a que termine)
      await createAppointment(formData);
      
      // 3. Si llega aquí, fue exitoso. Actualizamos el toast y cerramos.
      toast.update(toastId, { 
        render: "¡Cita agendada y correo enviado!", 
        type: "success", 
        isLoading: false,
        autoClose: 3000 
      });

      setIsCreateModalOpen(false);
      
      // 4. Recargamos los datos para ver la nueva cita en el calendario
      await fetchAppointments(); 

    } catch (error) {
      console.error("Error creando cita:", error);
      // Manejo de error real (mostramos el mensaje que venga del backend si existe)
      toast.dismiss(); // Quitamos el loading
      toast.error(error.message || "Error al crear la cita. Inténtalo de nuevo.");
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      toast.error("Error: No se encontró el ID de la cita para cancelar.");
      return;
    }
    const confirmCancel = window.confirm(
      "¿Estás seguro de que quieres CANCELAR esta cita? Esta acción es irreversible."
    );

    if (!confirmCancel) return;
    setLoading(true);
    const loadingToastId = toast.loading("Cancelando cita...");
    
    try {
      await cancelAppointment(selectedEvent.id);
      toast.update(loadingToastId, {
        render: "¡Cita cancelada con éxito!",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      closeEventModal();
      await fetchAppointments(); 
      
    } catch (error) {
      console.error(error);
      toast.update(loadingToastId, {
        render: error.message || "Error al cancelar la cita. Inténtalo de nuevo.",
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-slate-50 font-sans overflow-hidden">
      <MainSidebar />
      <div className="flex-1 flex flex-col h-full relative">
        <main className="flex-1 p-6 md:p-8 flex flex-col h-full overflow-hidden">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 flex-shrink-0">
            <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                  <FaCalendarCheck className="text-red-600" />
                  Agenda Corporativa
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                    Visualiza y gestiona la disponibilidad de todo tu equipo.
                </p>
            </div>
            
            <button 
                onClick={fetchAppointments}
                disabled={loading}
                className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold shadow-lg 
                    transition-all duration-200 ease-in-out border border-transparent
                    ${loading 
                        ? 'bg-red-400 cursor-wait opacity-75' 
                        : 'bg-red-600 hover:bg-red-700 hover:shadow-red-500/30 hover:-translate-y-0.5 active:translate-y-0'}
                `}
            >
                <FaSyncAlt className={`${loading ? "animate-spin" : ""}`} />
                <span>{loading ? "Sincronizando..." : "Sincronizar Citas"}</span>
            </button>
          </div>

          {/* Calendario */}
          <div className="flex-1 min-h-0 relative animate-in fade-in duration-500">
             <MyCalendar 
                appointments={appointments} 
                onEventClick={handleEventClick} 
                onCreateClick={handleCreateButtonClick}
                onDateSelect={handleDateSelect}
             />
          </div>

        </main>

        <EventModal 
            isOpen={isEventModalOpen} 
            onClose={closeEventModal} 
            event={selectedEvent}
            onCancel={handleCancelAppointment}
        />

        <CreateAppointmentModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateSubmit}
            initialDate={selectedDateForCreate}
        />

      </div>
    </div>
  );
}