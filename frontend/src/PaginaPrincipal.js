import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PaginaPrincipal() {
  const [modoOscuro, setModoOscuro] = useState(false);
  const [lang, setLang] = useState('es');
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [productosDestacados, setProductosDestacados] = useState([]);

  const alternarModo = () => {
    setModoOscuro(!modoOscuro);
    document.documentElement.classList.toggle('dark');
  };
  const toggleLang = () => {
    setLang(prev => (prev === 'es' ? 'en' : 'es'));
    // aquí podrías integrar i18n.changeLanguage si estuviera configurado
  };
  const buscarTiendas = () => {
    const term = searchTerm.toLowerCase();
    const results = stores.filter(s => s.nombre.toLowerCase().includes(term));
    setFilteredStores(results);
  };

  useEffect(() => {
    // Cargar tiendas
    fetch('/api/tiendas')
      .then(res => res.json())
      .then(data => { if (data.success) setStores(data.tiendas); })
      .catch(err => console.error('Error cargando tiendas:', err));
    // Cargar productos destacados
    fetch('/api/productos')
      .then(res => res.json())
      .then(data => { if (data.success) setProductosDestacados(data.productos); })
      .catch(err => console.error('Error cargando productos:', err));
  }, []);

  return (
    <div className={`${modoOscuro ? 'dark' : ''}`}>
      <div className="font-sans text-gray-800 dark:text-gray-100 dark:bg-gray-900 min-h-screen transition-colors duration-300">
        {/* Barra superior */}
        <header className="bg-white dark:bg-gray-800 shadow fixed w-full top-0 z-50 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-extrabold text-blue-900 dark:text-white">
              ParaTodos<span className="text-gray-600 dark:text-gray-300">.IA</span>
            </span>
          </div>
          <nav className="flex gap-4 items-center text-sm">
            <Link to="/" className="hover:text-blue-600 dark:hover:text-blue-300">Inicio</Link>
            <Link to="/crear-tienda" className="hover:text-blue-600 dark:hover:text-blue-300">Crear Tienda</Link>
            <Link to="/login" className="hover:text-blue-600 dark:hover:text-blue-300">Login</Link>
            <button className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">🌐 ES | EN</button>
            <button onClick={alternarModo} className="px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">
              {modoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
            </button>
            <button className="hover:text-blue-600 dark:hover:text-blue-300">❓ Ayuda</button>
          </nav>
        </header>

        <main className="pt-28 px-4 sm:px-10 max-w-6xl mx-auto">
          {/* Banner mensaje */}
          <section className="text-center mb-10">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              Crea tu tienda en minutos con IA
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Sube tu catálogo en PDF organizado y obtén tu tienda online personalizada
            </p>
            <Link
              to="/crear-tienda"
              className="bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition"
            >
              Crear mi tienda ahora
            </Link>
          </section>

          {/* Buscador de tiendas */}
          <section className="mb-10">
            <h2 className="text-center text-lg font-medium mb-3">🔍 Buscar Tiendas</h2>
            <div className="flex justify-center items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar tiendas..."
                className="w-full max-w-xl px-4 py-2 border rounded-l dark:bg-gray-800 dark:border-gray-600"
              />
              <button
                onClick={buscarTiendas}
                className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 transition"
              >
                🔎 Buscar
              </button>
            </div>
            {filteredStores.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredStores.map(store => (
                  <Link
                    key={store.slug}
                    to={`/tienda/${store.slug}`}
                    className="flex items-center gap-2 bg-white dark:bg-gray-800 p-4 rounded shadow hover:shadow-md"
                  >
                    {store.logo && (
                      <img src={store.logo} alt={store.nombre} className="h-10 w-10 object-cover rounded-full" />
                    )}
                    <span className="font-medium">{store.nombre}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Productos destacados */}
          <section className="mb-14">
            <h2 className="text-2xl font-semibold mb-4">Productos destacados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {productosDestacados.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded p-4 shadow">
                  {/* Enlace al detalle de producto */}
                  <Link to={`/producto/${p.id}`} className="block text-center hover:opacity-90 transition">
                    {p.imagen && (
                      <img src={p.imagen} alt={p.nombre} className="mx-auto h-32 mb-3 object-cover rounded" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">{p.nombre}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">${p.precio}</p>
                  </Link>
                  {/* Botón de compra por WhatsApp */}
                  {p.telefono ? (
                    <a
                      href={`https://wa.me/${p.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full block bg-[#25D366] text-white px-4 py-2 rounded-full text-sm shadow hover:opacity-90 transition text-center"
                    >
                      Comprar por WhatsApp
                    </a>
                  ) : (
                    <button className="w-full bg-gray-400 text-white px-4 py-2 rounded-full text-sm shadow cursor-not-allowed">
                      Sin WhatsApp
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Tiendas destacadas */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">Tiendas destacadas</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {stores.map(store => (
                <Link
                  key={store.slug}
                  to={`/tienda/${store.slug}`}
                  className="flex items-center gap-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-full px-6 py-2 shadow hover:shadow-md text-gray-700 dark:text-gray-200 font-medium"
                >
                  {store.logo && (
                    <img src={store.logo} alt={store.nombre} className="h-8 w-8 object-cover rounded-full" />
                  )}
                  <span>{store.nombre}</span>
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default PaginaPrincipal;
