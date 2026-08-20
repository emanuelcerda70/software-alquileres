// URL base de nuestro Backend
const API_URL = "http://localhost:8000";

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const dashboardView = document.getElementById('dashboard-view');
const loginView = document.getElementById('login-view');
const userEmailDisplay = document.getElementById('user-email-display');

// Evento de Login
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        try {
            // FastAPI OAuth2 usa form-urlencoded, no JSON
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
            
            // Guardamos el token en el navegador
            localStorage.setItem('token', data.access_token);
            
            // Cambiamos la vista
            mostrarDashboard(email);

        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.classList.remove('hidden');
        }
    });
}

function mostrarDashboard(email) {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    userEmailDisplay.textContent = email;
}

// Comprobar si ya hay sesión iniciada al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Acá luego agregaremos validación real del token
        mostrarDashboard("Usuario Logueado");
    }
});
