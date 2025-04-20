import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

function VistaTienda() {
  const { slug } = useParams();
  const [datos, setDatos] = useState(null);
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);

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

  // Cargar productos de la tienda
  useEffect(() => {
    fetch(`/api/productos/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductos(data.productos);
        } else {
          console.error('No se pudieron cargar los productos');
        }
        setCargandoProductos(false);
      })
      .catch(err => {
        console.error('Error al cargar productos:', err);
        setCargandoProductos(false);
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
            src={`/uploads/${slug}/${datos.logo}`}
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

        <div className="flex flex-col md:flex-row justify-center gap-4 mb-6">
          {/* Botón para visualizar el catálogo en nueva pestaña */}
          <a
            href={`/uploads/${slug}/${datos.catalogo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-center shadow-md transition duration-300"
          >
            Ver Catálogo
          </a>
          {/* Enlace al panel de administración */}
          <Link
            to={`/dashboard/${slug}`}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-center shadow-md transition duration-300"
          >
            Ir a mi tienda
          </Link>
        </div>
        {/* Sección de productos extraídos del catálogo */}
      <div className="mt-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Productos</h2>
        {cargandoProductos ? (
          <p className="text-center">Cargando productos...</p>
        ) : productos.length === 0 ? (
          <p className="text-center">No hay productos disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {productos.map(p => (
              <ProductCard key={p.id} producto={p} slug={slug} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default VistaTienda;

