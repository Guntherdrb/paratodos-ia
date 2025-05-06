import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import PaginaPrincipal from './PaginaPrincipal';
import FormularioTienda from './FormularioTienda';
import VistaTienda from './VistaTienda';
import DashboardTienda from './DashboardTienda';
import PedidosTienda from './PedidosTienda';
import ConfiguracionTienda from './ConfiguracionTienda';
import ClientesTienda from './ClientesTienda';
import ProductosTienda from './ProductosTienda';
import AgregarProducto from './AgregarProducto';
import EditarProducto from './EditarProducto';
import VerProducto from './VerProducto';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showBackButton = location.pathname !== '/';
  return (
    <>
      <Navbar />
      <div className="pt-20 flex flex-col h-screen">
        {showBackButton && (
          <div className="px-6 pb-2 bg-gray-100 dark:bg-gray-800 shadow-sm">
            <button
              onClick={() => navigate(-1)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm font-semibold"
            >
              ← Volver
            </button>
          </div>
        )}
        <div className="flex-grow">
          <Routes>
          <Route path="/" element={<PaginaPrincipal />} />
          <Route path="/crear-tienda" element={<FormularioTienda />} />
          <Route path="/tienda/:slug" element={<VistaTienda />} />
          <Route path="/dashboard/:slug" element={<DashboardTienda />} />
          <Route path="/dashboard/:slug/productos" element={<ProductosTienda />} />
          <Route path="/dashboard/:slug/productos/nuevo" element={<AgregarProducto />} />
          <Route path="/dashboard/:slug/productos/editar/:id" element={<EditarProducto />} />
          <Route path="/producto/:id" element={<VerProducto />} />
          <Route path="/dashboard/:slug/pedidos" element={<PedidosTienda />} />
          <Route path="/dashboard/:slug/config" element={<ConfiguracionTienda />} />
          <Route path="/dashboard/:slug/clientes" element={<ClientesTienda />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
