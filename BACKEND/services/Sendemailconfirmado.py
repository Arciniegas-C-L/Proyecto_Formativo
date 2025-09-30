# services/Sendemailconfirmado.py
from decimal import Decimal
from typing import Optional, Iterable, Tuple
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.core.validators import validate_email
from django.core.exceptions import ValidationError

# ───────────────────────── helpers ─────────────────────────

def _norm(s: Optional[str]) -> Optional[str]:
    if not isinstance(s, str):
        return None
    s = s.strip()
    return s or None

def _is_valid_email(v: Optional[str]) -> bool:
    v = _norm(v)
    if not v:
        return False
    try:
        validate_email(v)
        return True
    except ValidationError:
        return False

def _email_from_usuario(u) -> Optional[str]:
    if not u:
        return None
    for attr in ("email", "correo", "correo_electronico"):
        val = _norm(getattr(u, attr, None))
        if _is_valid_email(val):
            return val
    return None

def _email_from_factura(factura) -> Optional[str]:
    for attr in ("cliente_email", "usuario_email", "email"):
        val = _norm(getattr(factura, attr, None))
        if _is_valid_email(val):
            return val
    return _email_from_usuario(getattr(factura, "usuario", None))

def _email_from_pedido(pedido) -> Optional[str]:
    for attr in ("cliente_email", "email"):
        if hasattr(pedido, attr):
            val = _norm(getattr(pedido, attr, None))
            if _is_valid_email(val):
                return val
    return _email_from_usuario(getattr(pedido, "usuario", None))

def _try_url(obj, *names) -> Optional[str]:
    """
    Retorna la primera URL válida entre campos comunes:
    .url (File/ImageField), o la cadena si parece URL absoluta (/media/... o http...).
    """
    for n in names:
        if not hasattr(obj, n):
            continue
        val = getattr(obj, n)
        # FileField/ImageField con .url
        try:
            url = getattr(val, "url", None)
            if url:
                return str(url)
        except Exception:
            pass
        # string directa
        if isinstance(val, str):
            v = val.strip()
            if v.startswith(("http://", "https://", "/")):
                return v
    return None

def _producto_image_url(prod) -> Optional[str]:
    """
    Intenta resolver la URL de imagen del producto considerando varios nombres comunes.
    Si tienes un modelo de galería relacionado, intenta tomar la primera imagen.
    Ajusta los nombres a tu modelo real si difieren.
    """
    # Campos comunes en el propio producto
    url = _try_url(prod, "imagen", "image", "imagen_url", "image_url", "portada", "foto", "thumbnail")
    if url:
        return url

    # Relación común: producto.imagenes.first().imagen.url / image.url
    for rel_name in ("imagenes", "images", "fotos", "galeria", "gallery"):
        if hasattr(prod, rel_name):
            try:
                first = getattr(prod, rel_name).all().first()
                if first:
                    url = _try_url(first, "imagen", "image", "url", "archivo", "file")
                    if url:
                        return url
            except Exception:
                pass
    return None

def _safe_get_categoria_tuple(prod) -> Tuple[Optional[str], Optional[str]]:
    """
    Retorna (categoria, subcategoria) si existen en relaciones típicas:
    producto.subcategoria.categoria / producto.subcategoria
    """
    subc = getattr(prod, "subcategoria", None)
    sub = getattr(subc, "nombre", None) or getattr(subc, "titulo", None)
    cat_obj = getattr(subc, "categoria", None)
    cat = getattr(cat_obj, "nombre", None) or getattr(cat_obj, "titulo", None)
    return (cat, sub)

def _safe_grupo_tallas(it) -> Optional[str]:
    """
    Intenta obtener el nombre del grupo de tallas desde:
    item.talla.grupo / item.talla.grupo_tallas / producto.grupo_tallas
    """
    talla = getattr(it, "talla", None)
    if talla:
        for attr in ("grupo", "grupo_tallas", "grupoTallas"):
            g = getattr(talla, attr, None)
            nombre = getattr(g, "nombre", None) or getattr(g, "codigo", None)
            if nombre:
                return str(nombre)
    prod = getattr(it, "producto", None)
    if prod:
        g = getattr(prod, "grupo_tallas", None) or getattr(prod, "grupoTallas", None)
        nombre = getattr(g, "nombre", None) or getattr(g, "codigo", None)
        if nombre:
            return str(nombre)
    return None

def _items_iter(items_qs) -> Iterable[dict]:
    """
    Convierte items (Factura.items o Pedido.items/pedidoitem_set) a dicts sin romper
    si el modelo NO tiene 'talla' u otras relaciones. Hace select_related dinámico.
    """
    from django.core.exceptions import FieldDoesNotExist

    def _has_field(model, name: str) -> bool:
        try:
            model._meta.get_field(name)
            return True
        except FieldDoesNotExist:
            return False

    qs = items_qs
    model = getattr(qs, "model", None)
    sr = []

    if model and _has_field(model, "producto"):
        sr.append("producto")
        prod_model = model._meta.get_field("producto").related_model
        if prod_model and _has_field(prod_model, "subcategoria"):
            sr.append("producto__subcategoria")
            subc_model = prod_model._meta.get_field("subcategoria").related_model
            if subc_model and _has_field(subc_model, "categoria"):
                sr.append("producto__subcategoria__categoria")

    if model and _has_field(model, "talla"):
        sr.append("talla")

    try:
        qs = qs.select_related(*sr) if sr else qs
        items = list(qs)
    except Exception:
        items = list(items_qs.all())

    for it in items:
        prod = getattr(it, "producto", None)

        nombre = (
            getattr(it, "descripcion", None)
            or (prod and getattr(prod, "nombre", None))
            or "-"
        )

        # talla puede no existir en el modelo de item
        talla_obj = getattr(it, "talla", None) if hasattr(it, "talla") else None
        talla = (
            getattr(talla_obj, "nombre", None)
            or getattr(talla_obj, "codigo", None)
            or ""
        )

        # categoría / subcategoría (si existen)
        subc = getattr(prod, "subcategoria", None) if prod else None
        sub = getattr(subc, "nombre", None) or getattr(subc, "titulo", None)
        cat_obj = getattr(subc, "categoria", None) if subc else None
        cat = getattr(cat_obj, "nombre", None) or getattr(cat_obj, "titulo", None)

        # grupo de tallas (si existe)
        grupo = None
        if talla_obj:
            for attr in ("grupo", "grupo_tallas", "grupoTallas"):
                g = getattr(talla_obj, attr, None)
                nombre_g = getattr(g, "nombre", None) or getattr(g, "codigo", None)
                if nombre_g:
                    grupo = str(nombre_g)
                    break
        if not grupo and prod:
            g = getattr(prod, "grupo_tallas", None) or getattr(prod, "grupoTallas", None)
            nombre_g = getattr(g, "nombre", None) or getattr(g, "codigo", None)
            if nombre_g:
                grupo = str(nombre_g)

        img = _producto_image_url(prod) if prod else None

        yield {
            "nombre": str(nombre),
            "categoria": (str(cat) if cat else None),
            "subcategoria": (str(sub) if sub else None),
            "grupo_tallas": (str(grupo) if grupo else None),
            "talla": (str(talla) if talla else ""),
            "cantidad": int(getattr(it, "cantidad", 0) or 0),
            "image_url": img,
        }


# ───────────────────────── email ─────────────────────────

def _build_html(numero_ref: str, items: Iterable[dict]) -> Tuple[str, str]:
    """
    Construye (text_plain, html) SOLO con datos de productos usando Bootstrap.
    Incluye una lista estilizada con Bootstrap en el HTML.
    """
    plain_lines = [f"Compra confirmada #{numero_ref}", "", "Productos:"]

    html_lines = [
        "<!DOCTYPE html>",
        "<html lang='es'>",
        "<head>",
        "  <meta charset='UTF-8'>",
        "  <meta name='viewport' content='width=device-width, initial-scale=1'>",
        "  <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css' rel='stylesheet'>",
        f"  <title>Compra Confirmada #{numero_ref}</title>",
        "</head>",
        "<body class='bg-light'>",
        "  <div class='container my-4'>",
        "    <div class='card shadow-sm'>",
        "      <div class='card-body'>",
        f"        <h2 class='card-title text-success mb-3'>Compra confirmada #{numero_ref}</h2>",
        "        <p class='card-text text-muted'>Gracias por tu compra. Este es el resumen de tu pedido:</p>",
        "        <ul class='list-group list-group-flush mb-3'>"
    ]

    for it in items:
        # Texto plano
        line = f"- {it['nombre']} x{it['cantidad']}"
        if it["talla"]:
            line += f" (Talla {it['talla']})"
        if it["categoria"] or it["subcategoria"]:
            line += f" — {it['categoria'] or ''}/{it['subcategoria'] or ''}".rstrip("/")
        if it["grupo_tallas"]:
            line += f" — Grupo: {it['grupo_tallas']}"
        plain_lines.append(line)

        # HTML con Bootstrap
        html_line = f"<li class='list-group-item'>{line}</li>"
        html_lines.append(html_line)

    html_lines.append("        </ul>")
    html_lines.append("        <p class='text-muted'>Si tienes dudas, responde a este correo. —variedadezyestiloszoe@gmail.com</p>")
    html_lines.append("      </div>")
    html_lines.append("    </div>")
    html_lines.append("  </div>")
    html_lines.append("</body>")
    html_lines.append("</html>")

    return ("\n".join(plain_lines), "\n".join(html_lines))


# ───────────────────────── API pública ─────────────────────────

def enviar_email_pedido_confirmado(obj) -> bool:
    """
    Envía un email HTML con imágenes de lo vendido (si hay URL); si no hay imagen,
    envía ficha con nombre, categoría, subcategoría, grupo de tallas y talla.
    NO adjunta PDFs. Se espera que SOLO la llames cuando el pago esté 'approved'.
    Acepta una Factura o un Pedido.
    """
    # Resolver email destino
    is_factura = hasattr(obj, "items") and hasattr(obj, "total") and hasattr(obj, "moneda")
    to_email = _email_from_factura(obj) if is_factura else _email_from_pedido(obj)
    if not to_email:
        return False

    # Resolver items
    items_qs = obj.items if is_factura else (getattr(obj, "items", None) or getattr(obj, "pedidoitem_set", None))
    if not items_qs:
        return False

    numero = getattr(obj, "numero", None) or f"PED-{getattr(obj, 'id', getattr(obj, 'pk', ''))}"
    items_payload = list(_items_iter(items_qs))
    if not items_payload:
        return False

    # Construir contenido
    text_body, html_body = _build_html(numero, items_payload)

    subject = f"Compra confirmada — Pedido #{numero}"
    from_email = (
        getattr(settings, "DEFAULT_FROM_EMAIL", None)
        or getattr(settings, "EMAIL_HOST_USER", None)
        or "no-reply@tudominio.com"
    )

    msg = EmailMultiAlternatives(subject=subject, body=text_body, from_email=from_email, to=[to_email])
    msg.attach_alternative(html_body, "text/html")
    sent = msg.send(fail_silently=False)
    return bool(sent)
