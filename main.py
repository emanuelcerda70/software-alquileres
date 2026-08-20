from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import engine
import models
from routers import usuarios

# Creamos las tablas en la base de datos si no existen
models.Base.metadata.create_all(bind=engine)

# Inicializamos la aplicación
app = FastAPI(
    title="API Software Alquileres",
    description="Backend para gestión PropTech MVP",
    version="1.0.0"
)

# Configuración de CORS (Permite que el frontend se comunique con el backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos las rutas
app.include_router(usuarios.router)

# Ruta de prueba para verificar que el servidor está vivo
@app.get("/")
def read_root():
    return {
        "status": "online",
        "mensaje": "Bienvenido a la API de Software Alquileres MVP",
        "version": "1.0.0"
    }

# Punto de entrada para ejecutar el servidor localmente
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
