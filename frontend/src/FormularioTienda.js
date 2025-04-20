import React, { useState } from 'react';
import ConfirmacionTienda from './ConfirmacionTienda';

function FormularioTienda() {
  const [tienda, setTienda] = useState(null);

  const crearTienda = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const response = await fetch('/api/crear-tienda', {
        method: 'POST',
        body: formData,
      });

      const resultado = await response.json();

      if (resultado.success) {
        setTienda({ nombre: formData.get('nombre') });
      } else {
        alert('Error al crear la tienda: ' + (resultado.error || 'Revisa los datos ingresados.'));
      }
    } catch (error) {
      console.error('Error al conectar con el servidor:', error);
      alert('Hubo un problema al conectar con el servidor.');
    }
  };

  if (tienda) return <ConfirmacionTienda tienda={tienda} />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={crearTienda}
        className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full space-y-5"
      >
        <h1 className="text-3xl font-bold text-center text-gray-800">Crear nueva tienda</h1>

        <input name="nombre" required placeholder="Nombre de la tienda *" className="input" />
        <input name="responsable" required placeholder="Responsable *" className="input" />
        <input name="rif" required placeholder="RIF o Cédula *" className="input" />
        <input name="email" type="email" required placeholder="Correo *" className="input" />
        <input name="telefono" required placeholder="WhatsApp o Teléfono *" className="input" />
        <input name="instagram" placeholder="@Instagram (opcional)" className="input" />
        <textarea name="direccion" required placeholder="Dirección de envíos *" className="input" />
        <textarea name="productos" required placeholder="¿Qué productos vendes?" className="input" />

        <div>
          <label className="text-gray-700 font-semibold">Color corporativo *</label>
          <input name="color" type="color" required className="w-full h-12 rounded border" />
        </div>

        <div>
          <label className="text-gray-700 font-semibold">Logo de la tienda *</label>
          <input name="logo" type="file" accept="image/*" required className="w-full border rounded p-2" />
        </div>

        <div>
          <label className="text-gray-700 font-semibold">Catálogo en PDF *</label>
          <input name="catalogo" type="file" accept=".pdf" required className="w-full border rounded p-2" />
        </div>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 w-full rounded-full shadow"
        >
          Crear tienda
        </button>
      </form>
    </div>
  );
}

export default FormularioTienda;
