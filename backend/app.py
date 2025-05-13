from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, desc, inspect
from werkzeug.utils import secure_filename
import os
import datetime
import json
import ast
import re
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import openai
from PyPDF2 import PdfReader
from dotenv import load_dotenv
load_dotenv()

# ───── CONFIGURACIÓN ─────
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///paratodos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# ───── MODELOS ─────

class Tienda(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    responsable = db.Column(db.String(100))
    rif = db.Column(db.String(20))
    email = db.Column(db.String(100))
    telefono = db.Column(db.String(30))
    instagram = db.Column(db.String(100))
    direccion = db.Column(db.Text)
    productos = db.Column(db.Text)
    color = db.Column(db.String(10))
    logo = db.Column(db.String(200))
    catalogo = db.Column(db.String(200))
    slug = db.Column(db.String(100), unique=True)

class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    descripcion = db.Column(db.Text)
    precio = db.Column(db.String(50))
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))
    relacionados = db.Column(db.Text)
    imagen = db.Column(db.String(200))
    imagenes = db.Column(db.Text, nullable=True)

class Lead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente = db.Column(db.String(100))
    producto = db.Column(db.String(100))
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))
    fecha = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    estado = db.Column(db.String(50), default="pendiente")

class Customer(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    telefono = db.Column(db.String(50))
    email = db.Column(db.String(100))
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))
    fecha = db.Column(db.DateTime, default=datetime.datetime.utcnow)

with app.app_context():
    db.create_all()
    # Añadir columna 'imagenes' a Producto si no existe
    inspector = inspect(db.engine)
    cols = [c['name'] for c in inspector.get_columns('producto')]
    if 'imagenes' not in cols:
        # Agregar columna 'imagenes' para múltiples imágenes por producto
        from sqlalchemy import text
        db.session.execute(text('ALTER TABLE producto ADD COLUMN imagenes TEXT'))
        db.session.commit()

# ───── ENDPOINTS ─────

@app.route('/api/crear-tienda', methods=['POST'])
def crear_tienda():
    try:
        data = request.form
        nombre = data['nombre']
        slug = nombre.lower().replace(" ", "-")

        if Tienda.query.filter_by(slug=slug).first():
            return jsonify({ "success": False, "error": "Ya existe una tienda con ese nombre" }), 400

        nueva_tienda = Tienda(
            nombre=nombre,
            slug=slug,
            responsable=data['responsable'],
            rif=data['rif'],
            email=data['email'],
            telefono=data['telefono'],
            instagram=data.get('instagram', ''),
            direccion=data['direccion'],
            productos=data['productos'],
            color=data['color']
        )

        tienda_path = os.path.join(UPLOAD_FOLDER, slug)
        os.makedirs(tienda_path, exist_ok=True)

        logo = request.files['logo']
        logo_filename = secure_filename(logo.filename)
        logo.save(os.path.join(tienda_path, logo_filename))
        nueva_tienda.logo = logo_filename

        catalogo = request.files['catalogo']
        catalogo_filename = secure_filename(catalogo.filename)
        catalogo.save(os.path.join(tienda_path, catalogo_filename))
        nueva_tienda.catalogo = catalogo_filename

        db.session.add(nueva_tienda)
        db.session.commit()

        # 🧠 Procesar PDF con IA para crear productos
        try:
            pdf_path = os.path.join(tienda_path, catalogo_filename)
            reader = PdfReader(pdf_path)
            full_text = ""
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

            openai.api_key = os.getenv("OPENAI_API_KEY")
            client = openai.OpenAI()
            chat = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Extrae únicamente una lista en formato JSON de productos del catálogo con este esquema: [{\"name\": \"...\", \"description\": \"...\", \"price\": \"...\"}]. Devuelve solo el JSON, sin texto adicional."},
                    {"role": "user", "content": full_text}
                ]
            )
            content = chat.choices[0].message.content
            # Intentar cargar productos desde JSON, con fallback a Python literal
            try:
                products = json.loads(content)
            except json.JSONDecodeError:
                try:
                    products = ast.literal_eval(content)
                except Exception as parse_err:
                    print("❌ Error al parsear JSON de productos:", parse_err)
                    products = []

            # Crear productos extraídos: asignar imagen placeholder por defecto
            placeholder_img = os.getenv("PLACEHOLDER_IMG_URL", "https://via.placeholder.com/200")
            for prod in products:
                nuevo_prod = Producto(
                    nombre=prod.get("name", ""),
                    descripcion=prod.get("description", ""),
                    precio=prod.get("price", ""),
                    tienda_id=nueva_tienda.id,
                    imagen=placeholder_img
                )
                db.session.add(nuevo_prod)
            db.session.commit()

        except Exception as iae:
            print("❌ Error IA catálogo:", iae)

        return jsonify({ "success": True })

    except Exception as e:
        print("❌ Error al crear tienda:", e)
        return jsonify({ "success": False, "error": str(e) }), 400

@app.route('/api/tienda/<slug>', methods=['GET'])
def obtener_tienda(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "error": "Tienda no encontrada" }), 404

    data = {
        "nombre": tienda.nombre,
        "responsable": tienda.responsable,
        "rif": tienda.rif,
        "email": tienda.email,
        "telefono": tienda.telefono,
        "instagram": tienda.instagram,
        "direccion": tienda.direccion,
        "productos": tienda.productos,
        "color": tienda.color,
        "logo": tienda.logo,
        "catalogo": tienda.catalogo,
        "slug": tienda.slug
    }
    return jsonify({ "success": True, "tienda": data })
    
@app.route('/api/tienda/<slug>', methods=['PUT'])
def editar_tienda(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    data = request.form
    # Update text fields
    tienda.nombre = data.get('nombre', tienda.nombre)
    tienda.responsable = data.get('responsable', tienda.responsable)
    tienda.rif = data.get('rif', tienda.rif)
    tienda.email = data.get('email', tienda.email)
    tienda.telefono = data.get('telefono', tienda.telefono)
    tienda.instagram = data.get('instagram', tienda.instagram)
    tienda.direccion = data.get('direccion', tienda.direccion)
    tienda.productos = data.get('productos', tienda.productos)
    tienda.color = data.get('color', tienda.color)
    # Handle logo upload
    if 'logo' in request.files:
        logo = request.files['logo']
        if logo and logo.filename:
            tienda_path = os.path.join(app.config['UPLOAD_FOLDER'], slug)
            os.makedirs(tienda_path, exist_ok=True)
            filename = secure_filename(logo.filename)
            logo.save(os.path.join(tienda_path, filename))
            tienda.logo = filename
    # Handle catalog upload
    if 'catalogo' in request.files:
        catalogo = request.files['catalogo']
        if catalogo and catalogo.filename:
            tienda_path = os.path.join(app.config['UPLOAD_FOLDER'], slug)
            os.makedirs(tienda_path, exist_ok=True)
            filename = secure_filename(catalogo.filename)
            catalogo.save(os.path.join(tienda_path, filename))
            tienda.catalogo = filename
    db.session.commit()
    return jsonify({"success": True})

@app.route('/api/productos/<slug>', methods=['GET'])
def obtener_productos(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({ "success": False, "error": "Tienda no encontrada" }), 404

    productos = Producto.query.filter_by(tienda_id=tienda.id).all()
    lista = []
    for p in productos:
        # Determinar URL de imagen: si es URL externa, usarla; si es filename, servir desde uploads
        # Determinar URL primaria de imagen
        if p.imagen:
            if p.imagen.startswith('http'):
                img_url = p.imagen
            else:
                img_url = f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
        # Manejar múltiples imágenes
        imagenes_list = []
        if p.imagenes:
            try:
                files = json.loads(p.imagenes)
            except:
                files = []
            for fname in files:
                if fname.startswith('http'):
                    imagenes_list.append(fname)
                else:
                    imagenes_list.append(f"/uploads/{slug}/{fname}")
        # Fallback a imagen individual
        if not imagenes_list and img_url:
            imagenes_list = [img_url]
        lista.append({
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "precio": p.precio,
            "relacionados": p.relacionados,
            "imagen": img_url,
            "imagenes": imagenes_list
        })

    return jsonify({ "success": True, "productos": lista })

@app.route('/api/producto/<int:id>', methods=['GET'])
def obtener_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({ "success": False, "error": "Producto no encontrado" }), 404

    tienda = Tienda.query.get(producto.tienda_id)
    slug = tienda.slug if tienda else ""

    # Determinar URL de imagen para el producto
    if producto.imagen:
        if producto.imagen.startswith('http'):
            img_url = producto.imagen
        else:
            img_url = f"/uploads/{slug}/{producto.imagen}"
    else:
        img_url = ''
    # Manejar múltiples imágenes para el producto
    imagenes_list = []
    if producto.imagenes:
        try:
            files = json.loads(producto.imagenes)
        except:
            files = []
        for fname in files:
            if fname.startswith('http'):
                imagenes_list.append(fname)
            else:
                imagenes_list.append(f"/uploads/{slug}/{fname}")
    # Fallback a imagen individual
    if not imagenes_list and producto.imagen:
        imagenes_list = [img_url]
    # Incluir datos de la tienda a la que pertenece el producto (incluidas redes sociales)
    tienda_info = {
        "nombre": tienda.nombre if tienda else None,
        "slug": slug,
        "instagram": tienda.instagram if tienda and tienda.instagram else None,
        "telefono": tienda.telefono if tienda and tienda.telefono else None
    }
    return jsonify({
        "success": True,
        "producto": {
            "id": producto.id,
            "nombre": producto.nombre,
            "descripcion": producto.descripcion,
            "precio": producto.precio,
            "relacionados": producto.relacionados,
            "imagen": img_url,
            "imagenes": imagenes_list,
            "tienda": tienda_info
        }
    })

@app.route('/api/producto/<int:id>', methods=['PUT'])
def editar_producto(id):
    producto = Producto.query.get(id)
    if not producto:
        return jsonify({ "success": False, "error": "Producto no encontrado" }), 404

    data = request.form
    producto.nombre = data['nombre']
    producto.descripcion = data['descripcion']
    producto.precio = data['precio']
    producto.relacionados = data.get('relacionados', '')
    slug = data['slug']

    # Manejar actualización de múltiples imágenes (hasta 5)
    existing_imagenes = []
    if producto.imagenes:
        try:
            existing_imagenes = json.loads(producto.imagenes)
        except:
            existing_imagenes = []
    # Si se suben nuevas imágenes, reemplazar lista
    if 'imagenes' in request.files:
        files = request.files.getlist('imagenes')
        tienda = Tienda.query.filter_by(slug=slug).first()
        if tienda:
            tienda_path = os.path.join(app.config['UPLOAD_FOLDER'], slug)
            os.makedirs(tienda_path, exist_ok=True)
            new_list = []
            for img in files[:5]:
                if img and img.filename:
                    filename = secure_filename(img.filename)
                    img.save(os.path.join(tienda_path, filename))
                    new_list.append(filename)
            producto.imagenes = json.dumps(new_list)
            producto.imagen = new_list[0] if new_list else ''

    db.session.commit()
    return jsonify({ "success": True, "message": "Producto actualizado" })

@app.route('/api/crear-producto', methods=['POST'])
def crear_producto():
    try:
        data = request.form
        nombre = data['nombre']
        descripcion = data['descripcion']
        precio = data['precio']
        relacionados = data.get('relacionados', '')
        slug = data['slug']

        tienda = Tienda.query.filter_by(slug=slug).first()
        if not tienda:
            return jsonify({"success": False, "error": "Tienda no encontrada"}), 404

        # Manejar múltiples imágenes (hasta 5)
        imagenes_list = []
        if 'imagenes' in request.files:
            files = request.files.getlist('imagenes')
            tienda_path = os.path.join(UPLOAD_FOLDER, slug)
            os.makedirs(tienda_path, exist_ok=True)
            for img in files[:5]:
                if img and img.filename:
                    filename = secure_filename(img.filename)
                    img.save(os.path.join(tienda_path, filename))
                    imagenes_list.append(filename)
        elif 'imagen' in request.files:
            img = request.files['imagen']
            if img and img.filename:
                tienda_path = os.path.join(UPLOAD_FOLDER, slug)
                os.makedirs(tienda_path, exist_ok=True)
                filename = secure_filename(img.filename)
                img.save(os.path.join(tienda_path, filename))
                imagenes_list.append(filename)

        nuevo_producto = Producto(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            relacionados=relacionados,
            tienda_id=tienda.id,
            imagen=imagenes_list[0] if imagenes_list else '',
            imagenes=json.dumps(imagenes_list)
        )

        db.session.add(nuevo_producto)
        db.session.commit()

        return jsonify({ "success": True, "message": "Producto creado correctamente" })

    except Exception as e:
        print("Error al crear producto:", e)
        return jsonify({ "success": False, "error": str(e) }), 400

@app.route('/uploads/<slug>/<filename>')
def serve_upload(slug, filename):
    path = os.path.join(UPLOAD_FOLDER, slug)
    return send_from_directory(path, filename)

@app.route('/api/tiendas', methods=['GET'])
def listar_tiendas():
    tiendas = Tienda.query.all()
    lista = []
    for t in tiendas:
        logo_url = f"/uploads/{t.slug}/{t.logo}" if t.logo else ''
        lista.append({
            'id': t.id,
            'nombre': t.nombre,
            'slug': t.slug,
            'logo': logo_url
        })
    return jsonify({ 'success': True, 'tiendas': lista })

@app.route('/api/productos', methods=['GET'])
def listar_todos_productos():
    productos = Producto.query.all()
    lista = []
    for p in productos:
        tienda = Tienda.query.get(p.tienda_id)
        slug = tienda.slug if tienda else ''
        # Determinar URL de imagen: externa o uploads
        # Determinar URL primaria de imagen
        if p.imagen and p.imagen.startswith('http'):
            img_url = p.imagen
        elif p.imagen:
            img_url = f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
        # Manejar múltiples imágenes
        imagenes_list = []
        if p.imagenes:
            try:
                files = json.loads(p.imagenes)
            except:
                files = []
            for fname in files:
                if fname.startswith('http'):
                    imagenes_list.append(fname)
                else:
                    imagenes_list.append(f"/uploads/{slug}/{fname}")
        # Fallback a imagen individual
        if not imagenes_list and img_url:
            imagenes_list = [img_url]
        # Incluir teléfono e Instagram de la tienda asociada
        telefono = tienda.telefono if tienda and tienda.telefono else ''
        instagram = tienda.instagram if tienda and tienda.instagram else ''
        lista.append({
            'id': p.id,
            'nombre': p.nombre,
            'descripcion': p.descripcion,
            'precio': p.precio,
            'relacionados': p.relacionados,
            'imagen': img_url,
            'imagenes': imagenes_list,
            'slug': slug,
            'telefono': telefono,
            'instagram': instagram
        })
    return jsonify({ 'success': True, 'productos': lista })

@app.route('/api/buscar', methods=['GET'])
def buscar():
    q = request.args.get('q', '')
    # Prepare wildcard query
    q_like = f"%{q}%"
    # Search stores by name
    tiendas = Tienda.query.filter(Tienda.nombre.ilike(q_like)).all()
    # Search products by name
    productos = Producto.query.filter(Producto.nombre.ilike(q_like)).all()
    # Build response lists
    result_tiendas = []
    for t in tiendas:
        logo_url = f"/uploads/{t.slug}/{t.logo}" if t.logo else ''
        result_tiendas.append({
            'id': t.id,
            'nombre': t.nombre,
            'slug': t.slug,
            'logo': logo_url
        })
    result_productos = []
    for p in productos:
        tienda = Tienda.query.get(p.tienda_id)
        slug = tienda.slug if tienda else ''
        if p.imagen:
            img_url = p.imagen if p.imagen.startswith('http') else f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
        result_productos.append({
            'id': p.id,
            'nombre': p.nombre,
            'descripcion': p.descripcion,
            'precio': p.precio,
            'imagen': img_url,
            'slug': slug
        })
    return jsonify({ 'success': True, 'tiendas': result_tiendas, 'productos': result_productos })
 
@app.route('/api/leads/<slug>', methods=['GET'])
def obtener_leads(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    # Count leads for this store
    count = Lead.query.filter_by(tienda_id=tienda.id).count()
    return jsonify({"success": True, "count": count})
 
@app.route('/api/mas_vendidos/<slug>', methods=['GET'])
def mas_vendidos(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    # Agrupar leads por producto y obtener los 5 más populares
    resultados = db.session.query(
        Lead.producto,
        func.count(Lead.id).label('count')
    ).filter(
        Lead.tienda_id == tienda.id
    ).group_by(
        Lead.producto
    ).order_by(
        desc('count')
    ).limit(5).all()
    top = [{"producto": prod, "count": cnt} for prod, cnt in resultados]
    return jsonify({"success": True, "top": top})
    
@app.route('/api/pedidos/<slug>', methods=['GET'])
def obtener_pedidos(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    # Status filter: activos (pendiente), cerrados, cancelados
    status = request.args.get('status')
    query = Lead.query.filter_by(tienda_id=tienda.id)
    if status:
        status_map = {
            'activos': 'pendiente',
            'cerrados': 'cerrado',
            'cancelados': 'cancelado'
        }
        estado = status_map.get(status.lower())
        if estado:
            query = query.filter(Lead.estado == estado)
    leads = query.order_by(Lead.fecha.desc()).all()
    pedidos = []
    for l in leads:
        pedidos.append({
            'id': l.id,
            'cliente': l.cliente,
            'producto': l.producto,
            'fecha': l.fecha.isoformat(),
            'estado': l.estado
        })
    return jsonify({"success": True, "pedidos": pedidos})

@app.route('/api/pedidos/<slug>/counts', methods=['GET'])
def contar_pedidos(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    # Count by status
    count_activos = Lead.query.filter_by(tienda_id=tienda.id, estado='pendiente').count()
    count_cerrados = Lead.query.filter_by(tienda_id=tienda.id, estado='cerrado').count()
    count_cancelados = Lead.query.filter_by(tienda_id=tienda.id, estado='cancelado').count()
    return jsonify({
        "success": True,
        "counts": {
            "activos": count_activos,
            "cerrados": count_cerrados,
            "cancelados": count_cancelados
        }
    })
    
@app.route('/api/clientes/<slug>', methods=['GET'])
def obtener_clientes(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    clientes = Customer.query.filter_by(tienda_id=tienda.id).order_by(Customer.fecha.desc()).all()
    lista = []
    for c in clientes:
        lista.append({
            'id': c.id,
            'nombre': c.nombre,
            'telefono': c.telefono,
            'email': c.email,
            'fecha': c.fecha.isoformat()
        })
    return jsonify({"success": True, "clientes": lista})

@app.route('/api/clientes/<slug>', methods=['POST'])
def crear_cliente(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    data = request.get_json() or request.form
    nombre = data.get('nombre')
    if not nombre:
        return jsonify({"success": False, "error": "El nombre es obligatorio"}), 400
    telefono = data.get('telefono', '')
    email = data.get('email', '')
    nuevo = Customer(
        nombre=nombre,
        telefono=telefono,
        email=email,
        tienda_id=tienda.id
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"success": True, "cliente": {
        'id': nuevo.id,
        'nombre': nuevo.nombre,
        'telefono': nuevo.telefono,
        'email': nuevo.email,
        'fecha': nuevo.fecha.isoformat()
    }})
    
@app.route('/api/leads/cliente', methods=['GET'])
def obtener_leads_por_cliente():
    # Obtener leads consultados por un cliente (por nombre)
    cliente = request.args.get('cliente')
    if not cliente:
        return jsonify({"success": False, "error": "Parámetro 'cliente' es obligatorio"}), 400
    # Buscar leads que coincidan exactamente con el nombre de cliente
    leads = Lead.query.filter(func.lower(Lead.cliente) == cliente.lower()).order_by(Lead.fecha.desc()).all()
    resultados = []
    for l in leads:
        tienda = Tienda.query.get(l.tienda_id)
        resultados.append({
            'id': l.id,
            'producto': l.producto,
            'fecha': l.fecha.isoformat(),
            'estado': l.estado,
            'tienda_slug': tienda.slug if tienda else None,
            'tienda_nombre': tienda.nombre if tienda else None
        })
    return jsonify({"success": True, "leads": resultados})

@app.route('/api/ia/generar-imagen', methods=['POST'])
def generar_imagen():
    # Aceptar tanto JSON como form-data
    if request.is_json:
        data = request.get_json(silent=True) or {}
        prompt = data.get('prompt')
        reference = None
    else:
        prompt = request.form.get('prompt')
        reference = request.files.get('reference')
    if not prompt:
        return jsonify({"success": False, "error": "El prompt es obligatorio"}), 400
    try:
        # Inicializar cliente OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return jsonify({"success": False, "error": "API key no definida"}), 500
        openai.api_key = api_key
        client = openai.OpenAI(api_key=api_key)
        # Generar o editar imagen según referencia
        if reference:
            temp_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_ref.png')
            reference.save(temp_path)
            response = client.images.edit(
                # Usar el modelo de imagen más reciente de OpenAI (DALL·E 3)
                model="dall-e-3",
                image=open(temp_path, 'rb'),
                prompt=prompt,
                size="1024x1024",
                n=1
            )
        else:
            response = client.images.generate(
                # Usar el modelo de imagen más reciente de OpenAI (DALL·E 3)
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                n=1
            )
        urls = [d.url for d in response.data]
        return jsonify({"success": True, "images": urls})
    except Exception as e:
        print("Error IA generar imagen:", e)
        return jsonify({"success": False, "error": str(e)}), 500

@app.route('/api/ia/editar-imagen', methods=['POST'])
def editar_imagen():
    prompt = request.form.get('prompt')
    image = request.files.get('image')
    mask_file = request.files.get('mask')
    if not prompt or not image:
        return jsonify({"success": False, "error": "Imagen y prompt son obligatorios"}), 400
    try:
        # Guardar temporal la imagen a editar
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_edit.png')
        image.save(temp_path)
        # Guardar temporal la máscara si existe
        if mask_file:
            mask_path = os.path.join(app.config['UPLOAD_FOLDER'], 'temp_mask.png')
            mask_file.save(mask_path)
        # Inicializar cliente OpenAI
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return jsonify({"success": False, "error": "API key no definida"}), 500
        openai.api_key = api_key
        client = openai.OpenAI(api_key=api_key)
        # Llamar a la API de edición indicando máscara si la hay
        kwargs = {
            'model': 'dall-e-2',
            'image': open(temp_path, 'rb'),
            'prompt': prompt,
            'size': '1024x1024',
            'n': 1
        }
        if mask_file:
            kwargs['mask'] = open(mask_path, 'rb')
        response = client.images.edit(**kwargs)
        urls = [d.url for d in response.data]
        return jsonify({"success": True, "images": urls})
    except Exception as e:
        print("Error IA editar imagen:", e)
        return jsonify({"success": False, "error": str(e)}), 500
    
@app.route('/api/tienda/export-pdf', methods=['GET'])
def export_tienda_pdf_by_owner():
    responsable = (request.args.get('responsable') or '').strip()
    rif = (request.args.get('rif') or '').strip()
    template = request.args.get('template', 'default')
    if not responsable or not rif:
        return jsonify({"success": False, "error": "Responsable y RIF son requeridos"}), 400
    # Buscar tiendas por responsable (case-insensitive)
    tiendas = Tienda.query.filter(func.lower(Tienda.responsable) == responsable.lower()).all()
    if not tiendas:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    # Normalizar RIF comparando solo dígitos
    def normalize_rif(r):
        return re.sub(r"\D", "", r or "")
    ingreso_digits = normalize_rif(rif)
    tienda = None
    for t in tiendas:
        if normalize_rif(t.rif) == ingreso_digits:
            tienda = t
            break
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    productos = Producto.query.filter_by(tienda_id=tienda.id).all()
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle(f"Tienda_{tienda.nombre}")
    y = 750
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(50, y, f"Tienda: {tienda.nombre}")
    y -= 30
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, y, f"Responsable: {tienda.responsable}")
    y -= 20
    pdf.drawString(50, y, f"Contacto: {tienda.telefono or ''} | {tienda.email or ''}")
    y -= 30
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Productos:")
    y -= 20
    pdf.setFont("Helvetica", 12)
    for prod in productos:
        if y < 50:
            pdf.showPage()
            y = 750
        pdf.drawString(60, y, f"- {prod.nombre}: {prod.precio}")
        y -= 20
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{tienda.slug}.pdf",
        mimetype='application/pdf'
    )

# Endpoint para obtener datos de tienda y productos para brochure
@app.route('/api/tienda/brochure-data', methods=['GET'])
def obtener_brochure_data():
    responsable = (request.args.get('responsable') or '').strip()
    rif = (request.args.get('rif') or '').strip()
    if not responsable or not rif:
        return jsonify({"success": False, "error": "Responsable y RIF son requeridos"}), 400
    tiendas = Tienda.query.filter(func.lower(Tienda.responsable) == responsable.lower()).all()
    if not tiendas:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    def normalize_rif(r):
        return re.sub(r"\D", "", r or "")
    ingreso_digits = normalize_rif(rif)
    tienda = next((t for t in tiendas if normalize_rif(t.rif) == ingreso_digits), None)
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    productos = Producto.query.filter_by(tienda_id=tienda.id).all()
    lista = [{"id": p.id, "nombre": p.nombre, "descripcion": p.descripcion, "precio": p.precio} for p in productos]
    tienda_info = {"nombre": tienda.nombre, "slug": tienda.slug}
    return jsonify({"success": True, "tienda": tienda_info, "productos": lista})

# Endpoint para generar brochure con IA
@app.route('/api/tienda/export-brochure', methods=['POST'])
def export_brochure():
    responsable = (request.form.get('responsable') or '').strip()
    rif = (request.form.get('rif') or '').strip()
    template = request.form.get('template', 'default')
    description = request.form.get('description', '').strip()
    product_ids = request.form.getlist('product_ids')
    if not responsable or not rif:
        return jsonify({"success": False, "error": "Responsable y RIF son requeridos"}), 400
    tiendas = Tienda.query.filter(func.lower(Tienda.responsable) == responsable.lower()).all()
    if not tiendas:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    def normalize_rif(r):
        return re.sub(r"\D", "", r or "")
    ingreso_digits = normalize_rif(rif)
    tienda = next((t for t in tiendas if normalize_rif(t.rif) == ingreso_digits), None)
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    # Obtener productos seleccionados o todos
    if product_ids:
        productos = Producto.query.filter(Producto.tienda_id == tienda.id, Producto.id.in_(product_ids)).all()
    else:
        productos = Producto.query.filter_by(tienda_id=tienda.id).all()
    product_lines = [f"{p.nombre}: {p.descripcion} (Precio: {p.precio})" for p in productos]
    prompt = (
        f"Crea un brochure profesional en formato markdown tipo '{template}' para la tienda '{tienda.nombre}'. "
        f"Incluye esta introducción: {description}. "
        "Describe cada producto con un párrafo persuasivo. "
        "Lista los productos a continuación con sus descripciones y precios:\n"
        + "\n".join(product_lines)
    )
    try:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        client = openai.OpenAI()
        chat = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Eres un experto redactor de marketing, especializado en crear brochures atractivos."},
                {"role": "user", "content": prompt}
            ]
        )
        content = chat.choices[0].message.content
    except Exception as e:
        print("Error IA brochure:", e)
        content = ""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    pdf.setTitle(f"Brochure_{tienda.slug}")
    for line in content.splitlines():
        if line.startswith('# '):
            pdf.setFont("Helvetica-Bold", 18)
            text = line[2:]
        elif line.startswith('## '):
            pdf.setFont("Helvetica-Bold", 14)
            text = line[3:]
        elif line.startswith('- '):
            pdf.setFont("Helvetica", 12)
            text = u"\u2022 " + line[2:]
        else:
            pdf.setFont("Helvetica", 12)
            text = line
        pdf.drawString(50, y, text)
        y -= 18
        if y < 50:
            pdf.showPage()
            y = 750
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"Brochure_{tienda.slug}.pdf",
        mimetype='application/pdf'
    )
@app.route('/api/tienda/<slug>/export-pdf', methods=['GET'])
def export_tienda_pdf(slug):
    tienda = Tienda.query.filter_by(slug=slug).first()
    if not tienda:
        return jsonify({"success": False, "error": "Tienda no encontrada"}), 404
    productos = Producto.query.filter_by(tienda_id=tienda.id).all()
    # Generar PDF en memoria
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    pdf.setTitle(f"Tienda_{tienda.nombre}")
    y = 750
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(50, y, f"Tienda: {tienda.nombre}")
    y -= 30
    pdf.setFont("Helvetica", 12)
    pdf.drawString(50, y, f"Responsable: {tienda.responsable}")
    y -= 20
    pdf.drawString(50, y, f"Contacto: {tienda.telefono} | {tienda.email}")
    y -= 30
    pdf.setFont("Helvetica-Bold", 14)
    pdf.drawString(50, y, "Productos:")
    y -= 20
    pdf.setFont("Helvetica", 12)
    for prod in productos:
        if y < 50:
            pdf.showPage()
            y = 750
        pdf.drawString(60, y, f"- {prod.nombre}: {prod.precio}")
        y -= 20
    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{slug}.pdf",
        mimetype='application/pdf'
    )

# ───── MAIN ─────
if __name__ == '__main__':
    app.run(debug=True)
