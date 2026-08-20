const API_URL = "http://localhost:8000";

// Vistas
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');
const dashboardView = document.getElementById('dashboard-view');

// Botones de navegación
const btnGoRegister = document.getElementById('btn-go-register');
const btnGoLogin = document.getElementById('btn-go-login');

// Formularios y mensajes
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const regErrorMessage = document.getElementById('reg-error-message');

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevoUsuario)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Error al registrar el usuario");
            }

            // Registro exitoso, volver al login
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
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error("Credenciales incorrectas");
            }

            const data = await response.json();
            
            // Decodificar el JWT simple para obtener el rol (sin librerías extra)
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

function mostrarDashboard() {
    const email = localStorage.getItem('userEmail');
    const rol = localStorage.getItem('userRole');
    
    loginView.classList.add('hidden');
    registerView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    
    document.getElementById('user-email-display').textContent = email;
    document.getElementById('user-role-display').textContent = rol;
    
    // Lógica visual basada en el rol
    const btnNuevaProp = document.getElementById('btn-nueva-propiedad');
    const content = document.getElementById('dashboard-content');
    
    if (rol === 'propietario' || rol === 'inmobiliaria') {
        btnNuevaProp.classList.remove('hidden');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center justify-center text-center h-48 border-dashed">
                <span class="text-gray-400 mb-2">No tienes propiedades publicadas</span>
                <span class="text-sm text-gray-500">Tus inmuebles aparecerán aquí</span>
            </div>
        `;
    } else {
        btnNuevaProp.classList.add('hidden');
        content.innerHTML = `
            <div class="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center justify-center text-center h-48 border-dashed col-span-full">
                <span class="text-gray-400 mb-2">Bienvenido a tu perfil de Inquilino</span>
                <button class="text-blue-600 font-medium hover:text-blue-800">Ir al Marketplace para buscar alquileres</button>
            </div>
        `;
    }
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
