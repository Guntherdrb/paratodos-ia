import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function DashboardTienda() {
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
        Cargando datos del dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Dashboard: {datos.nombre}
          </h1>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
          >
            Ir al inicio
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-blue-100 p-4 rounded-lg text-center">
            <p className="text-gray-700 font-medium">Pedidos (leads)</p>
            <p className="text-3xl font-bold text-blue-700">0</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg text-center">
            <p className="text-gray-700 font-medium">Productos</p>
            <p className="text-3xl font-bold text-green-700">0</p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link
            to={`/dashboard/${slug}/productos`}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition duration-300"
          >
            Ver mis productos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardTienda;
