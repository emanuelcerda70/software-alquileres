from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas, seguridad
from database import get_db

router = APIRouter(
    prefix="/contratos",
    tags=["Contratos"]
)

@router.post("/", response_model=schemas.ContratoResponse)
def create_contrato(
    contrato: schemas.ContratoCreate, 
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value == "inquilino":
        raise HTTPException(status_code=403, detail="Los inquilinos no pueden crear contratos")
        
    nuevo_contrato = models.Contrato(
        id_propiedad=contrato.id_propiedad,
        id_inquilino=contrato.id_inquilino,
        id_propietario_gestor=usuario_actual.id_usuario,
        fecha_inicio=contrato.fecha_inicio,
        fecha_fin=contrato.fecha_fin,
        monto_mensual=contrato.monto_mensual
    )
    db.add(nuevo_contrato)
    db.commit()
    db.refresh(nuevo_contrato)
    return nuevo_contrato

@router.get("/mis-contratos-propietario", response_model=List[schemas.ContratoResponse])
def get_mis_contratos_propietario(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    contratos = db.query(models.Contrato).filter(
        models.Contrato.id_propietario_gestor == usuario_actual.id_usuario
    ).all()
    return contratos

@router.get("/mis-contratos", response_model=List[schemas.ContratoResponse])
def get_mis_contratos(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value == "inquilino":
        contratos = db.query(models.Contrato).filter(models.Contrato.id_inquilino == usuario_actual.id_usuario).all()
    else:
        contratos = db.query(models.Contrato).filter(models.Contrato.id_propietario_gestor == usuario_actual.id_usuario).all()
    return contratos

@router.get("/{id_contrato}", response_model=schemas.ContratoResponse)
def get_contrato(
    id_contrato: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    contrato = db.query(models.Contrato).filter(models.Contrato.id_contrato == id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
    if contrato.id_inquilino != usuario_actual.id_usuario and contrato.id_propietario_gestor != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="No tienes permiso para ver este contrato")
        
    return contrato

@router.patch("/{id_contrato}/estado", response_model=schemas.ContratoResponse)
def update_estado_contrato(
    id_contrato: int,
    estado_update: schemas.ContratoEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    contrato = db.query(models.Contrato).filter(models.Contrato.id_contrato == id_contrato).first()
    if not contrato:
        raise HTTPException(status_code=404, detail="Contrato no encontrado")
        
    if contrato.id_propietario_gestor != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="Solo el propietario/gestor puede modificar el estado del contrato")
        
    contrato.estado = estado_update.estado.value
    db.commit()
    db.refresh(contrato)
    return contrato
