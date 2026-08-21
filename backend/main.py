from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
import threading
import time
import urllib.request
from database import engine
import models
from routers import usuarios, autenticacion, propiedades, postulaciones, contratos, dashboard, tickets, proveedores

models.Base.metadata.create_all(bind=engine)
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="API Kelvi PropTech",
    description="Backend de Kelvi: El alquiler, simple para todos",
    version="1.3.0"
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
        "mensaje": "Bienvenido a la API de Kelvi - El alquiler, simple para todos",
        "version": "1.3.0"
    }

@app.get("/ping")
def ping():
    """Keep-alive endpoint — usado por el auto-pinger interno."""
    return {"pong": True}

def _keep_alive_worker():
    """Pinga el propio servicio cada 10 minutos para evitar que Render lo duerma."""
    service_url = os.getenv("RENDER_EXTERNAL_URL", "https://kelvi-api.onrender.com")
    ping_url = f"{service_url}/ping"
    time.sleep(60)  # Esperar 1 minuto al arrancar antes del primer ping
    while True:
        try:
            req = urllib.request.Request(ping_url, headers={"User-Agent": "Kelvi-KeepAlive/1.0"})
            urllib.request.urlopen(req, timeout=8)
            print(f"[KELVI PING] Keep-alive OK -> {ping_url}")
        except Exception as e:
            print(f"[KELVI PING] Error: {e}")
        time.sleep(600)  # Cada 10 minutos

# Iniciar keep-alive en hilo de fondo
_ka_thread = threading.Thread(target=_keep_alive_worker, daemon=True)
_ka_thread.start()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

