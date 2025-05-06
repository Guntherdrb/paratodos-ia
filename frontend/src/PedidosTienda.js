import React, { useEffect, useState } from 'react';
import { useParams, NavLink, useLocation } from 'react-router-dom';

function PedidosTienda() {
  const { slug } = useParams();
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const status = query.get('status') || 'activos';
  const [counts, setCounts] = useState({ activos: 0, cerrados: 0, cancelados: 0 });
  const [pedidos, setPedidos] = useState([]);

  // Fetch counts by status
  useEffect(() => {
    fetch(`/api/pedidos/${slug}/counts`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCounts(data.counts || {});
        }
      })
      .catch(err => console.error('Error al cargar counts de pedidos:', err));
  }, [slug]);

  // Fetch pedidos by selected status
  useEffect(() => {
    fetch(`/api/pedidos/${slug}?status=${status}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPedidos(data.pedidos || []);
        }
      })
      .catch(err => console.error('Error al cargar pedidos:', err));
  }, [slug, status]);

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <nav className="space-y-4 text-gray-700">
          {['activos', 'cerrados', 'cancelados'].map(st => (
            <NavLink
              key={st}
              to={`?status=${st}`}
              className={({ isActive }) =>
                isActive
                  ? 'block font-semibold text-blue-600'
                  : 'block hover:text-blue-600'
              }
            >
              {capitalize(st)} ({counts[st] || 0})
            </NavLink>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Pedidos: {capitalize(status)}
          </h1>
          {pedidos.length > 0 ? (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Cliente</th>
                  <th className="px-4 py-2 text-left">Producto</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="px-4 py-2">{p.cliente}</td>
                    <td className="px-4 py-2">{p.producto}</td>
                    <td className="px-4 py-2">{new Date(p.fecha).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize">{p.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">No hay pedidos en esta categoría.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PedidosTienda;