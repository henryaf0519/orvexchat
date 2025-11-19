// src/components/KanbanBoard.jsx

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { getContacts } from "../services/reminderService";
import { apiFetch } from "../services/api";
import { FaEllipsisH } from "react-icons/fa";
import ContactDetailModal from "./ContactDetailModal";

const updateContactStageAPI = (contactId, stage) => {
  const conversationId = contactId.split("#")[1] || contactId;
  return apiFetch(`/dynamo/contacts/${conversationId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
};

export default function KanbanBoard() {
  const [columns, setColumns] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  const selectConversation = useChatStore((state) => state.selectConversation);
  const companyId = useChatStore((state) => state.companyId);
  const stages = useChatStore((state) => state.stages); // ✅ Obtenemos etapas del Store
  const fetchStages = useChatStore((state) => state.fetchStages);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Cargamos etapas al montar si no existen
  useEffect(() => {
    if (!stages || stages.length === 0) {
        fetchStages();
    }
  }, [fetchStages, stages]);

  useEffect(() => {
    if (!companyId || !stages || stages.length === 0) return;

    getContacts()
      .then((contacts) => {
        // 1. Construimos las columnas dinámicamente usando el Store
        const dynamicColumns = {};
        stages.forEach(stage => {
            dynamicColumns[stage.id] = {
                name: stage.name,
                items: [],
                color: stage.color, // ✅ Usamos el color Hexadecimal del store
                isSystem: stage.isSystem
            };
        });

        // 2. Procesamos y asignamos los contactos
        const processedContacts = contacts.map((contact) => ({
          ...contact,
          id: `${companyId}#${contact.conversationId}`,
        }));

        processedContacts.forEach((contact) => {
          const stageId = contact.stage || "Nuevo"; // Fallback al default ID ("Nuevo" debe existir en tus stages)
          
          if (dynamicColumns[stageId]) {
            dynamicColumns[stageId].items.push(contact);
          } else {
            // Si la etapa del contacto no existe (borrada?), lo mandamos al Inbox (Nuevo)
            if (dynamicColumns["Nuevo"]) {
                dynamicColumns["Nuevo"].items.push(contact);
            }
          }
        });
        
        setColumns(dynamicColumns);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar contactos para el Kanban:", error);
        setIsLoading(false);
      });
  }, [companyId, stages]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    if (source.droppableId !== destination.droppableId) {
      const sourceColumn = columns[source.droppableId];
      const destColumn = columns[destination.droppableId];
      const sourceItems = [...sourceColumn.items];
      const destItems = [...destColumn.items];
      const [removed] = sourceItems.splice(source.index, 1);
      removed.stage = destination.droppableId;
      destItems.splice(destination.index, 0, removed);
      
      const oldColumns = columns;
      
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceColumn, items: sourceItems },
        [destination.droppableId]: { ...destColumn, items: destItems },
      });
      
      updateContactStageAPI(draggableId, destination.droppableId).catch(
        (err) => {
          console.error("Fallo al actualizar la etapa:", err);
          setColumns(oldColumns);
        }
      );
    }
  };

  const handleCardClick = (contact) => {
    selectConversation(contact.id);
    navigate("/chat");
  };

  const handleOpenModal = (contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  if (isLoading) {
    return <p className="text-center text-gray-500 pt-10">Cargando tablero...</p>;
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-6 min-w-max px-2"> {/* min-w-max para que no se rompa en pantallas pequeñas */}
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Renderizamos en el orden del array 'stages' para mantener consistencia visual */}
          {stages.map((stage) => {
            const columnId = stage.id;
            const column = columns[columnId];
            
            // Protección por si columns aún no se ha hidratado completamente
            if (!column) return null;

            return (
            <div
              key={columnId}
              className="w-80 bg-gray-100 rounded-xl flex flex-col flex-shrink-0"
            >
              {/* ✅ CAMBIO IMPORTANTE: Usamos style para pintar el Hexadecimal */}
              <div 
                className="p-4 flex justify-between items-center border-t-4 rounded-t-xl text-white shadow-sm"
                style={{ backgroundColor: column.color, borderColor: column.color }} 
              >
                <h3 className="font-bold truncate text-shadow-sm">{column.name}</h3>
                <span className="text-xs font-semibold bg-black/20 rounded-full px-2 py-0.5">
                  {column.items.length}
                </span>
              </div>
              
              <Droppable droppableId={columnId} key={columnId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`p-3 flex-grow min-h-[75vh] transition-colors duration-300 ${
                      snapshot.isDraggingOver ? "bg-gray-200" : "bg-transparent"
                    }`}
                  >
                    {column.items.map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleCardClick(item)}
                            className={`p-4 mb-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative group ${
                              snapshot.isDragging ? "ring-2 ring-red-500 z-50" : ""
                            }`}
                          >
                            <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{item.number}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(item);
                              }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1 transition-colors opacity-0 group-hover:opacity-100"
                              title="Ver detalles"
                            >
                              <FaEllipsisH size={16} />
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )})}
        </DragDropContext>
      </div>
      {isModalOpen && (
        <ContactDetailModal
          contact={selectedContact}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}