import os
import jwt
import datetime
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import mysql.connector
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
bcrypt = Bcrypt(app)
CORS(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=os.getenv('DB_HOST'), user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'), database=os.getenv('DB_DATABASE')
        )
        return conn
    except mysql.connector.Error as err:
        print(f"Erro de conexão com o DB: {err}")
        return None

@app.route("/cadastro", methods=['POST'])
def cadastrar_usuario():
    data = request.get_json()
    nome = data.get('NomeUsuario')
    email = data.get('Email')
    senha = data.get('Senha')
    time_id = data.get('fk_ID_Time')

    if not nome or not email or not senha or not time_id:
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos'}), 400

    senha_hash = bcrypt.generate_password_hash(senha).decode('utf-8')
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Não foi possível conectar ao banco de dados'}), 500

    cursor = conn.cursor()
    try:
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


# --- ROTA DE LOGIN DE USUÁRIO (ATUALIZADA) ---
@app.route("/login", methods=['POST'])
def login_usuario():
    data = request.get_json()
    email = data.get('Email')
    senha_digitada = data.get('Senha')

    if not email or not senha_digitada:
        return jsonify({'status': 'erro', 'mensagem': 'Email e Senha são obrigatórios'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Não foi possível conectar ao banco de dados'}), 500

    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM Usuario WHERE Email = %s"
    cursor.execute(query, (email,))
    usuario = cursor.fetchone()

    # Verifica se o usuário existe e se a senha está correta
    if usuario and bcrypt.check_password_hash(usuario['Senha'], senha_digitada):
        # Se o login estiver correto, GERE O TOKEN!
        token = jwt.encode({
            'user_id': usuario['ID'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Token expira em 24 horas
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        cursor.close()
        conn.close()

        # Retorna o token para o frontend
        return jsonify({'status': 'sucesso', 'token': token}), 200
    else:
        # Falha no login (usuário não encontrado ou senha incorreta)
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': 'Email ou senha inválidos'}), 401

# --- ROTA PARA BUSCAR OS PILARES ---
@app.route("/pilares", methods=['GET'])
def listar_pilares():
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Não foi possível conectar ao banco de dados'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Pilares ORDER BY NomePilar")
        pilares = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'status': 'sucesso', 'pilares': pilares}), 200
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    
# --- ROTA PARA BUSCAR PROJETOS DE UM PILAR ESPECÍFICO ---
@app.route("/projetos", methods=['GET'])
def listar_projetos_por_pilar():
    # Pega o 'pilar_id' que foi enviado como parâmetro na URL
    # Ex: /projetos?pilar_id=4
    pilar_id = request.args.get('pilar_id')

    if not pilar_id:
        return jsonify({'status': 'erro', 'mensagem': 'ID do pilar é obrigatório'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Não foi possível conectar ao banco de dados'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM Projetos WHERE fk_ID_Pilar = %s ORDER BY NomeProjeto"
        cursor.execute(query, (pilar_id,))
        projetos = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify({'status': 'sucesso', 'projetos': projetos}), 200
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)