const API_URL = "http://localhost:8000";

// Estado global de la aplicación
let currentPage = 1;
const pageSize = 9;
let totalProperties = 0;
let previousView = 'dashboard';
let leafletMap = null;
let mapMarkers = [];
const geocodeCache = {};
let currentTicketsList = [];

// ─── UTILIDAD: TOAST NOTIFICATIONS ─────────────────────────
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? '✓' : (type === 'error' ? '✕' : 'ℹ');
    toast.innerHTML = `<span style="font-size:16px;font-weight:bold;">${icon}</span> <span>${message}</span>`;
    
    toast.onclick = () => {
        toast.classList.add('fadeout');
        setTimeout(() => toast.remove(), 300);
    };

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('fadeout');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ─── GESTOR DE VISTAS Y NAVEGACIÓN ──────────────────────────
const views = {
    login: document.getElementById('login-view'),
    register: document.getElementById('register-view'),
    dashboard: document.getElementById('dashboard-view'),
    marketplace: document.getElementById('marketplace-view'),
    mapa: document.getElementById('mapa-view'),
    detalle: document.getElementById('detalle-propiedad-view'),
    postulaciones: document.getElementById('postulaciones-view'),
    contratos: document.getElementById('contratos-view'),
    tickets: document.getElementById('tickets-view'),
    branding: document.getElementById('branding-view'),
    nuevaPropiedad: document.getElementById('nueva-propiedad-view')
};

function ocultarTodasLasVistas() {
    Object.values(views).forEach(v => {
        if (v) v.classList.add('hidden');
    });
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
}

function navegarA(vistaNombre, params = {}) {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('userRole');

    if (!token && vistaNombre !== 'login' && vistaNombre !== 'register') {
        vistaNombre = 'login';
    }

    const nav = document.getElementById('app-nav');
    const mobileNav = document.getElementById('app-mobile-nav');
    const btnBranding = document.getElementById('nav-btn-branding');
    const mobileBtnBranding = document.getElementById('mobile-nav-btn-branding');

    if (vistaNombre === 'login' || vistaNombre === 'register') {
        if (nav) nav.classList.add('hidden');
        if (mobileNav) mobileNav.classList.add('hidden');
    } else {
        if (nav) nav.classList.remove('hidden');
        if (mobileNav) mobileNav.classList.remove('hidden');
        
        const emailSpan = document.getElementById('user-email-display');
        const roleSpan = document.getElementById('user-role-display');
        if (emailSpan) emailSpan.textContent = localStorage.getItem('userEmail') || '';
        if (roleSpan) roleSpan.textContent = rol || '';
        
        // Pestaña de Branding exclusiva para Inmobiliarias
        if (rol === 'inmobiliaria') {
            if (btnBranding) btnBranding.classList.remove('hidden');
            if (mobileBtnBranding) mobileBtnBranding.classList.remove('hidden');
        } else {
            if (btnBranding) btnBranding.classList.add('hidden');
            if (mobileBtnBranding) mobileBtnBranding.classList.add('hidden');
        }

        const activeNavBtn = document.getElementById(`nav-btn-${vistaNombre}`);
        if (activeNavBtn) activeNavBtn.classList.add('active');
    }

    ocultarTodasLasVistas();

    switch (vistaNombre) {
        case 'login':
            if (views.login) views.login.classList.remove('hidden');
            break;
        case 'register':
            if (views.register) views.register.classList.remove('hidden');
            break;
        case 'dashboard':
            if (views.dashboard) views.dashboard.classList.remove('hidden');
            previousView = 'dashboard';
            cargarDashboard();
            break;
        case 'marketplace':
            if (views.marketplace) views.marketplace.classList.remove('hidden');
            previousView = 'marketplace';
            cargarMarketplace();
            break;
        case 'mapa':
            if (views.mapa) views.mapa.classList.remove('hidden');
            previousView = 'mapa';
            cargarMapa();
            break;
        case 'detalle':
            if (views.detalle) views.detalle.classList.remove('hidden');
            if (params.id) cargarDetallePropiedad(params.id);
            break;
        case 'postulaciones':
            if (views.postulaciones) views.postulaciones.classList.remove('hidden');
            previousView = 'postulaciones';
            cargarPostulaciones();
            break;
        case 'contratos':
            if (views.contratos) views.contratos.classList.remove('hidden');
            previousView = 'contratos';
            cargarContratos();
            break;
        case 'tickets':
            if (views.tickets) views.tickets.classList.remove('hidden');
            previousView = 'tickets';
            cargarTickets();
            break;
        case 'branding':
            if (views.branding) views.branding.classList.remove('hidden');
            previousView = 'branding';
            cargarBrandingView();
            break;
        case 'nuevaPropiedad':
            if (views.nuevaPropiedad) views.nuevaPropiedad.classList.remove('hidden');
            prepararNuevaPropiedad();
            break;
        default:
            if (views.dashboard) views.dashboard.classList.remove('hidden');
            cargarDashboard();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function volverAtrasDetalle() {
    navegarA(previousView || 'marketplace');
}

// ─── PERSONALIZACIÓN WHITE-LABEL ────────────────────────────
function aplicarBranding(userData) {
    if (!userData) return;
    
    // 1. Color Primario Dinámico
    const colorPrimario = userData.color_primario || '#00a650';
    document.documentElement.style.setProperty('--brand', colorPrimario);
    
    // Generar variante más oscura para hover
    try {
        const num = parseInt(colorPrimario.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - 25);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - 25);
        const b = Math.max(0, (num & 0x0000FF) - 25);
        const darkHex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        document.documentElement.style.setProperty('--brand-dark', darkHex);
    } catch(e) {
        document.documentElement.style.setProperty('--brand-dark', '#008c44');
    }

    // 2. Nombre de la Empresa / Marca
    const companyName = userData.nombre_empresa || 'Software Alquileres';
    const navCompany = document.getElementById('nav-company-name');
    if (navCompany) navCompany.textContent = companyName;

    // 3. Logotipo en Navbar
    const navLogoMark = document.getElementById('nav-logo-mark');
    if (navLogoMark) {
        if (userData.logo_url) {
            navLogoMark.innerHTML = `<img src="${API_URL}${userData.logo_url}" class="h-8 w-8 object-contain rounded-md" alt="Logo">`;
            navLogoMark.style.background = 'transparent';
        } else {
            const initials = companyName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'SA';
            navLogoMark.textContent = initials;
            navLogoMark.style.background = colorPrimario;
        }
    }
}

async function sincronizarPerfilUsuario() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch(`${API_URL}/usuarios/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const user = await res.json();
            localStorage.setItem('userEmpresa', user.nombre_empresa || '');
            localStorage.setItem('userColor', user.color_primario || '#00a650');
            localStorage.setItem('userLogo', user.logo_url || '');
            aplicarBranding(user);
        }
    } catch (e) {
        console.error("Error sincronizando perfil de marca", e);
    }
}

function toggleNombreEmpresa(tipo) {
    const campo = document.getElementById('campo-empresa');
    if (!campo) return;
    if (tipo === 'inmobiliaria') {
        campo.classList.remove('hidden');
    } else {
        campo.classList.add('hidden');
    }
}

// ─── AUTENTICACIÓN (LOGIN Y REGISTRO) ────────────────────────
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const btnGoRegister = document.getElementById('btn-go-register');
const btnGoLogin = document.getElementById('btn-go-login');

if (btnGoRegister) {
    btnGoRegister.onclick = (e) => { e.preventDefault(); navegarA('register'); };
}
if (btnGoLogin) {
    btnGoLogin.onclick = (e) => { e.preventDefault(); navegarA('login'); };
}

if (registerForm) {
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        const tipoUsuario = document.getElementById('reg-tipo').value;
        const nombreEmpresa = document.getElementById('reg-empresa')?.value.trim() || null;

        const nuevoUsuario = {
            nombre: document.getElementById('reg-nombre').value.trim(),
            apellido: document.getElementById('reg-apellido').value.trim(),
            dni_cuit: document.getElementById('reg-dni').value.trim(),
            telefono: document.getElementById('reg-telefono').value.trim(),
            tipo_usuario: tipoUsuario,
            nombre_empresa: tipoUsuario === 'inmobiliaria' ? nombreEmpresa : null,
            color_primario: "#00a650",
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value
        };

        try {
            const res = await fetch(`${API_URL}/usuarios/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoUsuario)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Error al crear la cuenta");

            registerForm.reset();
            showToast("¡Cuenta creada exitosamente! Ahora iniciá sesión.", "success");
            navegarA('login');
        } catch (err) {
            showToast(err.message, "error");
        }
    };
}

if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!res.ok) throw new Error("Credenciales inválidas o usuario no registrado");

            const data = await res.json();
            const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', tokenPayload.rol);
            localStorage.setItem('userId', tokenPayload.id_usuario);

            loginForm.reset();
            await sincronizarPerfilUsuario();
            showToast(`¡Bienvenido de nuevo!`, "success");
            navegarA('dashboard');
        } catch (err) {
            showToast(err.message, "error");
        }
    };
}

function cerrarSesion() {
    localStorage.clear();
    document.documentElement.style.setProperty('--brand', '#00a650');
    document.documentElement.style.setProperty('--brand-dark', '#008c44');
    showToast("Sesión cerrada", "info");
    navegarA('login');
}

// ─── 1. DASHBOARD & STAT CARDS (MÉTRICAS) ────────────────────
async function cargarDashboard() {
    const rol = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const btnNuevaProp = document.getElementById('btn-nueva-propiedad');
    const statCards = document.getElementById('stat-cards-container');
    const content = document.getElementById('dashboard-content');
    const sectionTitle = document.getElementById('dashboard-section-title');

    if (btnNuevaProp) {
        if (rol === 'propietario' || rol === 'inmobiliaria') {
            btnNuevaProp.classList.remove('hidden');
            btnNuevaProp.onclick = () => navegarA('nuevaPropiedad');
        } else {
            btnNuevaProp.classList.add('hidden');
        }
    }

    try {
        const res = await fetch(`${API_URL}/dashboard/metricas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const m = await res.json();
            if (rol === 'inquilino') {
                statCards.innerHTML = `
                    <div class="stat-card">
                        <span class="stat-icon">📋</span>
                        <span class="stat-value">${m.postulaciones_pendientes || 0}</span>
                        <span class="stat-label">Postulaciones en espera</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">📄</span>
                        <span class="stat-value">${m.contratos_activos || 0}</span>
                        <span class="stat-label">Contratos activos</span>
                    </div>
                `;
            } else {
                statCards.innerHTML = `
                    <div class="stat-card">
                        <span class="stat-icon">🏠</span>
                        <span class="stat-value">${m.propiedades_activas || 0}</span>
                        <span class="stat-label">Inmuebles Activos</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">📋</span>
                        <span class="stat-value">${m.postulaciones_pendientes || 0}</span>
                        <span class="stat-label">Postulaciones por revisar</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">📄</span>
                        <span class="stat-value">${m.contratos_activos || 0}</span>
                        <span class="stat-label">Contratos vigentes</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-icon">💰</span>
                        <span class="stat-value">$${(m.ingresos_mes || 0).toLocaleString('es-AR')}</span>
                        <span class="stat-label">Ingresos del mes</span>
                    </div>
                `;
            }
        }
    } catch (e) {
        console.error("Error al cargar métricas", e);
    }

    if (rol === 'inquilino') {
        if (sectionTitle) sectionTitle.textContent = "Acciones Rápidas para Inquilinos";
        content.innerHTML = `
            <div class="property-card p-6 flex flex-col items-center text-center justify-center cursor-pointer" onclick="navegarA('marketplace')">
                <span class="text-4xl mb-2">🏘</span>
                <h3 class="font-bold text-navy text-base">Explorar Marketplace</h3>
                <p class="text-xs text-gray-500 mt-1">Buscá y postulate a departamentos o casas disponibles</p>
                <span class="mt-4 text-brand text-xs font-semibold">Ir al Marketplace →</span>
            </div>
            <div class="property-card p-6 flex flex-col items-center text-center justify-center cursor-pointer" onclick="navegarA('tickets')">
                <span class="text-4xl mb-2">🛠</span>
                <h3 class="font-bold text-navy text-base">Mantenimiento & Reclamos</h3>
                <p class="text-xs text-gray-500 mt-1">Reportá incidencias o fallas en tu alquiler</p>
                <span class="mt-4 text-brand text-xs font-semibold">Abrir Ticket →</span>
            </div>
            <div class="property-card p-6 flex flex-col items-center text-center justify-center cursor-pointer" onclick="navegarA('contratos')">
                <span class="text-4xl mb-2">📄</span>
                <h3 class="font-bold text-navy text-base">Mis Contratos</h3>
                <p class="text-xs text-gray-500 mt-1">Gestioná tus contratos de alquiler vigentes</p>
                <span class="mt-4 text-brand text-xs font-semibold">Ver contratos →</span>
            </div>
        `;
    } else {
        if (sectionTitle) sectionTitle.textContent = "Mis Propiedades Publicadas";
        content.innerHTML = `<div class="col-span-full text-center py-8 text-gray-400">Cargando propiedades...</div>`;
        
        try {
            const res = await fetch(`${API_URL}/propiedades/`);
            const propiedades = await res.json();
            const userId = parseInt(localStorage.getItem('userId') || '0');
            const misProps = propiedades.filter(p => p.id_propietario_gestor === userId);

            if (misProps.length === 0) {
                content.innerHTML = `
                    <div class="col-span-full bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center">
                        <span class="text-4xl mb-2 inline-block">🏠</span>
                        <h3 class="font-bold text-navy text-base">Aún no has publicado inmuebles</h3>
                        <p class="text-xs text-gray-400 mt-1 mb-4">Comenzá a recibir postulaciones publicando tu primera propiedad</p>
                        <button onclick="navegarA('nuevaPropiedad')" class="btn-primary text-xs">+ Publicar Inmueble</button>
                    </div>
                `;
            } else {
                content.innerHTML = misProps.map(p => renderPropertyCard(p, true)).join('');
            }
        } catch (err) {
            content.innerHTML = `<div class="col-span-full text-red-500 text-sm text-center">Error: ${err.message}</div>`;
        }
    }
}

// ─── 2. MARKETPLACE CON FILTROS & PAGINACIÓN ────────────────
async function cargarMarketplace() {
    const grid = document.getElementById('marketplace-content');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrev = document.getElementById('btn-prev-page');
    const btnNext = document.getElementById('btn-next-page');

    const ciudad = document.getElementById('filter-ciudad')?.value.trim() || '';
    const tipo = document.getElementById('filter-tipo')?.value || '';
    const precioMax = document.getElementById('filter-precio')?.value || '';
    const mascotas = document.getElementById('filter-mascotas')?.checked;

    grid.innerHTML = `
        <div class="col-span-full flex flex-col items-center py-16 text-gray-400">
            <div class="animate-pulse text-4xl mb-2">⏳</div>
            <p class="text-sm">Buscando propiedades disponibles...</p>
        </div>
    `;

    const skip = (currentPage - 1) * pageSize;
    const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString()
    });

    if (ciudad) params.append('ciudad', ciudad);
    if (tipo) params.append('tipo_inmueble', tipo);
    if (precioMax) params.append('precio_max', precioMax);
    if (mascotas) params.append('acepta_mascotas', 'true');

    try {
        const res = await fetch(`${API_URL}/propiedades/?${params.toString()}`);
        if (!res.ok) throw new Error("Error al consultar el servidor");

        const totalHeader = res.headers.get('X-Total-Count');
        totalProperties = totalHeader ? parseInt(totalHeader) : 0;
        const propiedades = await res.json();

        if (propiedades.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full empty-state bg-white rounded-xl border border-gray-200 p-12">
                    <div class="empty-icon">🔍</div>
                    <h3>No se encontraron propiedades</h3>
                    <p>Intentá modificando o limpiando los filtros de búsqueda</p>
                </div>
            `;
        } else {
            grid.innerHTML = propiedades.map(p => renderPropertyCard(p, false)).join('');
        }

        const maxPages = Math.max(1, Math.ceil(totalProperties / pageSize));
        if (paginationInfo) paginationInfo.textContent = `Página ${currentPage} de ${maxPages} (${totalProperties} total)`;
        if (btnPrev) btnPrev.disabled = currentPage <= 1;
        if (btnNext) btnNext.disabled = currentPage >= maxPages;

    } catch (err) {
        grid.innerHTML = `
            <div class="col-span-full empty-state bg-white rounded-xl border border-gray-200 p-8 text-red-500">
                <div class="empty-icon">⚠️</div>
                <h3>Error de conexión</h3>
                <p>${err.message}</p>
            </div>
        `;
    }
}

document.getElementById('btn-aplicar-filtros')?.addEventListener('click', () => {
    currentPage = 1;
    cargarMarketplace();
});

document.getElementById('btn-limpiar-filtros')?.addEventListener('click', () => {
    if (document.getElementById('filter-ciudad')) document.getElementById('filter-ciudad').value = '';
    if (document.getElementById('filter-tipo')) document.getElementById('filter-tipo').value = '';
    if (document.getElementById('filter-precio')) document.getElementById('filter-precio').value = '';
    if (document.getElementById('filter-mascotas')) document.getElementById('filter-mascotas').checked = false;
    currentPage = 1;
    cargarMarketplace();
});

document.getElementById('btn-prev-page')?.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        cargarMarketplace();
    }
});

document.getElementById('btn-next-page')?.addEventListener('click', () => {
    const maxPages = Math.ceil(totalProperties / pageSize);
    if (currentPage < maxPages) {
        currentPage++;
        cargarMarketplace();
    }
});

function renderPropertyCard(p, isOwnerView = false) {
    const imgHtml = p.imagen_url 
        ? `<img src="${API_URL}${p.imagen_url}" alt="${p.calle_direccion}" class="property-img">`
        : `<div class="property-img-placeholder">
             <span>${iconoTipo(p.tipo_inmueble)}</span>
             <span class="badge-tipo absolute top-3 left-3">${formatTipo(p.tipo_inmueble)}</span>
             <span class="badge-disponible absolute top-3 right-3">● Activa</span>
           </div>`;

    return `
        <div class="property-card" onclick="navegarA('detalle', { id: ${p.id_propiedad} })">
            ${imgHtml}
            <div class="property-card-body">
                <div class="property-card-badges">
                    <span class="badge-tipo">${formatTipo(p.tipo_inmueble)}</span>
                    <span class="text-xs text-gray-400">📍 ${p.ciudad}</span>
                </div>
                <h3 class="property-address">${p.calle_direccion}</h3>
                <div class="property-price-row">
                    <span class="property-price">$${p.precio_alquiler_base.toLocaleString('es-AR')}</span>
                    <span class="property-price-unit">/mes</span>
                </div>
                <div class="property-tags">
                    <span class="property-tag">${p.acepta_mascotas ? '🐾 Mascotas OK' : '🚫 Sin mascotas'}</span>
                    ${p.ingreso_minimo_requerido ? `<span class="property-tag">💰 Ing. mín $${p.ingreso_minimo_requerido.toLocaleString('es-AR')}</span>` : ''}
                </div>
                ${isOwnerView ? `
                    <div class="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-brand font-semibold">
                        <span>Ver detalles / Subir foto →</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

// ─── 3. VISTA DETALLE DE PROPIEDAD ──────────────────────────
async function cargarDetallePropiedad(propiedadId) {
    const container = document.getElementById('detalle-content');
    container.innerHTML = `<div class="text-center py-12 text-gray-400">Cargando detalle del inmueble...</div>`;

    const rol = localStorage.getItem('userRole');
    const userId = parseInt(localStorage.getItem('userId') || '0');

    try {
        const res = await fetch(`${API_URL}/propiedades/${propiedadId}`);
        if (!res.ok) throw new Error("Propiedad no encontrada");
        const prop = await res.json();

        const esDuenio = prop.id_propietario_gestor === userId;

        const imgHtml = prop.imagen_url
            ? `<img src="${API_URL}${prop.imagen_url}" alt="${prop.calle_direccion}" class="detalle-img">`
            : `<div class="detalle-img-placeholder">
                 <span>${iconoTipo(prop.tipo_inmueble)}</span>
               </div>`;

        container.innerHTML = `
            ${imgHtml}

            ${esDuenio ? `
                <div class="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                    <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">📸 Cambiar / Subir Fotografía</h4>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <input type="file" id="detalle-upload-input" accept="image/*" class="text-xs file:py-2 file:px-3 file:border-0 file:rounded-md file:bg-brand-light file:text-brand-dark file:font-semibold">
                        <button onclick="subirFotoPropiedad(${prop.id_propiedad})" class="btn-primary text-xs px-3 py-2">Subir Imagen</button>
                    </div>
                </div>
            ` : ''}

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-200">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="badge-tipo">${formatTipo(prop.tipo_inmueble)}</span>
                        <span class="badge-disponible">● ${prop.estado_publicacion}</span>
                    </div>
                    <h1 class="text-2xl font-bold text-navy">${prop.calle_direccion}</h1>
                    <p class="text-sm text-gray-500">📍 ${prop.ciudad}</p>
                </div>
                <div class="sm:text-right">
                    <span class="text-3xl font-extrabold text-brand">$${prop.precio_alquiler_base.toLocaleString('es-AR')}</span>
                    <span class="text-xs text-gray-400 block">/ mes</span>
                </div>
            </div>

            <div class="detalle-info-grid">
                <div class="info-item">
                    <div class="info-label">Tipo de inmueble</div>
                    <div class="info-value">${formatTipo(prop.tipo_inmueble)}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Política de mascotas</div>
                    <div class="info-value">${prop.acepta_mascotas ? '🐾 Acepta mascotas' : '🚫 No permite'}</div>
                </div>
                <div class="info-item">
                    <div class="info-label">Ingreso mínimo</div>
                    <div class="info-value">${prop.ingreso_minimo_requerido ? `$${prop.ingreso_minimo_requerido.toLocaleString('es-AR')}` : 'Sin requisito'}</div>
                </div>
            </div>

            ${rol === 'inquilino' ? `
                <div class="mt-8 p-6 rounded-xl bg-blue-50 border border-blue-100">
                    <h3 class="text-base font-bold text-navy mb-1">¿Te interesa este alquiler?</h3>
                    <p class="text-xs text-gray-500 mb-4">Envía tu postulación directa al propietario o inmobiliaria para coordinar una visita.</p>
                    <form id="form-postulacion" onsubmit="enviarPostulacion(event, ${prop.id_propiedad})" class="space-y-3">
                        <div>
                            <label class="block text-xs font-semibold text-gray-700 mb-1">Mensaje de presentación (opcional)</label>
                            <textarea id="postulacion-mensaje" rows="2" placeholder="Hola, me interesa el departamento. Tengo recibo de sueldo y garantía..." class="input-base text-sm"></textarea>
                        </div>
                        <button type="submit" class="btn-primary text-sm w-full sm:w-auto">
                            ✉ Postularme a esta propiedad
                        </button>
                    </form>
                </div>
            ` : ''}
        `;

    } catch (err) {
        container.innerHTML = `<div class="text-red-500 text-center py-8">Error: ${err.message}</div>`;
    }
}

async function subirFotoPropiedad(propiedadId) {
    const fileInput = document.getElementById('detalle-upload-input');
    if (!fileInput || !fileInput.files[0]) {
        showToast("Por favor seleccioná un archivo de imagen", "error");
        return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/propiedades/${propiedadId}/imagen`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!res.ok) {
            const d = await res.json();
            throw new Error(d.detail || "Error al subir la imagen");
        }

        showToast("¡Fotografía actualizada con éxito!", "success");
        cargarDetallePropiedad(propiedadId);
    } catch (err) {
        showToast(err.message, "error");
    }
}

async function enviarPostulacion(e, propiedadId) {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const mensaje = document.getElementById('postulacion-mensaje')?.value.trim() || '';

    try {
        const res = await fetch(`${API_URL}/postulaciones/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                id_propiedad: propiedadId,
                mensaje_inquilino: mensaje
            })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error al enviar la postulación");

        showToast("¡Postulación enviada con éxito!", "success");
        setTimeout(() => navegarA('postulaciones'), 1000);
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ─── 4. MAPA INTERACTIVO (LEAFLET + NOMINATIM) ──────────────
async function cargarMapa() {
    const mapDiv = document.getElementById('mapa-leaflet');
    if (!mapDiv) return;

    if (!leafletMap) {
        leafletMap = L.map('mapa-leaflet').setView([-34.6037, -58.3816], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(leafletMap);
    } else {
        setTimeout(() => leafletMap.invalidateSize(), 200);
    }

    mapMarkers.forEach(m => leafletMap.removeLayer(m));
    mapMarkers = [];

    try {
        const res = await fetch(`${API_URL}/propiedades/?limit=100`);
        const propiedades = await res.json();

        if (propiedades.length === 0) return;

        const bounds = [];

        for (const prop of propiedades) {
            let lat = prop.latitud;
            let lon = prop.longitud;

            if (!lat || !lon) {
                const queryKey = `${prop.ciudad}, Argentina`;
                if (geocodeCache[queryKey]) {
                    lat = geocodeCache[queryKey].lat + (Math.random() - 0.5) * 0.02;
                    lon = geocodeCache[queryKey].lon + (Math.random() - 0.5) * 0.02;
                } else {
                    try {
                        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryKey)}&limit=1`);
                        const geoData = await geoRes.json();
                        if (geoData && geoData.length > 0) {
                            lat = parseFloat(geoData[0].lat) + (Math.random() - 0.5) * 0.02;
                            lon = parseFloat(geoData[0].lon) + (Math.random() - 0.5) * 0.02;
                            geocodeCache[queryKey] = { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon) };
                        }
                    } catch (e) {
                        lat = -34.6037 + (Math.random() - 0.5) * 0.05;
                        lon = -58.3816 + (Math.random() - 0.5) * 0.05;
                    }
                }
            }

            if (lat && lon) {
                bounds.push([lat, lon]);
                const marker = L.marker([lat, lon]).addTo(leafletMap);
                
                const popupContent = `
                    <div class="popup-content">
                        <span class="popup-badge">${formatTipo(prop.tipo_inmueble)}</span>
                        <div class="popup-price">$${prop.precio_alquiler_base.toLocaleString('es-AR')}/mes</div>
                        <div class="popup-address">${prop.calle_direccion}</div>
                        <div class="popup-city">📍 ${prop.ciudad}</div>
                        <button onclick="navegarA('detalle', { id: ${prop.id_propiedad} })" class="btn-primary text-xs w-full py-1 mt-2">Ver Inmueble</button>
                    </div>
                `;
                marker.bindPopup(popupContent);
                mapMarkers.push(marker);
            }
        }

        if (bounds.length > 0) {
            leafletMap.fitBounds(bounds, { padding: [40, 40] });
        }
    } catch (err) {
        console.error("Error al cargar propiedades en mapa", err);
    }
}

// ─── 5. POSTULACIONES (INQUILINO & PROPIETARIO) ──────────────
async function cargarPostulaciones() {
    const rol = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const container = document.getElementById('postulaciones-table-container');
    const subtitle = document.getElementById('postulaciones-subtitle');

    container.innerHTML = `<div class="text-center py-8 text-gray-400">Cargando postulaciones...</div>`;

    if (rol === 'inquilino') {
        if (subtitle) subtitle.textContent = "Seguimiento de las solicitudes que enviaste a propietarios e inmobiliarias";
        try {
            const res = await fetch(`${API_URL}/postulaciones/mis-postulaciones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const posts = await res.json();

            if (posts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state p-8">
                        <div class="empty-icon">📋</div>
                        <h3>No tienes postulaciones realizadas</h3>
                        <p class="mb-3">Explorá el marketplace para encontrar inmuebles y postularte</p>
                        <button onclick="navegarA('marketplace')" class="btn-primary text-xs">Ir al Marketplace</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Propiedad #</th>
                            <th>Mensaje enviado</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map(p => `
                            <tr>
                                <td class="font-bold text-gray-500">#${p.id_postulacion}</td>
                                <td>Propiedad #${p.id_propiedad}</td>
                                <td class="text-xs text-gray-600">${p.mensaje_inquilino || '<i>Sin mensaje</i>'}</td>
                                <td class="text-xs text-gray-500">${new Date(p.fecha_postulacion).toLocaleDateString('es-AR')}</td>
                                <td><span class="estado-badge estado-${p.estado}">${p.estado}</span></td>
                                <td>
                                    <button onclick="navegarA('detalle', { id: ${p.id_propiedad} })" class="text-xs text-brand font-semibold hover:underline">Ver Inmueble</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            container.innerHTML = `<div class="text-red-500 text-center py-4">Error: ${err.message}</div>`;
        }
    } else {
        if (subtitle) subtitle.textContent = "Solicitudes recibidas de inquilinos interesados en tus inmuebles";
        try {
            const res = await fetch(`${API_URL}/postulaciones/recibidas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const posts = await res.json();

            if (posts.length === 0) {
                container.innerHTML = `
                    <div class="empty-state p-8">
                        <div class="empty-icon">📭</div>
                        <h3>No has recibido postulaciones aún</h3>
                        <p>Cuando los inquilinos se postulen a tus inmuebles aparecerán aquí</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Inquilino (ID)</th>
                            <th>Propiedad (ID)</th>
                            <th>Mensaje</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${posts.map(p => `
                            <tr>
                                <td class="font-bold text-gray-500">#${p.id_postulacion}</td>
                                <td>Inquilino #${p.id_inquilino}</td>
                                <td>Propiedad #${p.id_propiedad}</td>
                                <td class="text-xs text-gray-600">${p.mensaje_inquilino || '<i>Sin mensaje</i>'}</td>
                                <td class="text-xs text-gray-500">${new Date(p.fecha_postulacion).toLocaleDateString('es-AR')}</td>
                                <td><span class="estado-badge estado-${p.estado}">${p.estado}</span></td>
                                <td>
                                    ${p.estado === 'pendiente' ? `
                                        <div class="flex gap-2">
                                            <button onclick="cambiarEstadoPostulacion(${p.id_postulacion}, 'aprobada', ${p.id_propiedad}, ${p.id_inquilino})" class="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded font-semibold hover:bg-green-100">Aprobar</button>
                                            <button onclick="cambiarEstadoPostulacion(${p.id_postulacion}, 'rechazada')" class="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded font-semibold hover:bg-red-100">Rechazar</button>
                                        </div>
                                    ` : (p.estado === 'aprobada' ? `
                                        <button onclick="abrirModalContrato(${p.id_propiedad}, ${p.id_inquilino}, ${p.id_postulacion})" class="btn-primary text-xs py-1 px-2">Generar Contrato</button>
                                    ` : '<span class="text-xs text-gray-400">-</span>')}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            container.innerHTML = `<div class="text-red-500 text-center py-4">Error: ${err.message}</div>`;
        }
    }
}

async function cambiarEstadoPostulacion(postulacionId, nuevoEstado, idPropiedad = null, idInquilino = null) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/postulaciones/${postulacionId}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!res.ok) throw new Error("Error al actualizar la postulación");

        showToast(`Postulación #${postulacionId} marcada como ${nuevoEstado}`, "success");
        cargarPostulaciones();

        if (nuevoEstado === 'aprobada' && idPropiedad && idInquilino) {
            abrirModalContrato(idPropiedad, idInquilino, postulacionId);
        }
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ─── 6. CONTRATOS & MODAL DE GENERACIÓN ─────────────────────
function abrirModalContrato(idPropiedad, idInquilino, idPostulacion) {
    document.getElementById('contrato-id-propiedad').value = idPropiedad;
    document.getElementById('contrato-id-inquilino').value = idInquilino;
    document.getElementById('contrato-id-postulacion').value = idPostulacion;
    
    const hoy = new Date().toISOString().split('T')[0];
    const unAnioDespues = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];
    
    document.getElementById('contrato-fecha-inicio').value = hoy;
    document.getElementById('contrato-fecha-fin').value = unAnioDespues;
    
    document.getElementById('modal-crear-contrato').classList.remove('hidden');
}

function cerrarModalContrato() {
    document.getElementById('modal-crear-contrato').classList.add('hidden');
}

document.getElementById('form-crear-contrato')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const contratoData = {
        id_propiedad: parseInt(document.getElementById('contrato-id-propiedad').value),
        id_inquilino: parseInt(document.getElementById('contrato-id-inquilino').value),
        monto_mensual: parseFloat(document.getElementById('contrato-monto').value),
        fecha_inicio: document.getElementById('contrato-fecha-inicio').value,
        fecha_fin: document.getElementById('contrato-fecha-fin').value
    };

    try {
        const res = await fetch(`${API_URL}/contratos/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(contratoData)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error al crear el contrato");

        cerrarModalContrato();
        showToast("¡Contrato generado con éxito!", "success");
        navegarA('contratos');
    } catch (err) {
        showToast(err.message, "error");
    }
});

async function cargarContratos() {
    const rol = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const container = document.getElementById('contratos-table-container');
    const subtitle = document.getElementById('contratos-subtitle');

    container.innerHTML = `<div class="text-center py-8 text-gray-400">Cargando contratos...</div>`;

    const endpoint = rol === 'inquilino' ? '/contratos/mis-contratos' : '/contratos/mis-contratos-propietario';
    if (subtitle) {
        subtitle.textContent = rol === 'inquilino' ? 'Tus contratos de alquiler vigentes y finalizados' : 'Contratos registrados sobre tus inmuebles';
    }

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contratos = await res.json();

        if (contratos.length === 0) {
            container.innerHTML = `
                <div class="empty-state p-8">
                    <div class="empty-icon">📄</div>
                    <h3>No tienes contratos registrados</h3>
                    <p>Los contratos activos o finalizados se listarán aquí</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Propiedad</th>
                        ${rol !== 'inquilino' ? '<th>Inquilino</th>' : ''}
                        <th>Periodo</th>
                        <th>Monto Mensual</th>
                        <th>Estado</th>
                        ${rol !== 'inquilino' ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody>
                    ${contratos.map(c => `
                        <tr>
                            <td class="font-bold text-gray-500">#${c.id_contrato}</td>
                            <td>Propiedad #${c.id_propiedad}</td>
                            ${rol !== 'inquilino' ? `<td>Inquilino #${c.id_inquilino}</td>` : ''}
                            <td class="text-xs text-gray-600">${c.fecha_inicio} al ${c.fecha_fin}</td>
                            <td class="font-bold text-navy">$${c.monto_mensual.toLocaleString('es-AR')}</td>
                            <td><span class="estado-badge estado-${c.estado}">${c.estado}</span></td>
                            ${rol !== 'inquilino' ? `
                                <td>
                                    ${c.estado === 'activo' ? `
                                        <button onclick="cambiarEstadoContrato(${c.id_contrato}, 'finalizado')" class="text-xs text-blue-600 font-semibold hover:underline mr-2">Finalizar</button>
                                        <button onclick="cambiarEstadoContrato(${c.id_contrato}, 'rescindido')" class="text-xs text-red-600 font-semibold hover:underline">Rescindir</button>
                                    ` : '<span class="text-xs text-gray-400">-</span>'}
                                </td>
                            ` : ''}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        container.innerHTML = `<div class="text-red-500 text-center py-4">Error: ${err.message}</div>`;
    }
}

async function cambiarEstadoContrato(contratoId, nuevoEstado) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/contratos/${contratoId}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (!res.ok) throw new Error("Error al modificar contrato");

        showToast(`Contrato #${contratoId} marcado como ${nuevoEstado}`, "success");
        cargarContratos();
    } catch (err) {
        showToast(err.message, "error");
    }
}

// ─── 7. TICKETS DE MANTENIMIENTO (HELPDESK) ──────────────────
async function cargarTickets() {
    const rol = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');
    const container = document.getElementById('tickets-table-container');
    const subtitle = document.getElementById('tickets-subtitle');
    const btnNuevoTicket = document.getElementById('btn-nuevo-ticket');

    container.innerHTML = `<div class="text-center py-8 text-gray-400">Cargando tickets de mantenimiento...</div>`;

    if (rol === 'inquilino') {
        if (btnNuevoTicket) btnNuevoTicket.classList.remove('hidden');
        if (subtitle) subtitle.textContent = "Reportá fallas, roturas o solicitudes de reparación al propietario o inmobiliaria";
        
        try {
            const res = await fetch(`${API_URL}/tickets/mis-tickets`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await res.json();
            currentTicketsList = tickets;

            if (tickets.length === 0) {
                container.innerHTML = `
                    <div class="empty-state p-8">
                        <div class="empty-icon">🛠</div>
                        <h3>No tienes tickets de mantenimiento abiertos</h3>
                        <p class="mb-3">Si tenés algún inconveniente en tu vivienda alquilada, podés reportarlo acá</p>
                        <button onclick="abrirModalNuevoTicket()" class="btn-primary text-xs">+ Abrir Nuevo Ticket</button>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Propiedad</th>
                            <th>Título / Asunto</th>
                            <th>Prioridad</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Respuesta / Técnico</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tickets.map(t => `
                            <tr>
                                <td class="font-bold text-gray-500">#${t.id_ticket}</td>
                                <td>Propiedad #${t.id_propiedad}</td>
                                <td>
                                    <div class="font-semibold text-navy text-sm">${t.titulo}</div>
                                    <div class="text-xs text-gray-500 max-w-xs truncate">${t.descripcion}</div>
                                </td>
                                <td><span class="prioridad-badge prioridad-${t.prioridad}">${t.prioridad}</span></td>
                                <td><span class="estado-badge estado-${t.estado}">${t.estado.replace('_', ' ')}</span></td>
                                <td class="text-xs text-gray-500">${new Date(t.fecha_creacion).toLocaleDateString('es-AR')}</td>
                                <td class="text-xs">
                                    ${t.respuesta_gestor ? `<span class="text-gray-700 font-medium">${t.respuesta_gestor}</span>` : '<i class="text-gray-400">En revisión</i>'}
                                    ${t.proveedor_asignado ? `<div class="text-brand font-semibold mt-0.5">👷 ${t.proveedor_asignado}</div>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            container.innerHTML = `<div class="text-red-500 text-center py-4">Error: ${err.message}</div>`;
        }
    } else {
        // Propietario / Inmobiliaria
        if (btnNuevoTicket) btnNuevoTicket.classList.add('hidden');
        if (subtitle) {
            subtitle.textContent = rol === 'inmobiliaria' 
                ? "Mesa de ayuda: Asigná técnicos, registrá costos de reparación y respondé al inquilino"
                : "Reclamos recibidos de tus inquilinos para atención directa";
        }

        try {
            const res = await fetch(`${API_URL}/tickets/recibidos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await res.json();
            currentTicketsList = tickets;

            if (tickets.length === 0) {
                container.innerHTML = `
                    <div class="empty-state p-8">
                        <div class="empty-icon">✅</div>
                        <h3>¡Todo en orden! No hay tickets pendientes</h3>
                        <p>Las incidencias reportadas por inquilinos aparecerán acá</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Propiedad</th>
                            <th>Inquilino</th>
                            <th>Título e Incidencia</th>
                            <th>Prioridad</th>
                            <th>Estado</th>
                            ${rol === 'inmobiliaria' ? '<th>Técnico / Costo</th>' : ''}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${tickets.map(t => `
                            <tr>
                                <td class="font-bold text-gray-500">#${t.id_ticket}</td>
                                <td>Propiedad #${t.id_propiedad}</td>
                                <td>Inquilino #${t.id_inquilino}</td>
                                <td>
                                    <div class="font-semibold text-navy text-sm">${t.titulo}</div>
                                    <div class="text-xs text-gray-500 max-w-sm">${t.descripcion}</div>
                                </td>
                                <td><span class="prioridad-badge prioridad-${t.prioridad}">${t.prioridad}</span></td>
                                <td><span class="estado-badge estado-${t.estado}">${t.estado.replace('_', ' ')}</span></td>
                                ${rol === 'inmobiliaria' ? `
                                    <td class="text-xs">
                                        <div>${t.proveedor_asignado ? `👷 ${t.proveedor_asignado}` : '<span class="text-gray-400">Sin asignar</span>'}</div>
                                        ${t.costo_estimado ? `<div class="font-semibold text-gray-700">$${t.costo_estimado.toLocaleString('es-AR')}</div>` : ''}
                                    </td>
                                ` : ''}
                                <td>
                                    <button onclick="abrirModalGestionarTicket(${t.id_ticket})" class="btn-primary text-xs py-1 px-2.5">
                                        Gestionar
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } catch (err) {
            container.innerHTML = `<div class="text-red-500 text-center py-4">Error: ${err.message}</div>`;
        }
    }
}

async function abrirModalNuevoTicket() {
    const token = localStorage.getItem('token');
    const select = document.getElementById('ticket-propiedad-select');
    select.innerHTML = '<option value="">Cargando inmuebles alquilados...</option>';

    try {
        const res = await fetch(`${API_URL}/contratos/mis-contratos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contratos = await res.json();
        const activos = contratos.filter(c => c.estado === 'activo');

        if (activos.length === 0) {
            showToast("No tienes contratos de alquiler activos para abrir un ticket", "error");
            return;
        }

        select.innerHTML = activos.map(c => `
            <option value="${c.id_propiedad}">Propiedad #${c.id_propiedad} (Contrato #${c.id_contrato})</option>
        `).join('');

        document.getElementById('form-nuevo-ticket')?.reset();
        document.getElementById('modal-nuevo-ticket')?.classList.remove('hidden');
    } catch (e) {
        showToast("Error al cargar contratos", "error");
    }
}

function cerrarModalNuevoTicket() {
    document.getElementById('modal-nuevo-ticket')?.classList.add('hidden');
}

document.getElementById('form-nuevo-ticket')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const nuevoTicket = {
        id_propiedad: parseInt(document.getElementById('ticket-propiedad-select').value),
        titulo: document.getElementById('ticket-titulo').value.trim(),
        prioridad: document.getElementById('ticket-prioridad').value,
        descripcion: document.getElementById('ticket-descripcion').value.trim()
    };

    try {
        const res = await fetch(`${API_URL}/tickets/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(nuevoTicket)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Error al crear ticket");

        cerrarModalNuevoTicket();
        showToast("¡Ticket de mantenimiento enviado exitosamente!", "success");
        cargarTickets();
    } catch (err) {
        showToast(err.message, "error");
    }
});

function abrirModalGestionarTicket(ticketId) {
    const ticket = currentTicketsList.find(t => t.id_ticket === ticketId);
    if (!ticket) return;

    document.getElementById('gestionar-ticket-id').value = ticket.id_ticket;
    document.getElementById('gestionar-ticket-title').textContent = `Gestionar Ticket #${ticket.id_ticket}`;
    
    document.getElementById('gestionar-ticket-info').innerHTML = `
        <div><strong>Asunto:</strong> ${ticket.titulo}</div>
        <div><strong>Descripción:</strong> ${ticket.descripcion}</div>
        <div><strong>Prioridad:</strong> <span class="prioridad-badge prioridad-${ticket.prioridad}">${ticket.prioridad}</span></div>
    `;

    document.getElementById('gestionar-ticket-estado').value = ticket.estado;
    document.getElementById('gestionar-ticket-proveedor').value = ticket.proveedor_asignado || '';
    document.getElementById('gestionar-ticket-costo').value = ticket.costo_estimado || '';
    document.getElementById('gestionar-ticket-respuesta').value = ticket.respuesta_gestor || '';

    document.getElementById('modal-gestionar-ticket')?.classList.remove('hidden');
}

function cerrarModalGestionarTicket() {
    document.getElementById('modal-gestionar-ticket')?.classList.add('hidden');
}

document.getElementById('form-gestionar-ticket')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const ticketId = parseInt(document.getElementById('gestionar-ticket-id').value);
    const costoVal = document.getElementById('gestionar-ticket-costo').value;

    const payload = {
        estado: document.getElementById('gestionar-ticket-estado').value,
        proveedor_asignado: document.getElementById('gestionar-ticket-proveedor').value.trim() || null,
        costo_estimado: costoVal ? parseFloat(costoVal) : null,
        respuesta_gestor: document.getElementById('gestionar-ticket-respuesta').value.trim() || null
    };

    try {
        const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("Error al actualizar ticket");

        cerrarModalGestionarTicket();
        showToast("¡Ticket actualizado exitosamente!", "success");
        cargarTickets();
    } catch (err) {
        showToast(err.message, "error");
    }
});

// ─── 8. VISTA MI MARCA (WHITE-LABEL ENTERPRISE) ─────────────
function cargarBrandingView() {
    const empresa = localStorage.getItem('userEmpresa') || '';
    const color = localStorage.getItem('userColor') || '#00a650';
    const logo = localStorage.getItem('userLogo') || '';

    const inputEmpresa = document.getElementById('brand-empresa');
    const inputColorPicker = document.getElementById('brand-color-picker');
    const inputColorHex = document.getElementById('brand-color-hex');
    const previewCircle = document.getElementById('brand-preview-circle');
    const logoImg = document.getElementById('brand-logo-preview-img');
    const logoText = document.getElementById('brand-logo-preview-text');

    if (inputEmpresa) inputEmpresa.value = empresa;
    if (inputColorPicker) inputColorPicker.value = color;
    if (inputColorHex) inputColorHex.value = color;
    if (previewCircle) previewCircle.style.background = color;

    if (logo && logoImg && logoText) {
        logoImg.src = `${API_URL}${logo}`;
        logoImg.classList.remove('hidden');
        logoText.classList.add('hidden');
    }
}

// Sincronización reactiva del color picker
document.getElementById('brand-color-picker')?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (document.getElementById('brand-color-hex')) document.getElementById('brand-color-hex').value = val;
    if (document.getElementById('brand-preview-circle')) document.getElementById('brand-preview-circle').style.background = val;
    document.documentElement.style.setProperty('--brand', val);
});

document.getElementById('brand-color-hex')?.addEventListener('input', (e) => {
    const val = e.target.value;
    if (val.startsWith('#') && (val.length === 7 || val.length === 4)) {
        if (document.getElementById('brand-color-picker')) document.getElementById('brand-color-picker').value = val;
        if (document.getElementById('brand-preview-circle')) document.getElementById('brand-preview-circle').style.background = val;
        document.documentElement.style.setProperty('--brand', val);
    }
});

document.getElementById('form-branding')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const nombreEmpresa = document.getElementById('brand-empresa').value.trim();
    const colorPrimario = document.getElementById('brand-color-hex').value.trim() || '#00a650';
    const logoFile = document.getElementById('brand-logo-file')?.files[0];

    try {
        // 1. Actualizar datos de branding
        const res = await fetch(`${API_URL}/usuarios/branding`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                nombre_empresa: nombreEmpresa,
                color_primario: colorPrimario
            })
        });

        if (!res.ok) throw new Error("Error al guardar personalización de marca");
        const user = await res.json();

        // 2. Subir logo si fue seleccionado
        if (logoFile) {
            const formData = new FormData();
            formData.append('file', logoFile);

            const resLogo = await fetch(`${API_URL}/usuarios/logo`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (resLogo.ok) {
                const logoData = await resLogo.json();
                user.logo_url = logoData.logo_url;
            }
        }

        // 3. Aplicar en vivo
        localStorage.setItem('userEmpresa', user.nombre_empresa || '');
        localStorage.setItem('userColor', user.color_primario || '#00a650');
        localStorage.setItem('userLogo', user.logo_url || '');

        aplicarBranding(user);
        showToast("¡Identidad de marca guardada y aplicada con éxito!", "success");
        cargarBrandingView();
    } catch (err) {
        showToast(err.message, "error");
    }
});

// ─── 9. PUBLICACIÓN DE NUEVA PROPIEDAD CON FOTO ──────────────
function prepararNuevaPropiedad() {
    const form = document.getElementById('nueva-propiedad-form');
    if (form) form.reset();
}

const formNuevaPropiedad = document.getElementById('nueva-propiedad-form');
if (formNuevaPropiedad) {
    formNuevaPropiedad.onsubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const submitBtn = document.getElementById('btn-submit-propiedad');
        if (submitBtn) submitBtn.disabled = true;

        const ingresoMinimo = document.getElementById('prop-ingreso-minimo').value;
        const fotoInput = document.getElementById('prop-foto');

        const nuevaProp = {
            calle_direccion: document.getElementById('prop-direccion').value.trim(),
            ciudad: document.getElementById('prop-ciudad').value.trim(),
            tipo_inmueble: document.getElementById('prop-tipo').value,
            precio_alquiler_base: parseFloat(document.getElementById('prop-precio').value),
            acepta_mascotas: document.getElementById('prop-mascotas').checked,
            ingreso_minimo_requerido: ingresoMinimo ? parseFloat(ingresoMinimo) : null,
            estado_publicacion: "activa"
        };

        try {
            const res = await fetch(`${API_URL}/propiedades/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(nuevaProp)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Error al publicar propiedad");

            const idPropiedad = data.id_propiedad;

            if (fotoInput && fotoInput.files && fotoInput.files[0]) {
                const formData = new FormData();
                formData.append('file', fotoInput.files[0]);

                await fetch(`${API_URL}/propiedades/${idPropiedad}/imagen`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
            }

            showToast("¡Propiedad publicada con éxito!", "success");
            formNuevaPropiedad.reset();
            navegarA('dashboard');
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    };
}

// ─── HELPERS FORMATO ─────────────────────────────────────────
function formatTipo(tipo) {
    const tipos = {
        'departamento': 'Departamento',
        'casa': 'Casa',
        'duplex': 'Dúplex',
        'local_comercial': 'Local Comercial'
    };
    return tipos[tipo] || tipo;
}

function iconoTipo(tipo) {
    const iconos = {
        'departamento': '🏢',
        'casa': '🏡',
        'duplex': '🏘',
        'local_comercial': '🏪'
    };
    return iconos[tipo] || '🏠';
}

// ─── INICIALIZACIÓN ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        await sincronizarPerfilUsuario();
        navegarA('dashboard');
    } else {
        navegarA('login');
    }
});
