from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
import models, schemas, seguridad
from database import get_db
import shutil
import uuid
from pathlib import Path

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)

@router.post("/", response_model=schemas.UsuarioResponse, status_code=status.HTTP_201_CREATED)
def create_usuario(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    dni_existente = db.query(models.Usuario).filter(models.Usuario.dni_cuit == usuario.dni_cuit).first()
    if dni_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI o CUIT ya está registrado"
        )
    
    hashed_password = seguridad.get_password_hash(usuario.password)
    
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        dni_cuit=usuario.dni_cuit,
        email=usuario.email,
        telefono=usuario.telefono,
        tipo_usuario=usuario.tipo_usuario.value,
        password_hash=hashed_password,
        nombre_empresa=usuario.nombre_empresa,
        color_primario=usuario.color_primario or "#00a650"
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@router.get("/me", response_model=schemas.UsuarioResponse)
def get_mi_perfil(usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)):
    return usuario_actual

@router.patch("/branding", response_model=schemas.UsuarioResponse)
def update_branding(
    branding: schemas.UsuarioBrandingUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if branding.nombre_empresa is not None:
        usuario_actual.nombre_empresa = branding.nombre_empresa
    if branding.color_primario is not None:
        usuario_actual.color_primario = branding.color_primario
        
    db.commit()
    db.refresh(usuario_actual)
    return usuario_actual

@router.post("/logo")
def upload_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa JPG, PNG, WEBP o SVG")
    
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "png"
    filename = f"logo_user_{usuario_actual.id_usuario}_{uuid.uuid4().hex[:6]}.{ext}"
    file_path = upload_dir / filename
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    usuario_actual.logo_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(usuario_actual)
    return {"logo_url": usuario_actual.logo_url}
