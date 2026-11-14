/*
 * Aravá: configuración del sitio
 * --------------------------------
 * Único archivo que se debe editar para conectar datos oficiales.
 * Todo campo vacío ("") se trata como NO CONFIGURADO: el sitio lo muestra
 * honestamente como "por confirmar" y nunca inventa un dato.
 *
 * Ver docs/admin/CONFIGURACION.md (documentación interna, no se publica).
 */
window.ARAVA_CONFIG = {
  /* Datos de contacto oficiales: pendientes de confirmación del equipo Aravá. */
  contact: {
    email: "",          // p. ej. "contacto@dominio.com"
    phoneDisplay: "",   // p. ej. "+57 300 000 0000" (solo para mostrar)
    whatsapp: "",       // solo dígitos con indicativo, p. ej. "573000000000"
    address: "",        // dirección de oficina o sala de ventas en Armenia
    hours: "",          // p. ej. "Lunes a viernes, 8:00 a. m. – 5:00 p. m."
    mapUrl: ""          // enlace a Google Maps de la oficina o sala de ventas
  },

  /*
   * Cifras de Aravá (bloque de cifras de Inicio).
   * Una cifra solo se publica con confirmed:true, valor (value) y prueba (proof).
   * El bloque aparece al público cuando hay al menos tres cifras confirmadas.
   * Las pendientes nunca se muestran al público: solo en ?preview=1, como «por confirmar».
   * No escribir aquí cifras estimadas.
   *
   * Fuente de "primera-obra", "proyectos" y "premio": «Hoja de vida · Arquitectura Civil SAS 2024»
   * (carpeta Zoho «Aravá - Recursos Corporativos», 03 — Historia y trayectoria). Son cifras de
   * Arquitectura Civil S.A.S., la firma que antecede a Aravá; el pie del bloque lo dice.
   * "proyectos": el documento lista 21 proyectos ejecutados (2003–2022) y 2 en ejecución; se publica «+20».
   */
  facts: [
    { id: "generaciones", value: 4, label: "Generaciones", proof: "Bisabuelo, abuelo, padre y hoy nosotros.", confirmed: true },
    { id: "primera-obra", value: 2003, label: "Primera obra", proof: "Parque Residencial San Simón, en Armenia: 47 casas, de 2003 a 2005.", confirmed: true },
    { id: "proyectos", value: "+20", label: "Proyectos ejecutados", proof: "Vivienda, oficinas, clínicas y una institución educativa en Armenia, Pereira y Belén de Umbría.", confirmed: true },
    { id: "premio", value: 2008, label: "Premio Nacional de Arquitectura", proof: "Premio Karl Brunner, XXI Bienal Colombiana de Arquitectura, por la peatonalización de la carrera 14 de Armenia.", confirmed: true },
    { id: "equipo", value: null, label: "Personas en el equipo", proof: "", confirmed: false },
    { id: "clientes", value: null, label: "Clientes", proof: "", confirmed: false }
  ],

  /* Enlaces a landings de proyecto. Vacío => no se muestra el enlace. */
  projects: {
    hito18: "https://hito18.com",
    bremen: "https://montes-de-bremen.vercel.app/es"  // referencia pública actual; cambiar cuando tenga dominio propio
  },

  /*
   * Línea de presencia (pie y menú móvil). Fuente: bio pública de Instagram @arava.construcciones
   * (2026-11-09): «Armenia • Santa Marta • Medellín» (con ícono de ubicación). Es presencia de marca, no lista de proyectos.
   * Vacío ("") => la línea se oculta.
   */
  presence: {
    cities: "Armenia · Santa Marta · Medellín"
  },

  /* Redes oficiales. Solo se muestran las que tengan URL. */
  social: {
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: ""
  },

  /*
   * CRM / receptor del formulario.
   * endpoint vacío => el formulario NO envía y lo dice claramente.
   * format: "json" (application/json) o "form" (application/x-www-form-urlencoded).
   * El endpoint debe responder 2xx para que se muestre confirmación.
   */
  crm: {
    endpoint: "",
    format: "json",
    headers: {},        // no poner secretos aquí: este archivo es público
    extraFields: { source_site: "arava-corporativo" },
    timeoutMs: 15000
  },

  /*
   * Medición. IDs vacíos => no se carga ningún script de terceros
   * y no se muestra aviso de cookies (no hay nada que consentir).
   * Con IDs, nada se carga hasta que la persona acepta la analítica.
   */
  analytics: {
    ga4Id: "",          // formato "G-XXXXXXXXXX"
    clarityId: ""       // ID de proyecto de Microsoft Clarity
  },

  /* Versión del texto de autorización de datos enviada con cada registro. */
  privacyPolicyVersion: "2026-11-14-borrador",

  /* Días que se conserva la atribución de campaña (UTM / fbclid). */
  attributionDays: 90
};
