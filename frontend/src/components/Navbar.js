import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <header className="bg-white shadow fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600 flex items-center">
          ParaTodos IA
        </Link>
        <nav className="space-x-4 text-gray-700 font-medium">
          <Link to="/">Inicio</Link>
          <Link to="/">Crear tienda</Link>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
