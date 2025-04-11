from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Habilita CORS para que React pueda comunicarse con Flask

@app.route('/')
def home():
    return '¡Backend de ParaTodos funcionando correctamente!'

if __name__ == '__main__':
    app.run(debug=True)
