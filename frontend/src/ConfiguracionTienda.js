import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Link, useNavigate } from 'react-router-dom';

function ConfiguracionTienda() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [tienda, setTienda] = useState(null);
  const [nombre, setNombre] = useState('');
  const [responsable, setResponsable] = useState('');
  const [rif, setRif] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [instagram, setInstagram] = useState('');
  const [direccion, setDireccion] = useState('');
  const [productosDesc, setProductosDesc] = useState('');
  const [color, setColor] = useState('#ffffff');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    fetch(`/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const t = data.tienda;
          setTienda(t);
          setNombre(t.nombre || '');
          setResponsable(t.responsable || '');
          setRif(t.rif || '');
          setEmail(t.email || '');
          setTelefono(t.telefono || '');
          setInstagram(t.instagram || '');
          setDireccion(t.direccion || '');
          setProductosDesc(t.productos || '');
          setColor(t.color || '#ffffff');
          if (t.logo) setLogoPreview(`/uploads/${slug}/${t.logo}`);
        } else {
          alert('Tienda no encontrada');
        }
      })
      .catch(err => {
        console.error('Error al cargar configuración:', err);
        alert('Error al cargar configuración de la tienda.');
      });
  }, [slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('responsable', responsable);
    formData.append('rif', rif);
    formData.append('email', email);
    formData.append('telefono', telefono);
    formData.append('instagram', instagram);
    formData.append('direccion', direccion);
    formData.append('productos', productosDesc);
    formData.append('color', color);
    if (logoFile) formData.append('logo', logoFile);
    try {
      const res = await fetch(`/api/tienda/${slug}`, { method: 'PUT', body: formData });
      const result = await res.json();
      if (result.success) {
        alert('Configuración actualizada correctamente');
        navigate(`/dashboard/${slug}`);
      } else {
        alert('Error al guardar: ' + (result.error || ''));    
      }
    } catch (error) {
      console.error('Error al actualizar tienda:', error);
      alert('Error al conectar con el servidor');
    }
  };

  if (!tienda) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-600">
        Cargando configuración...
      </div>
    );
  }

  const capitalize = s => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar navigation */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block">
        <nav className="space-y-4 text-gray-700">
          <NavLink
            to={`/dashboard/${slug}`}
            className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}
          >Dashboard</NavLink>
          <NavLink
            to={`/dashboard/${slug}/productos`}
            className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}
          >Productos</NavLink>
          <NavLink
            to={`/dashboard/${slug}/pedidos`}
            className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}
          >Pedidos</NavLink>
          <NavLink
            to={`/dashboard/${slug}/config`}
            className={({ isActive }) => isActive ? 'block font-semibold text-blue-600' : 'block hover:text-blue-600'}
          >Configuración</NavLink>
          <NavLink to="/login" className="block text-red-500 hover:text-red-600">Cerrar Sesión</NavLink>
        </nav>
      </aside>
      {/* Content area */}
      <div className="flex-1 py-12 px-6">
        <div className="max-w-xl mx-auto bg-white shadow-xl rounded-lg p-8 space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Configuración de la tienda</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium">Nombre de la tienda</label>
              <input
                type="text" value={nombre} onChange={e => setNombre(e.target.value)} required
                className="input"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Responsable</label>
              <input
                type="text" value={responsable} onChange={e => setResponsable(e.target.value)} required
                className="input"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium">RIF / Cédula</label>
                <input type="text" value={rif} onChange={e => setRif(e.target.value)} required className="input" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Correo</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium">Teléfono / WhatsApp</label>
                <input type="text" value={telefono} onChange={e => setTelefono(e.target.value)} required className="input" />
              </div>
              <div>
                <label className="block text-gray-700 font-medium">Instagram</label>
                <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="@usuario" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Dirección</label>
              <textarea value={direccion} onChange={e => setDireccion(e.target.value)} required className="input" rows={2} />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Productos que vendes</label>
              <textarea value={productosDesc} onChange={e => setProductosDesc(e.target.value)} required className="input" rows={2} />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Color corporativo</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="input h-10 p-0" />
            </div>
            <div>
              <label className="block text-gray-700 font-medium">Logo actual</label>
              {logoPreview && <img src={logoPreview} alt="Logo actual" className="h-20 mb-2 rounded" />}
              <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} className="input" />
            </div>
            <div className="text-right">
              <button type="submit" className="btn">
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ConfiguracionTienda;