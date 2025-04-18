import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

import FormularioTienda from './FormularioTienda';
import VistaTienda from './VistaTienda';
import DashboardTienda from './DashboardTienda';
import ProductosTienda from './ProductosTienda';
import AgregarProducto from './AgregarProducto';
import Navbar from './components/Navbar';

function Layout() {
  const location = useLocation();
  const ocultarNavbar = location.pathname.startsWith('/tienda/');

  return (
    <>
      {!ocultarNavbar && <Navbar />}
      <div className={ocultarNavbar ? '' : 'pt-20'}>
        <Routes>
          <Route path="/" element={<FormularioTienda />} />
          <Route path="/tienda/:slug" element={<VistaTienda />} />
          <Route path="/dashboard/:slug" element={<DashboardTienda />} />
          <Route path="/dashboard/:slug/productos" element={<ProductosTienda />} />
          <Route path="/dashboard/:slug/productos/nuevo" element={<AgregarProducto />} />
        </Routes>
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
