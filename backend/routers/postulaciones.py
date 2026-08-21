from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas, seguridad
from database import get_db

router = APIRouter(
    prefix="/postulaciones",
    tags=["Postulaciones y Visitas"]
)

# 1. Iniciar Solicitud de Visita Presencial (Inquilino)
@router.post("/solicitar-visita", response_model=schemas.PostulacionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=schemas.PostulacionResponse, status_code=status.HTTP_201_CREATED)
def solicitar_visita(
    solicitud: schemas.SolicitudVisitaCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value != "inquilino":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los usuarios con rol 'inquilino' pueden agendar visitas o postularse"
        )

    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == solicitud.id_propiedad).first()
    if not propiedad:
        raise HTTPException(status_code=404, detail="La propiedad solicitada no existe")

    # Verificar si ya existe una solicitud activa
    existente = db.query(models.Postulacion).filter(
        models.Postulacion.id_propiedad == solicitud.id_propiedad,
        models.Postulacion.id_inquilino == usuario_actual.id_usuario,
        models.Postulacion.estado.notin_(["rechazada", "aprobada"])
    ).first()

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Ya tienes una solicitud de visita o postulación activa para esta propiedad"
        )

    nueva_postulacion = models.Postulacion(
        id_propiedad=solicitud.id_propiedad,
        id_inquilino=usuario_actual.id_usuario,
        mensaje_inquilino=solicitud.mensaje_inquilino,
        fecha_visita_propuesta=solicitud.fecha_visita_propuesta,
        franja_horaria=solicitud.franja_horaria or "Tarde (14:00 a 18:00)",
        estado="solicitud_visita"
    )

    db.add(nueva_postulacion)
    db.commit()
    db.refresh(nueva_postulacion)
    return nueva_postulacion

# 2. Consultar mis postulaciones (Inquilino)
@router.get("/mis-postulaciones", response_model=List[schemas.PostulacionResponse])
def get_mis_postulaciones(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    return db.query(models.Postulacion).filter(
        models.Postulacion.id_inquilino == usuario_actual.id_usuario
    ).order_by(models.Postulacion.fecha_postulacion.desc()).all()

# 3. Consultar postulaciones recibidas (Propietario / Inmobiliaria)
@router.get("/recibidas", response_model=List[schemas.PostulacionResponse])
def get_postulaciones_recibidas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value not in ["propietario", "inmobiliaria"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para ver estas solicitudes")

    return db.query(models.Postulacion).join(
        models.Propiedad, models.Postulacion.id_propiedad == models.Propiedad.id_propiedad
    ).filter(
        models.Propiedad.id_propietario_gestor == usuario_actual.id_usuario
    ).order_by(models.Postulacion.fecha_postulacion.desc()).all()

# 4. Confirmar Fecha y Hora de Visita (Inmobiliaria / Propietario)
@router.patch("/{id_postulacion}/confirmar-visita", response_model=schemas.PostulacionResponse)
def confirmar_visita(
    id_postulacion: int,
    confirmacion: schemas.ConfirmarVisitaUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    postulacion = db.query(models.Postulacion).filter(models.Postulacion.id_postulacion == id_postulacion).first()
    if not postulacion:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    postulacion.fecha_visita_confirmada = confirmacion.fecha_visita_confirmada
    postulacion.estado = "visita_confirmada"
    db.commit()
    db.refresh(postulacion)
    return postulacion

# 5. Marcar Visita Realizada (Inmobiliaria o Inquilino)
@router.patch("/{id_postulacion}/marcar-visita-realizada", response_model=schemas.PostulacionResponse)
def marcar_visita_realizada(
    id_postulacion: int,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    postulacion = db.query(models.Postulacion).filter(models.Postulacion.id_postulacion == id_postulacion).first()
    if not postulacion:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    postulacion.estado = "visita_realizada"
    db.commit()
    db.refresh(postulacion)
    return postulacion

# 6. Cargar Legajo Digital & Garantes (Inquilino tras la visita)
@router.patch("/{id_postulacion}/cargar-garantes", response_model=schemas.PostulacionResponse)
def cargar_garantes(
    id_postulacion: int,
    datos: schemas.CargarGarantesUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    postulacion = db.query(models.Postulacion).filter(models.Postulacion.id_postulacion == id_postulacion).first()
    if not postulacion:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    if postulacion.id_inquilino != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="No puedes modificar la postulación de otro inquilino")

    postulacion.ingresos_mensuales = datos.ingresos_mensuales
    postulacion.tipo_garantia = datos.tipo_garantia
    postulacion.nombre_garante = datos.nombre_garante
    postulacion.dni_garante = datos.dni_garante
    postulacion.telefono_garante = datos.telefono_garante
    postulacion.ingresos_garante = datos.ingresos_garante
    postulacion.notas_garantia = datos.notas_garantia
    postulacion.estado = "en_evaluacion"

    db.commit()
    db.refresh(postulacion)
    return postulacion

# 7. Evaluar y Aprobar/Rechazar Postulación (Inmobiliaria / Propietario)
@router.patch("/{id_postulacion}/estado", response_model=schemas.PostulacionResponse)
def update_estado_postulacion(
    id_postulacion: int,
    estado_update: schemas.PostulacionEstadoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value not in ["propietario", "inmobiliaria"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para evaluar postulaciones")

    postulacion = db.query(models.Postulacion).join(
        models.Propiedad, models.Postulacion.id_propiedad == models.Propiedad.id_propiedad
    ).filter(
        models.Postulacion.id_postulacion == id_postulacion,
        models.Propiedad.id_propietario_gestor == usuario_actual.id_usuario
    ).first()

    if not postulacion:
        raise HTTPException(status_code=404, detail="Postulación no encontrada o no te pertenece")

    postulacion.estado = estado_update.estado.value
    db.commit()
    db.refresh(postulacion)
    return postulacion
