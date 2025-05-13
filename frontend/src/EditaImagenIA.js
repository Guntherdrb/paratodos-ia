import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// API base URL same as PaginaPrincipal
const API_URL = process.env.REACT_APP_API_URL
  || `${window.location.protocol}//${window.location.hostname}:5000`;

function EditaImagenIA({ initialImageUrl }) {
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const location = useLocation();
  // Pre-cargar imagen para edición: se usa initialImageUrl o state de navegación
  useEffect(() => {
    const imgUrl = initialImageUrl || location.state?.imageUrl;
    if (imgUrl) {
      fetch(imgUrl)
        .then(res => {
          if (!res.ok) throw new Error(`Error al descargar imagen: ${res.status}`);
          return res.blob();
        })
        .then(blob => setFile(new File([blob], 'to_edit.png', { type: blob.type })))
        .catch(err => console.error('[EditaImagenIA] Fetch image error:', err));
    }
  }, [initialImageUrl, location.state]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Canvas refs and drawing state
  const imgCanvasRef = React.useRef(null);
  const maskCanvasRef = React.useRef(null);
  const [brushSize, setBrushSize] = useState(20);
  const [tool, setTool] = useState('pencil'); // 'pencil' to carve, 'eraser' to restore
  const drawing = React.useRef(false);

  // Initialize canvases when file changes
  useEffect(() => {
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;
    img.onload = () => {
      const imgC = imgCanvasRef.current;
      const maskC = maskCanvasRef.current;
      imgC.width = img.width;
      imgC.height = img.height;
      maskC.width = img.width;
      maskC.height = img.height;
      const imgCtx = imgC.getContext('2d');
      imgCtx.drawImage(img, 0, 0);
      const maskCtx = maskC.getContext('2d');
      // Inicializar máscara completamente blanca (área editable total)
      maskCtx.fillStyle = 'rgba(255,255,255,1)';
      maskCtx.fillRect(0, 0, maskC.width, maskC.height);
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Handle drawing on mask
  useEffect(() => {
    const maskC = maskCanvasRef.current;
    if (!maskC) return;
    const ctx = maskC.getContext('2d');
    const getPos = (e) => {
      const rect = maskC.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const start = (e) => { drawing.current = true; ctx.globalCompositeOperation = tool === 'pencil' ? 'destination-out' : 'source-over'; }
    const end = () => { drawing.current = false; };
    const draw = (e) => {
      if (!drawing.current) return;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize, 0, 2 * Math.PI);
      ctx.fill();
    };
    maskC.addEventListener('pointerdown', start);
    maskC.addEventListener('pointerup', end);
    maskC.addEventListener('pointerleave', end);
    maskC.addEventListener('pointermove', draw);
    return () => {
      maskC.removeEventListener('pointerdown', start);
      maskC.removeEventListener('pointerup', end);
      maskC.removeEventListener('pointerleave', end);
      maskC.removeEventListener('pointermove', draw);
    };
  }, [brushSize, tool]);

  // Submit handler: send image + mask
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return alert('Selecciona la imagen');
    setLoading(true);
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('image', file);
    maskCanvasRef.current.toBlob(blob => {
      formData.append('mask', blob, 'mask.png');
      fetch(`${API_URL}/api/ia/editar-imagen`, { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.success) setImages(data.images || []);
          else alert('Error editando imágenes: ' + (data.error || ''));
        })
        .catch(err => { console.error(err); alert('Error de conexión'); })
        .finally(() => setLoading(false));
    });
  };
  // Descarga una imagen (originalmente editada) al computador
  const handleDownloadEdited = async (url, idx) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `imagen_editada_${idx + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Error descargando la imagen editada:', err);
      alert('No se pudo descargar la imagen editada.');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2 text-gray-800 dark:text-gray-100">Edita tu imagen</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Canvas para edición */}
        {file && (
          <div className="relative inline-block border mb-4">
            <canvas ref={imgCanvasRef} className="block" />
            <canvas
              ref={maskCanvasRef}
              className="absolute top-0 left-0"
              style={{ cursor: tool === 'pencil' ? 'crosshair' : 'pointer' }}
            />
          </div>
        )}
  {/* Toolbar de herramientas */}
  {file && (
    <div className="flex justify-center space-x-6 mb-4">
      {/* Pincel */}
      <button type="button" onClick={() => setTool('pencil')} title="Pincel (p)"
        className={`p-2 rounded ${tool==='pencil'?'bg-blue-600 text-white':'bg-white'} hover:bg-gray-200`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l3-3m0 0l7-7-3 3m-7 7l-4 4v3h3l4-4" />
        </svg>
      </button>
      {/* Borrador */}
      <button type="button" onClick={() => setTool('eraser')} title="Borrador (e)"
        className={`p-2 rounded ${tool==='eraser'?'bg-blue-600 text-white':'bg-white'} hover:bg-gray-200`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.318 4.318a4.5 4.5 0 00-6.364 0L4 14.273V20h5.727l9.987-9.987a4.5 4.5 0 000-6.364z" />
        </svg>
      </button>
      {/* Selección rectangular */}
      <button type="button" onClick={() => setTool('select')} title="Selección (s)"
        className={`p-2 rounded ${tool==='select'?'bg-blue-600 text-white':'bg-white'} hover:bg-gray-200`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="4" y="4" width="16" height="16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Lupa */}
      <button type="button" onClick={() => setTool('zoom')} title="Zoom (z)"
        className={`p-2 rounded ${tool==='zoom'?'bg-blue-600 text-white':'bg-white'} hover:bg-gray-200`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* Ajustar tamaño del pincel */}
      <div className="flex flex-col items-center">
        <span className="text-sm">Tamaño</span>
        <input
          type="range" min="1" max="100" value={brushSize}
          onChange={e => setBrushSize(Number(e.target.value))}
          className="w-24"
        />
      </div>
    </div>
  )}
  {/* Cuadro para describir cambios deseados */}
  {file && (
    <div className="mb-4">
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Describe los cambios que deseas"
        className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
        rows={3}
        required
      />
    </div>
  )}
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            disabled={loading || !file}>
            {loading ? 'Editando...' : 'Editar Imagen'}
          </button>
        </form>
        {images.length > 0 && (
          <div className="mt-6 flex space-x-4">
            {images.map((url, i) => (
              <div key={i} className="w-1/2">
                <h4 className="text-sm font-medium mb-1 text-gray-800 dark:text-gray-100">Resultado {i + 1}</h4>
                <img src={url} alt={`Resultado ${i}`} className="w-full rounded shadow mb-2" />
                <button
                  onClick={() => handleDownloadEdited(url, i)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                >
                  Descargar Editada
                </button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
export default EditaImagenIA;