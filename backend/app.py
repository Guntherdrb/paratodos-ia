from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, desc
from werkzeug.utils import secure_filename
import os
import datetime
import json
import ast
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
        if p.imagen:
            if p.imagen.startswith('http'):
                img_url = p.imagen
            else:
                img_url = f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
        lista.append({
            "id": p.id,
            "nombre": p.nombre,
            "descripcion": p.descripcion,
            "precio": p.precio,
            "relacionados": p.relacionados,
            "imagen": img_url
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
    # Incluir datos de la tienda a la que pertenece el producto
    # Incluir datos de la tienda a la que pertenece el producto, incluidas redes sociales
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

    if 'imagen' in request.files:
        imagen = request.files['imagen']
        if imagen.filename:
            tienda = Tienda.query.filter_by(slug=slug).first()
            if tienda:
                tienda_path = os.path.join(app.config['UPLOAD_FOLDER'], slug)
                os.makedirs(tienda_path, exist_ok=True)
                imagen_filename = secure_filename(imagen.filename)
                imagen.save(os.path.join(tienda_path, imagen_filename))
                producto.imagen = imagen_filename

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

        imagen_filename = ''
        if 'imagen' in request.files:
            imagen = request.files['imagen']
            if imagen.filename:
                tienda_path = os.path.join(UPLOAD_FOLDER, slug)
                os.makedirs(tienda_path, exist_ok=True)
                imagen_filename = secure_filename(imagen.filename)
                imagen.save(os.path.join(tienda_path, imagen_filename))

        nuevo_producto = Producto(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            relacionados=relacionados,
            tienda_id=tienda.id,
            imagen=imagen_filename
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
        if p.imagen and p.imagen.startswith('http'):
            img_url = p.imagen
        elif p.imagen:
            img_url = f"/uploads/{slug}/{p.imagen}"
        else:
            img_url = ''
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

# ───── MAIN ─────
if __name__ == '__main__':
    app.run(debug=True)
