// src/components/KanbanBoard.jsx

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chatStore";
import { getContacts } from "../services/reminderService";
import { apiFetch } from "../services/api";

const initialColumns = {
  Nuevo: { name: "Nuevo", items: [] },
  Contactado: { name: "Contactado", items: [] },
  Propuesta: { name: "Propuesta", items: [] },
  Cierre: { name: "Cierre", items: [] },
};

const updateContactStageAPI = (contactId, stage) => {
  // El draggableId es el id compuesto, ej: "741...#573..."
  // El backend espera solo la segunda parte (el número)
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

  // Obtenemos la función CORRECTA y el companyId del store
  const selectConversation = useChatStore((state) => state.selectConversation);
  const companyId = useChatStore((state) => state.companyId);

  useEffect(() => {
    if (!companyId) return; // Esperamos a que el companyId esté disponible

    getContacts()
      .then((contacts) => {
        const newColumns = JSON.parse(JSON.stringify(initialColumns));

        // Transformamos los contactos para añadir el ID compuesto que necesita la app
        const processedContacts = contacts.map(contact => ({
          ...contact,
          // Creamos el ID compuesto: "741...#573..."
          id: `${companyId}#${contact.id}`
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
  }, [companyId]); // Volvemos a ejecutar si el companyId cambia

  const onDragEnd = (result) => {
    // Esta función ya está correcta y no necesita cambios
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
          console.error("Fallo al actualizar la etapa, revirtiendo cambio.", err);
          alert("No se pudo actualizar el estado del contacto. Inténtalo de nuevo.");
          setColumns(oldColumns);
        }
      );
    }
  };

  // Usamos la función 'selectConversation' con el id del contacto
  const handleCardClick = (contact) => {
    console.log("Card clicked, selecting conversation:", contact.id);
    selectConversation(contact.id);
    navigate("/");
  };

  if (isLoading) {
    return (
      <p className="text-center text-gray-500">Cargando tablero Kanban...</p>
    );
  }

  return (
    <div className="flex-1 overflow-x-auto pb-4">
      <div className="flex gap-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {Object.entries(columns).map(([columnId, column]) => (
            <div
              key={columnId}
              className="w-80 bg-gray-100 rounded-lg shadow-lg flex-shrink-0"
            >
              <h3 className="p-4 text-lg font-bold text-gray-700 border-b border-gray-300">
                {column.name} ({column.items.length})
              </h3>
              <Droppable droppableId={columnId} key={columnId}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`p-3 min-h-[60vh] transition-colors duration-300 ${
                      snapshot.isDraggingOver ? "bg-blue-50" : "bg-gray-100"
                    }`}
                  >
                    {column.items.map((item, index) => (
                      <Draggable
                        key={item.id}
                        // El draggableId DEBE ser el ID compuesto
                        draggableId={item.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => handleCardClick(item)}
                            className={`p-4 mb-3 bg-white rounded-lg shadow-sm border-l-4 border-red-500 transition-shadow cursor-pointer hover:shadow-md ${
                              snapshot.isDragging ? "shadow-xl" : ""
                            }`}
                          >
                            <p className="font-semibold text-gray-900">
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.number}
                            </p>
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
    </div>
  );
}