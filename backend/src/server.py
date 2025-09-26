import os
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)

# --- Função de Conexão com o Banco de Dados ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            database=os.getenv('DB_DATABASE')
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Erro de conexão com o DB: {err}")
        return None

# --- Rota de Cadastro de Usuário ---
@app.route("/cadastro", methods=['POST'])
def cadastrar_usuario():
    data = request.get_json()
    nome = data.get('NomeUsuario')
    email = data.get('Email')
    senha = data.get('Senha')
    time_id = data.get('fk_ID_Time') # Novo campo!

    if not nome or not email or not senha or not time_id:
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos'}), 400

    senha_hash = bcrypt.generate_password_hash(senha).decode('utf-8')
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Não foi possível conectar ao banco de dados'}), 500

    cursor = conn.cursor()
    try:
        # Query atualizada com os nomes exatos das suas colunas
        query = "INSERT INTO Usuario (NomeUsuario, Email, Senha, fk_ID_Time) VALUES (%s, %s, %s, %s)"
        cursor.execute(query, (nome, email, senha_hash, time_id))
        conn.commit()
        return jsonify({'status': 'sucesso', 'mensagem': 'Usuário criado com sucesso!'}), 201
    except mysql.connector.IntegrityError:
        return jsonify({'status': 'erro', 'mensagem': 'Este e-mail já está cadastrado.'}), 409
    except mysql.connector.Error as err:
        return jsonify({'status': 'erro', 'mensagem': f'Erro no banco de dados: {err}'}), 500
    finally:
        cursor.close()
        conn.close()

# --- AQUI VAI A ROTA DE LOGIN ---

if __name__ == "__main__":
    app.run(debug=True)