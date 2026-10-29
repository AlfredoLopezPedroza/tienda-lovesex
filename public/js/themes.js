/**
 * ============================================================================
 * Love&Sex - Seasonal Theme Engine Controller (themes.js)
 * Manejador de temas estacionales automáticos y selector manual
 * ============================================================================
 */

(function () {
  'use strict';

  const STORAGE_KEY_THEME = 'lovesex_theme';
  const STORAGE_KEY_MODE = 'lovesex_theme_mode'; // 'auto' | 'manual'
  const STORAGE_KEY_BANNER = 'lovesex_banner_dismissed';

  const THEMES = {
    'halloween': {
      id: 'halloween',
      name: 'Halloween',
      icon: '🎃',
      bannerText: '🎃 ESPECIAL NOCHE DE BRUJAS · Deseo & Misterio · Envíos 100% discretos a todo México 🦇',
      badge: 'Edición Brujas'
    },
    'san-valentin': {
      id: 'san-valentin',
      name: 'San Valentín',
      icon: '💖',
      bannerText: '💘 ESPECIAL SAN VALENTÍN · Enciende la chispa · Regalos con entrega 100% discreta',
      badge: 'Mes del Amor'
    },
    'black-friday': {
      id: 'black-friday',
      name: 'Black Friday',
      icon: '⚡',
      bannerText: '⚡ BLACK VIP DEALS · Descuentos exclusivos y máxima discreción garantizada',
      badge: 'Cyber Deals'
    },
    'navidad': {
      id: 'navidad',
      name: 'Navidad',
      icon: '🎄',
      bannerText: '🎄 ESPECIAL NAVIDEÑO · Los mejores regalos para compartir o disfrutar',
      badge: 'Invierno VIP'
    },
    'clasico': {
      id: 'clasico',
      name: 'Clásico',
      icon: '✨',
      bannerText: '✨ CATÁLOGO OFICIAL LOVE & SEX · Placer garantizado con envíos 100% discretos',
      badge: 'Original'
    }
  };

  /**
   * Detecta automáticamente el tema según el calendario del año
   */
  function detectSeasonalTheme() {
    const now = new Date();
    const month = now.getMonth(); // 0-11: 9=Octubre, 10=Noviembre, 11=Diciembre
    const day = now.getDate();

    // 🎃 Halloween: 20 de Octubre al 5 de Noviembre
    if ((month === 9 && day >= 20) || (month === 10 && day <= 5)) {
      return 'halloween';
    }

    // ⚡ Black Friday / Cyber: 15 de Noviembre al 30 de Noviembre
    if (month === 10 && day >= 15) {
      return 'black-friday';
    }

    // 🎄 Navidad / Fin de Año / Reyes: 1 de Diciembre al 6 de Enero
    if (month === 11 || (month === 0 && day <= 6)) {
      return 'navidad';
    }

    // 💖 San Valentín: 1 de Febrero al 20 de Febrero
    if (month === 1 && day >= 1 && day <= 20) {
      return 'san-valentin';
    }

    // ✨ Por defecto: Clásico Love&Sex
    return 'clasico';
  }

  /**
   * Determina el tema activo actual considerando preferencias manuales o calendario automático
   */
  function getActiveThemeConfig() {
    const mode = localStorage.getItem(STORAGE_KEY_MODE) || 'auto';
    const manualTheme = localStorage.getItem(STORAGE_KEY_THEME);

    if (mode === 'manual' && manualTheme && THEMES[manualTheme]) {
      return { theme: manualTheme, mode: 'manual' };
    }

    return { theme: detectSeasonalTheme(), mode: 'auto' };
  }

  /**
   * Aplica el tema al elemento raíz <html> inmediatamente
   */
  function applyTheme(themeId, mode) {
    if (!THEMES[themeId]) themeId = 'halloween';
    
    document.documentElement.setAttribute('data-theme', themeId);
    
    if (mode === 'manual') {
      localStorage.setItem(STORAGE_KEY_MODE, 'manual');
      localStorage.setItem(STORAGE_KEY_THEME, themeId);
    } else {
      localStorage.setItem(STORAGE_KEY_MODE, 'auto');
    }

    updateBanner(themeId);
    updateSwitcherUI(themeId, mode);
  }

  /**
   * Actualiza el contenido del banner superior
   */
  function updateBanner(themeId) {
    const banner = document.getElementById('seasonal-banner');
    if (!banner) return;

    const config = THEMES[themeId] || THEMES['halloween'];
    const contentEl = banner.querySelector('.seasonal-banner-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <span class="seasonal-banner-badge">${config.badge}</span>
        <span>${config.bannerText}</span>
      `;
    }
  }

  /**
   * Construye e inyecta el banner estacional al inicio del body
   */
  function buildBanner(activeTheme) {
    if (document.getElementById('seasonal-banner')) return;

    const bannerDismissed = sessionStorage.getItem(STORAGE_KEY_BANNER);
    if (bannerDismissed === 'true') return;

    const config = THEMES[activeTheme] || THEMES['halloween'];

    const banner = document.createElement('div');
    banner.id = 'seasonal-banner';
    banner.className = 'seasonal-banner';
    banner.innerHTML = `
      <div class="seasonal-banner-content">
        <span class="seasonal-banner-badge">${config.badge}</span>
        <span>${config.bannerText}</span>
      </div>
      <button class="seasonal-banner-close" title="Ocultar anuncio" aria-label="Cerrar">✕</button>
    `;

    // Cerrar banner
    banner.querySelector('.seasonal-banner-close').addEventListener('click', () => {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => banner.remove(), 300);
      sessionStorage.setItem(STORAGE_KEY_BANNER, 'true');
    });

    document.body.insertBefore(banner, document.body.firstChild);
  }

  /**
   * Construye e inyecta el widget flotante selector de temas
   */
  function buildSwitcher(activeTheme, activeMode) {
    if (document.getElementById('theme-switcher-container')) return;

    const container = document.createElement('div');
    container.id = 'theme-switcher-container';
    container.className = 'theme-switcher-container';

    const currentConfig = THEMES[activeTheme] || THEMES['halloween'];

    let optionsHtml = '';
    for (const [id, theme] of Object.entries(THEMES)) {
      const isActive = id === activeTheme;
      optionsHtml += `
        <button class="theme-option-btn ${isActive ? 'active' : ''}" data-theme-id="${id}">
          <div class="theme-option-btn-content">
            <span>${theme.icon}</span>
            <span>${theme.name}</span>
          </div>
          <span class="theme-option-check">✓</span>
        </button>
      `;
    }

    container.innerHTML = `
      <div class="theme-switcher-menu" id="theme-switcher-menu">
        <div class="theme-menu-header">
          <span>Seleccionar Tema</span>
          ${activeMode === 'auto' ? '<span class="theme-menu-auto-badge">Auto (Fecha)</span>' : ''}
        </div>
        <div class="theme-menu-options">
          ${optionsHtml}
        </div>
        <div class="theme-menu-footer">
          <button class="theme-auto-toggle-btn" id="theme-reset-auto">
            <span>🔄</span>
            <span>Restablecer fecha automática</span>
          </button>
        </div>
      </div>
      <button class="theme-switcher-pill" id="theme-switcher-pill" aria-label="Cambiar tema visual">
        <span class="theme-switcher-icon" id="theme-pill-icon">${currentConfig.icon}</span>
        <span class="theme-switcher-label" id="theme-pill-label">Tema: ${currentConfig.name}</span>
        <span class="theme-switcher-arrow">▲</span>
      </button>
    `;

    document.body.appendChild(container);

    // Event listeners del widget
    const pill = container.querySelector('#theme-switcher-pill');
    pill.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    // Cambiar a un tema manual
    container.querySelectorAll('.theme-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const themeId = btn.getAttribute('data-theme-id');
        applyTheme(themeId, 'manual');
        container.classList.remove('open');
      });
    });

    // Restablecer a modo auto
    const resetBtn = container.querySelector('#theme-reset-auto');
    if (resetBtn) {
      resetBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const autoTheme = detectSeasonalTheme();
        applyTheme(autoTheme, 'auto');
        container.classList.remove('open');
      });
    }

    // Cerrar al hacer clic fuera
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        container.classList.remove('open');
      }
    });

    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        container.classList.remove('open');
      }
    });
  }

  /**
   * Actualiza el estado visual del selector cuando cambia el tema
   */
  function updateSwitcherUI(themeId, mode) {
    const container = document.getElementById('theme-switcher-container');
    if (!container) return;

    const config = THEMES[themeId] || THEMES['halloween'];
    
    // Actualizar pill
    const iconEl = container.querySelector('#theme-pill-icon');
    const labelEl = container.querySelector('#theme-pill-label');
    if (iconEl) iconEl.textContent = config.icon;
    if (labelEl) labelEl.textContent = `Tema: ${config.name}`;

    // Actualizar botones de opción
    container.querySelectorAll('.theme-option-btn').forEach(btn => {
      const btnTheme = btn.getAttribute('data-theme-id');
      if (btnTheme === themeId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Actualizar badge auto
    const headerEl = container.querySelector('.theme-menu-header');
    if (headerEl) {
      headerEl.innerHTML = `
        <span>Seleccionar Tema</span>
        ${mode === 'auto' ? '<span class="theme-menu-auto-badge">Auto (Fecha)</span>' : ''}
      `;
    }
  }

  // --- EJECUCIÓN INICIAL ---
  // 1. Aplicar data-theme al <html> de inmediato (evita FOUC)
  const initial = getActiveThemeConfig();
  document.documentElement.setAttribute('data-theme', initial.theme);

  // 2. Inyectar UI cuando el DOM esté listo
  function onDOMReady() {
    buildBanner(initial.theme);
    buildSwitcher(initial.theme, initial.mode);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMReady);
  } else {
    onDOMReady();
  }

  // Exponer API global ligera para depuración o scripts externos
  window.LoveSexThemes = {
    setTheme: (id) => applyTheme(id, 'manual'),
    resetAuto: () => applyTheme(detectSeasonalTheme(), 'auto'),
    getAvailableThemes: () => Object.keys(THEMES),
    getActiveTheme: () => document.documentElement.getAttribute('data-theme')
  };

})();
