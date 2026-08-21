from datetime import datetime, timedelta
from typing import Optional
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
import models
from database import get_db

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "clave_secreta_super_segura_para_mvp")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # El token dura 7 días

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_usuario_actual(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub: str = str(payload.get("sub", ""))
        id_usuario = payload.get("id_usuario")
        if not sub and not id_usuario:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    usuario = None
    # 1. Intentar buscar por id_usuario del payload o sub numérico
    target_id = id_usuario if id_usuario else (int(sub) if sub.isdigit() else None)
    if target_id is not None:
        usuario = db.query(models.Usuario).filter(models.Usuario.id_usuario == int(target_id)).first()

    # 2. Si no se encontró y sub es email, buscar por email
    if not usuario and "@" in sub:
        usuario = db.query(models.Usuario).filter(models.Usuario.email == sub.lower().strip()).first()

    if usuario is None:
        raise credentials_exception
    return usuario

