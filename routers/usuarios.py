from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import models, schemas
from database import get_db

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

@router.post("/", response_model=schemas.UsuarioResponse)
def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    # Verificar si el email o dni ya existen
    db_usuario = db.query(models.Usuario).filter(
        (models.Usuario.email == usuario.email) | (models.Usuario.dni_cuit == usuario.dni_cuit)
    ).first()
    
    if db_usuario:
        raise HTTPException(status_code=400, detail="El email o DNI/CUIT ya está registrado")
    
    # Crear nuevo usuario
    nuevo_usuario = models.Usuario(
        tipo_usuario=usuario.tipo_usuario,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        dni_cuit=usuario.dni_cuit,
        email=usuario.email,
        telefono=usuario.telefono,
        password_hash=usuario.password  # TODO: Hashear esto en el paso de autenticación
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return nuevo_usuario

@router.get("/{usuario_id}", response_model=schemas.UsuarioResponse)
def get_usuario(usuario_id: int, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == usuario_id).first()
    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario
