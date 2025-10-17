# VERSÃO CORRIGIDA E ORGANIZADA DO SERVER.PY
import os
import jwt
import datetime
from functools import wraps
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

# --- FUNÇÃO DE CONEXÃO COM O BANCO ---
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

# --- DECORATOR DE SEGURANÇA (DEFINIDO NO LUGAR CORRETO) ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'status': 'erro', 'mensagem': 'Token é obrigatório'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'status': 'erro', 'mensagem': 'Token é inválido ou expirou', 'error': str(e)}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated

# --- ROTAS DE AUTENTICAÇÃO E DADOS BÁSICOS ---
@app.route("/cadastro", methods=['POST'])
def cadastrar_usuario():
    # ... (Seu código aqui está perfeito, não precisa mudar)
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


@app.route("/login", methods=['POST'])
def login_usuario():
    # ... (Seu código aqui está perfeito, não precisa mudar)
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

    if usuario and bcrypt.check_password_hash(usuario['Senha'], senha_digitada):
        token = jwt.encode({
            'user_id': usuario['ID'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        cursor.close()
        conn.close()
        return jsonify({'status': 'sucesso', 'token': token}), 200
    else:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': 'Email ou senha inválidos'}), 401

@app.route("/pilares", methods=['GET'])
@token_required
def listar_pilares(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Não foi possível conectar ao banco de dados'}), 500
    
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM Pilares ORDER BY NomePilar")
        pilares = cursor.fetchall()
        return jsonify({'status': 'sucesso', 'pilares': pilares}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/projetos", methods=['GET'])
@token_required
def listar_projetos_por_pilar(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
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
        return jsonify({'status': 'sucesso', 'projetos': projetos}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- ROTAS DE APONTAMENTOS (Cronômetro) ---
@app.route("/apontamentos/iniciar", methods=['POST'])
@token_required
def iniciar_apontamento(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    data = request.get_json()
    projeto_id = data.get('projeto_id')
    descricao = data.get('descricao') or ""
    if not projeto_id:
        return jsonify({'status': 'erro', 'mensagem': 'Projeto é obrigatório'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        query = "INSERT INTO Apontamentos (fk_ID_Usuario, fk_ID_Projeto, Descricao, Data_Inicio) VALUES (%s, %s, %s, NOW())"
        cursor.execute(query, (current_user_id, projeto_id, descricao))
        conn.commit()
        novo_apontamento_id = cursor.lastrowid
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento iniciado', 'apontamento_id': novo_apontamento_id}), 201
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/apontamentos/parar", methods=['POST'])
@token_required
def parar_apontamento(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    data = request.get_json()
    apontamento_id = data.get('apontamento_id')
    duration_seconds = data.get('duration_seconds')

    if not apontamento_id:
        return jsonify({'status': 'erro', 'mensagem': 'ID do apontamento é obrigatório'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        if duration_seconds is not None:
            cursor.execute("SELECT Data_Inicio FROM Apontamentos WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s", (apontamento_id, current_user_id))
            apontamento = cursor.fetchone()
            if not apontamento:
                return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado'}), 404
            data_inicio = apontamento['Data_Inicio']
            nova_data_fim = data_inicio + datetime.timedelta(seconds=int(duration_seconds))
            query = "UPDATE Apontamentos SET Data_Fim = %s WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s AND Data_Fim IS NULL"
            cursor.execute(query, (nova_data_fim, apontamento_id, current_user_id))
        else:
            query = "UPDATE Apontamentos SET Data_Fim = NOW() WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s AND Data_Fim IS NULL"
            cursor.execute(query, (apontamento_id, current_user_id))
        
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado ou já finalizado'}), 404
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento finalizado'}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/apontamentos/ativo", methods=['GET'])
@token_required
def get_apontamento_ativo(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        query = "SELECT * FROM Apontamentos WHERE fk_ID_Usuario = %s AND Data_Fim IS NULL ORDER BY Data_Inicio DESC LIMIT 1"
        cursor.execute(query, (current_user_id,))
        apontamento_ativo = cursor.fetchone()
        if apontamento_ativo:
            apontamento_ativo['Data_Inicio'] = str(apontamento_ativo['Data_Inicio'])
            return jsonify({'status': 'sucesso', 'apontamento': apontamento_ativo}), 200
        else:
            return jsonify({'status': 'sucesso', 'apontamento': None}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- ROTAS DE MANIPULAÇÃO DE APONTAMENTOS (Lista) ---
@app.route("/apontamentos", methods=['GET'])
@token_required
def listar_apontamentos(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500
    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT
                ap.ID_Apontamento, ap.Descricao, ap.Data_Inicio, ap.Data_Fim,
                TIMEDIFF(ap.Data_Fim, ap.Data_Inicio) AS Duracao,
                proj.NomeProjeto, pil.NomePilar
            FROM Apontamentos ap
            JOIN Projetos proj ON ap.fk_ID_Projeto = proj.ID_Projeto
            JOIN Pilares pil ON proj.fk_ID_Pilar = pil.ID_Pilar
            WHERE ap.fk_ID_Usuario = %s
            ORDER BY ap.Data_Inicio DESC
        """
        cursor.execute(query, (current_user_id,))
        apontamentos = cursor.fetchall()
        for apontamento in apontamentos:
            for key, value in apontamento.items():
                if isinstance(value, (datetime.datetime, datetime.timedelta)):
                    apontamento[key] = str(value)
        return jsonify({'status': 'sucesso', 'apontamentos': apontamentos}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': f"Erro ao executar a query: {str(e)}"}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/apontamentos/<int:apontamento_id>", methods=['PUT'])
@token_required
def atualizar_apontamento(current_user_id, apontamento_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    data = request.get_json()
    duration_seconds = data.get('duration_seconds')
    if duration_seconds is None:
        return jsonify({'status': 'erro', 'mensagem': 'Duração em segundos é obrigatória'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT Data_Inicio FROM Apontamentos WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s", (apontamento_id, current_user_id))
        apontamento = cursor.fetchone()
        if not apontamento:
            return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado ou não pertence a você'}), 404

        data_inicio = apontamento['Data_Inicio']
        nova_data_fim = data_inicio + datetime.timedelta(seconds=int(duration_seconds))
        query = "UPDATE Apontamentos SET Data_Fim = %s WHERE ID_Apontamento = %s"
        cursor.execute(query, (nova_data_fim, apontamento_id))
        conn.commit()
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento atualizado com sucesso'}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/apontamentos/<int:apontamento_id>", methods=['DELETE'])
@token_required
def excluir_apontamento(current_user_id, apontamento_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500
    cursor = conn.cursor()
    try:
        query = "DELETE FROM Apontamentos WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s"
        cursor.execute(query, (apontamento_id, current_user_id))
        conn.commit()
        if cursor.rowcount == 0:
            return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado ou não pertence a você'}), 404
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento excluído com sucesso'}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- ROTAS DA PLANILHA ---
@app.route("/planilha", methods=['GET'])
@token_required
def get_dados_planilha(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    data_ref_str = request.args.get('data', datetime.date.today().isoformat())
    data_ref = datetime.datetime.fromisoformat(data_ref_str).date()
    start_of_week = data_ref - datetime.timedelta(days=data_ref.weekday())
    end_of_week = start_of_week + datetime.timedelta(days=6)

    conn = get_db_connection()
    if conn is None: return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        query = """
            SELECT
                p.NomePilar, pr.NomeProjeto, pr.ID_Projeto, a.Descricao,
                DATE(a.Data_Inicio) AS Dia,
                SUM(TIME_TO_SEC(TIMEDIFF(a.Data_Fim, a.Data_Inicio))) AS Total_Segundos
            FROM Apontamentos a
            JOIN Projetos pr ON a.fk_ID_Projeto = pr.ID_Projeto
            JOIN Pilares p ON pr.fk_ID_Pilar = p.ID_Pilar
            WHERE
                a.fk_ID_Usuario = %s AND
                a.Data_Inicio BETWEEN %s AND %s AND
                a.Data_Fim IS NOT NULL
            GROUP BY
                p.NomePilar, pr.NomeProjeto, pr.ID_Projeto, a.Descricao, DATE(a.Data_Inicio)
            ORDER BY Dia;
        """
        cursor.execute(query, (current_user_id, start_of_week, end_of_week + datetime.timedelta(days=1)))
        resultados = cursor.fetchall()
        planilha_data = {}
        for res in resultados:
            tarefa_key = f"{res['NomePilar']} | {res['NomeProjeto']} | {res['Descricao']}"
            if tarefa_key not in planilha_data:
                planilha_data[tarefa_key] = {
                    'projetoId': res['ID_Projeto'],
                    'dias': {}
                }
            dia_str = res['Dia'].isoformat()
            total_seconds = int(res['Total_Segundos'])
            h, rem = divmod(total_seconds, 3600)
            m, s = divmod(rem, 60)
            planilha_data[tarefa_key]['dias'][dia_str] = f"{int(h):02}:{int(m):02}"
        return jsonify({
            'status': 'sucesso', 'planilha': planilha_data,
            'inicio_semana': start_of_week.isoformat(),
        }), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/planilha/salvar", methods=['POST'])
@token_required
def salvar_apontamento_planilha(current_user_id):
    # ... (Seu código aqui está perfeito, não precisa mudar)
    data = request.get_json()
    projeto_id = data.get('projeto_id')
    data_apontamento_str = data.get('data')
    duracao_segundos = data.get('duracao_segundos')
    descricao = data.get('descricao', '')

    if not all([projeto_id, data_apontamento_str, duracao_segundos is not None]):
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos'}), 400

    conn = get_db_connection()
    if conn is None: return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão'}), 500

    cursor = conn.cursor()
    try:
        data_apontamento = datetime.datetime.fromisoformat(data_apontamento_str).date()
        inicio_do_dia = datetime.datetime.combine(data_apontamento, datetime.time.min)
        fim_do_dia = inicio_do_dia + datetime.timedelta(days=1)
        del_query = """
            DELETE FROM Apontamentos 
            WHERE fk_ID_Usuario = %s AND fk_ID_Projeto = %s AND Descricao = %s AND Data_Inicio >= %s AND Data_Inicio < %s
        """
        cursor.execute(del_query, (current_user_id, projeto_id, descricao, inicio_do_dia, fim_do_dia))
        if int(duracao_segundos) > 0:
            nova_data_inicio = datetime.datetime.combine(data_apontamento, datetime.time.min)
            nova_data_fim = nova_data_inicio + datetime.timedelta(seconds=int(duracao_segundos))
            ins_query = "INSERT INTO Apontamentos (fk_ID_Usuario, fk_ID_Projeto, Descricao, Data_Inicio, Data_Fim) VALUES (%s, %s, %s, %s, %s)"
            cursor.execute(ins_query, (current_user_id, projeto_id, descricao, nova_data_inicio, nova_data_fim))
        conn.commit()
        return jsonify({'status': 'sucesso', 'mensagem': 'Planilha atualizada'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- PONTO DE PARTIDA DA APLICAÇÃO ---
if __name__ == "__main__":
    app.run(debug=True)