/*
 * Aravá: comportamiento del sitio (JavaScript sin dependencias, salvo Bootstrap para el menú).
 * Módulos: atribución de campaña, consentimiento + analítica, eventos, WhatsApp,
 * datos de contacto, formulario CRM, carruseles, encabezado y animaciones.
 */
(function () {
  "use strict";

  var CFG = window.ARAVA_CONFIG || {};
  var doc = document;
  var ATTR_KEY = "arava_attribution_v1";
  var CONSENT_KEY = "arava_consent_v1";
  var ATTR_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id", "fbclid", "gclid", "wbraid", "gbraid"];

  /* Iconos Lucide (ISC) en línea, iguales a los del HTML (assets/vendor/lucide/LICENSE.txt) */
  var ICON_EXT = '<svg class="ar-icon ar-icon--arrow-up-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg><span class="visually-hidden"> (se abre en una pestaña nueva)</span>';

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }
  function has(v) { return typeof v === "string" && v.trim() !== ""; }

  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* almacenamiento no disponible */ } }
  };

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
   * 1. Atribución persistente (primer y último toque)
   * ------------------------------------------------------------- */
  var Attribution = (function () {
    var now = Date.now();
    var maxAge = (CFG.attributionDays || 90) * 864e5;
    var data = store.get(ATTR_KEY);
    if (!data || !data.firstSeen || now - data.firstSeen > maxAge) data = null;

    var params = new URLSearchParams(window.location.search);
    var touch = {};
    ATTR_PARAMS.forEach(function (p) { var v = params.get(p); if (has(v)) touch[p] = v.slice(0, 200); });
    var externalRef = "";
    try {
      if (doc.referrer && new URL(doc.referrer).host !== window.location.host) externalRef = doc.referrer.slice(0, 300);
    } catch (e) { /* referrer inválido */ }

    var isCampaignTouch = Object.keys(touch).length > 0;
    if (!data) {
      data = { firstSeen: now, first: null, last: null, landingPage: window.location.pathname + window.location.search, referrer: externalRef };
    }
    if (isCampaignTouch) {
      touch.at = new Date(now).toISOString();
      touch.page = window.location.pathname;
      if (!data.first) data.first = touch;
      data.last = touch;
    }
    if (!data.referrer && externalRef) data.referrer = externalRef;
    store.set(ATTR_KEY, data);

    return {
      get: function () { return data; },
      flat: function () {
        var out = {
          landing_page: data.landingPage || "",
          referrer: data.referrer || "",
          first_seen: new Date(data.firstSeen).toISOString()
        };
        ATTR_PARAMS.forEach(function (p) {
          out[p] = (data.last && data.last[p]) || "";
          out["first_" + p] = (data.first && data.first[p]) || "";
        });
        return out;
      }
    };
  })();

  /* ---------------------------------------------------------------
   * 2. Consentimiento y carga condicionada de GA4 / Clarity
   * ------------------------------------------------------------- */
  var analyticsCfg = CFG.analytics || {};
  var ga4Id = has(analyticsCfg.ga4Id) && /^G-[A-Z0-9]+$/i.test(analyticsCfg.ga4Id.trim()) ? analyticsCfg.ga4Id.trim() : "";
  var clarityId = has(analyticsCfg.clarityId) && /^[a-z0-9]+$/i.test(analyticsCfg.clarityId.trim()) ? analyticsCfg.clarityId.trim() : "";
  var trackingConfigured = !!(ga4Id || clarityId);
  var analyticsLoaded = false;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function loadScript(src) {
    var s = doc.createElement("script");
    s.async = true; s.src = src;
    doc.head.appendChild(s);
  }

  function loadAnalytics() {
    if (analyticsLoaded || !trackingConfigured) return;
    analyticsLoaded = true;
    if (ga4Id) {
      window.gtag = gtag;
      gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied" });
      gtag("consent", "update", { analytics_storage: "granted" });
      gtag("js", new Date());
      gtag("config", ga4Id, { anonymize_ip: true });
      loadScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga4Id));
    }
    if (clarityId) {
      (function (c, l, a, r, i) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        var t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + encodeURIComponent(i);
        var y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, doc, "clarity", "script", clarityId);
      window.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    }
  }

  var Consent = {
    get: function () { var c = store.get(CONSENT_KEY); return c && typeof c.analytics === "boolean" ? c : null; },
    set: function (analytics) {
      store.set(CONSENT_KEY, { analytics: !!analytics, at: new Date().toISOString(), v: 1 });
      if (analytics) loadAnalytics();
      else if (analyticsLoaded) {
        /* Si se retira el consentimiento después de cargar, se recarga para detener la medición. */
        window.location.reload();
      }
    },
    granted: function () { var c = Consent.get(); return !!(c && c.analytics); }
  };

  function initConsentBanner() {
    var banner = $("#consent-banner");
    var reopeners = $all("[data-consent-open]");
    if (!trackingConfigured) {
      /* Sin IDs configurados no hay medición de terceros: no hay nada que consentir. */
      if (banner) banner.remove();
      reopeners.forEach(function (el) { var li = el.closest("li"); (li || el).remove(); });
      return;
    }
    if (!banner) return;
    function show() { banner.hidden = false; var b = $("[data-consent-accept]", banner); if (b) b.focus({ preventScroll: true }); }
    function hide() { banner.hidden = true; }
    $all("[data-consent-accept]", banner).forEach(function (b) { b.addEventListener("click", function () { Consent.set(true); hide(); }); });
    $all("[data-consent-reject]", banner).forEach(function (b) { b.addEventListener("click", function () { Consent.set(false); hide(); }); });
    reopeners.forEach(function (el) { el.addEventListener("click", function (e) { e.preventDefault(); show(); }); });
    if (Consent.get() === null) show();
    else if (Consent.granted()) loadAnalytics();
  }

  /* ---------------------------------------------------------------
   * 3. Eventos de medición (solo se envían si hay consentimiento)
   * ------------------------------------------------------------- */
  function track(eventName, params) {
    if (!analyticsLoaded || !Consent.granted()) return;
    var p = params || {};
    if (ga4Id && window.gtag) window.gtag("event", eventName, p);
    if (clarityId && window.clarity) window.clarity("event", eventName);
  }
  window.aravaTrack = track;

  function initOutboundTracking() {
    doc.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-track]");
      if (!a) return;
      track(a.getAttribute("data-track"), {
        link_url: a.href,
        project: a.getAttribute("data-project") || "",
        page_location_path: window.location.pathname
      });
    });
  }

  /* ---------------------------------------------------------------
   * 4. Datos de contacto y WhatsApp (sin números inventados)
   * ------------------------------------------------------------- */
  var contact = CFG.contact || {};
  var waNumber = (contact.whatsapp || "").replace(/\D/g, "");
  var waValid = waNumber.length >= 10 && waNumber.length <= 15;

  /* Mensajes prellenados por página de origen (art-direction §7.9) */
  var WA_TEXT = {
    inicio: "Hola, vengo de la página de Aravá y quiero más información.",
    nosotros: "Hola, vengo de la página de Aravá y quiero más información.",
    proyectos: "Hola, vi los proyectos en la página de Aravá y quiero más información.",
    hito18: "Hola, vi Hito 18 en la página de Aravá y quiero más información.",
    bremen: "Hola, vi Montes de Bremen en la página de Aravá y quiero más información.",
    proximos: "Hola, quiero saber de los próximos proyectos de Aravá.",
    contacto: "Hola, quiero hablar con Aravá."
  };

  function initWhatsApp() {
    var pageCtx = doc.body.getAttribute("data-page") || "inicio";
    $all("[data-whatsapp]").forEach(function (el) {
      var ctx = el.getAttribute("data-wa-context") || pageCtx;
      if (waValid) {
        var text = WA_TEXT[ctx] || WA_TEXT.inicio;
        el.setAttribute("href", "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(text));
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
        el.setAttribute("data-track", "whatsapp_click");
        el.hidden = false;
      } else {
        /* Número oficial pendiente: se oculta el botón o se muestra el aviso indicado. */
        var fallbackSel = el.getAttribute("data-wa-fallback");
        if (fallbackSel) $all(fallbackSel).forEach(function (f) { f.hidden = false; });
        el.remove();
      }
    });
    $all("[data-wa-pending]").forEach(function (el) { el.hidden = waValid; });
  }

  /* Cada línea de contacto se muestra solo si está configurada (art-direction §7.11). */
  function initContactFields() {
    var any = false;
    $all("[data-contact-row]").forEach(function (row) {
      var key = row.getAttribute("data-contact-row");
      var ok = key === "whatsapp" ? waValid : has(contact[key]);
      row.hidden = !ok;
      if (!ok) return;
      any = true;
      $all("[data-contact]", row).forEach(function (el) {
        var val = (contact[el.getAttribute("data-contact")] || "").trim();
        if (key === "email") {
          el.textContent = "";
          var a = doc.createElement("a"); a.href = "mailto:" + val; a.textContent = val; el.appendChild(a);
        } else if (key === "mapUrl") {
          el.textContent = "";
          var m = doc.createElement("a"); m.href = val; m.target = "_blank"; m.rel = "noopener"; m.textContent = "Ver en Google Maps"; m.insertAdjacentHTML("beforeend", ICON_EXT); el.appendChild(m);
        } else {
          el.textContent = val;
        }
      });
    });
    var social = CFG.social || {};
    $all("[data-social]").forEach(function (el) {
      var url = social[el.getAttribute("data-social")];
      if (has(url) && /^https:\/\//.test(url.trim())) { el.href = url.trim(); el.hidden = false; any = true; }
      else { var li = el.closest("li"); (li || el).remove(); }
    });
    $all("[data-social-list]").forEach(function (list) { list.hidden = list.children.length === 0; });
    $all("[data-contact-empty]").forEach(function (el) { el.hidden = any; });
  }

  /* ---------------------------------------------------------------
   * 5. Formulario de contacto: envío al CRM
   * ------------------------------------------------------------- */
  function initContactForm() {
    var form = $("#contact-form");
    if (!form) return;
    var status = $("#form-status");
    var submitBtn = $("[type=submit]", form);
    var crm = CFG.crm || {};
    var endpoint = has(crm.endpoint) && /^https:\/\//.test(crm.endpoint.trim()) ? crm.endpoint.trim() : "";
    var notice = $("#form-not-configured");
    if (notice) notice.hidden = !!endpoint;

    /* Preselección del interés desde la URL (?interes=hito18) */
    var interestParam = new URLSearchParams(window.location.search).get("interes");
    var select = form.elements.interes;
    if (interestParam && select) {
      Array.prototype.forEach.call(select.options, function (o) { if (o.value === interestParam) select.value = interestParam; });
    }

    var MESSAGES = {
      nombre: "Escribe tu nombre.",
      telefono: "Escribe un teléfono válido (7 a 15 dígitos).",
      correo: "Escribe un correo válido, por ejemplo nombre@correo.com.",
      interes: "Elige una opción.",
      autorizacion: "Necesitamos tu autorización para contactarte."
    };
    var LABELS = { nombre: "Nombre", telefono: "Teléfono o WhatsApp", correo: "Correo electrónico", interes: "¿Qué te interesa?", autorizacion: "Autorización de datos" };

    function fieldError(field, msg) {
      var id = field.id + "-error";
      var err = doc.getElementById(id);
      if (msg) {
        field.setAttribute("aria-invalid", "true");
        field.classList.add("is-invalid");
        if (err) { err.textContent = msg; err.hidden = false; }
      } else {
        field.removeAttribute("aria-invalid");
        field.classList.remove("is-invalid");
        if (err) { err.textContent = ""; err.hidden = true; }
      }
    }

    function validateField(field) {
      var name = field.name;
      var v = field.type === "checkbox" ? field.checked : (field.value || "").trim();
      var msg = "";
      if (name === "nombre" && v.length < 2) msg = MESSAGES.nombre;
      if (name === "telefono") { var d = v.replace(/\D/g, ""); if (d.length < 7 || d.length > 15) msg = MESSAGES.telefono; }
      if (name === "correo" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = MESSAGES.correo;
      if (name === "correo" && !v && field.required) msg = MESSAGES.correo;
      if (name === "interes" && !v) msg = MESSAGES.interes;
      if (name === "autorizacion" && !v) msg = MESSAGES.autorizacion;
      fieldError(field, msg);
      return !msg;
    }

    var validated = ["nombre", "telefono", "correo", "interes", "autorizacion"];
    var submittedOnce = false;
    validated.forEach(function (n) {
      var f = form.elements[n];
      if (!f) return;
      f.addEventListener("blur", function () { if (submittedOnce) validateField(f); });
      f.addEventListener("change", function () { if (submittedOnce || f.getAttribute("aria-invalid")) validateField(f); });
    });

    function setStatus(kind, html, keepFocus) {
      status.className = "form-status form-status--" + kind;
      status.setAttribute("role", kind === "error" || kind === "warning" ? "alert" : "status");
      status.innerHTML = html;
      status.hidden = false;
      if (!keepFocus) status.focus({ preventScroll: false });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      submittedOnce = true;
      var invalid = [];
      validated.forEach(function (n) {
        var f = form.elements[n];
        if (f && !validateField(f)) invalid.push(f);
      });
      if (invalid.length) {
        /* Resumen de errores con enlaces a cada campo (§7.10); el foco va al primer campo inválido */
        var items = invalid.map(function (f) {
          return '<li><a href="#' + f.id + '">' + LABELS[f.name] + ": " + MESSAGES[f.name] + "</a></li>";
        }).join("");
        setStatus("error", "<strong>Revisa " + (invalid.length === 1 ? "este campo" : "estos " + invalid.length + " campos") + " antes de enviar:</strong><ul>" + items + "</ul>", true);
        $all("a", status).forEach(function (a) {
          a.addEventListener("click", function (ev) { ev.preventDefault(); var t = doc.getElementById(a.getAttribute("href").slice(1)); if (t) t.focus(); });
        });
        invalid[0].focus();
        return;
      }
      /* Trampa anti-spam: si un bot llenó el campo oculto, se descarta en silencio. */
      if (form.elements.empresa_web && form.elements.empresa_web.value) return;

      if (!endpoint) {
        /* Estado honesto: nunca se simula un envío exitoso (§7.10). */
        setStatus("warning", "<strong>Tu mensaje no fue enviado.</strong> Este formulario aún no está conectado al sistema de Aravá, así que tus datos no salieron de este navegador. " +
          (waValid || has(contact.email) ? "Mientras tanto, escríbenos por los canales de esta página." : "Pronto publicaremos nuestros canales de contacto."));
        return;
      }

      var payload = {
        nombre: form.elements.nombre.value.trim(),
        telefono: form.elements.telefono.value.trim(),
        correo: form.elements.correo.value.trim(),
        interes: form.elements.interes.value,
        mensaje: (form.elements.mensaje.value || "").trim().slice(0, 2000),
        autorizacion_datos: true,
        politica_version: CFG.privacyPolicyVersion || "",
        autorizacion_fecha: new Date().toISOString(),
        pagina_origen: window.location.pathname,
        origen: doc.body.getAttribute("data-page") || ""
      };
      var attr = Attribution.flat();
      Object.keys(attr).forEach(function (k) { payload[k] = attr[k]; });
      var extra = crm.extraFields || {};
      Object.keys(extra).forEach(function (k) { payload[k] = extra[k]; });

      var headers = {};
      var body;
      if (crm.format === "form") {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        body = new URLSearchParams(payload).toString();
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(payload);
      }
      Object.keys(crm.headers || {}).forEach(function (k) { headers[k] = crm.headers[k]; });

      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = controller ? setTimeout(function () { controller.abort(); }, crm.timeoutMs || 15000) : null;

      submitBtn.disabled = true;
      submitBtn.setAttribute("aria-busy", "true");
      setStatus("info", "Enviando…");

      fetch(endpoint, { method: "POST", headers: headers, body: body, signal: controller ? controller.signal : undefined })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          track("form_submit", { interes: payload.interes, origen: payload.origen });
          track("generate_lead", { interes: payload.interes, origen: payload.origen });
          form.reset();
          submittedOnce = false;
          /* Panel de éxito en lugar del formulario (§7.10), solo con respuesta 2xx del CRM */
          var panel = doc.createElement("div");
          panel.className = "form-status form-status--success";
          panel.setAttribute("role", "status");
          panel.tabIndex = -1;
          panel.innerHTML = '<h3 class="ar-h3" style="color:inherit;margin:0 0 .5rem">Gracias. Te escribimos pronto.</h3>' +
            (waValid ? '<p style="margin:0">Si prefieres, también puedes <a href="https://wa.me/' + waNumber + "?text=" + encodeURIComponent(WA_TEXT.contacto) + '" target="_blank" rel="noopener" data-track="whatsapp_click">escribirnos por WhatsApp' + ICON_EXT + '</a>.</p>' : '<p style="margin:0">Recibimos tu mensaje.</p>');
          form.hidden = true;
          if (notice) notice.hidden = true;
          status.hidden = true;
          form.parentNode.insertBefore(panel, form);
          panel.focus();
        })
        .catch(function () {
          setStatus("error", "<strong>No pudimos enviar tu mensaje.</strong> Revisa tu conexión e inténtalo de nuevo en unos minutos.");
        })
        .then(function () {
          if (timer) clearTimeout(timer);
          submitBtn.disabled = false;
          submitBtn.removeAttribute("aria-busy");
        });
    });
  }

  /* ---------------------------------------------------------------
   * 6. Carruseles (hero de Inicio y galerías de proyecto)
   * Usa Carousel de Bootstrap para la transición, el teclado y el gesto táctil.
   * Solo el hero avanza solo, y nunca con «movimiento reducido» activo.
   * ------------------------------------------------------------- */
  function initSliders() {
    if (!window.bootstrap || !window.bootstrap.Carousel) return;
    $all("[data-slider]").forEach(function (el) {
      var items = $all(".carousel-item", el);
      if (items.length < 2) return;
      var autoplay = el.hasAttribute("data-slider-autoplay");
      var interval = parseInt(el.getAttribute("data-slider-autoplay"), 10) || 6500;
      var carousel = new window.bootstrap.Carousel(el, { interval: interval, ride: false, pause: false, wrap: true, touch: true, keyboard: true });
      var gotos = $all("[data-slide-to]", el);
      var captions = $all("[data-slide-caption]", el);
      var live = $("[data-slide-live]", el);
      var toggle = $("[data-slide-toggle]", el);
      var playing = false;   /* lo que eligió la persona */
      var held = false;      /* pausa temporal mientras el foco del teclado está dentro */

      function sync(index, announce) {
        gotos.forEach(function (b) {
          if (Number(b.getAttribute("data-slide-to")) === index) b.setAttribute("aria-current", "true");
          else b.removeAttribute("aria-current");
        });
        captions.forEach(function (c, i) { c.classList.toggle("is-active", i === index); });
        if (live && announce) {
          var img = $("img", items[index]);
          live.textContent = "Imagen " + (index + 1) + " de " + items.length + (img && img.alt ? ": " + img.alt : "");
        }
      }
      function run() {
        var on = playing && !held;
        if (on) carousel.cycle(); else carousel.pause();
        el.classList.toggle("is-paused", !on);
      }
      function setPlaying(v) {
        playing = v;
        if (toggle) toggle.setAttribute("aria-label", v ? "Pausar el cambio automático de imágenes" : "Reanudar el cambio automático de imágenes");
        run();
      }

      /* Las imágenes de las demás diapositivas se piden cuando el carrusel se acerca a la pantalla */
      function preload() { $all("img[loading='lazy']", el).forEach(function (img) { img.loading = "eager"; }); }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); preload(); }
        }, { rootMargin: "300px 0px" });
        io.observe(el);
      } else preload();

      el.addEventListener("slide.bs.carousel", function (e) { sync(e.to, !autoplay || !playing || held); });
      $all("[data-slide]", el).forEach(function (b) {
        b.addEventListener("click", function () { if (b.getAttribute("data-slide") === "prev") carousel.prev(); else carousel.next(); });
      });
      gotos.forEach(function (b) {
        b.addEventListener("click", function () { carousel.to(Number(b.getAttribute("data-slide-to"))); });
      });

      if (autoplay) {
        el.style.setProperty("--ar-reel-ms", interval + "ms");
        if (toggle) toggle.addEventListener("click", function () { setPlaying(!playing); });
        /* Solo el foco de teclado detiene el avance; un clic con el ratón no. */
        el.addEventListener("focusin", function (e) {
          var kb = false;
          try { kb = e.target.matches(":focus-visible"); } catch (err) { kb = true; }
          if (kb) { held = true; run(); }
        });
        el.addEventListener("focusout", function (e) { if (held && !el.contains(e.relatedTarget)) { held = false; run(); } });
        setPlaying(!prefersReducedMotion);
      }
      sync(0, false);
      el.classList.add("is-ready");
    });
  }

  /* ---------------------------------------------------------------
   * 7. Encabezado, navegación y animaciones
   * ------------------------------------------------------------- */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    /* Menú móvil: aria-expanded sincronizado y foco devuelto al botón al cerrar (§7.1) */
    var menu = $("#site-menu");
    var toggle = $(".ar-nav-toggle");
    if (menu && toggle) {
      menu.addEventListener("show.bs.offcanvas", function () { toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Cerrar menú"); });
      menu.addEventListener("hidden.bs.offcanvas", function () {
        toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menú");
        if (toggle.offsetParent !== null && !menu.contains(doc.activeElement)) toggle.focus({ preventScroll: true });
      });
    }
    if (menu && window.bootstrap) {
      $all("a[href^='#']", menu).forEach(function (a) {
        a.addEventListener("click", function () { var oc = window.bootstrap.Offcanvas.getInstance(menu); if (oc) oc.hide(); });
      });
    }
  }

  /*
   * Aparición al desplazarse (§9). Determinista: en cada fotograma de desplazamiento se revela todo
   * elemento cuyo borde superior ya entró en el viewport o quedó por encima (saltos con ancla, tecla Fin,
   * desplazamiento rápido). No depende de los tiempos de IntersectionObserver. Sin JS o con movimiento
   * reducido, todo es visible desde el inicio (la clase .js-reveal nunca se añade).
   */
  function initReveal() {
    var items = $all("[data-reveal]");
    if (!items.length) return;
    function revealAll() { items.forEach(function (el) { el.classList.add("is-visible"); }); items = []; }
    if (prefersReducedMotion || !("requestAnimationFrame" in window)) { revealAll(); return; }
    doc.documentElement.classList.add("js-reveal");
    var ticking = false;
    function check() {
      ticking = false;
      var limit = (window.innerHeight || doc.documentElement.clientHeight) * 0.92;
      items = items.filter(function (el) {
        if (el.getBoundingClientRect().top < limit) { el.classList.add("is-visible"); return false; }
        return true;
      });
      if (!items.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; window.requestAnimationFrame(check); } }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    window.addEventListener("hashchange", onScroll);
    window.addEventListener("load", onScroll);
    window.addEventListener("beforeprint", revealAll);
    check();
  }

  /* Línea de presencia editable desde site-config.js; vacía => se oculta (nunca se inventa). */
  function initPresence() {
    var pres = CFG.presence;
    if (!pres || typeof pres.cities !== "string") return;
    $all("[data-presence]").forEach(function (el) {
      var span = el.querySelector("[data-presence-text]") || el;
      if (has(pres.cities)) span.textContent = pres.cities.trim(); else el.hidden = true;
    });
  }

  function initYear() {
    $all("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }


  /* ---------------------------------------------------------------
   * 7b. Modo revisión (?preview=1), cifras y enlaces de proyecto
   * ------------------------------------------------------------- */
  var isPreview = new URLSearchParams(window.location.search).get("preview") === "1";

  function initPreview() {
    if (!isPreview) return;
    doc.documentElement.setAttribute("data-preview", "");
    $all("[data-preview-only]").forEach(function (el) { el.hidden = false; });
  }

  function escapeHtml(t) { var d = doc.createElement("div"); d.textContent = String(t); return d.innerHTML; }

  /*
   * Cifras de Aravá (§7.3). Solo se publican cifras confirmadas, con valor y prueba; nunca guiones ni "XX".
   * El bloque completo permanece oculto mientras haya menos de tres: una cifra suelta se ve pobre.
   * Con ?preview=1 se muestra siempre, con las pendientes marcadas como «por confirmar».
   */
  function initTrustStrip() {
    var list = $("[data-trust]");
    if (!list) return;
    var section = list.closest("[data-trust-section]") || list;
    var all = CFG.facts || [];
    var facts = all.filter(function (f) { return f && f.confirmed === true && f.value !== null && f.value !== "" && has(f.proof); });
    var pending = isPreview ? all.filter(function (f) { return f && facts.indexOf(f) === -1; }) : [];
    if (facts.length < 3 && !isPreview) { section.hidden = true; return; }
    list.innerHTML = facts.map(function (f) {
      return '<li class="ar-trust__item"><span class="ar-trust__numeral">' + escapeHtml(f.value) + '</span>' +
        '<span class="ar-eyebrow ar-trust__label">' + escapeHtml(f.label) + '</span><p class="ar-trust__proof">' + escapeHtml(f.proof) + "</p></li>";
    }).join("") + pending.map(function (f) {
      return '<li class="ar-trust__item ar-trust__item--pending"><span class="ar-trust__statement">Cifra por confirmar con el equipo</span>' +
        '<span class="ar-eyebrow ar-trust__label">' + escapeHtml(f.label) + "</span></li>";
    }).join("");
    list.style.setProperty("--ar-trust-cols", String(Math.min(5, list.children.length)));
    section.hidden = false;
  }

  function initProjectLinks() {
    var projects = CFG.projects || {};
    $all("[data-project-url]").forEach(function (el) {
      var url = projects[el.getAttribute("data-project-url")];
      if (has(url) && /^https:\/\//.test(url.trim())) { el.href = url.trim(); el.hidden = false; }
      else {
        var fb = el.getAttribute("data-fallback");
        if (fb) $all(fb).forEach(function (f) { f.hidden = false; });
        var li = el.closest("li"); (li && li.children.length === 1 ? li : el).remove();
      }
    });
  }

  /* API de depuración para pruebas y administración (sin datos personales). */
  window.ARAVA = {
    attribution: function () { return Attribution.get(); },
    consent: function () { return Consent.get(); },
    trackingConfigured: trackingConfigured,
    analyticsLoaded: function () { return analyticsLoaded; },
    whatsappConfigured: waValid
  };

  function init() {
    initPreview();
    initYear();
    initPresence();
    initTrustStrip();
    initProjectLinks();
    initHeader();
    initContactFields();
    initWhatsApp();
    initConsentBanner();
    initOutboundTracking();
    initContactForm();
    initSliders();
    initReveal();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init);
  else init();
})();
