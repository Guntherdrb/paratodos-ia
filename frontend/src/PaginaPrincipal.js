import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PaginaPrincipal() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const [stores, setStores] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);

  const alternarModo = () => {
    setModoOscuro(!modoOscuro);
    document.documentElement.classList.toggle('dark');
  };

  useEffect(() => {
    fetch('/api/tiendas')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStores(data.tiendas.slice(0, 10));
      });
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProductosDestacados(data.productos.slice(0, 10));
        }
      });
  }, []);

  return (
    <div className={`${modoOscuro ? 'dark' : ''}`}>
      <div className="font-sans text-gray-800 dark:text-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">

        {/* Barra superior */}
        <header className="bg-white dark:bg-gray-800 shadow fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center">
          <div className="text-3xl font-extrabold text-blue-900 dark:text-white">
            <img src="/logopartodosia.png" alt="ParaTodos.IA" className="h-10" />
          </div>
          <nav className="flex gap-4 items-center text-sm">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-300">Inicio</Link>
            <Link to="/crear-tienda" className="hover:text-blue-600 dark:hover:text-blue-300">Crear Tienda</Link>
            <Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-300">Login</Link>
            <button onClick={alternarModo} className="border px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              {modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
          </nav>
        </header>

    
            

        <main className="pt-28 max-w-7xl mx-auto px-4">

          {/* Carrusel de banners */}
          <section className="relative h-[450px] mb-12 rounded-lg overflow-hidden shadow-lg">
          
            
            <img
              src="/banner1.png"
              alt="Banner 1"
              className="absolute inset-0 animate-fade1 object-cover w-full h-full"
            />
            <img
              src="/banner2.png"
              alt="Banner 2"
              className="absolute inset-0 animate-fade2 object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-center items-center text-white text-center p-6">
              
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Crea tu tienda online en minutos con IA.  Sube tu Catalogo de Productos en PDF y te sorprederas 
                
              </h1>
              
              <Link to="/crear-tienda" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full text-white font-semibold">
                Crear Tienda con IA
              </Link>
            </div>
          </section>

          {/* Productos populares */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Productos más populares</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {productosDestacados.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow">
                  <Link to={`/producto/${p.id}`}>
                    {p.imagen && <img src={p.imagen} alt={p.nombre} className="w-full h-40 object-cover" />}
                    <div className="p-3">
                      <h3 className="text-base font-semibold mb-1 text-center">{p.nombre}</h3>
                      <p className="text-center text-gray-600 dark:text-gray-400">${p.precio}</p>
                    </div>
                  </Link>
                  <a
                    href={`https://wa.me/${p.telefono || ''}`}
                    className="block text-center bg-[#25D366] text-white py-2 font-medium hover:opacity-90 transition"
                    target="_blank" rel="noopener noreferrer"
                  >
                    Comprar por WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* Tiendas destacadas */}
          <section className="mb-16">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Tiendas destacadas</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {stores.map(store => (
                <Link
                  key={store.slug}
                  to={`/tienda/${store.slug}`}
                  className="flex flex-col items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition"
                >
                  {store.logo && (
                    <img src={store.logo} alt={store.nombre} className="w-24 h-24 object-cover rounded-full mb-3" />
                  )}
                  <span className="font-semibold text-center text-gray-800 dark:text-gray-200">{store.nombre}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Marcas destacadas */}
          <section className="bg-gray-100 dark:bg-gray-800 py-8 px-4 rounded-lg shadow">
            <h3 className="text-center text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Marcas disponibles en nuestra plataforma
            </h3>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg',
                'https://upload.wikimedia.org/wikipedia/commons/8/88/Samet_logo.png',
                'https://via.placeholder.com/120x60?text=Casa+Bonita',
                'https://via.placeholder.com/120x60?text=DecoHome'
              ].map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Marca destacada ${i}`}
                  className="h-14 object-contain grayscale hover:grayscale-0 transition"
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default PaginaPrincipal;
