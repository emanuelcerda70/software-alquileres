from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Response, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, seguridad
from database import get_db
import shutil
import uuid
from pathlib import Path

router = APIRouter(
    prefix="/propiedades",
    tags=["Propiedades"]
)

@router.post("/", response_model=schemas.PropiedadResponse)
def create_propiedad(
    propiedad: schemas.PropiedadCreate,
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    if usuario_actual.tipo_usuario.value == "inquilino":
        raise HTTPException(status_code=403, detail="Los inquilinos no pueden publicar propiedades")
    nueva_propiedad = models.Propiedad(
        id_propietario_gestor=usuario_actual.id_usuario,
        calle_direccion=propiedad.calle_direccion,
        ciudad=propiedad.ciudad,
        tipo_inmueble=propiedad.tipo_inmueble.value,
        precio_alquiler_base=propiedad.precio_alquiler_base,
        acepta_mascotas=propiedad.acepta_mascotas,
        ingreso_minimo_requerido=propiedad.ingreso_minimo_requerido,
        estado_publicacion=propiedad.estado_publicacion.value,
        imagen_url=propiedad.imagen_url,
        latitud=propiedad.latitud,
        longitud=propiedad.longitud
    )
    db.add(nueva_propiedad)
    db.commit()
    db.refresh(nueva_propiedad)
    return nueva_propiedad

@router.get("/", response_model=List[schemas.PropiedadResponse])
def get_propiedades_activas(
    ciudad: Optional[str] = Query(None),
    tipo_inmueble: Optional[str] = Query(None),
    precio_max: Optional[float] = Query(None),
    acepta_mascotas: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=100),
    response: Response = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Propiedad).filter(
        models.Propiedad.estado_publicacion == models.EstadoPublicacion.activa
    )
    if ciudad:
        query = query.filter(models.Propiedad.ciudad.ilike(f"%{ciudad}%"))
    if tipo_inmueble:
        query = query.filter(models.Propiedad.tipo_inmueble == tipo_inmueble)
    if precio_max:
        query = query.filter(models.Propiedad.precio_alquiler_base <= precio_max)
    if acepta_mascotas is not None:
        query = query.filter(models.Propiedad.acepta_mascotas == acepta_mascotas)
    
    total = query.count()
    propiedades = query.order_by(models.Propiedad.fecha_creacion.desc()).offset(skip).limit(limit).all()
    
    if response is not None:
        response.headers["X-Total-Count"] = str(total)
        response.headers["Access-Control-Expose-Headers"] = "X-Total-Count"
    return propiedades

@router.get("/{propiedad_id}", response_model=schemas.PropiedadResponse)
def get_propiedad(propiedad_id: int, db: Session = Depends(get_db)):
    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == propiedad_id).first()
    if propiedad is None:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    return propiedad

@router.post("/{propiedad_id}/imagen")
def upload_imagen_propiedad(
    propiedad_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    usuario_actual: models.Usuario = Depends(seguridad.get_usuario_actual)
):
    propiedad = db.query(models.Propiedad).filter(models.Propiedad.id_propiedad == propiedad_id).first()
    if not propiedad:
        raise HTTPException(status_code=404, detail="Propiedad no encontrada")
    if propiedad.id_propietario_gestor != usuario_actual.id_usuario:
        raise HTTPException(status_code=403, detail="Sin permiso para modificar esta propiedad")
    allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Formato no soportado. Usa JPG, PNG o WEBP")
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else "jpg"
    filename = f"prop_{propiedad_id}_{uuid.uuid4().hex[:8]}.{ext}"
    file_path = upload_dir / filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    propiedad.imagen_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(propiedad)
    return {"imagen_url": propiedad.imagen_url}
