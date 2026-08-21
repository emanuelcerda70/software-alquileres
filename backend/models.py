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
    
    # White-Label Branding (Inmobiliarias)
    nombre_empresa = Column(String(150), nullable=True)
    logo_url = Column(String(500), nullable=True)
    color_primario = Column(String(20), nullable=True, default="#00a650")

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
    solicitud_visita = "solicitud_visita"
    visita_confirmada = "visita_confirmada"
    visita_realizada = "visita_realizada"
    en_evaluacion = "en_evaluacion"
    aprobada = "aprobada"
    rechazada = "rechazada"

class Postulacion(Base):
    __tablename__ = "postulaciones"
    id_postulacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_propiedad = Column(Integer, ForeignKey("propiedades.id_propiedad"), nullable=False)
    id_inquilino = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    mensaje_inquilino = Column(Text, nullable=True)
    estado = Column(Enum(EstadoPostulacion), default=EstadoPostulacion.solicitud_visita)
    
    # 1. Agendamiento de Visitas Presenciales
    fecha_visita_propuesta = Column(Date, nullable=True)
    franja_horaria = Column(String(100), nullable=True) # Ej: "Mañana (09:00 a 13:00)"
    fecha_visita_confirmada = Column(String(100), nullable=True) # Ej: "Sábado 24/08 a las 11:30 hs"
    
    # 2. Legajo Digital del Inquilino & Garantes
    ingresos_mensuales = Column(Float, nullable=True)
    tipo_garantia = Column(String(100), nullable=True) # Garantía Propietaria, Seguro Caución, Recibo Sueldo Garante
    nombre_garante = Column(String(150), nullable=True)
    dni_garante = Column(String(30), nullable=True)
    telefono_garante = Column(String(30), nullable=True)
    ingresos_garante = Column(Float, nullable=True)
    notas_garantia = Column(Text, nullable=True)
    
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

class PrioridadTicket(enum.Enum):
    baja = "baja"
    media = "media"
    alta = "alta"
    urgente = "urgente"

class EstadoTicket(enum.Enum):
    abierto = "abierto"
    en_progreso = "en_progreso"
    resuelto = "resuelto"
    cancelado = "cancelado"

class TicketMantenimiento(Base):
    __tablename__ = "tickets_mantenimiento"
    id_ticket = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_propiedad = Column(Integer, ForeignKey("propiedades.id_propiedad"), nullable=False)
    id_inquilino = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    id_destinatario = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=False)
    titulo = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    prioridad = Column(Enum(PrioridadTicket), default=PrioridadTicket.media)
    estado = Column(Enum(EstadoTicket), default=EstadoTicket.abierto)
    proveedor_asignado = Column(String(150), nullable=True)
    costo_estimado = Column(Float, nullable=True)
    respuesta_gestor = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_resolucion = Column(DateTime, nullable=True)

class RubroServicio(enum.Enum):
    electricista = "electricista"
    plomero = "plomero"
    gasista = "gasista"
    pintor = "pintor"
    cerrajero = "cerrajero"
    aire_acondicionado = "aire_acondicionado"
    albanileria = "albanileria"
    limpieza = "limpieza"
    otro = "otro"

class ProveedorServicio(Base):
    __tablename__ = "proveedores_servicio"
    id_proveedor = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_inmobiliaria_creadora = Column(Integer, ForeignKey("usuarios.id_usuario"), nullable=True)
    nombre_completo = Column(String(150), nullable=False)
    empresa = Column(String(150), nullable=True)
    rubro = Column(Enum(RubroServicio), nullable=False)
    matricula = Column(String(100), nullable=True)
    ciudad = Column(String(100), nullable=False)
    telefono = Column(String(30), nullable=False)
    whatsapp = Column(String(30), nullable=False)
    tarifa_visita_estimada = Column(Float, nullable=True)
    calificacion = Column(Float, default=5.0)
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

class CodigoAcceso(Base):
    __tablename__ = "codigos_acceso"
    id_codigo = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(150), index=True, nullable=False)
    codigo = Column(String(10), nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    fecha_expiracion = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False)
