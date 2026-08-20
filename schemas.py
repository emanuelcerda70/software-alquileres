from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import enum

class TipoUsuarioEnum(str, enum.Enum):
    inquilino = "inquilino"
    propietario = "propietario"
    inmobiliaria = "inmobiliaria"

class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    dni_cuit: str
    email: EmailStr
    telefono: str
    tipo_usuario: TipoUsuarioEnum

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    estado_verificacion: str
    fecha_registro: datetime

    class Config:
        from_attributes = True
