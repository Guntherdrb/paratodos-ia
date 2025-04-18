import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function VistaTienda() {
  const { slug } = useParams();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDatos(data.tienda);
        } else {
          alert('Tienda no encontrada');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Error al cargar la tienda');
      });
  }, [slug]);

  if (!datos) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        Cargando tienda...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{ backgroundColor: datos.color || '#ffffff' }}
    >
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-lg p-8">
        <div className="flex justify-center mb-6">
          <img
            src={`http://localhost:5000/uploads/${slug}/${datos.logo}`}
            alt="Logo de la tienda"
            className="h-28 w-auto rounded"
          />
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">{datos.nombre}</h1>
        <p className="text-center text-gray-600 mb-4 italic">{datos.productos}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-800 mb-6">
          <p><strong>Responsable:</strong> {datos.responsable}</p>
          <p><strong>RIF / Cédula:</strong> {datos.rif}</p>
          <p><strong>Correo:</strong> {datos.email}</p>
          <p><strong>WhatsApp:</strong> {datos.telefono}</p>
          <p><strong>Instagram:</strong> {datos.instagram}</p>
          <p><strong>Dirección:</strong> {datos.direccion}</p>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4">
          <a
            href={`http://localhost:5000/uploads/${slug}/${datos.catalogo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-center shadow-md transition duration-300"
          >
            Ver catálogo
          </a>

          <Link
            to={`/dashboard/${slug}`}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-center shadow-md transition duration-300"
          >
            Ir a mi tienda
          </Link>
        </div>
      </div>
    </div>
  );
}

export default VistaTienda;

