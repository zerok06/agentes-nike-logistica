# Documento de Diseño de Software (SDD) - Frontend
## Interfaz de Usuario y Centro de Comando Visual (React + Vite + shadcn/ui)

---

## 1. Estructura y Capas de la Interfaz
El frontend está desarrollado sobre **React 18** compilado con **Vite**. La organización se basa en módulos y capas para garantizar que los componentes gráficos de propósito general estén desacoplados de las reglas operativas y consumo de APIs de Nike.

```text
frontend/src/
├── components/         # CAPA BASE [Responsabilidad: FE_DEV_1]: Componentes atómicos (Button, Input, Card, Modal de shadcn)
├── features/           # CAPA DE MÓDULOS DE NEGOCIO:
│   ├── auth/           # [Responsabilidad: FE_DEV_2]: Login, Token Handler y Widget Demostrativo de Roles
│   ├── dashboard/      # [Responsabilidad: FE_DEV_1]: Paneles multisede e inventario
│   ├── tracking/       # [Responsabilidad: FE_DEV_1]: Mapa interactivo y visualización GPS/IoT
│   ├── chatbot/        # [Responsabilidad: FE_DEV_2]: Interfaz de chat interactivo y lector de QR
│   ├── command_center/ # [Responsabilidad: FE_DEV_1]: Grid Drag-and-Drop de traslado de lotes
│   └── audit/          # [Responsabilidad: FE_DEV_1]: Panel del historial de operaciones (Audit Trail)
├── hooks/              # [Responsabilidad: FE_DEV_2]: Custom hooks (useAuth, useDrag, useMap, useWebSocket)
├── services/           # CAPA DE ACCESO A API [Responsabilidad: FE_DEV_2]: Clientes Axios para Backend y Mock APIs
└── store/              # CAPA DE ESTADO GLOBAL [Responsabilidad: FE_DEV_2]: Zustand store para almacenar el rol activo, token y tema
```

---

## 2. Sistema de Diseño Premium y Estilo Visual `[Responsabilidad: FE_DEV_1]`
Para lograr un impacto inmediato ("Wow effect") a la docente y usuarios finales, el diseño sigue principios modernos y limpios:

* **Paleta de Colores Nike Premium:**
  - Dominante: Oscuro Matte (`#0E0E10`) y Gris Carbón (`#1C1C1E`).
  - Acentos: Naranja Nike (`#FA5400`) y Blanco Puro (`#FFFFFF`) para alto contraste.
  - Alertas: Tonos suaves de verde (éxito) y rojo neón (alertas de stock crítico).
* **Tipografía:** Configuración por defecto a **Outfit** o **Inter** (cargadas vía Google Fonts) para un estilo premium.
* **Componentes Visuales Clave:**
  - **Glassmorphism:** Tarjetas y paneles laterales translúcidos con efecto de desenfoque (`backdrop-filter: blur(12px)`) y bordes sutiles.
  - **Framer Motion:** Animaciones de entrada en paneles, micro-interacciones en botones al hacer hover y desplazamientos fluidos de los marcadores en el mapa de tracking.
  - **Recharts:** Gráficos responsivos y estilizados en modo oscuro para la visualización del stock.
  - **Lucide React:** Iconografía vectorial estilizada y homogénea.

---

## 3. Particularidad Demostrativa: Widget Selector de Roles `[Responsabilidad: FE_DEV_2]`
* **Ubicación:** Esquina inferior derecha de la pantalla, flotante y discreto.
* **Funcionamiento:** 
  - Un desplegable que permite alternar el rol activo del usuario actual entre: `Administrador`, `Supervisor` y `Operador`.
  - Al cambiar de rol, el estado global de **Zustand** se cambia en caliente y añade la cabecera `X-Demo-Role` para modificar los privilegios en la API del backend.
* **Impacto Dinámico en la UI:**
  - **Admin:** Desbloquea todos los módulos, permite mover lotes mediante Drag-and-Drop, consultar datos globales y ver el panel de auditoría.
  - **Supervisor:** Permite ver el Drag-and-Drop pero restringe traslados fuera de su región física.
  - **Operador:** Oculta por completo la opción de Drag-and-Drop en el menú de navegación, y el Chatbot solo le responde sobre su sucursal de origen.

---

## 4. Resiliencia en Comunicaciones: WebSocket con Reconexión y Fallback `[Responsabilidad: FE_DEV_2]`
* **Hook Personalizado (`useWebSocket`):**
  - Implementa lógica de reconexión automática en caso de pérdida de enlace (por ejemplo, desconexión de red de la docente) con reintentos progresivos (backoff exponencial).
  - Si los WebSockets fallan reiteradamente o son bloqueados por el firewall local, el hook conmuta automáticamente a llamadas de sondeo corto (polling) HTTP REST para que el mapa y el chat sigan funcionando de forma transparente.

---

## 5. Panel de Historial de Operaciones (Audit Trail View) `[Responsabilidad: FE_DEV_1]`
* **Visualización:**
  - Una pestaña o sección de auditoría (disponible para administradores y supervisores) que renderiza una tabla de datos (Shadcn Table) estilizada en modo oscuro.
  - Muestra un feed en tiempo real de los registros de `AuditLog` devueltos por el backend, permitiendo auditar visualmente los movimientos confirmados del Drag-and-Drop.

---

## 6. Soporte Offline y PWA para Dispositivos Móviles `[Responsabilidad: FE_DEV_2]`
* **Propiedades PWA:**
  - Configuración del manifiesto (`manifest.json`) e integración de un Service Worker simple.
  - El Service Worker realiza el almacenamiento en caché de los elementos de UI estáticos y la pantalla del escáner de códigos QR de modo offline, permitiendo que un operario de Nike pueda utilizar la interfaz en sótanos con baja señal e internamente encolar las consultas de escaneo.
