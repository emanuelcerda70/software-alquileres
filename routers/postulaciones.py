from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, seguridad
from database import get_db

router = APIRouter(
    prefix="/postulaciones",
    tags=["Postulaciones"]
)

@router.post("/", response_model=schemas.PostulacionResponse)
def create_postulacion(
    postulacion: schemas.PostulacionCreate, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value != "inquilino":
        raise HTTPException(status_code=403, detail="Solo los inquilinos pueden postularse")
    
    nueva_postulacion = models.Postulacion(
        id_propiedad=postulacion.id_propiedad,
        id_inquilino=usuario_actual.id_usuario,
        mensaje_inquilino=postulacion.mensaje_inquilino
    )
    db.add(nueva_postulacion)
    db.commit()
    db.refresh(nueva_postulacion)
    return nueva_postulacion

@router.get("/mis-postulaciones", response_model=List[schemas.PostulacionResponse])
def get_mis_postulaciones(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    postulaciones = db.query(models.Postulacion).filter(models.Postulacion.id_inquilino == usuario_actual.id_usuario).all()
    return postulaciones

@router.get("/propiedad/{id_propiedad}", response_model=List[schemas.PostulacionResponse])
def get_postulaciones_por_propiedad(
    id_propiedad: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == id_propiedad).first()
    if not propiedad or propiedad.id_propietario_gestor != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver estas postulaciones")
        
    postulaciones = db.query(models.Postulacion).filter(models.Postulacion.id_propiedad == id_propiedad).all()
    return postulaciones

@router.patch("/{id_postulacion}/estado", response_model=schemas.PostulacionResponse)
def update_estado_postulacion(
    id_postulacion: int,
    estado_update: schemas.PostulacionEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    postulacion = db.query(models.Postulacion).filter(models.Postulacion.id_postulacion == id_postulacion).first()
    if not postulacion:
        raise HTTPException(status_code=404, detail="Postulacion no encontrada")
        
    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == postulacion.id_propiedad).first()
    if propiedad.id_propietario_gestor != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta postulacion")
        
    postulacion.estado = estado_update.estado.value
    db.commit()
    db.refresh(postulacion)
    return postulacion
