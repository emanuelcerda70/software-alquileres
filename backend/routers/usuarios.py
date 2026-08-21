from pydantic import BaseModel
from typing import Optional
﻿from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
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

import random
from datetime import datetime, timedelta
import base64
import json

# ─── 1. SOLICITAR CÓDIGO OTP (6 DÍGITOS) POR EMAIL ─────────
@router.post("/solicitar-codigo-otp")
def solicitar_codigo_otp(payload: schemas.SolicitarOTPRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    
    # Generar código de 6 dígitos
    codigo_6_digitos = f"{random.randint(100000, 999999)}"
    expiracion = datetime.utcnow() + timedelta(minutes=10)
    
    # Desactivar códigos anteriores sin usar para este email
    db.query(models.CodigoAcceso).filter(
        models.CodigoAcceso.email == email,
        models.CodigoAcceso.usado == False
    ).update({"usado": True})
    
    nuevo_codigo = models.CodigoAcceso(
        email=email,
        codigo=codigo_6_digitos,
        fecha_expiracion=expiracion,
        usado=False
    )
    db.add(nuevo_codigo)
    db.commit()
    
    # Simulación de envío de correo (en producción con Resend/SMTP)
    print(f"📧 [KELVI OTP] Código de acceso generado para {email}: {codigo_6_digitos}")
    
    return {
        "status": "ok",
        "mensaje": f"Código de acceso enviado a {email}",
        "codigo_demo": codigo_6_digitos, # Retornado para pruebas inmediatas y desarrollo
        "expira_en_minutos": 10
    }

# ─── 2. VERIFICAR CÓDIGO OTP (6 DÍGITOS) & LOGIN ───────────
@router.post("/verificar-codigo-otp", response_model=schemas.TokenResponse)
def verificar_codigo_otp(payload: schemas.VerificarOTPRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    codigo = payload.codigo.strip()
    
    # Buscar código válido
    registro = db.query(models.CodigoAcceso).filter(
        models.CodigoAcceso.email == email,
        models.CodigoAcceso.codigo == codigo,
        models.CodigoAcceso.usado == False,
        models.CodigoAcceso.fecha_expiracion > datetime.utcnow()
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de acceso inválido o expirado"
        )
    
    # Marcar código como usado
    registro.usado = True
    db.commit()
    
    # Buscar o crear usuario
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario:
        nombre = payload.nombre or email.split("@")[0].capitalize()
        apellido = payload.apellido or "Kelvi"
        dni_aleatorio = f"OTP{random.randint(10000000, 99999999)}"
        
        usuario = models.Usuario(
            nombre=nombre,
            apellido=apellido,
            dni_cuit=dni_aleatorio,
            email=email,
            telefono="+5491100000000",
            tipo_usuario=payload.tipo_usuario or models.TipoUsuario.inquilino,
            password_hash=seguridad.get_password_hash(f"OTP_{random.randint(10000, 99999)}!"),
            estado_verificacion=models.EstadoVerificacion.verificado
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
    
    # Generar JWT
    access_token_expires = timedelta(minutes=seguridad.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = seguridad.create_access_token(
        data={"sub": usuario.email, "id_usuario": usuario.id_usuario, "rol": usuario.tipo_usuario.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": usuario
    }

# ─── 3. INICIO DE SESIÓN CON GOOGLE (OAUTH 2.0 / GIS) ──────
@router.post("/google-login", response_model=schemas.TokenResponse)
def google_login(payload: schemas.GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        # Decodificar el payload del token JWT de Google
        parts = payload.credential.split(".")
        if len(parts) < 2:
            raise HTTPException(status_code=400, detail="Token de Google inválido")
            
        payload_b64 = parts[1]
        # Agregar padding si es necesario
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        decoded_bytes = base64.urlsafe_b64decode(payload_b64)
        google_data = json.loads(decoded_bytes.decode("utf-8"))
        
        email = google_data.get("email", "").lower().strip()
        if not email:
            raise HTTPException(status_code=400, detail="El token de Google no contiene un email válido")
            
        nombre = google_data.get("given_name", "Usuario")
        apellido = google_data.get("family_name", "Google")
        foto_url = google_data.get("picture", None)
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar credencial de Google: {str(e)}")
        
    # Buscar o crear el usuario en Kelvi
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario:
        dni_aleatorio = f"GGL{random.randint(10000000, 99999999)}"
        usuario = models.Usuario(
            nombre=nombre,
            apellido=apellido,
            dni_cuit=dni_aleatorio,
            email=email,
            telefono="+5491100000000",
            tipo_usuario=payload.tipo_usuario or models.TipoUsuario.inquilino,
            password_hash=seguridad.get_password_hash(f"GGL_{random.randint(10000, 99999)}!"),
            logo_url=foto_url,
            estado_verificacion=models.EstadoVerificacion.verificado
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)
        
    # Generar JWT de Kelvi
    access_token_expires = timedelta(minutes=seguridad.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = seguridad.create_access_token(
        data={"sub": usuario.email, "id_usuario": usuario.id_usuario, "rol": usuario.tipo_usuario.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": usuario
    }


# ─── 4. REGISTRO COMPLETO CON VERIFICACIÓN DE CÓDIGO POR EMAIL ───
@router.post("/registro-con-verificacion", status_code=status.HTTP_201_CREATED)
def registro_con_verificacion(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    email_clean = usuario.email.lower().strip()
    
    # 1. Validar que no exista
    if db.query(models.Usuario).filter(models.Usuario.email == email_clean).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado en Kelvi"
        )
    
    if db.query(models.Usuario).filter(models.Usuario.dni_cuit == usuario.dni_cuit.strip()).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El DNI o CUIT ya está registrado"
        )
    
    # 2. Crear usuario en estado PENDIENTE de verificación
    nuevo_usuario = models.Usuario(
        nombre=usuario.nombre.strip(),
        apellido=usuario.apellido.strip(),
        dni_cuit=usuario.dni_cuit.strip(),
        email=email_clean,
        telefono=usuario.telefono.strip(),
        tipo_usuario=usuario.tipo_usuario.value if hasattr(usuario.tipo_usuario, 'value') else usuario.tipo_usuario,
        password_hash=seguridad.get_password_hash(usuario.password),
        nombre_empresa=usuario.nombre_empresa.strip() if usuario.nombre_empresa else None,
        color_primario=usuario.color_primario or "#00a650",
        estado_verificacion=models.EstadoVerificacion.pendiente
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    # 3. Generar código OTP de 6 dígitos
    codigo_6_digitos = f"{random.randint(100000, 999999)}"
    expiracion = datetime.utcnow() + timedelta(minutes=15)
    
    db.query(models.CodigoAcceso).filter(
        models.CodigoAcceso.email == email_clean,
        models.CodigoAcceso.usado == False
    ).update({"usado": True})
    
    nuevo_codigo = models.CodigoAcceso(
        email=email_clean,
        codigo=codigo_6_digitos,
        fecha_expiracion=expiracion,
        usado=False
    )
    db.add(nuevo_codigo)
    db.commit()
    
    print(f"📧 [KELVI REGISTRO] Código de activación para {email_clean}: {codigo_6_digitos}")
    
    return {
        "status": "ok",
        "mensaje": f"Usuario registrado. Te enviamos un código de verificación a {email_clean}",
        "email": email_clean,
        "codigo_demo": codigo_6_digitos
    }

# ─── 5. ACTIVAR CUENTA TRAS VERIFICAR CÓDIGO EMAIL ──────────
@router.post("/activar-cuenta-otp", response_model=schemas.TokenResponse)
def activar_cuenta_otp(payload: schemas.VerificarOTPRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    codigo = payload.codigo.strip()
    
    registro = db.query(models.CodigoAcceso).filter(
        models.CodigoAcceso.email == email_clean,
        models.CodigoAcceso.codigo == codigo,
        models.CodigoAcceso.usado == False,
        models.CodigoAcceso.fecha_expiracion > datetime.utcnow()
    ).first()
    
    if not registro:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código de verificación inválido o expirado"
        )
    
    registro.usado = True
    
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email_clean).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    usuario.estado_verificacion = models.EstadoVerificacion.verificado
    db.commit()
    db.refresh(usuario)
    
    access_token_expires = timedelta(minutes=seguridad.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = seguridad.create_access_token(
        data={"sub": usuario.email, "id_usuario": usuario.id_usuario, "rol": usuario.tipo_usuario.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "usuario": usuario
    }

# ─── 6. CORROBORAR / COMPLETAR DATOS TRAS LOGIN GOOGLE ──────
class CorroborarDatosGoogleRequest(BaseModel):
    nombre: str
    apellido: str
    dni_cuit: str
    telefono: str
    tipo_usuario: schemas.TipoUsuarioEnum
    nombre_empresa: Optional[str] = None

@router.patch("/completar-datos-google", response_model=schemas.UsuarioResponse)
def completar_datos_google(
    payload: CorroborarDatosGoogleRequest,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    usuario_actual.nombre = payload.nombre.strip()
    usuario_actual.apellido = payload.apellido.strip()
    usuario_actual.dni_cuit = payload.dni_cuit.strip()
    usuario_actual.telefono = payload.telefono.strip()
    usuario_actual.tipo_usuario = payload.tipo_usuario.value if hasattr(payload.tipo_usuario, 'value') else payload.tipo_usuario
    if payload.nombre_empresa:
        usuario_actual.nombre_empresa = payload.nombre_empresa.strip()
    
    usuario_actual.estado_verificacion = models.EstadoVerificacion.verificado
    db.commit()
    db.refresh(usuario_actual)
    return usuario_actual
