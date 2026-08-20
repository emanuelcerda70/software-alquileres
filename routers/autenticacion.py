from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import models, seguridad
from database import get_db

router = APIRouter(
    tags=["Autenticación"]
)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Usamos el campo username del formulario estándar para recibir el email
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    
    if not usuario:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    if not seguridad.verify_password(form_data.password, usuario.password_hash):
        raise HTTPException(status_code=400, detail="Credenciales incorrectas")
    
    access_token_expires = timedelta(minutes=seguridad.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = seguridad.create_access_token(
        data={"sub": str(usuario.id_usuario), "rol": usuario.tipo_usuario.value},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
