from flask import Flask

app = Flask(__name__)

@app.route("/")
def hello_world():
    return "<p>Olá, Mundo! Meu backend está funcionando!<p>"

if __name__ == "__main__":
    app.run(debug=True)