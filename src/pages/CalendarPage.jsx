// src/pages/CalendarPage.jsx

import React, { useState, useEffect } from "react";
import MainSidebar from "../components/MainSidebar";
import MyCalendar from "../components/MyCalendar";
import EventModal from "../components/EventModal";
import { toast } from "react-toastify";
import { FaSyncAlt, FaCalendarCheck } from "react-icons/fa";

import { getAppointments } from "../services/appointmentService";

export default function CalendarPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // ✅ USAMOS EL SERVICIO AQUÍ
      const data = await getAppointments();
      setAppointments(data);
      // Opcional: toast.success("Agenda sincronizada");
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar las citas. Verifica tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedEvent(null), 200);
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
                    Visualiza y gestiona la disponibilidad de todo tu equipo Orvex.
                </p>
            </div>
            
            {/* Botón de Sincronizar */}
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
             />
          </div>

        </main>

        {/* Modal */}
        <EventModal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            event={selectedEvent} 
        />

      </div>
    </div>
  );
}