# 🏢 DOSSIER EJECUTIVO: SOFTWARE ALQUILERES (PROPTECH MVP)

**Documento de Presentación Estratégica, Modelo de Negocio y Plan de Lanzamiento**  
*Fecha: Agosto 2026*  
*Repositorio GitHub:* `emanuelcerda70/software-alquileres` (Rama `main`)

---

## 💡 1. Resumen Ejecutivo y Visión

El mercado de alquileres tradicional en Argentina y Latinoamérica sufre de una **alta ineficiencia operativa**:
- Los acuerdos y postulaciones se gestionan por hilos caóticos de WhatsApp y planillas de Excel.
- Los reclamos de mantenimiento y roturas no tienen trazabilidad ni presupuesto claro.
- Los portales actuales (Zonaprop, Argenprop, MercadoLibre) solo publican anuncios pero **abandonan a la inmobiliaria y al propietario una vez firmado el contrato**.

**Nuestra Solución:** Un software integral **PropTech B2B/B2C** que digitaliza todo el ciclo de vida del alquiler: desde la búsqueda en mapa hasta la firma de contratos, cobranza y mesa de ayuda con técnicos especializados.

---

## 🛠 2. ¿Qué tenemos construido hoy? (Estado del MVP 100% Funcional)

El sistema ya está programado, probado y versionado con las siguientes funcionalidades:

1. **Marketplace de Inmuebles estilo Rightmove:**
   - Buscador rápido con filtros por ciudad, tipo de propiedad, precio máximo y política de mascotas.
   - Paginación dinámica y vista detallada de inmuebles con fotos de alta resolución.
2. **Mapa Interactivo Geolocalizado (Leaflet.js + OpenStreetMap):**
   - Exploración visual en tiempo real de propiedades disponibles por ubicación geográfica.
3. **Módulo de Postulaciones y Contratos Digitales:**
   - Los inquilinos envían solicitudes formales con mensajes de presentación.
   - Propietarios e inmobiliarias pueden aprobar/rechazar y generar contratos automáticos con fechas y montos pactados.
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

Gracias a la arquitectura tecnológica elegida, los costos fijos de servidores son prácticamente **cero ($0 a $15 USD/mes)**.

| Escenario | Clientes / Inmuebles Administrados | Facturación Mensual Estimada | Costo de Servidores | Margen Operativo |
| :--- | :--- | :--- | :--- | :--- |
| **Fase Piloto (Mes 1-3)** | 5 Inmobiliarias / 50 propiedades (Prueba) | $0 (Validación) | $0 / mes | 100% |
| **Fase Validación (Mes 4-6)** | 3 Inmobiliarias de pago (70 props) + 10 Dueños directos | **$1.800.000 ARS / mes** | $0 / mes | **~99%** |
| **Fase Crecimiento (Mes 7-12)** | 10 Inmobiliarias + 50 Dueños (250 props) | **$6.000.000 ARS / mes** | ~$15 USD / mes | **~98%** |

---

## ☁️ 5. Infraestructura y Hosting ($0 Inicial)

El proyecto está preparado para desplegarse sin costo de hosting:
- **Frontend:** Vercel (CDN global, SSL automático, soporta cobros y pasarelas de pago).
- **Backend:** Render.com (API FastAPI en Python de alto rendimiento).
- **Base de Datos:** PostgreSQL en Neon.tech o Supabase (500 MB libres = ~300.000 registros).
- **Capacidad del Plan Gratuito:** Hasta **5.000 inquilinos, 300 inmobiliarias y 50.000 visitas al mes**.

---

## 🎯 6. Plan de Acción Inmediato (Roadmap a 30 Días)

```
SEMANA 1 ──► Puesta en Producción
             - Deploy del backend en Render y frontend en Vercel.
             - Dominio propio opcional (ej: www.softwarealquileres.com).

SEMANA 2 ──► Comercialización Piloto (Foco Hiperlocal)
             - Contactar a 5 inmobiliarias de confianza de la zona.
             - Ofrecerles 60 a 90 días de prueba GRATIS con su logo y colores.

SEMANA 3 ──► Onboarding & Carga de Inmuebles
             - Capacitación rápida de 15 minutos al equipo de la inmobiliaria.
             - Carga de sus propiedades y primeros contratos reales.

SEMANA 4 ──► Feedback & Ajustes de Uso
             - Medir uso de tickets de mantenimiento y postulaciones.
             - Preparar la integración con Mercado Pago para cobros recurrentes automáticos.
```

---

*Este documento resume la propuesta de valor, viabilidad técnica y plan de ejecución comercial del proyecto.*
