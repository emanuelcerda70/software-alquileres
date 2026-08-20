from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import enum

class TipoUsuarioEnum(str, enum.Enum):
    inquilino = "inquilino"
    propietario = "propietario"
    inmobiliaria = "inmobiliaria"

class TipoInmuebleEnum(str, enum.Enum):
    departamento = "departamento"
    casa = "casa"
    duplex = "duplex"
    local_comercial = "local_comercial"

class EstadoPublicacionEnum(str, enum.Enum):
    activa = "activa"
    pausada = "pausada"
    alquilada = "alquilada"

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

class PropiedadBase(BaseModel):
    calle_direccion: str
    ciudad: str
    tipo_inmueble: TipoInmuebleEnum
    precio_alquiler_base: float
    acepta_mascotas: bool = False
    ingreso_minimo_requerido: Optional[float] = None
    estado_publicacion: EstadoPublicacionEnum = EstadoPublicacionEnum.activa

class PropiedadCreate(PropiedadBase):
    pass

class PropiedadResponse(PropiedadBase):
    id_propiedad: int
    id_propietario_gestor: int
    fecha_creacion: datetime

    class Config:
        from_attributes = True
