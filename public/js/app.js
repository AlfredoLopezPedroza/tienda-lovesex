const WHATSAPP_NUMBER = '527772507342';

// Variables globales
let productosOriginales = [];
let productosFiltrados = [];
let packs = [];
let experiencias = [];
let catalogo = null;
let contenedorFiltros = null;
let modoVista = 'home'; // home | categorias | productos

// Elementos del DOM
let selectCategoria = null;


// Elementos del modal
let modalOverlay = null;
let modalCerrar = null;

// Mapeo explícito de categorías a imágenes
const categoryImages = {
  "DILDOS": "dildos.webp",
  "VIBRADORES": "vibradores.webp",
  "JUGUETES ANALES": "juguetes-anales.webp",
  "FUNDAS Y ANILLOS": "fundas-anillos.webp",
  "MASTURBADORES Y BOMBAS": "masturbadores-bombas.webp",
  "RETARDANTES SEXUALES": "retardantes-sexuales.webp",
  "VIGORIZANTES SEXUALES": "vigorizantes-sexuales.webp",
  "LUBRICANTES Y CREMAS": "lubricantes-cremas.webp",
  "ARNES Y FETISH": "arnes-fetish.webp"
};

// Cargar productos
fetch('/api/productos')
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }
    return res.json();
  })
  .then(resultado => {
    catalogo = resultado;
    productosOriginales = resultado.data || [];
    productosFiltrados = [...productosOriginales];

    // Mostrar barra de filtros
    contenedorFiltros = document.getElementById('filtros');
    if (contenedorFiltros) {
      contenedorFiltros.style.display = 'block';
    }

    // Obtener referencias a elementos de filtro
    selectCategoria = document.getElementById('categoria');

    // Obtener referencias al modal
    modalOverlay = document.getElementById('modal-overlay');
    modalCerrar = document.getElementById('modal-cerrar');

    // Generar opciones de categoría dinámicamente
    generarCategorias();

    // Ocultar filtros inicialmente (se muestran al ver productos)
    if (contenedorFiltros) {
      contenedorFiltros.style.display = 'none';
    }

    // Cargar packs y renderizar home
    cargarPacksYRenderizarHome();

    // Agregar event listeners para filtros
    if (selectCategoria) {
      selectCategoria.addEventListener('change', aplicarFiltros);
    }

    // Agregar event listener para cerrar modal
    if (modalCerrar) {
      modalCerrar.addEventListener('click', cerrarModal);
    }
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          cerrarModal();
        }
      });
    }
  })
  .catch(err => {
    console.error('❌ Error cargando productos:', err);

    // Mostrar mensaje de error en la UI
    const contenedor = document.createElement('div');
    contenedor.className = 'catalogo';
    contenedor.innerHTML = `
      <div class="error-carga" style="grid-column: 1 / -1;">
        <p style="font-size: 1.2rem; color: #d63384; margin-bottom: 1rem;">
          ⚠️ No se pudo cargar el catálogo
        </p>
        <p style="color: #6c757d; margin-bottom: 1.5rem;">
          Por favor, intenta recargar la página o contacta con soporte.
        </p>
        <button onclick="location.reload()" style="
          background: #d63384;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">
          🔄 Recargar página
        </button>
      </div>
    `;
    document.body.appendChild(contenedor);
  });

// Cargar packs
function cargarPacksYRenderizarHome() {
  fetch('/api/packs')
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return res.json();
    })
    .then(resultado => {
      packs = resultado.data || [];
      renderizarPacksHome();
      return fetch('/api/experiencias');
    })
    .then(res => {
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }
      return res.json();
    })
    .then(resultado => {
      experiencias = resultado.data || [];
      renderizarExperienciasHome();
      // Ensure we use the categories from the JSON to includes ones that might not have products yet
      renderizarCategorias();
    })
    .catch(err => {
      console.error('❌ Error cargando packs/experiencias:', err);
      renderizarPacksHome();
      renderizarExperienciasHome();
      renderizarCategorias();
    });
}

// Renderizar packs en home
function renderizarPacksHome() {
  modoVista = 'home';

  // Ocultar filtros
  if (contenedorFiltros) {
    contenedorFiltros.style.display = 'none';
  }

  // Limpiar packs anteriores
  const packsAnterior = document.querySelector('.packs-container');
  if (packsAnterior) {
    packsAnterior.remove();
  }

  // Obtener contenedor
  const packsContainer = document.getElementById('packs-destacados');
  if (!packsContainer) {
    console.warn('No se encontró el contenedor #packs-destacados');
    return;
  }

  // Limpiar contenido
  packsContainer.innerHTML = '';

  // Título de sección
  const titulo = document.createElement('h2');
  titulo.className = 'packs-titulo';
  titulo.textContent = '🔥 PROMOCIONES 🔥';
  packsContainer.appendChild(titulo);

  // Crear grid de packs
  const grid = document.createElement('div');
  grid.className = 'packs-container';

  packs.forEach(pack => {
    const card = document.createElement('div');
    card.className = 'pack-card';

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(pack.whatsappMensaje)}`;

    card.innerHTML = `
        <div class="pack-card-imagen">
          <img src="${pack.imagen}" alt="${pack.nombre}" loading="lazy">
        </div>
        <div class="pack-card-contenido">
          <h3 class="pack-card-nombre">${pack.nombre}</h3>
          <p class="pack-card-descripcion">${pack.descripcion}</p>
          <a href="${whatsappURL}" target="_blank" class="pack-card-cta">
            📲 Comprar por WhatsApp
          </a>
        </div>
      `;

    grid.appendChild(card);
  });

  packsContainer.appendChild(grid);
}

// Renderizar experiencias en home
function renderizarExperienciasHome() {
  modoVista = 'home';

  // Limpiar experiencias anteriores
  const experienciasAnterior = document.querySelector('.experiencias-container');
  if (experienciasAnterior) {
    experienciasAnterior.remove();
  }

  // Obtener contenedor
  const experienciasContainer = document.getElementById('experiencias-guiadas');
  if (!experienciasContainer) {
    console.warn('No se encontró el contenedor #experiencias-guiadas');
    return;
  }

  // Limpiar contenido
  experienciasContainer.innerHTML = '';

  // Título de sección
  const titulo = document.createElement('h2');
  titulo.className = 'experiencias-titulo';
  titulo.textContent = '✨ Experiencias Guiadas';
  experienciasContainer.appendChild(titulo);

  // Crear grid de experiencias
  const grid = document.createElement('div');
  grid.className = 'experiencias-container';

  experiencias.forEach(experiencia => {
    const card = document.createElement('div');
    card.className = 'experiencia-card';

    const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(experiencia.whatsappMensaje)}`;

    const esVideo = experiencia.imagen.endsWith('.mp4');
    const mediaHTML = esVideo
      ? `<video src="${experiencia.imagen}" autoplay muted loop playsinline></video>`
      : `<img src="${experiencia.imagen}" alt="${experiencia.nombre}" loading="lazy">`;

    card.innerHTML = `
        <div class="experiencia-card-imagen">
          ${mediaHTML}
        </div>
        <div class="experiencia-card-contenido">
          <h3 class="experiencia-card-nombre">${experiencia.nombre}</h3>
          <p class="experiencia-card-descripcion">${experiencia.descripcion}</p>
          <a href="${whatsappURL}" target="_blank" class="experiencia-card-cta">
            📲 Solicitar Asesoría
          </a>
        </div>
      `;

    grid.appendChild(card);
  });

  experienciasContainer.appendChild(grid);
}

// Renderizar categorías como cards
function renderizarCategorias() {
  modoVista = 'categorias';

  // Limpiar contenido anterior
  const catalogoAnterior = document.querySelector('.catalogo');
  if (catalogoAnterior) {
    catalogoAnterior.remove();
  }

  // Ocultar filtros
  if (contenedorFiltros) {
    contenedorFiltros.style.display = 'none';
  }

  // Ocultar botón volver
  const btnVolver = document.getElementById('btn-volver-categorias');
  if (btnVolver) {
    btnVolver.style.display = 'none';
  }

  // Get all categories from the products data
  const categoriasJSON = (catalogo && catalogo.categorias) ? catalogo.categorias : [];

  const productosPorCategoria = {};
  productosOriginales.forEach(producto => {
    const categoria = producto.categoria || 'Sin categoría';
    if (!productosPorCategoria[categoria]) {
      productosPorCategoria[categoria] = [];
    }
    productosPorCategoria[categoria].push(producto);
  });

  // Ensure all categories from the JSON are present even if they have no products
  const todasLasCategorias = new Set();
  categoriasJSON.forEach(c => todasLasCategorias.add(c.nombre));
  Object.keys(productosPorCategoria).forEach(c => todasLasCategorias.add(c));

  const categoriasOrdenadas = Array.from(todasLasCategorias).sort();

  // Obtener contenedor existente
  let contenedor = document.querySelector('.categorias-container');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.className = 'categorias-container';
    document.body.appendChild(contenedor);
  }

  contenedor.innerHTML = '';

  categoriasOrdenadas.forEach(categoria => {
    const productos = productosPorCategoria[categoria] || [];

    // Explicit mapping for category images
    const categoryImgFile = categoryImages[categoria.toUpperCase()] || "pendiente.webp";
    const imgPath = `/img/categorias/${categoryImgFile}`;
    const fallback = `/img/productos/pendiente.webp`;

    const card = document.createElement('div');
    card.className = 'categoria-card';
    card.onclick = () => seleccionarCategoria(categoria);

    card.innerHTML = `
        <div class="categoria-card-imagen">
          <img 
            src="${imgPath}" 
            alt="${categoria}" 
            loading="lazy" 
            onerror="this.onerror=null; this.src='${fallback}';"
          >
        </div>
        <div class="categoria-card-contenido">
          <h2 class="categoria-card-titulo">${categoria}</h2>
          <p class="categoria-card-subtitulo">${productos.length} producto${productos.length !== 1 ? 's' : ''}</p>
          <span class="categoria-card-cta">Ver productos →</span>
        </div>
      `;

    contenedor.appendChild(card);
  });
}

// Seleccionar categoría y mostrar productos
function seleccionarCategoria(categoria) {
  modoVista = 'productos';

  // Limpiar cards de categorías
  const categoriasContainer = document.querySelector('.categorias-container');
  if (categoriasContainer) {
    categoriasContainer.innerHTML = '';
  }

  // Ocultar packs en home
  const packsContainer = document.getElementById('packs-destacados');
  if (packsContainer) {
    packsContainer.style.display = 'none';
  }

  // Ocultar experiencias en home
  const experienciasContainer = document.getElementById('experiencias-guiadas');
  if (experienciasContainer) {
    experienciasContainer.style.display = 'none';
  }

  // Mostrar filtros
  if (contenedorFiltros) {
    contenedorFiltros.style.display = 'block';
  }

  // Mostrar botón volver
  const btnVolver = document.getElementById('btn-volver-categorias');
  if (btnVolver) {
    btnVolver.style.display = 'block';
  }

  // Filtrar por categoría seleccionada
  productosFiltrados = productosOriginales.filter(producto =>
    producto.categoria === categoria
  );

  // Seleccionar la categoría en el dropdown
  if (selectCategoria) {
    selectCategoria.value = categoria;
  }

  // Renderizar productos
  renderizarCatalogo(productosFiltrados);
}

// Volver a vista de categorías
function volverCategorias() {
  // Limpiar productos
  const catalogoAnterior = document.querySelector('.catalogo');
  if (catalogoAnterior) {
    catalogoAnterior.remove();
  }

  // Limpiar filtros
  if (selectCategoria) selectCategoria.value = '';

  // Mostrar packs en home
  const packsContainer = document.getElementById('packs-destacados');
  if (packsContainer) {
    packsContainer.style.display = 'block';
  }

  // Mostrar experiencias en home
  const experienciasContainer = document.getElementById('experiencias-guiadas');
  if (experienciasContainer) {
    experienciasContainer.style.display = 'block';
  }

  // Mostrar categorías
  renderizarCategorias();
}

// Navegación suave al bloque de categorías
function irACategoriasSmooth() {
  volverCategorias();
  const target = document.getElementById('categorias-container');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function generarMensajeWhatsApp(producto) {
  const nombre = producto.nombre || 'Producto sin nombre';
  const sku = producto.sku || 'N/A';

  const mensaje = `Hola, me interesa este producto:
${nombre}
SKU: ${sku}`;

  return encodeURIComponent(mensaje);
}

// Generar opciones de categoría
function generarCategorias() {
  if (!selectCategoria) return;

  const categorias = new Set();
  productosOriginales.forEach(producto => {
    if (producto.categoria) {
      categorias.add(producto.categoria);
    }
  });

  // Ordenar alfabéticamente
  const categoriasArray = Array.from(categorias).sort();

  categoriasArray.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    selectCategoria.appendChild(option);
  });
}

// Aplicar filtros
function aplicarFiltros() {
  const categoriaSeleccionada = selectCategoria?.value || '';

  productosFiltrados = productosOriginales.filter(producto => {
    // Solo filtro de categoría
    const coincideCategoria = !categoriaSeleccionada ||
      producto.categoria === categoriaSeleccionada;

    return coincideCategoria;
  });

  renderizarCatalogo(productosFiltrados);
}


// Abrir modal
function abrirModal(producto) {
  if (!modalOverlay) return;

  const mensajeEncoded = generarMensajeWhatsApp(producto);
  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeEncoded}`;

  const hasGallery = producto.galeria && producto.galeria.length > 1;
  const modalImagenContenedor = document.querySelector('.modal-imagen');

  if (hasGallery) {
    let currentImgIndex = 0;
    modalImagenContenedor.innerHTML = `
      <div class="gallery-wrapper">
        <button class="gallery-prev" id="prev-btn">❮</button>
        <img id="modal-img" src="/img/productos/${producto.galeria[0]}" alt="${producto.nombre}" />
        <button class="gallery-next" id="next-btn">❯</button>
        <div class="gallery-counter"><span id="current-idx">1</span> / ${producto.galeria.length}</div>
      </div>
    `;

    const imgElement = document.getElementById('modal-img');
    const counterElement = document.getElementById('current-idx');

    document.getElementById('prev-btn').onclick = (e) => {
      e.stopPropagation();
      currentImgIndex = (currentImgIndex - 1 + producto.galeria.length) % producto.galeria.length;
      imgElement.src = `/img/productos/${producto.galeria[currentImgIndex]}`;
      counterElement.textContent = currentImgIndex + 1;
    };

    document.getElementById('next-btn').onclick = (e) => {
      e.stopPropagation();
      currentImgIndex = (currentImgIndex + 1) % producto.galeria.length;
      imgElement.src = `/img/productos/${producto.galeria[currentImgIndex]}`;
      counterElement.textContent = currentImgIndex + 1;
    };
  } else {
    modalImagenContenedor.innerHTML = `<img id="modal-img" src="/img/productos/${producto.imagen}" alt="${producto.nombre}" />`;
  }

  document.getElementById('modal-nombre').textContent = producto.nombre;
  document.getElementById('modal-categoria').textContent = producto.categoria || 'Sin categoría';

  // Secciones de texto (3 secciones separadas)
  const infoContenedor = document.querySelector('.modal-info');
  // Remove existing dynamic sections if any (to avoid duplicates)
  const existingSections = infoContenedor.querySelectorAll('.modal-section-extra');
  existingSections.forEach(s => s.remove());

  // Commercial description
  const descElement = document.getElementById('modal-description'); // I will rename IDs in HTML or handle it here
  if (descElement) {
    descElement.textContent = producto.descripcion || '';
    descElement.style.display = producto.descripcion ? 'block' : 'none';
  }

  // Create Beneficio and Ficha sections
  if (producto.beneficio) {
    const beneficioDiv = document.createElement('div');
    beneficioDiv.className = 'modal-section-extra';
    beneficioDiv.innerHTML = `<h4 class="modal-section-title">✨ Beneficio Principal</h4><p class="modal-text-content">${producto.beneficio}</p>`;
    infoContenedor.insertBefore(beneficioDiv, document.getElementById('modal-whatsapp'));
  }

  if (producto.ficha) {
    const fichaDiv = document.createElement('div');
    fichaDiv.className = 'modal-section-extra';
    fichaDiv.innerHTML = `<h4 class="modal-section-title">📋 Ficha Técnica</h4><p class="modal-text-content">${producto.ficha}</p>`;
    infoContenedor.insertBefore(fichaDiv, document.getElementById('modal-whatsapp'));
  }

  const precioElement = document.getElementById('modal-precio');
  if (producto.promo_activa === true && producto.precio_promo) {
    precioElement.innerHTML = `
      <span style="text-decoration: line-through; color: #999; font-size: 0.9rem; margin-right: 10px;">$${producto.precio_base}</span>
      <strong style="font-size: 1.5rem;">$${producto.precio_promo}</strong>
    `;
  } else {
    precioElement.textContent = `$${producto.precio_base}`;
  }

  const botonWhatsApp = document.getElementById('modal-whatsapp');
  botonWhatsApp.href = whatsappURL;

  modalOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

// Cerrar modal
function cerrarModal() {
  if (modalOverlay) {
    modalOverlay.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// Renderizar catálogo por categorías
function renderizarCatalogo(productos) {
  // Limpiar catálogo anterior
  const catalogoAnterior = document.querySelector('.catalogo');
  if (catalogoAnterior) {
    catalogoAnterior.remove();
  }

  const contenedor = document.createElement('div');
  contenedor.className = 'catalogo';

  if (productos.length === 0) {
    contenedor.innerHTML = '<p class="sin-resultados">No se encontraron productos</p>';
    document.body.appendChild(contenedor);
    return;
  }

  // Agrupar productos por categoría manteniendo orden
  const productosPorCategoria = {};
  const categoriasOrdenadas = [];

  productos.forEach(producto => {
    const categoria = producto.categoria || 'Sin categoría';

    if (!productosPorCategoria[categoria]) {
      productosPorCategoria[categoria] = [];
      categoriasOrdenadas.push(categoria);
    }

    productosPorCategoria[categoria].push(producto);
  });

  // Renderizar cada categoría como sección
  categoriasOrdenadas.forEach(categoria => {
    const seccion = document.createElement('div');
    seccion.className = 'categoria-seccion';

    const titulo = document.createElement('h2');
    titulo.className = 'categoria-titulo';
    titulo.textContent = categoria;
    seccion.appendChild(titulo);

    const grid = document.createElement('div');
    grid.className = 'categoria-grid';

    productosPorCategoria[categoria].forEach(producto => {
      const item = document.createElement('div');
      item.className = 'producto';

      const mensajeEncoded = generarMensajeWhatsApp(producto);
      const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeEncoded}`;

      const precioHTML = producto.promo_activa === true && producto.precio_promo
        ? `
          <div class="producto-precio-promo">
            <span class="precio-tachado">$${producto.precio_base}</span>
            <span class="precio-grande">$${producto.precio_promo}</span>
          </div>
        `
        : `<p class="producto-precio">$${producto.precio_base}</p>`;

      item.innerHTML = `
        <img
          src="/img/productos/${producto.imagen}"
          alt="${producto.nombre}"
          class="producto-imagen"
        >

        <h3 class="producto-nombre">${producto.nombre}</h3>

        <p class="producto-descripcion">${producto.descripcion || ''}</p>

        ${precioHTML}

        ${producto.stock_nota ? `<p class="producto-stock">${producto.stock_nota}</p>` : ''}

        <a href="${whatsappURL}" target="_blank" class="producto-whatsapp">
          Pedir ahora
        </a>
      `;

      // Agregar event listeners para abrir modal
      const imagen = item.querySelector('.producto-imagen');
      const nombre = item.querySelector('.producto-nombre');

      if (imagen) imagen.addEventListener('click', () => abrirModal(producto));
      if (nombre) nombre.addEventListener('click', () => abrirModal(producto));

      grid.appendChild(item);
    });

    seccion.appendChild(grid);

    // Botón inferior de navegación (Scroll UX)
    const btnInferiorContainer = document.createElement('div');
    btnInferiorContainer.className = 'btn-navegacion-inferior-container';
    btnInferiorContainer.innerHTML = `
      <button onclick="irACategoriasSmooth()" class="btn-navegacion-inferior">
        ← Ver todas las categorías
      </button>
    `;
    seccion.appendChild(btnInferiorContainer);

    contenedor.appendChild(seccion);
  });

  document.body.appendChild(contenedor);
}

// ============================================
// Lógica del Popup Promocional (Versión Urgencia)
// ============================================

function inicializarPopup() {
  const popup = document.getElementById('popup-promo');
  const cerrarBtn = document.getElementById('popup-cerrar-btn');
  const timerDisplay = document.getElementById('popup-timer');

  if (!popup) return;

  // Lógica del Temporizador (1 hora = 3600 segundos)
  let timeLeft = 3600;

  const updateTimer = () => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    if (timerDisplay) {
      timerDisplay.textContent = `${String(hours).padStart(2, '0')} : ${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
    }

    if (timeLeft > 0) {
      timeLeft--;
    } else {
      clearInterval(timerInterval);
    }
  };

  const timerInterval = setInterval(updateTimer, 1000);
  updateTimer(); // Ejecución inmediata

  const mostrarPopup = () => {
    popup.style.display = 'flex';
    // No bloqueamos scroll según la nueva misión
  };

  const ocultarPopup = () => {
    popup.style.display = 'none';
    clearInterval(timerInterval);
  };

  // Mostrar siempre al cargar (con pequeño delay para impacto visual)
  setTimeout(mostrarPopup, 1000);

  // Cerrar popup (Botón X)
  if (cerrarBtn) {
    cerrarBtn.addEventListener('click', ocultarPopup);
  }

  // Cerrar al hacer click en el overlay oscuro
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      ocultarPopup();
    }
  });

  // El botón CTA de WhatsApp cerrará el popup al ser clickeado
  const ctaBtn = popup.querySelector('.popup-cta');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      setTimeout(ocultarPopup, 500);
    });
  }
}

// Iniciar popup cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarPopup);
} else {
  inicializarPopup();
}

