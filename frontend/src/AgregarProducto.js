import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function AgregarProducto() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    relacionados: ''
  });

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const manejarEnvio = (e) => {
    e.preventDefault();

    fetch('http://localhost:5000/api/crear-producto', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formulario,
        slug
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert('Producto creado correctamente');
          navigate(`/dashboard/${slug}/productos`);
        } else {
          alert('Error al crear producto: ' + data.error);
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error de conexión');
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12 text-gray-800">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Agregar Producto</h1>

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div>
            <label className="block font-medium">Nombre del producto</label>
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Descripción</label>
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Precio</label>
            <input
              type="text"
              name="precio"
              value={formulario.precio}
              onChange={manejarCambio}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium">Productos relacionados (opcional)</label>
            <input
              type="text"
              name="relacionados"
              value={formulario.relacionados}
              onChange={manejarCambio}
              className="w-full border rounded px-3 py-2"
              placeholder="Ej: zapato, bolso, cartera"
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Guardar producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgregarProducto;
