from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, seguridad
from database import get_db

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/metricas")
def get_metricas(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    rol = usuario_actual.tipo_usuario.value
    if rol == "inquilino":
        postulaciones_pendientes = db.query(models.Postulacion).filter(
            models.Postulacion.id_inquilino == usuario_actual.id_usuario,
            models.Postulacion.estado == models.EstadoPostulacion.pendiente
        ).count()
        contratos_activos = db.query(models.Contrato).filter(
            models.Contrato.id_inquilino == usuario_actual.id_usuario,
            models.Contrato.estado == models.EstadoContrato.activo
        ).count()
        return {
            "propiedades_activas": None,
            "postulaciones_pendientes": postulaciones_pendientes,
            "contratos_activos": contratos_activos,
            "ingresos_mes": None
        }
    else:
        propiedades_activas = db.query(models.Propiedad).filter(
            models.Propiedad.id_propietario_gestor == usuario_actual.id_usuario,
            models.Propiedad.estado_publicacion == models.EstadoPublicacion.activa
        ).count()
        postulaciones_pendientes = db.query(models.Postulacion).join(
            models.Propiedad,
            models.Postulacion.id_propiedad == models.Propiedad.id_propiedad
        ).filter(
            models.Propiedad.id_propietario_gestor == usuario_actual.id_usuario,
            models.Postulacion.estado == models.EstadoPostulacion.pendiente
        ).count()
        contratos_activos = db.query(models.Contrato).filter(
            models.Contrato.id_propietario_gestor == usuario_actual.id_usuario,
            models.Contrato.estado == models.EstadoContrato.activo
        ).count()
        ingresos_mes = db.query(func.sum(models.Contrato.monto_mensual)).filter(
            models.Contrato.id_propietario_gestor == usuario_actual.id_usuario,
            models.Contrato.estado == models.EstadoContrato.activo
        ).scalar() or 0
        return {
            "propiedades_activas": propiedades_activas,
            "postulaciones_pendientes": postulaciones_pendientes,
            "contratos_activos": contratos_activos,
            "ingresos_mes": ingresos_mes
        }
