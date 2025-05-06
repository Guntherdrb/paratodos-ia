import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function PaginaPrincipal() {
  const [stores, setStores] = useState([]);
  const [productosDestacados, setProductosDestacados] = useState([]);


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
  // Carousel state
  const carouselImages = ['/banner1.png', '/banner2.png']; // add more images as needed
  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <main className="font-sans text-gray-800 dark:text-gray-100 dark:bg-gray-900 transition-colors duration-300">

      {/* Hero section */}
      <section className="relative h-screen w-full overflow-hidden">
        {carouselImages.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Banner ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col justify-center items-center text-white text-center p-6">
              
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Crea tu tienda online en minutos con IA.  Sube tu Catalogo de Productos en PDF y te sorprederas 
                
              </h1>
              
              <Link to="/crear-tienda" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-full text-white font-semibold">
                Crear Tienda con IA
              </Link>
            </div>
          </section>

      {/* Main content container */}
      <div className="pt-12 max-w-7xl mx-auto px-4">
        {/* Productos más populares */}
        <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Productos más populares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
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
        </div>
      </main>
  );
}

export default PaginaPrincipal;
