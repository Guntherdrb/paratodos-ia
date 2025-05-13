import React, { useState, useRef } from 'react';
// import EditaImagenIA from './EditaImagenIA'; (no inline editor here)

// API base URL: por defecto apunta al servidor de backend en Node (puerto 5000)
const API_URL = process.env.REACT_APP_API_URL
  || `${window.location.protocol}//${window.location.hostname}:5000`;

function CreaImagenIA() {
  const [prompt, setPrompt] = useState('');
  const [reference, setReference] = useState(null);
  const [preview, setPreview] = useState(null);
  // Array de objetos de imagen: { url }
  const [images, setImages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  // Ejemplos para inspirar prompts de producto
  const samplePrompts = [
    { prompt: 'A modern minimalistic white chair on a plain white background for an e-commerce product photo', img: 'https://via.placeholder.com/250?text=White+Chair' },
    { prompt: 'A sleek black sneaker isolated on white background, high resolution, e-commerce style', img: 'https://via.placeholder.com/250?text=Black+Sneaker' },
    { prompt: 'A close-up of a luxury wristwatch on a reflective surface, crisp white background', img: 'https://via.placeholder.com/250?text=Wristwatch' },
    { prompt: 'A colorful ceramic mug on a white table for online store display, clean and bright', img: 'https://via.placeholder.com/250?text=Ceramic+Mug' }
  ];
  const [selectedSample, setSelectedSample] = useState(null);

  // Ref y estado para reemplazar imagen
  const replaceInputRef = React.useRef(null);
  const [replaceIndex, setReplaceIndex] = useState(null);
  // Descarga la imagen al computador
  const handleDownload = async (url, idx) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `imagen_ia_${idx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error descargando la imagen:', err);
      alert('No se pudo descargar la imagen.');
    }
  };
  // Recorta la imagen seleccionada a un cuadrado centrado
  const handleCrop = (idx) => {
    const imgObj = images[idx];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgObj.url;
    img.onload = () => {
      const { width, height } = img;
      const side = Math.min(width, height);
      const sx = (width - side) / 2;
      const sy = (height - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = side;
      canvas.height = side;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, sx, sy, side, side, 0, 0, side, side);
      canvas.toBlob(blob => {
        const newUrl = URL.createObjectURL(blob);
        const newImages = [...images];
        newImages[idx] = { url: newUrl };
        setImages(newImages);
      });
    };
  };
  // Reemplaza la imagen con un archivo local
  const handleReplaceClick = (idx) => {
    setReplaceIndex(idx);
    replaceInputRef.current.click();
  };
  const handleReplaceFile = (e) => {
    const file = e.target.files[0];
    if (file != null && replaceIndex != null) {
      const newUrl = URL.createObjectURL(file);
      const newImages = [...images];
      newImages[replaceIndex] = { url: newUrl };
      setImages(newImages);
      setReplaceIndex(null);
      e.target.value = '';
    }
  };
  // Duplica la imagen
  const handleCopy = (idx) => {
    const imgObj = images[idx];
    setImages(prev => {
      const arr = [...prev]; arr.splice(idx + 1, 0, { url: imgObj.url }); return arr;
    });
  };
  // Rota 90° la imagen
  const handleRotate = (idx) => {
    const imgObj = images[idx];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgObj.url;
    img.onload = () => {
      const { width, height } = img;
      const canvas = document.createElement('canvas');
      canvas.width = height;
      canvas.height = width;
      const ctx = canvas.getContext('2d');
      ctx.translate(height/2, width/2);
      ctx.rotate(Math.PI/2);
      ctx.drawImage(img, -width/2, -height/2);
      canvas.toBlob(blob => {
        const newUrl = URL.createObjectURL(blob);
        const newImages = [...images];
        newImages[idx] = { url: newUrl };
        setImages(newImages);
      });
    };
  };
  // Elimina la imagen
  const handleDelete = (idx) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };
  // Genera imagen: admite prompt y archivo de referencia opcional
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setImages([]);
    setError(null);
    try {
      // Prepare form data: prompt and optional reference image
      const formData = new FormData();
      formData.append('prompt', prompt);
      if (reference) {
        // Enviar file como 'reference' para que el backend lo reconozca
        formData.append('reference', reference);
      }
      const response = await fetch(`${API_URL}/api/ia/generar-imagen`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        const msg = data.error?.message || data.error || JSON.stringify(data);
        throw new Error(msg);
      }
      // The API may return { images: [...] } or { urls: [...] }
      const urls = Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : Array.isArray(data.urls) && data.urls.length > 0
          ? data.urls
          : [];
      // Inicializar imágenes como objetos con la URL
      setImages(urls.map(u => ({ url: u })));
    } catch (err) {
      console.error('Error generando imágenes:', err);
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Input oculto para reemplazar imagen */}
      <input type="file" ref={replaceInputRef} className="hidden" accept="image/*" onChange={handleReplaceFile} />
      {/* Hero banner with samples */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold mb-4">Crea imágenes de producto con IA</h1>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Genera fotos profesionales para tu e-commerce en segundos. Elige un ejemplo o describe tu producto.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {samplePrompts.map((s, i) => (
              <div
                key={i}
                className={`cursor-pointer rounded overflow-hidden shadow-lg transform hover:scale-105 transition ${selectedSample === i ? 'ring-4 ring-white' : ''}`}
                onClick={() => { setPrompt(s.prompt); setSelectedSample(i); setReference(null); setPreview(null); }}
              >
                <img src={s.img} alt={s.prompt} className="w-full h-32 object-cover" />
                <div className="p-2 bg-white text-gray-800 dark:bg-gray-800 dark:text-gray-100">
                  <p className="text-xs truncate">{s.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>
      {/* Main form and results */}
      <main className="flex-grow py-16">
        <div className="container mx-auto px-4 max-w-xl bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Describe tu producto para generar la imagen..."
              className="w-full p-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
              rows={4}
              required
            />
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Imagen de referencia (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => { const file = e.target.files[0]; setReference(file); setPreview(file ? URL.createObjectURL(file) : null);} }
                className="w-full"
              />
              {preview && <img src={preview} alt="preview" className="mt-4 max-h-48 rounded border" />}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-semibold transition"
              disabled={loading}
            >{loading ? 'Generando...' : 'Generar Imagen'}</button>
            {error && <p className="mt-2 text-red-600 text-center">{error}</p>}
          </form>
        </div>
      {/* Resultados de generación y edición inline */}
      {images.length > 0 && (
        <div className="container mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {images.map((imgObj, idx) => (
            <div key={idx} className="relative group bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
              <img
                src={imgObj.url}
                alt={`Imagen IA ${idx + 1}`}
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-start justify-center pt-2 space-x-4">
                {/* Edit icons overlay */}
                <button onClick={() => handleCrop(idx)} title="Recortar" className="p-2 bg-white rounded hover:bg-gray-200">
                  {/* Scissors icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.5 4a3.5 3.5 0 103.11 5.48L16.3 18l1.4-1.4-7.7-7.7A3.5 3.5 0 105.5 4zM5.5 6a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                  </svg>
                </button>
                <button onClick={() => handleReplaceClick(idx)} title="Reemplazar" className="p-2 bg-white rounded hover:bg-gray-200">
                  {/* Refresh icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a8 8 0 018-8v2a6 6 0 100 12h2a8 8 0 01-8-8z" clipRule="evenodd" />
                  </svg>
                </button>
                <button onClick={() => handleCopy(idx)} title="Copiar" className="p-2 bg-white rounded hover:bg-gray-200">
                  {/* Duplicate icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-9a1 1 0 00-1-1H4zm1 1h7v7H5V4z" />
                    <path d="M7 7h7v7H7V7z" />
                  </svg>
                </button>
                <button onClick={() => handleRotate(idx)} title="Rotar" className="p-2 bg-white rounded hover:bg-gray-200">
                  {/* Rotate icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a8 8 0 018-8v2a6 6 0 100 12h2a8 8 0 01-8-8z" clipRule="evenodd" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(idx)} title="Eliminar" className="p-2 bg-white rounded hover:bg-gray-200">
                  {/* Trash icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 011 1v1h6V3a1 1 0 112 0v1h1a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h1V3a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDownload(imgObj.url, idx)}
                  title="Descargar"
                  className="p-2 bg-white rounded hover:bg-gray-200"
                >
                  {/* Download icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 11-2 0V5H5v10a1 1 0 11-2 0V3z" clipRule="evenodd" />
                    <path d="M7 9a1 1 0 012 0v4a1 1 0 11-2 0V9z" />
                    <path d="M11 9a1 1 0 112 0v4a1 1 0 11-2 0V9z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      </main>
    </div>
  );
}

export default CreaImagenIA;