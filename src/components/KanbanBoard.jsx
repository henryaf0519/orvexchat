// src/components/KanbanBoard.jsx

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { getContacts } from "../services/reminderService";
import { apiFetch } from "../services/api";
import { FaEllipsisH } from "react-icons/fa";
import ContactDetailModal from "./ContactDetailModal";

// Define la estructura y el orden de nuestras columnas del Kanban
const initialColumns = {
  Nuevo: { name: "Nuevo Lead", items: [], color: "bg-blue-500" },
  Contactado: { name: "Contactado", items: [], color: "bg-indigo-500" },
  Propuesta: { name: "Propuesta Enviada", items: [], color: "bg-purple-500" },
  Vendido: { name: "Vendido", items: [], color: "bg-green-500" },
  Perdido: { name: "Perdido", items: [], color: "bg-gray-400" },
};

const updateContactStageAPI = (contactId, stage) => {
  const conversationId = contactId.split("#")[1] || contactId;
  return apiFetch(`/dynamo/contacts/${conversationId}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stage }),
  });
};

export default function KanbanBoard() {
  const [columns, setColumns] = useState(initialColumns);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const selectConversation = useChatStore((state) => state.selectConversation);
  const companyId = useChatStore((state) => state.companyId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  useEffect(() => {
    if (!companyId) return;

    getContacts()
      .then((contacts) => {
        const newColumns = JSON.parse(JSON.stringify(initialColumns));
        const processedContacts = contacts.map((contact) => ({
          ...contact,
          id: `${companyId}#${contact.conversationId}`,
        }));

        processedContacts.forEach((contact) => {
          const stage = contact.stage || "Nuevo";
          if (newColumns[stage]) {
            newColumns[stage].items.push(contact);
          } else {
            newColumns["Nuevo"].items.push(contact);
          }
        });
        setColumns(newColumns);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error al cargar contactos para el Kanban:", error);
        setIsLoading(false);
      });
  }, [companyId]);

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
    return <p className="text-center text-gray-500">Cargando tablero...</p>;
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-6">
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => (
            <div
              key={columnId}
              className="w-80 bg-gray-100 rounded-xl flex flex-col flex-shrink-0"
            >
              <div className={`p-4 flex justify-between items-center border-t-4 rounded-t-xl ${column.color}`}>
                <h3 className="font-bold text-white">{column.name}</h3>
                <span className="text-sm font-semibold text-white bg-white/30 rounded-full px-2 py-0.5">
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
                            className={`p-4 mb-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer relative ${
                              snapshot.isDragging ? "ring-2 ring-red-500" : ""
                            }`}
                          >
                            <p className="font-semibold text-gray-800">{item.name}</p>
                            <p className="text-sm text-gray-500 mt-1">{item.number}</p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(item);
                              }}
                              className="absolute top-2 right-2 text-gray-400 hover:text-red-600 p-1 transition-colors"
                              title="Ver detalles del contacto"
                            >
                              <FaEllipsisH size={20} />
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
          ))}
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