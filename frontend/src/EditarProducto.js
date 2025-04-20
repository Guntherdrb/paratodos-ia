import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditarProducto() {
  const { slug, id } = useParams();
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    relacionados: ''
  });
  const [imagen, setImagen] = useState(null);
  const [imagenActual, setImagenActual] = useState('');
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    // Cargar datos del producto
    fetch(`/api/producto/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFormulario({
            nombre: data.producto.nombre,
            descripcion: data.producto.descripcion,
            precio: data.producto.precio,
            relacionados: data.producto.relacionados || ''
          });
          setImagenActual(data.producto.imagen);
        } else {
          alert('Producto no encontrado');
        }
      });
    // Cargar nombre de la tienda
    fetch(`/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStoreName(data.tienda.nombre);
      })
      .catch(err => console.error('Error cargando tienda:', err));
  }, [id, slug]);

  const manejarCambio = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', formulario.nombre);
    formData.append('descripcion', formulario.descripcion);
    formData.append('precio', formulario.precio);
    formData.append('relacionados', formulario.relacionados);
    if (imagen) formData.append('imagen', imagen);
    // Incluir slug para localizar la tienda en el backend
    formData.append('slug', slug);

    fetch(`/api/producto/${id}`, {
      method: 'PUT',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Producto actualizado correctamente');
          navigate(`/dashboard/${slug}/productos`);
        } else {
          alert('Error al actualizar: ' + data.error);
        }
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      {/* Nombre de la tienda */}
      {storeName && <h2 className="text-2xl font-bold text-center mb-6">{storeName}</h2>}
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Editar Producto</h1>
        <form onSubmit={manejarEnvio} className="space-y-4" encType="multipart/form-data">
          <input type="text" name="nombre" value={formulario.nombre} onChange={manejarCambio} className="w-full border rounded px-3 py-2" placeholder="Nombre" />
          <textarea name="descripcion" value={formulario.descripcion} onChange={manejarCambio} className="w-full border rounded px-3 py-2" placeholder="Descripción" />
          <input type="text" name="precio" value={formulario.precio} onChange={manejarCambio} className="w-full border rounded px-3 py-2" placeholder="Precio" />
          <input type="text" name="relacionados" value={formulario.relacionados} onChange={manejarCambio} className="w-full border rounded px-3 py-2" placeholder="Relacionados" />
          <div>
            <label className="block font-medium">Imagen actual:</label>
            {imagenActual && <img src={imagenActual} alt="Actual" className="h-24 my-2 rounded" />}
            <input type="file" onChange={(e) => setImagen(e.target.files[0])} className="w-full" />
          </div>
          <div className="text-center">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Actualizar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarProducto;
