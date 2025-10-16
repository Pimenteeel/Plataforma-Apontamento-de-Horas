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

# Adicione estes imports no topo do arquivo para nos ajudar com o token
import jwt
from functools import wraps

# --- DECORATOR PARA PROTEGER ROTAS ---
# Esta é uma função especial (um "decorator") que usaremos para proteger rotas.
# Ela verifica se o token JWT é válido antes de permitir que a rota seja executada.
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            # O token vem no formato "Bearer [token]"
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'status': 'erro', 'mensagem': 'Token é obrigatório'}), 401
        
        try:
            # Decodifica o token para pegar o user_id
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user_id = data['user_id']
        except Exception as e:
            return jsonify({'status': 'erro', 'mensagem': 'Token é inválido ou expirou', 'error': str(e)}), 401
        
        # Passa o ID do usuário logado para a função da rota
        return f(current_user_id, *args, **kwargs)
    return decorated


# --- ROTA PARA INICIAR UM APONTAMENTO ---
@app.route("/apontamentos/iniciar", methods=['POST'])
@token_required # <-- Aplicamos nosso decorator de segurança
def iniciar_apontamento(current_user_id):
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
        # Insere um novo apontamento com a data e hora atuais
        query = "INSERT INTO Apontamentos (fk_ID_Usuario, fk_ID_Projeto, Descricao, Data_Inicio) VALUES (%s, %s, %s, NOW())"
        cursor.execute(query, (current_user_id, projeto_id, descricao))
        conn.commit()
        
        # Pega o ID do apontamento que acabamos de criar
        novo_apontamento_id = cursor.lastrowid
        
        cursor.close()
        conn.close()
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento iniciado', 'apontamento_id': novo_apontamento_id}), 201
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500


# --- ROTA PARA PARAR UM APONTAMENTO ---
@app.route("/apontamentos/parar", methods=['POST'])
@token_required # <-- Aplicamos nosso decorator de segurança
def parar_apontamento(current_user_id):
    data = request.get_json()
    apontamento_id = data.get('apontamento_id')

    if not apontamento_id:
        return jsonify({'status': 'erro', 'mensagem': 'ID do apontamento é obrigatório'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor()
    try:
        # Atualiza o apontamento, preenchendo o campo Data_Fim
        query = "UPDATE Apontamentos SET Data_Fim = NOW() WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s AND Data_Fim IS NULL"
        cursor.execute(query, (apontamento_id, current_user_id))
        conn.commit()
        
        # cursor.rowcount nos diz quantas linhas foram afetadas.
        # Se for 0, significa que o apontamento não foi encontrado ou já estava parado.
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado ou já finalizado'}), 404
        
        cursor.close()
        conn.close()
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento finalizado'}), 200
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500

# --- ROTA PARA ATUALIZAR (EDITAR) A DURAÇÃO DE UM APONTAMENTO ---
@app.route("/apontamentos/<int:apontamento_id>", methods=['PUT'])
@token_required
def atualizar_apontamento(current_user_id, apontamento_id):
    data = request.get_json()
    duration_seconds = data.get('duration_seconds')

    if duration_seconds is None:
        return jsonify({'status': 'erro', 'mensagem': 'Duração em segundos é obrigatória'}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Busca o apontamento para garantir que ele existe e pertence ao usuário logado
        cursor.execute("SELECT Data_Inicio FROM Apontamentos WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s", (apontamento_id, current_user_id))
        apontamento = cursor.fetchone()
        
        if not apontamento:
            return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado ou não pertence a você'}), 404

        # 2. Calcula a nova Data_Fim com base na Data_Inicio e na nova duração
        data_inicio = apontamento['Data_Inicio']
        nova_data_fim = data_inicio + datetime.timedelta(seconds=int(duration_seconds))

        # 3. Atualiza o registro no banco de dados com a nova Data_Fim
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

# --- ROTA PARA LISTAR OS APONTAMENTOS DO USUÁRIO LOGADO (VERSÃO CORRIGIDA) ---
# --- ROTA PARA LISTAR OS APONTAMENTOS DO USUÁRIO LOGADO (VERSÃO DEFINITIVA) ---
@app.route("/apontamentos", methods=['GET'])
@token_required
def listar_apontamentos(current_user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Query mais limpa: removemos o TIME_FORMAT problemático.
        # Pedimos a duração crua com TIMEDIFF.
        query = """
            SELECT
                ap.ID_Apontamento,
                ap.Descricao,
                ap.Data_Inicio,
                ap.Data_Fim,
                TIMEDIFF(ap.Data_Fim, ap.Data_Inicio) AS Duracao,
                proj.NomeProjeto,
                pil.NomePilar
            FROM
                Apontamentos ap
            JOIN
                Projetos proj ON ap.fk_ID_Projeto = proj.ID_Projeto
            JOIN
                Pilares pil ON proj.fk_ID_Pilar = pil.ID_Pilar
            WHERE
                ap.fk_ID_Usuario = %s
            ORDER BY
                ap.Data_Inicio DESC
        """
        
        cursor.execute(query, (current_user_id,))
        apontamentos = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        for apontamento in apontamentos:
            for key, value in apontamento.items():
                if isinstance(value, (datetime.datetime, datetime.timedelta)):
                    apontamento[key] = str(value)

        return jsonify({'status': 'sucesso', 'apontamentos': apontamentos}), 200
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': f"Erro ao executar a query: {str(e)}"}), 500

# --- ROTA PARA VERIFICAR SE HÁ UM APONTAMENTO ATIVO ---
@app.route("/apontamentos/ativo", methods=['GET'])
@token_required
def get_apontamento_ativo(current_user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # Busca por um apontamento do usuário que ainda não foi finalizado (Data_Fim IS NULL)
        query = "SELECT * FROM Apontamentos WHERE fk_ID_Usuario = %s AND Data_Fim IS NULL ORDER BY Data_Inicio DESC LIMIT 1"
        cursor.execute(query, (current_user_id,))
        apontamento_ativo = cursor.fetchone() # fetchone() pega apenas um resultado
        
        cursor.close()
        conn.close()
        
        if apontamento_ativo:
            # Converte a data para string para poder ser enviada como JSON
            apontamento_ativo['Data_Inicio'] = str(apontamento_ativo['Data_Inicio'])
            return jsonify({'status': 'sucesso', 'apontamento': apontamento_ativo}), 200
        else:
            return jsonify({'status': 'sucesso', 'apontamento': None}), 200 # Retorna sucesso, mas com apontamento nulo

    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500

# --- ROTA PARA EXCLUIR UM APONTAMENTO ---
@app.route("/apontamentos/<int:apontamento_id>", methods=['DELETE'])
@token_required
def excluir_apontamento(current_user_id, apontamento_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão com o banco'}), 500

    cursor = conn.cursor()
    try:
        # A query deleta o apontamento, mas a cláusula WHERE garante duas coisas:
        # 1. Que o ID do apontamento corresponde ao que foi pedido.
        # 2. Que o apontamento pertence ao usuário que está logado (current_user_id).
        # Isso impede que um usuário apague os apontamentos de outro.
        query = "DELETE FROM Apontamentos WHERE ID_Apontamento = %s AND fk_ID_Usuario = %s"
        cursor.execute(query, (apontamento_id, current_user_id))
        conn.commit()
        
        # cursor.rowcount nos diz quantas linhas foram afetadas.
        # Se for 0, significa que o apontamento não foi encontrado para aquele usuário.
        if cursor.rowcount == 0:
            return jsonify({'status': 'erro', 'mensagem': 'Apontamento não encontrado ou não pertence a você'}), 404
        
        return jsonify({'status': 'sucesso', 'mensagem': 'Apontamento excluído com sucesso'}), 200
    except Exception as e:
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

# --- ROTA PARA BUSCAR DADOS PARA A PLANILHA (VERSÃO ATUALIZADA COM ID DO PROJETO) ---
@app.route("/planilha", methods=['GET'])
@token_required
def get_dados_planilha(current_user_id):
    data_ref_str = request.args.get('data', datetime.date.today().isoformat())
    data_ref = datetime.datetime.fromisoformat(data_ref_str).date()

    start_of_week = data_ref - datetime.timedelta(days=data_ref.weekday())
    end_of_week = start_of_week + datetime.timedelta(days=6)

    conn = get_db_connection()
    if conn is None: return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão'}), 500

    cursor = conn.cursor(dictionary=True)
    try:
        # QUERY ATUALIZADA: Agora também selecionamos o ID_Projeto
        query = """
            SELECT
                p.NomePilar,
                pr.NomeProjeto,
                pr.ID_Projeto, 
                a.Descricao,
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
            ORDER BY
                Dia;
        """
        cursor.execute(query, (current_user_id, start_of_week, end_of_week + datetime.timedelta(days=1)))
        
        resultados = cursor.fetchall()
        cursor.close()
        conn.close()

        # Reestrutura os dados em um formato mais inteligente para o frontend
        planilha_data = {}
        for res in resultados:
            tarefa_key = f"{res['NomePilar']} | {res['NomeProjeto']} | {res['Descricao']}"
            if tarefa_key not in planilha_data:
                planilha_data[tarefa_key] = {
                    'projetoId': res['ID_Projeto'], # <-- Guardamos o ID do projeto
                    'dias': {}
                }
            
            dia_str = res['Dia'].isoformat()
            
            total_seconds = int(res['Total_Segundos'])
            h, rem = divmod(total_seconds, 3600)
            m, s = divmod(rem, 60)
            # Formata para HH:MM, como você pediu
            planilha_data[tarefa_key]['dias'][dia_str] = f"{int(h):02}:{int(m):02}:{int(s):02}"

        return jsonify({
            'status': 'sucesso', 
            'planilha': planilha_data,
            'inicio_semana': start_of_week.isoformat(),
        }), 200

    except Exception as e:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    
    # --- ROTA PARA SALVAR/ATUALIZAR UM APONTAMENTO DA PLANILHA (VERSÃO CORRIGIDA) ---
@app.route("/planilha/salvar", methods=['POST'])
@token_required
def salvar_apontamento_planilha(current_user_id):
    data = request.get_json()
    projeto_id = data.get('projeto_id')
    data_apontamento_str = data.get('data') # Espera uma data no formato 'AAAA-MM-DD'
    duracao_segundos = data.get('duracao_segundos')

    if not all([projeto_id, data_apontamento_str, duracao_segundos is not None]):
        return jsonify({'status': 'erro', 'mensagem': 'Dados incompletos'}), 400

    conn = get_db_connection()
    if conn is None: return jsonify({'status': 'erro', 'mensagem': 'Erro de conexão'}), 500

    cursor = conn.cursor()
    try:
        # Converte a string 'AAAA-MM-DD' para um objeto de data
        data_apontamento = datetime.datetime.fromisoformat(data_apontamento_str).date()
        
        # Define o início e o fim do dia para a query
        inicio_do_dia = datetime.datetime.combine(data_apontamento, datetime.time.min)
        fim_do_dia = inicio_do_dia + datetime.timedelta(days=1)

        # 1. Deleta todos os apontamentos existentes para este usuário, neste projeto, neste dia.
        #    QUERY CORRIGIDA: Usa BETWEEN para ser mais compatível.
        del_query = """
            DELETE FROM Apontamentos 
            WHERE fk_ID_Usuario = %s AND fk_ID_Projeto = %s AND Data_Inicio >= %s AND Data_Inicio < %s
        """
        cursor.execute(del_query, (current_user_id, projeto_id, inicio_do_dia, fim_do_dia))

        # 2. Se a duração for maior que zero, insere um novo apontamento consolidado.
        if int(duracao_segundos) > 0:
            nova_data_inicio = datetime.datetime.combine(data_apontamento, datetime.time.min)
            nova_data_fim = nova_data_inicio + datetime.timedelta(seconds=int(duracao_segundos))
            
            ins_query = """
                INSERT INTO Apontamentos (fk_ID_Usuario, fk_ID_Projeto, Descricao, Data_Inicio, Data_Fim)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(ins_query, (current_user_id, projeto_id, 'Entrada via Planilha', nova_data_inicio, nova_data_fim))

        conn.commit()
        return jsonify({'status': 'sucesso', 'mensagem': 'Planilha atualizada'}), 200

    except Exception as e:
        conn.rollback()
        return jsonify({'status': 'erro', 'mensagem': str(e)}), 500
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == "__main__":
    app.run(debug=True)