# Prompts de Configuración: Pruebas E2E y DevOps (Gitea Actions)

Este archivo contiene la secuencia de sub-prompts técnicos estructurados para la automatización de pruebas y despliegue continuo de la plataforma logística.

---

## Sub-prompt 1: Pruebas E2E con Playwright (Automatización de Flujos Logísticos)
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Configura la suite de pruebas E2E automatizadas para la plataforma logística utilizando Playwright (TypeScript/JavaScript):
1. Estructura de Directorios:
   - Configura Playwright en una carpeta `/tests/e2e/`.
   - Crea un archivo de configuración de Playwright que soporte la inicialización del navegador en modo headless.

2. Flujo de Prueba 1: Autenticación Keycloak:
   - Implementa un flujo que navegue a la página de login, complete credenciales de prueba, redirija al Keycloak y valide que el token de sesión se establezca correctamente ingresando a la ruta principal `/dashboard`.

3. Flujo de Prueba 2: Operación Drag-and-Drop:
   - Diseña un test que arrastre una tarjeta de stock (origen) hacia un contenedor de tienda (destino).
   - Valide que aparezca la ventana modal de "Simulación de Impacto".
   - Simule el clic en "Confirmar traslado" y verifique que se invoque el endpoint correspondiente y se muestre un mensaje de éxito.

4. Flujo de Prueba 3: Chatbot y Búsqueda Semántica:
   - Simule que el usuario escribe en la barra de chat: "¿Cuál es el stock de Air Max en almacén central?".
   - Valide que se envíe la petición y que la respuesta del bot contenga la tabla de productos esperada en formato HTML/Markdown legible.
```

---

## Sub-prompt 2: Pipeline de CI/CD para Gitea Actions (Integración y Despliegue)
**Copia y pega el siguiente prompt en tu asistente de desarrollo:**

```text
Crea el pipeline de CI/CD para automatizar las pruebas y despliegue usando Gitea Actions/Runners:
1. Configuración de Workflow:
   - Crea un archivo en la ruta `.gitea/workflows/ci-cd.yml` para dispararse en cada 'push' o 'pull_request' en la rama `main`.

2. Trabajos de Integración Continua (CI Job):
   - Configura un paso para levantar la base de datos de prueba PostgreSQL con la extensión pgvector mediante Docker.
   - Instala las dependencias del backend, ejecuta linters y corre la suite de pruebas unitarias (`pytest`).
   - Instala dependencias del frontend, compila la aplicación (`npm run build`) y realiza análisis estático de código.

3. Pruebas E2E Automatizadas:
   - Configura un job que levante tanto el backend de FastAPI como el frontend compilado.
   - Ejecute las pruebas E2E de Playwright usando contenedores de navegadores oficiales y guarde los reportes de Playwright como artefactos de la build de Gitea.

4. Despliegue Continuo (CD Job):
   - Al pasar las pruebas con éxito, compila imágenes Docker para el Frontend y Backend.
   - Empuja las imágenes a tu registro de contenedores privado de Gitea o Docker Hub.
   - Configura los comandos de despliegue automatizado en tu entorno objetivo (ej. docker-compose, SSH deploy).
```
