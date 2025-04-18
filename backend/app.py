from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import datetime

# ───────── CONFIGURACIÓN ─────────
app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///paratodos.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ───────── MODELOS ─────────

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

class Lead(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    cliente = db.Column(db.String(100))
    producto = db.Column(db.String(100))
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))
    fecha = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    estado = db.Column(db.String(50), default="pendiente")

class Producto(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    descripcion = db.Column(db.Text)
    precio = db.Column(db.String(50))
    imagen = db.Column(db.String(200))
    tienda_id = db.Column(db.Integer, db.ForeignKey('tienda.id'))

with app.app_context():
    db.create_all()

# ───────── ENDPOINTS ─────────

@app.route('/api/crear-tienda', methods=['POST'])
def crear_tienda():
    try:
        nombre = request.form['nombre']
        slug = nombre.lower().replace(" ", "-")

        if Tienda.query.filter_by(slug=slug).first():
            return jsonify({ "success": False, "error": "Ya existe una tienda con ese nombre" }), 400

        nueva_tienda = Tienda(
            nombre=nombre,
            slug=slug,
            responsable=request.form['responsable'],
            rif=request.form['rif'],
            email=request.form['email'],
            telefono=request.form['telefono'],
            instagram=request.form.get('instagram', ''),
            direccion=request.form['direccion'],
            productos=request.form['productos'],
            color=request.form['color']
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

        return jsonify({ "success": True })

    except Exception as e:
        print("Error al crear tienda:", e)
        return jsonify({ "success": False, "error": str(e) }), 400

@app.route('/api/tienda/<slug>', methods=['GET'])
def obtener_tienda(slug):
    try:
        tienda = Tienda.query.filter_by(slug=slug).first()
        if not tienda:
            return jsonify({ "success": False, "error": "Tienda no encontrada" }), 404

        datos = {
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

        return jsonify({ "success": True, "tienda": datos })

    except Exception as e:
        print("Error al obtener tienda:", e)
        return jsonify({ "success": False, "error": str(e) }), 400

@app.route('/uploads/<slug>/<filename>')
def serve_archivos(slug, filename):
    path = os.path.join(UPLOAD_FOLDER, slug)
    return send_from_directory(path, filename)

# ───────── MAIN ─────────
if __name__ == '__main__':
    app.run(debug=True)
