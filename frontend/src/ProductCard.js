import React, { useState } from 'react';

const ProductCard = ({ producto, slug }) => {
  const [liked, setLiked] = useState(false);

  const handleLike = () => {
    setLiked(!liked);
  };
  const handleComprar = () => {
    window.open(`https://wa.me/?text=Estoy interesado en ${producto.nombre} de la tienda ${slug}`, '_blank');
  };

  return (
    <div className="bg-white shadow rounded-xl p-4 flex flex-col gap-2 hover:shadow-lg transition">
      {producto.imagen && (
        <img
          src={producto.imagen}
          alt={producto.nombre}
          className="h-40 w-full object-cover rounded mb-2"
        />
      )}
      <h3 className="text-lg font-semibold">{producto.nombre}</h3>
      <p className="text-sm text-gray-600">{producto.descripcion}</p>
      <p className="text-green-600 font-bold">{producto.precio}</p>

      <div className="flex gap-2 mt-2 items-center">
        <button
          onClick={handleLike}
          className={`text-xl p-1 rounded ${liked ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-500'}`}
        >
          {liked ? '♥' : '♡'}
        </button>
        <button onClick={handleComprar} className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600">
          Comprar
        </button>
        <button
          className="text-sm flex items-center gap-1 px-3 py-1 border rounded text-gray-600 hover:text-blue-600"
          onClick={() => navigator.share?.({ title: producto.nombre, url: window.location.href })}
        >
          <span>🔗</span> Compartir
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
