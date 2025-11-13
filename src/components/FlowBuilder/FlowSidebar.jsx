import React from 'react';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function FlowSidebar({ 
  isOpen, 
  toggleOpen, 
  flowName, 
  setFlowName, 
  onAddNode, 
  onSave, 
  onTest, 
  isSaving, 
  isSendingTest 
}) {
  const panelWidth = isOpen ? "250px" : "0px";
  const panelPadding = isOpen ? "10px" : "0px";
  const panelOpacity = isOpen ? 1 : 0;

  // Estilos reutilizables para botones
  const btnStyle = (bgColor) => ({
    marginTop: "10px",
    padding: "10px",
    background: bgColor,
    color: "white",
    border: "none",
    borderRadius: "5px",
    width: "100%",
    cursor: "pointer",
  });

  return (
    <>
      <div
        style={{
          width: panelWidth,
          padding: panelPadding,
          opacity: panelOpacity,
          background: "#f8fafc",
          borderRight: isOpen ? "1px solid #ddd" : "none",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          transition: "all 0.3s ease-in-out",
          flexShrink: 0,
        }}
      >
        <div>
          <input
            disabled={true}
            value={flowName}
            onChange={(e) => setFlowName(e.target.value)}
            placeholder="Nombre del Flujo"
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginBottom: "20px",
            }}
          />

          <button onClick={() => onAddNode('screenNode')} style={btnStyle("#3b82f6")}>
            + Añadir Menú
          </button>
          <button onClick={() => onAddNode('catalogNode')} style={btnStyle("#10b981")}>
            + Añadir Catálogo
          </button>
          <button onClick={() => onAddNode('formNode')} style={btnStyle("#f59e0b")}>
            + Añadir Formulario
          </button>
          <button onClick={() => onAddNode('appointmentNode')} style={btnStyle("#9F7AEA")}>
            + Añadir Cita
          </button>
          <button onClick={() => onAddNode('confirmationNode')} style={btnStyle("#ef4444")}>
            + Añadir Confirmación
          </button>
        </div>

        <div style={{ marginTop: "20px" }}>
          <button
            onClick={onSave}
            disabled={isSaving}
            style={{
              marginBottom: "10px",
              padding: "10px",
              width: "100%",
              backgroundColor: isSaving ? "#9ca3af" : "#16a34a",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isSaving ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {isSaving ? "Guardando..." : "Guardar Flujo"}
          </button>

          <button
            onClick={onTest}
            disabled={isSaving || isSendingTest}
            style={{
              padding: "10px",
              width: "100%",
              backgroundColor: isSaving || isSendingTest ? "#9ca3af" : "#0ea5e9",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: isSaving || isSendingTest ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
            }}
          >
            {isSendingTest ? "Enviando..." : "Enviar Flujo Prueba"}
          </button>
        </div>
      </div>

      <button
        onClick={toggleOpen}
        style={{
            position: "absolute",
            left: isOpen ? "250px" : "0px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "0 5px 5px 0",
            padding: "10px 5px",
            cursor: "pointer",
            transition: "left 0.3s ease-in-out",
        }}
      >
        {isOpen ? <FaChevronLeft size={14} /> : <FaChevronRight size={14} />}
      </button>
    </>
  );
}