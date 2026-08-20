from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, seguridad
from database import get_db

router = APIRouter(
    prefix="/propiedades",
    tags=["Propiedades"]
)

@router.post("/", response_model=schemas.PropiedadResponse)
def create_propiedad(
    propiedad: schemas.PropiedadCreate, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    # Validamos que solo dueños o inmobiliarias puedan publicar
    if usuario_actual.tipo_usuario.value == "inquilino":
        raise HTTPException(status_code=403, detail="Los inquilinos no pueden publicar propiedades")
    
    nueva_propiedad = models.Propiedad(
        id_propietario_gestor=usuario_actual.id_usuario,
        calle_direccion=propiedad.calle_direccion,
        ciudad=propiedad.ciudad,
        tipo_inmueble=propiedad.tipo_inmueble.value,
        precio_alquiler_base=propiedad.precio_alquiler_base,
        acepta_mascotas=propiedad.acepta_mascotas,
        ingreso_minimo_requerido=propiedad.ingreso_minimo_requerido,
        estado_publicacion=propiedad.estado_publicacion.value
    )
    
    db.add(nueva_propiedad)
    db.commit()
    db.refresh(nueva_propiedad)
    
    return nueva_propiedad

@router.get("/", response_model=List[schemas.PropiedadResponse])
def get_propiedades_activas(db: Session = Depends(get_db)):
    # Ruta pública para ver propiedades disponibles (para el marketplace)
    propiedades = db.query(models.Propiedad).filter(models.Propiedad.estado_publicacion == "activa").all()
    return propiedades

@router.get("/{propiedad_id}", response_model=schemas.PropiedadResponse)
def get_propiedad(propiedad_id: int, db: Session = Depends(get_db)):
    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == propiedad_id).first()
    if propiedad is None:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return propiedad
