import { useEffect, useState } from 'react';
import { useParams, NavLink, Link } from 'react-router-dom';
import ProductCard from './ProductCard';

function ProductosTienda() {
  const { slug } = useParams();
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
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <nav className="space-y-4 text-gray-700">
          <NavLink
            to={`/dashboard/${slug}`}
            className={({ isActive }) =>
              isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to={`/dashboard/${slug}/productos`}
            className={({ isActive }) =>
              isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'
            }
          >
            Productos
          </NavLink>
          <NavLink
            to={`/dashboard/${slug}/pedidos`}
            className={({ isActive }) =>
              isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'
            }
          >
            Pedidos
          </NavLink>
          <NavLink
            to={`/dashboard/${slug}/clientes`}
            className={({ isActive }) =>
              isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'
            }
          >
            Clientes
          </NavLink>
          <NavLink
            to={`/dashboard/${slug}/clientes`}
            className={({ isActive }) =>
              isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'
            }
          >
            Clientes
          </NavLink>
          <NavLink
            to={`/dashboard/${slug}/config`}
            className={({ isActive }) =>
              isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'
            }
          >
            Configuración
          </NavLink>
          <NavLink to="/login" className="block text-red-500 hover:text-red-600">
            Cerrar Sesión
          </NavLink>
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-6xl mx-auto bg-white shadow-xl rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{storeName}</h1>
          <div className="mb-6 text-right">
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
                <div key={prod.id}>
                  <ProductCard producto={prod} slug={slug} />
                  <div className="mt-2 text-right">
                    <Link
                      to={`/dashboard/${slug}/productos/editar/${prod.id}`}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      ✏️ Editar producto
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductosTienda;
