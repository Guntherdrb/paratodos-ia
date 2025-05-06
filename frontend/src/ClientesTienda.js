import React, { useEffect, useState } from 'react';
import { useParams, NavLink } from 'react-router-dom';

function ClientesTienda() {
  const { slug } = useParams();
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [counts, setCounts] = useState(0);
  const [selectedClients, setSelectedClients] = useState([]);

  // Fetch all customers
  const loadClientes = () => {
    fetch(`/api/clientes/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setClientes(data.clientes || []);
          setCounts(data.clientes.length);
        }
      })
      .catch(err => console.error('Error al cargar clientes:', err));
  };

  useEffect(() => { loadClientes(); }, [slug]);

  const toggleSelect = (id) => {
    setSelectedClients(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const sendWhatsApp = (telefono) => {
    const msg = prompt('Escriba el mensaje a enviar:', '');
    if (msg !== null) {
      const text = encodeURIComponent(msg);
      window.open(`https://wa.me/${telefono}?text=${text}`, '_blank');
    } else {
      window.open(`https://wa.me/${telefono}`, '_blank');
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const newCliente = { nombre, telefono, email };
    fetch(`/api/clientes/${slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCliente)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNombre(''); setTelefono(''); setEmail('');
          loadClientes();
        } else {
          alert('Error al agregar cliente: ' + (data.error || ''));
        }
      })
      .catch(err => console.error('Error al crear cliente:', err));
  };

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <nav className="space-y-4 text-gray-700">
          <NavLink to={`/dashboard/${slug}`} className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}>Dashboard</NavLink>
          <NavLink to={`/dashboard/${slug}/productos`} className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}>Productos</NavLink>
          <NavLink to={`/dashboard/${slug}/pedidos`} className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}>Pedidos</NavLink>
          <NavLink to={`/dashboard/${slug}/clientes`} className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}>Clientes ({counts})</NavLink>
          <NavLink to={`/dashboard/${slug}/config`} className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}>Configuración</NavLink>
          <NavLink to="/login" className="block text-red-500 hover:text-red-600">Cerrar Sesión</NavLink>
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Clientes registrados</h1>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input type="text" placeholder="Nombre" required value={nombre} onChange={e => setNombre(e.target.value)} className="input" />
            <input type="text" placeholder="Teléfono" value={telefono} onChange={e => setTelefono(e.target.value)} className="input" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="input" />
            <button type="submit" className="btn col-span-full sm:col-span-1">Agregar cliente</button>
          </form>
          {clientes.length > 0 ? (
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Contacto</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2 align-middle">{c.nombre}</td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                        />
                        <span>{c.telefono}</span>
                        <button
                          onClick={() => sendWhatsApp(c.telefono)}
                          className="ml-auto text-green-600 hover:text-green-800"
                        >📲
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle">{c.email}</td>
                    <td className="px-4 py-2 align-middle">{new Date(c.fecha).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-600">Aún no hay clientes registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientesTienda;