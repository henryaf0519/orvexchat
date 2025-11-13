// src/utils/flowConfig.js

export const NODE_DEFAULTS = {
  screenNode: {
    title: '',
    components: [
      { type: "Image", id: "image_1", src: null },
      {
        type: "TextBody",
        id: "textbody_1",
        text: "¡Hola! 👋 Escribe aquí tu mensaje de bienvenida.",
      },
    ],
    footer_label: "Continuar",
  },
  catalogNode: {
    title: "",
    introText: "Mira nuestros productos destacados:",
    products: [],
    radioLabel: "¿Cuál producto te interesa más?",
    radioOptions: [],
    footer_label: "Seleccionar",
  },
  formNode: {
    title: "",
    introText: "Por favor, completa los siguientes datos:",
    components: [],
    footer_label: "Continuar",
  },
  appointmentNode: {
    title: "Agendar Cita",
    footer_label: "Continuar",
    config: {
      labelDate: "Selecciona la fecha",
      introText: "Por favor, selecciona una fecha disponible.",
      daysAvailable: [1, 2, 3, 4, 5],
      intervalMinutes: 60,
      daysToShow: 30,
    },
  },
  confirmationNode: {
    title: "",
    headingText: "✅ ¡Todo listo!",
    bodyText:
      "Oprime el boton y un agente se comunicará contigo para finalizar el proceso.",
    footer_label: "Finalizar",
  },
};