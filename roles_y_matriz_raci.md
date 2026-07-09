# Roles del Equipo de Desarrollo y Matriz RACI
## Plataforma Global de Inteligencia Logística e Inventario - Nike Inc.

Este documento establece la estructura organizativa y de responsabilidades para el desarrollo de la plataforma, dividida entre los desarrolladores de Frontend, Backend y Base de Datos.

---

## 1. Definición de Roles del Equipo

El equipo está conformado por 5 miembros especializados con atribuciones claras para garantizar un desarrollo paralelo y eficiente:

### Capa de Presentación (Frontend)
*   **Desarrollador Frontend 1 (FE_DEV_1): Especialista en UI/UX y Visualización**
    *   *Responsabilidad:* Diseño premium de Nike (Modo Oscuro, Glassmorphism, animaciones fluidas con Framer Motion).
    *   *Módulos a su cargo:* Dashboard global de inventario multisede, mapa de tracking dinámico (Leaflet/Mapbox), y la pantalla visual del historial de auditoría.
*   **Desarrollador Frontend 2 (FE_DEV_2): Especialista en Lógica e Integraciones**
    *   *Responsabilidad:* Gestión del estado de la aplicación, conectividad y seguridad de la interfaz.
    *   *Módulos a su cargo:* Cliente Keycloak en frontend, Widget Selector de Roles (`RoleSwitcher`), hook de reconexión de WebSockets (`useWebSocket`), interfaz conversacional del Chatbot e integración del escáner QR.

### Capa lógica y de Servicios (Backend)
*   **Desarrollador Backend 1 (BE_DEV_1): Especialista en Core, Auth y Rutas**
    *   *Responsabilidad:* Cimientos del servidor y flujos de datos.
    *   *Módulos a su cargo:* API Gateway (FastAPI layered routers), middleware de validación Keycloak, implementación de la simulación local `DEMO_MODE=True` y enrutamiento seguro de WebSockets.
*   **Desarrollador Backend 2 (BE_DEV_2): Especialista en Inteligencia Artificial y Optimización**
    *   *Responsabilidad:* Orquestación de IA y capas de optimización.
    *   *Módulos a su cargo:* Cliente de la API de Groq, lógica de negocio del Chatbot logístico, sanitización de entradas y salidas de IA (LLM Top 10) e integración de la Caché Semántica con Redis.

### Capa de Datos (Database Manager)
*   **Gestor de Base de Datos (DB_MGR): Diseñador y Administrador de Datos**
    *   *Responsabilidad:* Modelado físico de los datos, indexación y seeding.
    *   *Módulos a su cargo:* Creación de tablas de inventarios y tablas inmutables de auditoría, configuración de la extensión `pgvector` en PostgreSQL, y diseño del script de inicialización inteligente (`seed.py`).

---

## 2. Matriz RACI del Proyecto

La matriz define el nivel de participación en cada entregable:
*   **R (Responsible):** El rol que ejecuta directamente la tarea.
*   **A (Accountable):** El rol responsable final del éxito de la entrega (aprueba y supervisa). *Nota: Solo puede haber un Accountable (A) por fila.*
*   **C (Consulted):** Personas consultadas para proporcionar información adicional (comunicación bidireccional).
*   **I (Informed):** Personas que deben ser notificadas de los avances o del resultado (comunicación unidireccional).

| Entregable / Hito Técnico | FE_DEV_1 | FE_DEV_2 | BE_DEV_1 | BE_DEV_2 | DB_MGR |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Estructura y Capas del Proyecto | **R** | **R** | **R** | **R** | **C** |
| Configuración de Keycloak & `DEMO_MODE` | **I** | **R** | **R** | **I** | **I** |
| Modelado SQL y extensión `pgvector` | **I** | **I** | **C** | **C** | **R** |
| Script de semillero `seed.py` (Zapatillas & GPS) | **C** | **I** | **I** | **C** | **R** |
| Integración de Groq API y System Prompts | **I** | **C** | **I** | **R** | **C** |
| Caché Semántica con Redis | **I** | **I** | **C** | **R** | **C** |
| Módulo Drag-and-Drop & Simulación modal | **R** | **C** | **C** | **I** | **I** |
| Hook de resiliencia `useWebSocket` | **C** | **R** | **C** | **I** | **I** |
| Logs e Historial de Auditoría | **R** | **C** | **C** | **I** | **R** |
| PWA offline y escaneo de códigos QR | **C** | **R** | **I** | **I** | **I** |
| Pipelines CI/CD & Tests de Playwright | **C** | **R** | **R** | **I** | **I** |
