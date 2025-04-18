import { useNavigate } from 'react-router-dom';

function ConfirmacionTienda({ tienda }) {
  const navigate = useNavigate();

  const verTienda = () => {
    const slug = tienda.nombre.toLowerCase().replace(/\s+/g, '-');
    navigate(`/tienda/${slug}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full text-center">
        <h2 className="text-3xl font-bold mb-4 text-gray-800">¡Tienda creada!</h2>
        <p className="text-gray-600 mb-6">
          Tu tienda <strong>{tienda.nombre}</strong> fue creada correctamente.
          <br />Ahora puedes visualizar cómo se ve públicamente.
        </p>
        <button
          onClick={verTienda}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow transition duration-300"
        >
          Ver tienda
        </button>
      </div>
    </div>
  );
}

export default ConfirmacionTienda;
