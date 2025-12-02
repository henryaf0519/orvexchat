import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

// 🎨 PALETA "FRESH & SOFT"
const COLOR_PALETTE = [
  { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' }, // AZUL CIELO
  { bg: '#ecfdf5', border: '#10b981', text: '#047857' }, // ESMERALDA
  { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' }, // ÁMBAR
  { bg: '#f5f3ff', border: '#8b5cf6', text: '#5b21b6' }, // VIOLETA
  { bg: '#fff1f2', border: '#f43f5e', text: '#9f1239' }, // ROSA
  { bg: '#ecfeff', border: '#06b6d4', text: '#155e75' }, // CIAN
  { bg: '#f7fee7', border: '#84cc16', text: '#3f6212' }, // LIMA
  { bg: '#eef2ff', border: '#6366f1', text: '#3730a3' }, // ÍNDIGO
  { bg: '#fff7ed', border: '#f97316', text: '#9a3412' }, // NARANJA
];

const GENERAL_STYLE = { bg: '#f8fafc', border: '#64748b', text: '#334155' }; 

export default function MyCalendar({ appointments, onEventClick, onDateSelect, onCreateClick }) {

  // Función determinista para colores
  const getDynamicStyles = (professionalId) => {
    if (!professionalId || professionalId === 'any_professional') {
      return GENERAL_STYLE;
    }
    let hash = 0;
    for (let i = 0; i < professionalId.length; i++) {
      hash = professionalId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % COLOR_PALETTE.length);
    return COLOR_PALETTE[index];
  };

  const events = (appointments || []).map((appt) => {
    const styles = getDynamicStyles(appt.professionalId);
    return {
      id: appt.id,
      title: appt.title,
      start: appt.date,
      backgroundColor: styles.bg,
      borderColor: styles.border,
      textColor: styles.text,
      extendedProps: {
          guestEmail: appt.guestEmail,
          userNumber: appt.userNumber,
          professionalId: appt.professionalId,
          userName: appt.userName,
          meetingLink: appt.meetingLink
      }
    };
  });

  const renderEventContent = (eventInfo) => {
    return (
      <div className="flex flex-col overflow-hidden leading-tight p-0.5 h-full justify-center">
        <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold opacity-75">
            {eventInfo.timeText}
            </span>
        </div>
        <div className="text-xs font-bold truncate leading-snug">
          {eventInfo.event.title.split('(')[0]} 
        </div>
        <div className="text-[10px] font-medium italic opacity-90 flex items-center gap-1 truncate mt-0.5">
           👤 {eventInfo.event.extendedProps.userName || 'Cliente'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-2 rounded-2xl shadow-lg border border-slate-200 h-full overflow-hidden flex flex-col font-sans">
      
      <style>{`
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

        /* Estilos de la tarjeta (Soft UI) */
        .fc-event {
          border-radius: 6px !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          padding: 2px 4px !important;
          cursor: pointer !important;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .fc-event:hover {
          transform: scale(1.02) translateY(-1px);
          box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.1) !important;
          z-index: 50 !important;
          filter: brightness(0.97); 
        }
      `}</style>
      
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        
        /* --- NUEVO: Botón personalizado --- */
        customButtons={{
            btnAdd: {
                text: '+ Nueva Cita',
                click: onCreateClick, // Dispara evento al padre
            }
        }}

        headerToolbar={{
          left: 'prev,next today btnAdd', // Agregamos btnAdd aquí
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        
        locale={esLocale}
        slotLabelFormat={{ hour: 'numeric', minute: '2-digit', omitZeroMinute: false, meridiem: 'short', hour12: true }}
        eventContent={renderEventContent}

        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        allDaySlot={false}
        height="100%" 
        events={events}
        eventClick={onEventClick}
        nowIndicator={true}
        dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}

        /* --- NUEVO: Selección de fecha (huecos vacíos) --- */
        selectable={true}
        selectMirror={true}
        select={(selectInfo) => {
            onDateSelect(selectInfo.start);
            selectInfo.view.calendar.unselect();
        }}
      />
    </div>
  );
}