const API_URL = "http://localhost:8000";

// Vistas
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const dashboardView = document.getElementById('dashboard-view');
const marketplaceView = document.getElementById('marketplace-view');
const nuevaPropiedadView = document.getElementById('nueva-propiedad-view');

// Botones de navegación auth
const btnGoRegister = document.getElementById('btn-go-register');
const btnGoLogin = document.getElementById('btn-go-login');

// Formularios y mensajes
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const nuevaPropiedadForm = document.getElementById('nueva-propiedad-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const regErrorMessage = document.getElementById('reg-error-message');

// Utilidad: ocultar todas las vistas
function ocultarTodasLasVistas() {
    [loginView, registerView, dashboardView, marketplaceView, nuevaPropiedadView]
        .forEach(v => v.classList.add('hidden'));
}

// Navegación entre Login y Registro
btnGoRegister.addEventListener('click', () => {
    loginView.classList.add('hidden');
    registerView.classList.remove('hidden');
    regErrorMessage.classList.add('hidden');
});

btnGoLogin.addEventListener('click', () => {
    registerView.classList.add('hidden');
    loginView.classList.remove('hidden');
    errorMessage.classList.add('hidden');
});

// Lógica de Registro
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nuevoUsuario = {
            nombre: document.getElementById('reg-nombre').value,
            apellido: document.getElementById('reg-apellido').value,
            dni_cuit: document.getElementById('reg-dni').value,
            telefono: document.getElementById('reg-telefono').value,
            tipo_usuario: document.getElementById('reg-tipo').value,
            email: document.getElementById('reg-email').value,
            password: document.getElementById('reg-password').value
        };

        try {
            const response = await fetch(`${API_URL}/usuarios/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoUsuario)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Error al registrar el usuario");

            registerForm.reset();
            registerView.classList.add('hidden');
            loginView.classList.remove('hidden');
            successMessage.textContent = "¡Cuenta creada con éxito! Ahora puedes iniciar sesión.";
            successMessage.classList.remove('hidden');
            errorMessage.classList.add('hidden');

        } catch (error) {
            regErrorMessage.textContent = error.message;
            regErrorMessage.classList.remove('hidden');
        }
    });
}

// Lógica de Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const formData = new URLSearchParams();
            formData.append('username', email);
            formData.append('password', password);

            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!response.ok) throw new Error("Credenciales incorrectas");

            const data = await response.json();
            const tokenPayload = JSON.parse(atob(data.access_token.split('.')[1]));

            localStorage.setItem('token', data.access_token);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userRole', tokenPayload.rol);

            mostrarDashboard();

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
            successMessage.classList.add('hidden');
        }
    });
}

// ─── DASHBOARD ──────────────────────────────────────────────
function mostrarDashboard() {
    const email = localStorage.getItem('userEmail');
    const rol = localStorage.getItem('userRole');

    ocultarTodasLasVistas();
    dashboardView.classList.remove('hidden');

    document.getElementById('user-email-display').textContent = email;
    document.getElementById('user-role-display').textContent = rol;

    const btnNuevaProp = document.getElementById('btn-nueva-propiedad');
    const btnMarketplace = document.getElementById('btn-marketplace');
    const content = document.getElementById('dashboard-content');

    btnMarketplace.onclick = () => cargarMarketplace();

    if (rol === 'propietario' || rol === 'inmobiliaria') {
        btnNuevaProp.classList.remove('hidden');
        btnNuevaProp.onclick = () => mostrarNuevaPropiedad();
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center justify-center text-center h-48 border-dashed">
                <span class="text-4xl mb-3">🏠</span>
                <span class="text-gray-500 mb-2 font-medium">No tienes propiedades publicadas</span>
                <span class="text-sm text-gray-400">Usa el botón "+ Nueva Propiedad" para comenzar</span>
            </div>`;
    } else {
        btnNuevaProp.classList.add('hidden');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center justify-center text-center h-48 border-dashed col-span-full">
                <span class="text-4xl mb-3">🔍</span>
                <span class="text-gray-500 mb-3 font-medium">Bienvenido a tu perfil de Inquilino</span>
                <button onclick="cargarMarketplace()" class="text-blue-600 font-medium hover:text-blue-800 border border-blue-200 px-4 py-2 rounded-md hover:bg-blue-50 text-sm">
                    Explorar el Marketplace →
                </button>
            </div>`;
    }
}

// ─── MARKETPLACE ─────────────────────────────────────────────
async function cargarMarketplace() {
    const email = localStorage.getItem('userEmail');
    const rol = localStorage.getItem('userRole');

    ocultarTodasLasVistas();
    marketplaceView.classList.remove('hidden');

    document.getElementById('mkt-user-email').textContent = email;
    document.getElementById('mkt-user-role').textContent = rol;

    const content = document.getElementById('marketplace-content');
    content.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-16">
            <div class="text-center text-gray-400">
                <div class="animate-pulse text-4xl mb-3">⏳</div>
                <p>Cargando propiedades...</p>
            </div>
        </div>`;

    try {
        const response = await fetch(`${API_URL}/propiedades/`);
        if (!response.ok) throw new Error("No se pudo conectar con el servidor");

        const propiedades = await response.json();

        if (propiedades.length === 0) {
            content.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <p class="text-5xl mb-4">🏚</p>
                    <p class="text-gray-500 text-lg font-medium">No hay propiedades disponibles aún</p>
                    <p class="text-gray-400 text-sm mt-1">Vuelve más tarde o publica la tuya</p>
                </div>`;
            return;
        }

        content.innerHTML = propiedades.map(prop => `
            <div class="bg-white rounded-lg shadow border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div class="bg-gradient-to-r from-blue-50 to-blue-100 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                    <span class="text-xs font-bold uppercase text-blue-700 bg-white px-2 py-1 rounded-full shadow-sm">${formatTipo(prop.tipo_inmueble)}</span>
                    <span class="text-xs text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">● Disponible</span>
                </div>
                <div class="p-5">
                    <h3 class="font-semibold text-gray-800 text-base leading-tight mb-1">${prop.calle_direccion}</h3>
                    <p class="text-gray-400 text-sm mb-4">📍 ${prop.ciudad}</p>
                    <div class="flex justify-between items-end mb-4">
                        <div>
                            <span class="text-2xl font-bold text-blue-600">$${prop.precio_alquiler_base.toLocaleString('es-AR')}</span>
                            <span class="text-gray-400 text-xs ml-1">/ mes</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 text-xs text-gray-500">
                        <span class="bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">${prop.acepta_mascotas ? '🐾 Mascotas OK' : '🚫 Sin mascotas'}</span>
                        ${prop.ingreso_minimo_requerido ? `<span class="bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">💰 Ing. mín: $${prop.ingreso_minimo_requerido.toLocaleString('es-AR')}</span>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        content.innerHTML = `
            <div class="col-span-full text-center py-16">
                <p class="text-5xl mb-4">⚠️</p>
                <p class="text-red-400 font-medium">Error al cargar propiedades</p>
                <p class="text-gray-400 text-sm mt-2">${error.message}</p>
                <p class="text-gray-400 text-sm">Asegúrate de que el servidor backend esté corriendo en <code class="bg-gray-100 px-1 rounded">localhost:8000</code></p>
            </div>`;
    }
}

// ─── NUEVA PROPIEDAD ─────────────────────────────────────────
function mostrarNuevaPropiedad() {
    ocultarTodasLasVistas();
    nuevaPropiedadView.classList.remove('hidden');
    document.getElementById('prop-error-message').classList.add('hidden');
    document.getElementById('prop-success-message').classList.add('hidden');
    if (nuevaPropiedadForm) nuevaPropiedadForm.reset();
}

if (nuevaPropiedadForm) {
    nuevaPropiedadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        const propErrorMsg = document.getElementById('prop-error-message');
        const propSuccessMsg = document.getElementById('prop-success-message');
        const ingresoMinimo = document.getElementById('prop-ingreso-minimo').value;

        const nuevaPropiedad = {
            calle_direccion: document.getElementById('prop-direccion').value,
            ciudad: document.getElementById('prop-ciudad').value,
            tipo_inmueble: document.getElementById('prop-tipo').value,
            precio_alquiler_base: parseFloat(document.getElementById('prop-precio').value),
            acepta_mascotas: document.getElementById('prop-mascotas').checked,
            ingreso_minimo_requerido: ingresoMinimo ? parseFloat(ingresoMinimo) : null,
            estado_publicacion: "activa"
        };

        try {
            const response = await fetch(`${API_URL}/propiedades/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(nuevaPropiedad)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail || "Error al publicar la propiedad");

            propSuccessMsg.textContent = "✅ ¡Propiedad publicada con éxito! Volviendo al panel...";
            propSuccessMsg.classList.remove('hidden');
            propErrorMsg.classList.add('hidden');

            setTimeout(() => mostrarDashboard(), 1500);

        } catch (error) {
            propErrorMsg.textContent = error.message;
            propErrorMsg.classList.remove('hidden');
            propSuccessMsg.classList.add('hidden');
        }
    });
}

// ─── UTILIDADES ───────────────────────────────────────────────
function formatTipo(tipo) {
    const tipos = {
        'departamento': 'Departamento',
        'casa': 'Casa',
        'duplex': 'Dúplex',
        'local_comercial': 'Local Comercial'
    };
    return tipos[tipo] || tipo;
}

function cerrarSesion() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    location.reload();
}

// Comprobar sesión activa al inicio
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        mostrarDashboard();
    }
});
