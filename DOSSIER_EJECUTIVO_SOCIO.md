# 🏢 DOSSIER EJECUTIVO: KELVI (PROPTECH MVP)

**"Kelvi: El alquiler, simple para todos"**  
**Documento de Presentación Estratégica, Modelo de Negocio y Plan de Lanzamiento**  
*Fecha: Agosto 2026*  
*Repositorio GitHub:* `emanuelcerda70/software-alquileres` (Rama `main`)

---

## 💡 1. Resumen Ejecutivo y Visión

El mercado de alquileres tradicional en Argentina y Latinoamérica sufre de una **alta ineficiencia operativa**:
- Los acuerdos y visitas se gestionan por hilos caóticos de WhatsApp y planillas de Excel.
- Los reclamos de mantenimiento y roturas no tienen trazabilidad ni presupuesto claro.
- Los portales actuales (Zonaprop, Argenprop, MercadoLibre) solo publican anuncios pero **abandonan a la inmobiliaria y al propietario una vez firmado el contrato**.

**Kelvi** es la plataforma integral **PropTech B2B/B2C** que digitaliza todo el ciclo de vida del alquiler: desde la búsqueda en mapa y el agendamiento de visitas presenciales hasta el scoring de garantes, contratos y mesa de ayuda con técnicos especializados.

---

## 🛠 2. ¿Qué tenemos construido hoy? (Estado del MVP 100% Funcional)

1. **Marketplace de Inmuebles estilo Rightmove:**
   - Buscador rápido con filtros por ciudad, tipo de propiedad, precio máximo y política de mascotas.
   - Paginación dinámica y vista detallada de inmuebles con fotos.
2. **Mapa Interactivo Geolocalizado (Leaflet.js + OpenStreetMap):**
   - Exploración visual en tiempo real de propiedades disponibles por ubicación geográfica.
3. **Circuito de Visitas Presenciales & Legajo de Garantes:**
   - Agendamiento de visitas con fecha y franja horaria preferida (*Mañana, Tarde, Sábado*).
   - Confirmación por parte de la inmobiliaria y concreción de la visita.
   - Carga de **Legajo Digital** por el inquilino (ingresos demostrables, recibos de sueldo de garantes, garantía propietaria o seguro de caución).
   - Evaluación y aprobación para generación instantánea de contratos.
4. **Mesa de Ayuda & Tickets de Mantenimiento (Helpdesk):**
   - Registro de reclamos con niveles de urgencia (*Baja, Media, Alta, Urgente*).
   - Panel de triage para asignar técnicos, asentar costos de reparación y responder con notas de coordinación.
5. **Red de Profesionales y Oficios con WhatsApp Directo:**
   - Directorio de plomeros, electricistas, gasistas matriculados, cerrajeros y técnicos de clima.
   - Botón de WhatsApp con mensaje prearmado que contiene los datos del inmueble y la rotura para solicitar cotización en 1 clic.
6. **Marca Blanca / White-Label para Inmobiliarias (Enterprise):**
   - Las inmobiliarias pueden personalizar la plataforma con su propio **Nombre Comercial**, **Logotipo** y **Paleta de Colores Corporativos (HEX)**.

---

## 💰 3. Modelo de Negocio y Estrategia de Monetización

Diseñado para generar **ingresos recurrentes predecibles (SaaS - Software as a Service)**:

### A. Suscripción para Propietarios Directos
- **Precio base:** **$30.000 ARS / mes por propiedad**.
- **Gancho de entrada:** Prueba gratuita de **1 a 3 meses** (según volumen de propiedades) para validar el sistema sin riesgo.

### B. Planes para Inmobiliarias (B2B Cartera Administrada)
Abono mensual escalonado con módulo de Marca Blanca (White-Label) incluido:
- **Plan Inmobiliaria Starter (hasta 15 propiedades):** $350.000 ARS / mes.
- **Plan Inmobiliaria Pro (hasta 40 propiedades):** $750.000 ARS / mes.
- **Plan Inmobiliaria Enterprise (carteras de 100+ propiedades):** Cotización a medida (~$1.800.000+ ARS / mes).

### C. Monetización Secundaria (Marketplace de Proveedores)
- Fee de verificación o membresía mensual para que técnicos y gasistas aparezcan en las primeras posiciones del catálogo.

---

## 📊 4. Proyección Financiera y Márgenes

| Escenario | Clientes / Inmuebles Administrados | Facturación Mensual Estimada | Costo de Servidores | Margen Operativo |
| :--- | :--- | :--- | :--- | :--- |
| **Fase Piloto (Mes 1-3)** | 5 Inmobiliarias / 50 propiedades (Prueba) | $0 (Validación) | $0 / mes | 100% |
| **Fase Validación (Mes 4-6)** | 3 Inmobiliarias de pago (70 props) + 10 Dueños directos | **$1.800.000 ARS / mes** | $0 / mes | **~99%** |
| **Fase Crecimiento (Mes 7-12)** | 10 Inmobiliarias + 50 Dueños (250 props) | **$6.000.000 ARS / mes** | ~$15 USD / mes | **~98%** |

---

## ☁️ 5. Infraestructura y Hosting ($0 Inicial)

- **Frontend:** Vercel (CDN global, SSL automático, soporta cobros y pasarelas de pago).
- **Backend:** Render.com (API FastAPI en Python de alto rendimiento).
- **Base de Datos:** PostgreSQL en Neon.tech o Supabase (500 MB libres = ~300.000 registros).
- **Capacidad del Plan Gratuito:** Hasta **5.000 inquilinos, 300 inmobiliarias y 50.000 visitas al mes**.

---

*Kelvi · El alquiler, simple para todos.*
