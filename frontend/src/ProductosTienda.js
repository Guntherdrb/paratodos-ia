import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

function ProductosTienda() {
  const { slug } = useParams();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/productos/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductos(data.productos);
        } else {
          alert('No se pudieron cargar los productos');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setLoading(false);
      });
  }, [slug]);

  return (
    <div className="min-h-screen px-6 py-10 bg-gray-50 text-gray-800">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📦 Mis Productos</h1>
          <Link
            to={`/dashboard/${slug}/productos/nuevo`}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            ➕ Agregar producto
          </Link>
        </div>

        {loading ? (
          <p className="text-center">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-center">No hay productos aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {productos.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded shadow p-4 border border-gray-200"
              >
                <h2 className="text-xl font-semibold text-blue-600">{p.nombre}</h2>
                <p className="text-gray-700 mt-2">{p.descripcion}</p>
                <p className="font-bold text-green-700 mt-2">Precio: ${p.precio}</p>
                {p.relacionados && (
                  <p className="text-sm text-gray-500 mt-1">🔗 Relacionados: {p.relacionados}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductosTienda;
