from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date
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

class EstadoPostulacionEnum(str, enum.Enum):
    pendiente = "pendiente"
    aprobada = "aprobada"
    rechazada = "rechazada"

class EstadoContratoEnum(str, enum.Enum):
    activo = "activo"
    finalizado = "finalizado"
    rescindido = "rescindido"

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
    imagen_url: Optional[str] = None
    latitud: Optional[float] = None
    longitud: Optional[float] = None

class PropiedadCreate(PropiedadBase):
    pass

class PropiedadResponse(PropiedadBase):
    id_propiedad: int
    id_propietario_gestor: int
    fecha_creacion: datetime
    class Config:
        from_attributes = True

class PostulacionBase(BaseModel):
    id_propiedad: int
    mensaje_inquilino: Optional[str] = None

class PostulacionCreate(PostulacionBase):
    pass

class PostulacionResponse(PostulacionBase):
    id_postulacion: int
    id_inquilino: int
    estado: EstadoPostulacionEnum
    fecha_postulacion: datetime
    class Config:
        from_attributes = True

class PostulacionEstadoUpdate(BaseModel):
    estado: EstadoPostulacionEnum

class ContratoBase(BaseModel):
    id_propiedad: int
    id_inquilino: int
    fecha_inicio: date
    fecha_fin: date
    monto_mensual: float

class ContratoCreate(ContratoBase):
    pass

class ContratoResponse(ContratoBase):
    id_contrato: int
    id_propietario_gestor: int
    estado: EstadoContratoEnum
    fecha_creacion: datetime
    class Config:
        from_attributes = True

class ContratoEstadoUpdate(BaseModel):
    estado: EstadoContratoEnum
