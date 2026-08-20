from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, seguridad
from database import get_db

router = APIRouter(
    prefix="/proveedores",
    tags=["Proveedores de Servicio"]
)

def sembrar_proveedores_iniciales(db: Session):
    count = db.query(models.ProveedorServicio).count()
    if count == 0:
        iniciales = [
            models.ProveedorServicio(
                nombre_completo="Carlos Benítez",
                empresa="Plomería & Gas San Juan",
                rubro="plomero",
                matricula="Matrícula CABA #4812",
                ciudad="Buenos Aires",
                telefono="+54 9 11 4512-8890",
                whatsapp="5491145128890",
                tarifa_visita_estimada=15000,
                calificacion=4.9,
                activo=True
            ),
            models.ProveedorServicio(
                nombre_completo="Martín Rossi",
                empresa="ElectroSur Instalaciones",
                rubro="electricista",
                matricula="Técnico Matriculado COPIME",
                ciudad="Buenos Aires",
                telefono="+54 9 11 6723-1100",
                whatsapp="5491167231100",
                tarifa_visita_estimada=18000,
                calificacion=5.0,
                activo=True
            ),
            models.ProveedorServicio(
                nombre_completo="Jorge Albarracín",
                empresa="Gasistas del Centro",
                rubro="gasista",
                matricula="Gasista Matriculado 1ra Cat. #1920",
                ciudad="Rosario",
                telefono="+54 9 341 555-4321",
                whatsapp="5493415554321",
                tarifa_visita_estimada=20000,
                calificacion=4.8,
                activo=True
            ),
            models.ProveedorServicio(
                nombre_completo="Esteban Morales",
                empresa="Cerrajería 24hs Express",
                rubro="cerrajero",
                matricula=None,
                ciudad="Buenos Aires",
                telefono="+54 9 11 3344-9988",
                whatsapp="5491133449988",
                tarifa_visita_estimada=12000,
                calificacion=4.9,
                activo=True
            ),
            models.ProveedorServicio(
                nombre_completo="Lucas Villalba",
                empresa="ClimaTech Refrigeración",
                rubro="aire_acondicionado",
                matricula="Técnico CACAAV #890",
                ciudad="Córdoba",
                telefono="+54 9 351 444-7766",
                whatsapp="5493514447766",
                tarifa_visita_estimada=22000,
                calificacion=5.0,
                activo=True
            )
        ]
        db.add_all(iniciales)
        db.commit()

@router.post("/", response_model=schemas.ProveedorResponse, status_code=status.HTTP_201_CREATED)
def create_proveedor(
    proveedor: schemas.ProveedorCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    id_inmobiliaria = usuario_actual.id_usuario if usuario_actual.tipo_usuario.value in ["inmobiliaria", "propietario"] else None
    
    nuevo_prov = models.ProveedorServicio(
        id_inmobiliaria_creadora=id_inmobiliaria,
        nombre_completo=proveedor.nombre_completo,
        empresa=proveedor.empresa,
        rubro=proveedor.rubro.value,
        matricula=proveedor.matricula,
        ciudad=proveedor.ciudad,
        telefono=proveedor.telefono,
        whatsapp=proveedor.whatsapp.replace("+", "").replace(" ", "").replace("-", ""),
        tarifa_visita_estimada=proveedor.tarifa_visita_estimada,
        calificacion=5.0,
        activo=True
    )
    db.add(nuevo_prov)
    db.commit()
    db.refresh(nuevo_prov)
    return nuevo_prov

@router.get("/", response_model=List[schemas.ProveedorResponse])
def get_proveedores(
    rubro: Optional[str] = Query(None),
    ciudad: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    sembrar_proveedores_iniciales(db)
    
    query = db.query(models.ProveedorServicio).filter(models.ProveedorServicio.activo == True)
    
    if rubro:
        query = query.filter(models.ProveedorServicio.rubro == rubro)
    if ciudad:
        query = query.filter(models.ProveedorServicio.ciudad.ilike(f"%{ciudad}%"))
        
    return query.order_by(models.ProveedorServicio.calificacion.desc()).all()

@router.get("/{proveedor_id}", response_model=schemas.ProveedorResponse)
def get_proveedor(proveedor_id: int, db: Session = Depends(get_db)):
    prov = db.query(models.ProveedorServicio).filter(models.ProveedorServicio.id_proveedor == proveedor_id).first()
    if not prov:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return prov
