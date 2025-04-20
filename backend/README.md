 # Backend Setup

 Este directorio contiene la API backend construida con Flask.

 ## Requisitos
 - Python 3.8 o superior instalado.

 ## Crear y activar el entorno virtual

 Windows (PowerShell):
 ```powershell
 python -m venv venv
 .\venv\Scripts\Activate
 pip install -r requirements.txt
 ```

 Windows (cmd.exe):
 ```cmd
 python -m venv venv
 venv\Scripts\activate.bat
 pip install -r requirements.txt
 ```

 macOS/Linux (bash/zsh):
 ```bash
 python3 -m venv .venv
 source .venv/bin/activate
 pip install -r requirements.txt
 ```

 ## Ejecutar la aplicación

 Con el entorno virtual activo:
 ```bash
 
 ```python app.py

 Esto lanzará el servidor Flask en `http://localhost:5000` por defecto.