from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models, schemas, seguridad
from database import get_db

router = APIRouter(
    prefix="/tickets",
    tags=["Tickets de Mantenimiento"]
)

@router.post("/", response_model=schemas.TicketMantenimientoResponse, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket: schemas.TicketMantenimientoCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value != "inquilino":
        raise HTTPException(
            status_code=403,
            detail="Solo los inquilinos pueden abrir tickets de reclamos o mantenimiento"
        )
    
    # Buscar propiedad para obtener el destinatario (propietario o inmobiliaria)
    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == ticket.id_propiedad).first()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    
    nuevo_ticket = models.TicketMantenimiento(
        id_propiedad=ticket.id_propiedad,
        id_inquilino=usuario_actual.id_usuario,
        id_destinatario=propiedad.id_propietario_gestor,
        titulo=ticket.titulo,
        descripcion=ticket.descripcion,
        prioridad=ticket.prioridad.value,
        estado="abierto"
    )
    
    db.add(nuevo_ticket)
    db.commit()
    db.refresh(nuevo_ticket)
    return nuevo_ticket

@router.get("/mis-tickets", response_model=List[schemas.TicketMantenimientoResponse])
def get_mis_tickets_inquilino(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    return db.query(models.TicketMantenimiento).filter(
        models.TicketMantenimiento.id_inquilino == usuario_actual.id_usuario
    ).order_by(models.TicketMantenimiento.fecha_creacion.desc()).all()

@router.get("/recibidos", response_model=List[schemas.TicketMantenimientoResponse])
def get_tickets_recibidos(
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    return db.query(models.TicketMantenimiento).filter(
        models.TicketMantenimiento.id_destinatario == usuario_actual.id_usuario
    ).order_by(models.TicketMantenimiento.fecha_creacion.desc()).all()

@router.patch("/{ticket_id}", response_model=schemas.TicketMantenimientoResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: schemas.TicketMantenimientoUpdate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    ticket = db.query(models.TicketMantenimiento).filter(
        models.TicketMantenimiento.id_ticket == ticket_id
    ).first()
    
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket no encontrado")
        
    if ticket.id_destinatario != usuario_actual.id_usuario and ticket.id_inquilino != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="Sin permiso para modificar este ticket")
        
    if ticket_update.estado is not None:
        ticket.estado = ticket_update.estado.value
        if ticket_update.estado.value == "resuelto":
            ticket.fecha_resolucion = datetime.utcnow()
            
    if ticket_update.proveedor_asignado is not None:
        ticket.proveedor_asignado = ticket_update.proveedor_asignado
        
    if ticket_update.costo_estimado is not None:
        ticket.costo_estimado = ticket_update.costo_estimado
        
    if ticket_update.respuesta_gestor is not None:
        ticket.respuesta_gestor = ticket_update.respuesta_gestor
        
    db.commit()
    db.refresh(ticket)
    return ticket
