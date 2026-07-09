# Prompts de Configuración: Frontend (React + Vite + shadcn/ui)

Este archivo contiene la secuencia de sub-prompts técnicos estructurados para la creación guiada del frontend de la Plataforma de Inteligencia Logística.

---

## Sub-prompt 1: Inicialización de Proyecto, Estilos Premium y Keycloak Integration
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Inicializa el Frontend del proyecto utilizando React, Vite, TypeScript y TailwindCSS. Implementa una estética premium enfocada en el diseño de Nike:

Tareas:
1. Configuración de Estilo y UI Modernas:
   - Instala 'tailwindcss-animate', 'framer-motion' (para micro-animaciones fluidas) y 'lucide-react' (iconografía).
   - Diseña un tema dominado por el Modo Oscuro (Fondo `#0E0E10`, Tarjetas translúcidas con Glassmorphism `#1C1C1E` con blur de 12px y bordes sutiles).
   - Utiliza acentos en el Naranja Oficial de Nike (`#FA5400`) y Blanco (`#FFFFFF`) para textos.
   - Aplica la tipografía 'Outfit' o 'Inter' en todo el proyecto.
   - Instala e inicializa el catálogo de componentes base de shadcn/ui.

2. Integración de Keycloak:
   - Configura la autenticación usando 'keycloak-js'.
   - Crea un HOC (Higher-Order Component) o componente guardián `<ProtectedRoute>` que requiera autenticación y verifique los roles antes de renderizar la app principal.
```

---

## Sub-prompt 2: Particularidad Evaluativa - Widget Selector de Roles y Cabecera Demo
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Implementa un Widget Selector de Roles demostrativo en el Frontend para permitir que el evaluador/docente alterne perfiles dinámicamente en caliente:

Tareas:
1. Creación del Componente (src/features/auth/RoleSwitcher.tsx):
   - Crea un botón flotante y discreto en la esquina inferior derecha de la pantalla con efecto Glassmorphic y bordes naranjas.
   - Al hacer clic, despliega un menú (Shadcn Dropdown) con las opciones de roles de Nike: 'Administrador', 'Supervisor' y 'Operador'.

2. Gestión de Estado con Zustand y Axios Header:
   - Almacena el rol seleccionado en un store de Zustand (`useAuthStore`).
   - Sincroniza este rol con una cabecera HTTP personalizada 'X-Demo-Role' que se enviará automáticamente en cada petición de Axios al backend para emular el cambio de privilegios en el servidor de forma síncrona.

3. Adaptación Dinámica de la UI:
   - Si el rol es 'Operador', oculta el menú del Drag-and-Drop, bloquea el módulo en el enrutador y deshabilita los mapas globales de tracking.
   - Si es 'Supervisor', permite ver los mapas pero restringe el movimiento Drag-and-Drop a áreas locales únicamente.
   - Si es 'Administrador', habilita todas las funciones del ecosistema, incluyendo el menú de auditoría.
```

---

## Sub-prompt 3: Resiliencia de WebSockets, Drag-and-Drop, Historial de Auditoría y PWA
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Implementa la comunicación por WebSockets, el comando Drag-and-Drop, el panel de auditoría visual y las capacidades offline de PWA:

Tareas:
1. Resiliencia de WebSockets (src/hooks/useWebSocket.ts):
   - Implementa un hook personalizado para manejar la conexión con el servidor.
   - Agrega lógica de auto-reconexión automática con backoff exponencial.
   - Si los WebSockets fallan tras 5 intentos, conmuta automáticamente a llamadas de sondeo corto (polling) HTTP REST para garantizar que la demo continúe operando.

2. Drag-and-Drop y Simulación de Impacto:
   - Utiliza '@hello-pangea/dnd' o la API nativa de HTML5 para arrastrar lotes de calzado Nike entre almacenes y tiendas.
   - Al soltar la tarjeta, muestra un Shadcn Dialog simulando capacidad en destino, fletes y ETA dinámicos. Al confirmar, llama al backend para persistir la orden de traslado.

3. Panel de Auditoría (src/features/audit/AuditTrail.tsx):
   - Diseña una tabla en modo oscuro que consuma el endpoint `/api/v1/audit-logs` y muestre el historial inmutable de movimientos realizados. Esta vista solo es accesible para Admin y Supervisor.

4. Soporte Offline (PWA):
   - Integra 'vite-plugin-pwa' para registrar un service worker básico.
   - Asegura el cacheado offline de los activos estáticos y de la vista del escáner de códigos QR para que el chatbot de la demo funcione en zonas de baja conectividad.
```
