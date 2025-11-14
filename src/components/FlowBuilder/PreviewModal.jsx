// src/components/PreviewModal.jsx
import React from "react";
import {
  FaTimes,
  FaImage,
  FaHeading,
  FaKeyboard,
  FaDotCircle,
  FaChevronRight,
} from "react-icons/fa";

// Componente auxiliar para NODO NORMAL (screenNode) Y FORMULARIO (formNode)
const RenderScreenComponent = ({ component }) => {
  // (Mantenemos la lógica de RenderFlowComponent de la respuesta anterior aquí)
  switch (component.type) {
    case "Image":
      const imageSrc =
        component.src || "https://via.placeholder.com/600x314.png?text=Imagen";
      return (
        <img
          src={imageSrc}
          alt="Preview"
          className="w-full h-auto object-cover block"
        />
      );
    case "TextHeading":
      return (
        <h2 className="text-xl font-semibold text-gray-800 px-4 pt-4 pb-1">
          {component.text || "Título"}
        </h2>
      );
    case "TextBody":
      return (
        <p className="text-sm text-gray-700 px-4 py-2 whitespace-pre-wrap">
          {component.text || "Cuerpo del texto..."}
        </p>
      );
    case "TextCaption":
      return (
        <p className="text-xs text-gray-500 px-4 pb-2 pt-1">
          {component.text || "Caption..."}
        </p>
      );

    case "TextInput":
      return (
        <div className="px-4 py-2">
          <input
            type="text"
            placeholder={component.label || "Input Label"}
            disabled
            className="w-full border border-gray-300 rounded-lg p-3 text-sm bg-white cursor-not-allowed"
          />
        </div>
      );

    case "Dropdown":
      return (
        <div className="px-4 py-2">
          <div className="w-full border border-gray-400 rounded-lg p-3 text-sm bg-white cursor-not-allowed flex justify-between items-center text-gray-700">
            <span>{component.label || "Selecciona una opción"}</span>
            <FaChevronRight className="text-gray-500" size={14} />
          </div>
          {/* Simula el helper text de error de tu imagen, pero con un color neutro */}
          <p className="text-xs text-gray-500 px-1 pt-1">
            Simulación de selector
          </p>
        </div>
      );

    case "RadioButtonsGroup":
      return (
        <div className="px-4 py-3 space-y-1">
          <span className="block text-xs font-medium text-gray-500 mb-2">
            {component.label || "Selecciona una opción:"}
          </span>
          {(component.options || []).map((opt, index) => (
            <div
              key={opt.id || index}
              className="flex items-center p-2 rounded hover:bg-gray-100 border border-transparent -ml-2"
            >
              <input
                type="radio"
                name={`preview-radio-${component.name || index}`}
                disabled
                className="mr-2 ml-1 h-4 w-4 text-green-600 cursor-not-allowed border-gray-300 focus:ring-green-500 focus:ring-offset-0 focus:ring-1"
              />
              <span className="text-sm text-gray-800">
                {opt.title || `Opción ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <p className="text-xs text-red-500 px-4 py-1">
          Componente no soportado: {component.type}
        </p>
      );
  }
};

// Componente auxiliar para NODO CATÁLOGO (catalogNode)
const RenderCatalogContent = ({ nodeData }) => {
  return (
    <>
      {nodeData.introText && (
        <p className="text-sm text-gray-700 px-4 py-2 whitespace-pre-wrap">
          {nodeData.introText}
        </p>
      )}
      {(nodeData.products || []).map((product, index) => (
        <div
          key={product.id || index}
          className="border-b border-gray-100 pb-3 mb-3"
        >
          {product.imageBase64 && (
            <img
              src={product.imageBase64}
              alt={product.title || "Producto"}
              className="w-full h-auto object-cover block"
            />
          )}
          <p className="text-sm text-gray-800 px-4 pt-2 whitespace-pre-wrap">
            {product.title ? `**${product.title}**\n` : ""}
            {product.description ? `${product.description}\n` : ""}
            {product.price ? `Precio: ${product.price}` : ""}
          </p>
        </div>
      ))}
      {(nodeData.radioOptions || []).length > 0 && (
        <div className="px-4 py-3 space-y-1">
          <span className="block text-xs font-medium text-gray-500 mb-2">
            {nodeData.radioLabel || "Selecciona:"}
          </span>
          {(nodeData.radioOptions || []).map((opt, index) => (
            <div
              key={opt.id || index}
              className="flex items-center p-2 rounded hover:bg-gray-100 border border-transparent -ml-2"
            >
              <input
                type="radio"
                name="catalog-preview-radio"
                disabled
                className="mr-2 ml-1 h-4 w-4 text-green-600 cursor-not-allowed border-gray-300 focus:ring-green-500 focus:ring-offset-0 focus:ring-1"
              />
              <span className="text-sm text-gray-800">
                {opt.title || `Opción ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default function PreviewModal({ nodeData, onClose }) {
  if (!nodeData) return null;

  // Detecta el tipo de nodo
  const isCatalogNode = nodeData.type === "catalogNode";
  const isFormNode = nodeData.type === "formNode";
  const isConfirmationNode = nodeData.type === "confirmationNode";
  const isScreenNode = !isCatalogNode && !isFormNode && !isConfirmationNode; // Default

  const title = nodeData.title;
  let footer_label = "Continuar";
  if (isConfirmationNode) {
    footer_label = nodeData.footer_label || "Finalizar";
  } else if (isFormNode) {
    // ✅ El formulario también puede tener su propio label
    footer_label = nodeData.footer_label || "Enviar Datos";
  } else {
    footer_label = nodeData.footer_label || "Continuar";
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4 transition-opacity duration-300 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[40px] shadow-2xl w-full max-w-[370px] h-[740px] transform transition-all duration-300 flex flex-col overflow-hidden border-[10px] border-black ring-1 ring-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <header className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-200 flex-shrink-0 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl"></div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-black z-10 p-1 rounded-full hover:bg-gray-200"
          >
            <FaTimes size={16} />
          </button>
          <h3 className="text-sm font-semibold text-gray-700 truncate absolute left-1/2 transform -translate-x-1/2">
            {title || "Vista Previa"}
          </h3>
          <div className="w-6 z-10"></div>
        </header>

        {/* Cuerpo (Scrollable) */}
        <div className="flex-grow overflow-y-auto bg-white">
          {isCatalogNode ? (
            <RenderCatalogContent nodeData={nodeData} />
          ) : isConfirmationNode ? (
            <>
              <RenderScreenComponent
                component={{ type: "TextHeading", text: nodeData.headingText }}
              />
              <div className="border-y border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400 italic mb-1">
                  Vista previa de datos dinámicos:
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono bg-gray-50 p-2 rounded">
                  ${"{data.details}"}
                </p>
              </div>
              <RenderScreenComponent
                component={{ type: "TextBody", text: nodeData.bodyText }}
              />
            </>
          ) : (
            /* ✅ --- INICIO CAMBIO: Renderizado para screenNode Y formNode --- */
            <>
              {/* Si es un FormNode Y tiene introText, lo renderiza primero */}
              {isFormNode && nodeData.introText && (
                <div className="border-b border-gray-100">
                  <RenderScreenComponent
                    component={{ type: "TextBody", text: nodeData.introText }}
                  />
                </div>
              )}

              {/* Mapea el resto de los componentes (inputs, imágenes, etc.) */}
              {(nodeData.components || []).map((component, index) => (
                <div
                  key={component.id || index}
                  className={`${
                    (component.type === "Image" &&
                      index === 0 &&
                      !isFormNode) ||
                    index === nodeData.components.length - 1
                      ? ""
                      : "border-b border-gray-100"
                  }`}
                >
                  <RenderScreenComponent component={component} />
                </div>
              ))}
            </>
            /* ✅ --- FIN CAMBIO --- */
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 pt-3 border-t border-gray-200 bg-white flex-shrink-0 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
          <button
            disabled
            className="w-full bg-gray-200 text-gray-500 p-2.5 rounded-lg font-semibold text-sm cursor-not-allowed"
          >
            {footer_label}
          </button>
          <p className="text-[10px] text-center text-gray-400 mt-2">
            Administrado por la empresa.{" "}
            <span className="text-blue-600">Más información</span>
          </p>
        </footer>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 4px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
