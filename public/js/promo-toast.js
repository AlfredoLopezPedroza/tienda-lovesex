(function () {
  'use strict';

  const WHATSAPP_NUMBER = '527771949697';
  const STORAGE_KEY = 'ls_promo_toast_dismissed';
  const INITIAL_DELAY_MS = 4000;
  const SHOW_DURATION_MS = 7000;
  const GAP_DURATION_MS = 3500;

  const OFERTAS_VIP = [
    {
      id: 'parejas',
      tabLabel: '#1 Parejas',
      badge: '⚡ OFERTA PAREJAS',
      nombre: 'Vibrador Huevo + Lubricante 4 en 1',
      precioAnterior: '$420',
      precioNuevo: '$299 MXN',
      imagen: '/img/productos/vibradores/vv-huevo01.webp',
      descripcion:
        'Incluye Vibrador Tipo Huevo (discreto y potente) + Lubricante 4 en 1. Ideal para encender la noche en pareja.',
      whatsappMensaje:
        'Hola 👋\n\nQuiero aprovechar la Oferta VIP #1: VIBRADOR HUEVO + LUBRICANTE 4 EN 1 por $299 MXN (antes $420).\n\n¿Me confirman disponibilidad y detalles del envío discreto?'
    },
    {
      id: 'mujer-vip',
      tabLabel: '#2 Mujer VIP',
      badge: '🔥 TOP MUJER VIP',
      nombre: 'Estimulador Pélvico Flamingo 5981',
      precioAnterior: '$850',
      precioNuevo: '$599 MXN',
      imagen: '/img/productos/vibradores/vv-flamingocb5981.jpg',
      descripcion:
        'Estimulador pélvico Flamingo recargable de alta potencia y múltiples modos. El favorito VIP para máximo placer.',
      whatsappMensaje:
        'Hola 👋\n\nMe interesa la Oferta VIP #2: ESTIMULADOR FLAMINGO 5981 por $599 MXN (antes $850).\n\n¿Me confirman disponibilidad y detalles del envío discreto?'
    },
    {
      id: 'hombre',
      tabLabel: '#3 Hombre',
      badge: '💥 POTENCIA HOMBRE',
      nombre: 'Anillo Media Funda + Vigorizante Dragon',
      precioAnterior: '$450',
      precioNuevo: '$299 MXN',
      imagen: '/img/productos/fundas-anillos/fa-anillomediafunda.jpeg',
      descripcion:
        'Combo rendimiento total: Anillo Elastomérico con Media Funda Estimulante + Vigorizante Dragon.',
      whatsappMensaje:
        'Hola 👋\n\nQuiero la Oferta VIP #3: ANILLO MEDIA FUNDA + VIGORIZANTE DRAGON por $299 MXN (antes $450).\n\n¿Está disponible para envío discreto?'
    }
  ];

  let currentIdx = 0;
  let cycleTimer = null;
  let isHovering = false;
  let isToastVisible = false;
  let isDismissed = sessionStorage.getItem(STORAGE_KEY) === '1';

  let toastEl, imgEl, badgeEl, titleEl, oldEl, newEl, pillEl, modalOverlay, modalBody;

  function buildWhatsAppUrl(msg) {
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  }

  function createUI() {
    // 1. Toast flotante
    toastEl = document.createElement('div');
    toastEl.className = 'ls-promo-toast';
    toastEl.setAttribute('role', 'region');
    toastEl.setAttribute('aria-label', 'Oferta Black Friday');
    toastEl.innerHTML = `
      <img class="ls-promo-toast-img" src="" alt="" />
      <div class="ls-promo-toast-body">
        <span class="ls-promo-toast-badge"></span>
        <div class="ls-promo-toast-title"></div>
        <div class="ls-promo-toast-price-row">
          <span class="ls-promo-toast-old"></span>
          <span class="ls-promo-toast-new"></span>
          <span class="ls-promo-toast-cta">Ver →</span>
        </div>
      </div>
      <button type="button" class="ls-promo-toast-close" aria-label="Cerrar anuncio">✕</button>
    `;

    imgEl = toastEl.querySelector('.ls-promo-toast-img');
    badgeEl = toastEl.querySelector('.ls-promo-toast-badge');
    titleEl = toastEl.querySelector('.ls-promo-toast-title');
    oldEl = toastEl.querySelector('.ls-promo-toast-old');
    newEl = toastEl.querySelector('.ls-promo-toast-new');

    const closeBtn = toastEl.querySelector('.ls-promo-toast-close');
    closeBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      dismissToast();
    });

    toastEl.addEventListener('click', function () {
      openModal(currentIdx);
    });

    toastEl.addEventListener('mouseenter', function () {
      isHovering = true;
    });
    toastEl.addEventListener('mouseleave', function () {
      isHovering = false;
    });

    // 2. Píldora discreta
    pillEl = document.createElement('button');
    pillEl.type = 'button';
    pillEl.className = 'ls-promo-pill';
    pillEl.textContent = '🔥 3 Promos VIP';
    pillEl.addEventListener('click', function () {
      openModal(currentIdx);
    });

    // 3. Modal VIP de ofertas
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'ls-promo-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="ls-promo-modal" role="dialog" aria-modal="true" aria-label="Ofertas Black Friday">
        <button type="button" class="ls-promo-modal-close" aria-label="Cerrar">✕</button>
        <div class="ls-promo-modal-tabs"></div>
        <div class="ls-promo-modal-content"></div>
      </div>
    `;

    modalOverlay.querySelector('.ls-promo-modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function (e) {
      if (e.target === modalOverlay) closeModal();
    });
    modalBody = modalOverlay.querySelector('.ls-promo-modal-content');

    document.body.appendChild(toastEl);
    document.body.appendChild(pillEl);
    document.body.appendChild(modalOverlay);
  }

  function isCatalogModalOpen() {
    const mainModal = document.getElementById('modal-overlay');
    return mainModal && mainModal.style.display && mainModal.style.display !== 'none';
  }

  function renderToast(idx) {
    const oferta = OFERTAS_VIP[idx];
    imgEl.src = oferta.imagen;
    imgEl.alt = oferta.nombre;
    badgeEl.textContent = oferta.badge;
    titleEl.textContent = oferta.nombre;
    oldEl.textContent = oferta.precioAnterior;
    newEl.textContent = oferta.precioNuevo;
  }

  function showToast() {
    if (isDismissed || isCatalogModalOpen() || modalOverlay.classList.contains('is-open')) {
      scheduleNext(GAP_DURATION_MS);
      return;
    }
    renderToast(currentIdx);
    toastEl.classList.add('is-visible');
    isToastVisible = true;
    scheduleNext(SHOW_DURATION_MS);
  }

  function hideToastAndAdvance() {
    if (isHovering) {
      scheduleNext(1500);
      return;
    }
    toastEl.classList.remove('is-visible');
    isToastVisible = false;
    currentIdx = (currentIdx + 1) % OFERTAS_VIP.length;
    scheduleNext(GAP_DURATION_MS);
  }

  function scheduleNext(ms) {
    clearTimeout(cycleTimer);
    if (isDismissed) return;
    cycleTimer = setTimeout(function () {
      if (isToastVisible) {
        hideToastAndAdvance();
      } else {
        showToast();
      }
    }, ms);
  }

  function dismissToast() {
    isDismissed = true;
    sessionStorage.setItem(STORAGE_KEY, '1');
    clearTimeout(cycleTimer);
    toastEl.classList.remove('is-visible');
    isToastVisible = false;
    pillEl.classList.add('is-visible');
  }

  function renderModal(idx) {
    const oferta = OFERTAS_VIP[idx];
    const tabsContainer = modalOverlay.querySelector('.ls-promo-modal-tabs');
    tabsContainer.innerHTML = '';

    OFERTAS_VIP.forEach(function (item, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ls-promo-tab' + (i === idx ? ' is-active' : '');
      btn.textContent = item.tabLabel;
      btn.addEventListener('click', function () {
        currentIdx = i;
        renderModal(i);
      });
      tabsContainer.appendChild(btn);
    });

    modalBody.innerHTML = `
      <div class="ls-promo-modal-img-wrap">
        <img class="ls-promo-modal-img" src="${oferta.imagen}" alt="${oferta.nombre}" />
      </div>
      <span class="ls-promo-modal-badge">${oferta.badge}</span>
      <h3 class="ls-promo-modal-title">${oferta.nombre}</h3>
      <p class="ls-promo-modal-desc">${oferta.descripcion}</p>
      <div class="ls-promo-modal-prices">
        <span class="ls-promo-modal-old">Antes ${oferta.precioAnterior}</span>
        <span class="ls-promo-modal-new">${oferta.precioNuevo}</span>
      </div>
      <div class="ls-promo-modal-note">📦 Envío 100% discreto · Empaque sin logos ni referencias</div>
      <a class="ls-promo-modal-wa" href="${buildWhatsAppUrl(oferta.whatsappMensaje)}" target="_blank" rel="noopener">
        📲 Pedir esta promo por WhatsApp
      </a>
    `;
  }

  function openModal(idx) {
    currentIdx = idx;
    renderModal(idx);
    toastEl.classList.remove('is-visible');
    isToastVisible = false;
    modalOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
    if (isDismissed) {
      pillEl.classList.add('is-visible');
    } else {
      scheduleNext(GAP_DURATION_MS);
    }
  }

  function init() {
    createUI();
    if (isDismissed) {
      pillEl.classList.add('is-visible');
    } else {
      cycleTimer = setTimeout(showToast, INITIAL_DELAY_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
