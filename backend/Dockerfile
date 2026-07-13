FROM python:3.12-slim

WORKDIR /workspace

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar configuración de dependencias
COPY pyproject.toml .

# Instalar dependencias utilizando pip
RUN pip install --no-cache-dir .

# Copiar el código del backend
COPY . .

# Exponer el puerto del backend
EXPOSE 8000

# Ejecutar la aplicación FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
