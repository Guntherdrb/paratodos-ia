import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PaginaPrincipal from './PaginaPrincipal';
import FormularioTienda from './FormularioTienda';
import VistaTienda from './VistaTienda';
import DashboardTienda from './DashboardTienda';
import ProductosTienda from './ProductosTienda';
import AgregarProducto from './AgregarProducto';
import EditarProducto from './EditarProducto';
import VerProducto from './VerProducto';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function Layout() {
  return (
    <>
      <Navbar />
      <div className="pt-20 flex flex-col h-screen">
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
