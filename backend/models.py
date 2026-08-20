from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Enum, DateTime, Text, Date
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class TipoUsuario(enum.Enum):
    inquilino = "inquilino"
    propietario = "propietario"
    inmobiliaria = "inmobiliaria"

class EstadoVerificacion(enum.Enum):
    pendiente = "pendiente"
    verificado = "verificado"
    rechazado = "rechazado"

class Usuario(Base):
    __tablename__ = "usuarios"
    id_usuario = Column(Integer, primary_key=True, index=True, autoincrement=True)
    tipo_usuario = Column(Enum(TipoUsuario), nullable=False)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    dni_cuit = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    telefono = Column(String(30), nullable=False)
    password_hash = Column(String(255), nullable=False)
    estado_verificacion = Column(Enum(EstadoVerificacion), default=EstadoVerificacion.pendiente)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    propiedades = relationship("Propiedad", back_populates="propietario_gestor")

class TipoInmueble(enum.Enum):
    departamento = "departamento"
    casa = "casa"
    duplex = "duplex"
    local_comercial = "local_comercial"

class EstadoPublicacion(enum.Enum):
    activa = "activa"
    pausada = "pausada"
    alquilada = "alquilada"

class Propiedad(Base):
    __tablename__ = "propiedades"
    id_propiedad = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_propietario_gestor = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    calle_direccion = Column(String(200), nullable=False)
    ciudad = Column(String(100), nullable=False)
    tipo_inmueble = Column(Enum(TipoInmueble), nullable=False)
    precio_alquiler_base = Column(Float, nullable=False)
    acepta_mascotas = Column(Boolean, default=False)
    ingreso_minimo_requerido = Column(Float)
    estado_publicacion = Column(Enum(EstadoPublicacion), default=EstadoPublicacion.activa)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    imagen_url = Column(String(500), nullable=True)
    latitud = Column(Float, nullable=True)
    longitud = Column(Float, nullable=True)
    propietario_gestor = relationship("Usuario", back_populates="propiedades")

class EstadoPostulacion(enum.Enum):
    pendiente = "pendiente"
    aprobada = "aprobada"
    rechazada = "rechazada"

class Postulacion(Base):
    __tablename__ = "postulaciones"
    id_postulacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_propiedad = Column(Integer, ForeignKey("propiedades.id_propiedad"), nullable=False)
    id_inquilino = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    mensaje_inquilino = Column(Text, nullable=True)
    estado = Column(Enum(EstadoPostulacion), default=EstadoPostulacion.pendiente)
    fecha_postulacion = Column(DateTime, default=datetime.utcnow)

class EstadoContrato(enum.Enum):
    activo = "activo"
    finalizado = "finalizado"
    rescindido = "rescindido"

class Contrato(Base):
    __tablename__ = "contratos"
    id_contrato = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_propiedad = Column(Integer, ForeignKey("propiedades.id_propiedad"), nullable=False)
    id_inquilino = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_propietario_gestor = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    monto_mensual = Column(Float, nullable=False)
    estado = Column(Enum(EstadoContrato), default=EstadoContrato.activo)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
