import { useParams, NavLink, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function DashboardTienda() {
  const { slug } = useParams();
  const [datos, setDatos] = useState(null);
  const [leadsCount, setLeadsCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [pedidoCounts, setPedidoCounts] = useState({ activos: 0, cerrados: 0, cancelados: 0 });

  useEffect(() => {
    fetch(`/api/tienda/${slug}`)
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
  // Fetch leads count
  useEffect(() => {
    fetch(`/api/leads/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLeadsCount(data.count || 0);
        }
      })
      .catch(err => console.error('Error al cargar leads:', err));
  }, [slug]);
  // Fetch products count
  useEffect(() => {
    fetch(`/api/productos/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.productos)) {
          setProductsCount(data.productos.length);
        }
      })
      .catch(err => console.error('Error al cargar productos:', err));
  }, [slug]);
  // Fetch top selling products
  useEffect(() => {
    fetch(`/api/mas_vendidos/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTopProducts(data.top || []);
        }
      })
      .catch(err => console.error('Error al cargar top productos:', err));
  }, [slug]);
  // Fetch pedido counts by status for sales statistics
  useEffect(() => {
    fetch(`/api/pedidos/${slug}/counts`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.counts) {
          setPedidoCounts(data.counts);
        }
      })
      .catch(err => console.error('Error al cargar estadísticas de ventas:', err));
  }, [slug]);

  if (!datos) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        Cargando datos del dashboard...
      </div>
    );
  }

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
      {/* Main content area */}
      <div className="flex-1 py-12 px-6">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-100 p-4 rounded-lg text-center">
              <p className="text-gray-700 font-medium">Pedidos (leads)</p>
              <p className="text-3xl font-bold text-blue-700">{leadsCount}</p>
            </div>
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-gray-700 font-medium">Productos</p>
              <p className="text-3xl font-bold text-green-700">{productsCount}</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              to={`/dashboard/${slug}/productos`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full shadow-md transition duration-300"
            >
              Ver mis productos
            </Link>
          </div>

          {/* Sales statistics */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Estadísticas de ventas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-yellow-100 p-4 rounded-lg text-center">
                <p className="text-gray-700 font-medium">Pendientes</p>
                <p className="text-2xl font-bold">{pedidoCounts.activos}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-lg text-center">
                <p className="text-gray-700 font-medium">Cerrados</p>
                <p className="text-2xl font-bold">{pedidoCounts.cerrados}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg text-center">
                <p className="text-gray-700 font-medium">Cancelados</p>
                <p className="text-2xl font-bold">{pedidoCounts.cancelados}</p>
              </div>
            </div>
          </div>
          {/* Top selling products */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Productos más vendidos</h2>
            {topProducts.length > 0 ? (
              <ul className="space-y-2">
                {topProducts.map(item => (
                  <li key={item.producto} className="flex justify-between">
                    <span>{item.producto}</span>
                    <span className="font-bold">{item.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">No hay datos de ventas disponibles.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardTienda;
