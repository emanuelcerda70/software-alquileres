from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from database import engine
import models
from routers import usuarios, autenticacion, propiedades, postulaciones, contratos

# Creamos las tablas en la base de datos si no existen
models.Base.metadata.create_all(bind=engine)

# Inicializamos la aplicación
app = FastAPI(
    title="API Software Alquileres",
    description="Backend para gestión PropTech MVP",
    version="1.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluimos las rutas
app.include_router(autenticacion.router)
app.include_router(usuarios.router)
app.include_router(propiedades.router)
app.include_router(postulaciones.router)
app.include_router(contratos.router)

# Ruta de prueba
@app.get("/")
def read_root():
    return {
        "status": "online",
        "mensaje": "Bienvenido a la API de Software Alquileres MVP",
        "version": "1.0.0"
    }

# Punto de entrada
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
