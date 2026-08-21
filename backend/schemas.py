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
    solicitud_visita = "solicitud_visita"
    visita_confirmada = "visita_confirmada"
    visita_realizada = "visita_realizada"
    en_evaluacion = "en_evaluacion"
    aprobada = "aprobada"
    rechazada = "rechazada"

class EstadoContratoEnum(str, enum.Enum):
    activo = "activo"
    finalizado = "finalizado"
    rescindido = "rescindido"

class PrioridadTicketEnum(str, enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    urgente = "urgente"

class EstadoTicketEnum(str, enum.Enum):
    abierto = "abierto"
    en_progreso = "en_progreso"
    resuelto = "resuelto"
    cancelado = "cancelado"

class RubroServicioEnum(str, enum.Enum):
    electricista = "electricista"
    plomero = "plomero"
    gasista = "gasista"
    pintor = "pintor"
    cerrajero = "cerrajero"
    aire_acondicionado = "aire_acondicionado"
    albanileria = "albanileria"
    limpieza = "limpieza"
    otro = "otro"

# ─── USUARIOS & BRANDING ──────────────────────────────────
class UsuarioBase(BaseModel):
    nombre: str
    apellido: str
    dni_cuit: str
    email: EmailStr
    telefono: str
    tipo_usuario: TipoUsuarioEnum
    nombre_empresa: Optional[str] = None
    logo_url: Optional[str] = None
    color_primario: Optional[str] = "#00a650"

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    estado_verificacion: str
    fecha_registro: datetime
    class Config:
        from_attributes = True

class UsuarioBrandingUpdate(BaseModel):
    nombre_empresa: Optional[str] = None
    color_primario: Optional[str] = "#00a650"

# ─── PROPIEDADES ──────────────────────────────────────────
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

# ─── POSTULACIONES & VISITAS ──────────────────────────────
class SolicitudVisitaCreate(BaseModel):
    id_propiedad: int
    mensaje_inquilino: Optional[str] = None
    fecha_visita_propuesta: Optional[date] = None
    franja_horaria: Optional[str] = "Tarde (14:00 a 18:00)"

class ConfirmarVisitaUpdate(BaseModel):
    fecha_visita_confirmada: str

class CargarGarantesUpdate(BaseModel):
    ingresos_mensuales: float
    tipo_garantia: str
    nombre_garante: str
    dni_garante: str
    telefono_garante: str
    ingresos_garante: float
    notas_garantia: Optional[str] = None

class PostulacionResponse(BaseModel):
    id_postulacion: int
    id_propiedad: int
    id_inquilino: int
    mensaje_inquilino: Optional[str] = None
    estado: EstadoPostulacionEnum
    fecha_visita_propuesta: Optional[date] = None
    franja_horaria: Optional[str] = None
    fecha_visita_confirmada: Optional[str] = None
    ingresos_mensuales: Optional[float] = None
    tipo_garantia: Optional[str] = None
    nombre_garante: Optional[str] = None
    dni_garante: Optional[str] = None
    telefono_garante: Optional[str] = None
    ingresos_garante: Optional[float] = None
    notas_garantia: Optional[str] = None
    fecha_postulacion: datetime
    class Config:
        from_attributes = True

class PostulacionEstadoUpdate(BaseModel):
    estado: EstadoPostulacionEnum

# ─── CONTRATOS ────────────────────────────────────────────
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

# ─── TICKETS DE MANTENIMIENTO ─────────────────────────────
class TicketMantenimientoBase(BaseModel):
    id_propiedad: int
    titulo: str
    descripcion: str
    prioridad: PrioridadTicketEnum = PrioridadTicketEnum.media

class TicketMantenimientoCreate(TicketMantenimientoBase):
    pass

class TicketMantenimientoResponse(TicketMantenimientoBase):
    id_ticket: int
    id_inquilino: int
    id_destinatario: int
    estado: EstadoTicketEnum
    proveedor_asignado: Optional[str] = None
    costo_estimado: Optional[float] = None
    respuesta_gestor: Optional[str] = None
    fecha_creacion: datetime
    fecha_resolucion: Optional[datetime] = None
    class Config:
        from_attributes = True

class TicketMantenimientoUpdate(BaseModel):
    estado: Optional[EstadoTicketEnum] = None
    proveedor_asignado: Optional[str] = None
    costo_estimado: Optional[float] = None
    respuesta_gestor: Optional[str] = None

# ─── PROVEEDORES DE SERVICIOS ─────────────────────────────
class ProveedorBase(BaseModel):
    nombre_completo: str
    empresa: Optional[str] = None
    rubro: RubroServicioEnum
    matricula: Optional[str] = None
    ciudad: str
    telefono: str
    whatsapp: str
    tarifa_visita_estimada: Optional[float] = None

class ProveedorCreate(ProveedorBase):
    pass

class ProveedorResponse(ProveedorBase):
    id_proveedor: int
    id_inmobiliaria_creadora: Optional[int] = None
    calificacion: float
    activo: bool
    fecha_registro: datetime
    class Config:
        from_attributes = True
