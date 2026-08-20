from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from database import engine
import models
from routers import usuarios, autenticacion, propiedades, postulaciones, contratos, dashboard, tickets, proveedores

models.Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="API Software Alquileres",
    description="Backend PropTech MVP con Helpdesk, White-Label y Red de Proveedores",
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count"]
)

app.include_router(autenticacion.router)
app.include_router(usuarios.router)
app.include_router(propiedades.router)
app.include_router(postulaciones.router)
app.include_router(contratos.router)
app.include_router(dashboard.router)
app.include_router(tickets.router)
app.include_router(proveedores.router)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "mensaje": "Bienvenido a la API de Software Alquileres MVP",
        "version": "1.2.0"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
