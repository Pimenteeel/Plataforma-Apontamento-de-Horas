document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. LÓGICA DE PROTEÇÃO E ELEMENTOS GERAIS ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
        return; // Para a execução do script se não houver token
    }

    // Captura de todos os elementos da página que usaremos
    const logoutButton = document.getElementById('logout-btn');
    const pilarSelect = document.getElementById('pilar-select');
    const projetoSelect = document.getElementById('projeto-select');
    const observacaoInput = document.getElementById('observacao-input');
    const timerDisplay = document.getElementById('timer-display');
    const startStopBtn = document.getElementById('start-stop-btn');
    const contentArea = document.querySelector('.content-area'); // <-- Declarado uma única vez aqui

    // --- 2. LÓGICA DE NAVEGAÇÃO ENTRE AS TELAS ---
    const navCronometro = document.getElementById('nav-cronometro');
    const navPlanilha = document.getElementById('nav-planilha');
    const navRelatorioDetalhado = document.getElementById('nav-relatorio-detalhado');
    const navGestao = document.getElementById('nav-gestao');
    const views = document.querySelectorAll('.view');

    function showView(viewId) {
        views.forEach(view => {
            view.style.display = 'none';
        });
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.style.display = 'block';
        }
    }

    navCronometro.addEventListener('click', (e) => { e.preventDefault(); showView('cronometro-view'); });
    navPlanilha.addEventListener('click', (e) => { e.preventDefault(); showView('planilha-view'); });
    navRelatorioDetalhado.addEventListener('click', (e) => { e.preventDefault(); showView('relatorio-detalhado-view'); });
    navGestao.addEventListener('click', (e) => { e.preventDefault(); showView('gestao-view'); });

    // --- 3. FUNÇÕES DE CARREGAMENTO DE DADOS (APIs) ---
    function carregarPilares() {
        fetch('http://127.0.0.1:5000/pilares')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                pilarSelect.innerHTML = '<option value="">Selecione o Pilar</option>';
                data.pilares.forEach(pilar => {
                    const option = document.createElement('option');
                    option.value = pilar.ID_Pilar;
                    option.textContent = pilar.NomePilar;
                    pilarSelect.appendChild(option);
                });
            }
        }).catch(error => console.error('Erro ao buscar pilares:', error));
    }

    function carregarProjetos(pilarId) {
        if (!pilarId) {
            projetoSelect.innerHTML = '<option value="">Selecione o Projeto</option>';
            projetoSelect.disabled = true;
            return;
        }
        fetch(`http://127.0.0.1:5000/projetos?pilar_id=${pilarId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                projetoSelect.innerHTML = '<option value="">Selecione o Projeto</option>';
                data.projetos.forEach(projeto => {
                    const option = document.createElement('option');
                    option.value = projeto.ID_Projeto;
                    option.textContent = projeto.NomeProjeto;
                    projetoSelect.appendChild(option);
                });
                projetoSelect.disabled = false;
            }
        }).catch(error => console.error('Erro ao buscar projetos:', error));
    }

    // --- FUNÇÃO ATUALIZADA: CARREGAR E EXIBIR APONTAMENTOS AGRUPADOS POR DATA ---
    function carregarApontamentos() {
        if (!contentArea) return;

        fetch('http://127.0.0.1:5000/apontamentos', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                contentArea.innerHTML = '<h2>Meus Apontamentos</h2>';

                if (data.apontamentos.length === 0) {
                    contentArea.innerHTML += '<p>Nenhum apontamento encontrado.</p>';
                    return;
                }

                let dataAtual = ""; // Variável para controlar a data do grupo

                data.apontamentos.forEach(ap => {
                    // Pega a data do apontamento atual
                    const dataDoApontamento = new Date(ap.Data_Inicio).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'});

                    // Se a data do apontamento for diferente da data do último grupo...
                    if (dataDoApontamento !== dataAtual) {
                        dataAtual = dataDoApontamento; // Atualiza a data do grupo
                        // E cria um novo cabeçalho de data na tela
                        const headerDiv = document.createElement('h3');
                        headerDiv.className = 'data-header';
                        headerDiv.textContent = `${dataAtual}`;
                        contentArea.appendChild(headerDiv);
                    }

                    // Cria o item do apontamento (agora com Pilar, Projeto e Descrição)
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'apontamento-item';

                    const inicio = new Date(ap.Data_Inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const fim = ap.Data_Fim ? new Date(ap.Data_Fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...';

                    // Template atualizado para mostrar as 3 informações
                    itemDiv.innerHTML = `
                        <span class="apontamento-descricao">${ap.NomePilar} | ${ap.NomeProjeto} | ${ap.Descricao}</span>
                        <span>${inicio} - ${fim}</span>
                        <span class="apontamento-duracao">${ap.Duracao || 'Rodando...'}</span>
                    `;
                    contentArea.appendChild(itemDiv);
                });
            } else {
                contentArea.innerHTML = `<h2>Meus Apontamentos</h2><p style="color:red;">Erro: ${data.mensagem}</p>`;
            }
        }).catch(error => {
            console.error('Erro ao buscar apontamentos:', error);
            contentArea.innerHTML = '<h2>Meus Apontamentos</h2><p style="color:red;">Erro de conexão.</p>';
        });
    }

    // --- 4. LÓGICA DO CRONÔMETRO ---
    let timerInterval = null;
    let segundosPassados = 0;
    let apontamentoAtivoId = null;

    function formatarTempo(segundos) {
        const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
        const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(segundos % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    async function iniciarCronometro() {
        if (!pilarSelect.value || !projetoSelect.value || !observacaoInput.value) {
            alert("Por favor, selecione Pilar, Projeto e preencha a observação.");
            return;
        }
        const dados = {
            projeto_id: parseInt(projetoSelect.value),
            descricao: observacaoInput.value
        };
        const response = await fetch('http://127.0.0.1:5000/apontamentos/iniciar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(dados)
        });
        const result = await response.json();
        if (result.status === 'sucesso') {
            apontamentoAtivoId = result.apontamento_id;
            startStopBtn.textContent = 'PARAR';
            startStopBtn.style.backgroundColor = '#dc3545';
            [pilarSelect, projetoSelect, observacaoInput].forEach(el => el.disabled = true);
            segundosPassados = 0;
            timerInterval = setInterval(() => {
                segundosPassados++;
                timerDisplay.textContent = formatarTempo(segundosPassados);
            }, 1000);
        } else {
            alert(`Erro: ${result.mensagem}`);
        }
    }

    async function pararCronometro() {
        const response = await fetch('http://127.0.0.1:5000/apontamentos/parar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ apontamento_id: apontamentoAtivoId })
        });
        const result = await response.json();
        if (result.status === 'sucesso') {
            clearInterval(timerInterval);
            timerInterval = null;
            apontamentoAtivoId = null;
            startStopBtn.textContent = 'INICIAR';
            startStopBtn.style.backgroundColor = '#007bff';
            timerDisplay.textContent = '00:00:00';
            [pilarSelect, projetoSelect, observacaoInput].forEach(el => el.disabled = false);
            observacaoInput.value = '';
            alert("Apontamento finalizado com sucesso!");
            carregarApontamentos(); // Atualiza a lista!
        } else {
            alert(`Erro: ${result.mensagem}`);
        }
    }

    // --- 5. EVENT LISTENERS PRINCIPAIS ---
    logoutButton.addEventListener('click', function() {
        localStorage.removeItem('token');
        alert("Você saiu da sua conta.");
        window.location.href = 'login.html';
    });

    pilarSelect.addEventListener('change', function() {
        carregarProjetos(pilarSelect.value);
    });

    startStopBtn.addEventListener('click', () => {
        if (timerInterval) {
            pararCronometro();
        } else {
            iniciarCronometro();
        }
    });

    // --- 6. INICIALIZAÇÃO DA PÁGINA ---
    showView('cronometro-view');
    carregarPilares();
    carregarApontamentos();
});