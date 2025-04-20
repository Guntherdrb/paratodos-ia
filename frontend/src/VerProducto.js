import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function VerProducto() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);

  useEffect(() => {
    fetch(`/api/producto/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProducto(data.producto);
        } else {
          alert('Producto no encontrado');
        }
      });
  }, [id]);

  if (!producto) {
    return <div className="text-center py-10 text-gray-500">Cargando producto...</div>;
  }

  // Función para compartir el producto
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: producto.nombre,
          text: producto.descripcion,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    } catch (err) {
      console.error('Error al compartir', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 px-6 py-10 relative">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
        {/* Encabezado: nombre de tienda y botones de redes/compartir */}
        <div className="flex justify-between items-center mb-6">
          <div>
            {producto.tienda && (
              <Link to={`/tienda/${producto.tienda.slug}`} className="text-xl font-semibold text-blue-600 hover:underline">
                {producto.tienda.nombre}
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Botón compartir */}
            <button
              onClick={handleShare}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
              title="Compartir producto"
            >
              🔗
            </button>
            {/* Instagram de la tienda */}
            {producto.tienda && producto.tienda.instagram && (
              <a
                href={`https://instagram.com/${producto.tienda.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-pink-500 text-white rounded-full hover:opacity-90 transition"
                title="Instagram de la tienda"
              >
                📸
              </a>
            )}
            {/* WhatsApp de la tienda */}
            {producto.tienda && producto.tienda.telefono && (
              <a
                href={`https://wa.me/${producto.tienda.telefono.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-green-500 text-white rounded-full hover:opacity-90 transition"
                title="WhatsApp de la tienda"
              >
                💬
              </a>
            )}
          </div>
        </div>
        {/* Detalle de producto */}
        <h1 className="text-3xl font-bold mb-4 text-blue-800">{producto.nombre}</h1>
        {producto.imagen && (
          <img src={producto.imagen} alt={producto.nombre} className="h-64 w-full object-contain mb-6 rounded" />
        )}
        <p className="text-lg mb-4 text-gray-700"><strong>Descripción:</strong> {producto.descripcion}</p>
        <p className="text-lg mb-4 text-gray-700"><strong>Precio:</strong> ${producto.precio}</p>
        {producto.relacionados && (
          <p className="text-sm text-gray-500">Relacionados: {producto.relacionados}</p>
        )}
      </div>
      {/* Botón fijo de comprar en esquina inferior derecha */}
      {producto.tienda && producto.tienda.telefono && (
        <a
          href={`https://wa.me/${producto.tienda.telefono.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-[#25D366] text-white px-6 py-3 rounded-full shadow-lg hover:opacity-90 transition"
        >
          Comprar por WhatsApp
        </a>
      )}
    </div>
  );
}

export default VerProducto;
