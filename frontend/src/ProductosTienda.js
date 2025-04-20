import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function ProductosTienda() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    fetch(`/api/productos/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductos(data.productos);
        }
      })
      .catch(err => console.error("Error cargando productos:", err));
  }, [slug]);
  // Obtener nombre de la tienda para header
  useEffect(() => {
    fetch(`/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStoreName(data.tienda.nombre);
      })
      .catch(err => console.error('Error cargando tienda:', err));
  }, [slug]);

  return (
    <div className="font-sans text-gray-800 bg-gray-50 min-h-screen">
      {/* Nombre de la tienda */}
      {storeName && (
        <div className="pt-16 pb-4 bg-white shadow">
          <h1 className="text-center text-2xl font-bold">{storeName}</h1>
        </div>
      )}
      {/* Navbar superior */}
      <header className="bg-white shadow fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-blue-900">
            ParaTodos<span className="text-gray-800">.IA</span>
          </span>
        </div>
        <nav className="flex gap-6 items-center">
          <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium">Inicio</Link>
          <Link to="/crear-tienda" className="text-gray-600 hover:text-blue-600 font-medium">Crear Tienda</Link>
          <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">Login</Link>
          <button className="border px-3 py-1 rounded text-sm hover:bg-gray-100">🌐 ES | EN</button>
        </nav>
      </header>

      <main className="pt-28 max-w-6xl mx-auto px-4 sm:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mis Productos</h1>
          <Link
            to={`/dashboard/${slug}/productos/nuevo`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Agregar producto
          </Link>
        </div>

        {productos.length === 0 ? (
          <p className="text-gray-500">No hay productos registrados todavía.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {productos.map((prod) => (
              <div key={prod.id} className="bg-white border rounded-lg shadow-sm p-4">
                {prod.imagen && (
                  <img
                    src={prod.imagen}
                    alt={prod.nombre}
                    className="h-40 w-full object-cover rounded mb-4"
                  />
                )}
                <h2 className="text-lg font-semibold">{prod.nombre}</h2>
                <p className="text-sm text-gray-600 mb-2">{prod.descripcion}</p>
                <p className="font-bold text-blue-700 mb-3">${prod.precio}</p>
                <Link
                  to={`/dashboard/${slug}/productos/editar/${prod.id}`}
                  className="text-blue-600 text-sm hover:underline"
                >
                  ✏️ Editar producto
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10">
          <button
            onClick={() => navigate(`/dashboard/${slug}`)}
            className="text-blue-600 text-sm underline"
          >
            ← Volver al Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default ProductosTienda;
