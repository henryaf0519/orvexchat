import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

export default function MyCalendar({ appointments, onEventClick }) {

  const getEventColor = (professionalId) => {
    if (professionalId === 'henry_arevalo') return '#2563eb';
    if (professionalId === 'stefanny_gomez') return '#db2777';
    if (professionalId === 'juanca_perez') return '#d97706';
    if (professionalId === 'any_professional') return '#059669';
    return '#4b5563';
  };

  const events = (appointments || []).map((appt) => ({
    id: appt.id,
    title: appt.title, // Ej: "Corte de Cabello"
    start: appt.date,
    backgroundColor: getEventColor(appt.professionalId),
    borderColor: getEventColor(appt.professionalId),
    // ✅ Pasamos todos los datos nuevos al modal
    extendedProps: {
        guestEmail: appt.guestEmail,
        userNumber: appt.userNumber,
        professionalId: appt.professionalId,
        userName: appt.userName,     // <--- Nombre del Cliente
        meetingLink: appt.meetingLink // <--- Link de Meet
    }
  }));

  // ✅ RENDERIZADO PERSONALIZADO DE LA TARJETA (Para que se vea PRO)
  const renderEventContent = (eventInfo) => {
    return (
      <div className="flex flex-col overflow-hidden leading-tight p-0.5">
        {/* Hora */}
        <div className="text-[10px] font-bold opacity-90">
          {eventInfo.timeText}
        </div>
        {/* Título del Servicio (Truncado) */}
        <div className="text-xs font-bold truncate">
          {eventInfo.event.title.split('(')[0]} 
        </div>
        {/* ✅ Nombre del Cliente Destacado */}
        <div className="text-[10px] italic opacity-90 flex items-center gap-1 truncate mt-0.5">
           👤 {eventInfo.event.extendedProps.userName || 'Cliente'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 h-full overflow-hidden flex flex-col font-sans">
      <style>{`
        /* ... (Mismos estilos de antes) ... */
        .fc-toolbar-title { font-size: 1.5rem !important; font-weight: 800 !important; color: #1e293b !important; text-transform: capitalize; letter-spacing: -0.025em; }
        .fc-button-primary { background-color: white !important; color: #1e293b !important; border: 1px solid #e2e8f0 !important; font-weight: 600 !important; text-transform: capitalize; border-radius: 0.5rem !important; padding: 0.5rem 1rem !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important; transition: all 0.2s ease-in-out !important; }
        .fc-button-primary:hover { background-color: #f8fafc !important; border-color: #cbd5e1 !important; }
        .fc-button-active { background-color: #1e293b !important; color: white !important; border-color: #1e293b !important; }
        .fc-today-button { opacity: 1 !important; font-weight: 700 !important; }
        .fc-col-header-cell-cushion { color: #64748b; font-weight: 700; text-transform: uppercase; font-size: 0.75rem; padding: 12px 0 !important; }
        .fc-timegrid-slot-label-cushion { font-size: 0.70rem; font-weight: 600; color: #64748b; text-transform: uppercase; white-space: nowrap; }
        .fc-timegrid-now-indicator-line { border-color: #dc2626; border-width: 2px; }
        .fc-timegrid-now-indicator-arrow { border-color: #dc2626; border-bottom-color: #dc2626; }
        .fc-day-today { background-color: #fef2f2 !important; }

        /* Estilos de la tarjeta */
        .fc-event {
          border: none !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 2px 3px !important;
          cursor: pointer !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .fc-event:hover {
          transform: scale(1.02) translateY(-1px);
          box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.15) !important;
          z-index: 50 !important;
          filter: brightness(1.05);
        }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale={esLocale}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: false, meridiem: 'short', hour12: true }}
        
        // Usamos renderEventContent en lugar de eventTimeFormat simple
        eventContent={renderEventContent}

        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        allDaySlot={false}
        height="100%" 
        events={events}
        eventClick={onEventClick}
        nowIndicator={true}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
      />
    </div>
  );
}