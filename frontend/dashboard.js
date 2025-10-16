// VERSÃO COMPLETA E CORRIGIDA DO DASHBOARD.JS
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. CONFIGURAÇÃO INICIAL E PROTEÇÃO ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
        return; 
    }

    // Captura de todos os elementos da página que usaremos
    const logoutButton = document.getElementById('logout-btn');
    const pilarSelect = document.getElementById('pilar-select');
    const projetoSelect = document.getElementById('projeto-select');
    const observacaoInput = document.getElementById('observacao-input');
    const timerDisplay = document.getElementById('timer-display');
    const startStopBtn = document.getElementById('start-stop-btn');
    const contentArea = document.querySelector('.content-area');
    const planilhaContainer = document.getElementById('planilha-container');
    const navCronometro = document.getElementById('nav-cronometro');
    const navPlanilha = document.getElementById('nav-planilha');
    const navRelatorioDetalhado = document.getElementById('nav-relatorio-detalhado');
    const navGestao = document.getElementById('nav-gestao');
    const views = document.querySelectorAll('.view');

    // Variáveis de estado do cronômetro
    let timerInterval = null;
    let segundosPassados = 0;
    let apontamentoAtivoId = null;

    // --- 2. LÓGICA DE NAVEGAÇÃO ENTRE TELAS ---
    function showView(viewId) {
        views.forEach(view => view.style.display = 'none');
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) viewToShow.style.display = 'block';
    }

    // --- 3. FUNÇÕES DE CARREGAMENTO DE DADOS (APIs) ---
    function carregarPilares() {
        fetch('http://127.0.0.1:5000/pilares', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
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
        fetch(`http://127.0.0.1:5000/projetos?pilar_id=${pilarId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
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

                let dataAtual = "";
                data.apontamentos.forEach(ap => {
                    const dataDoApontamento = new Date(ap.Data_Inicio).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit', year: '2-digit'});
                    if (dataDoApontamento !== dataAtual) {
                        dataAtual = dataDoApontamento;
                        const headerDiv = document.createElement('h3');
                        headerDiv.className = 'data-header';
                        headerDiv.textContent = dataAtual;
                        contentArea.appendChild(headerDiv);
                    }

                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'apontamento-item';
                    const inicio = new Date(ap.Data_Inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const fim = ap.Data_Fim ? new Date(ap.Data_Fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '...';
                    
                    // MUDANÇA: Adicionamos um data-id na duração para sabermos qual apontamento editar
                    itemDiv.innerHTML = `
                        <span class="apontamento-descricao">${ap.NomePilar} | ${ap.NomeProjeto} | ${ap.Descricao}</span>
                        <span>${inicio} - ${fim}</span>
                        <span class="apontamento-duracao" data-id="${ap.ID_Apontamento}">${ap.Duracao || 'Rodando...'}</span>
                        <button class="apontamento-delete-btn" data-id="${ap.ID_Apontamento}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    contentArea.appendChild(itemDiv);
                });

                // MUDANÇA: Depois de criar os itens, adicionamos o evento de clique a cada um
                document.querySelectorAll('.apontamento-duracao').forEach(span => {
                    if (span.textContent !== 'Rodando...') {
                        span.addEventListener('click', function() { tornarEditavel(this); });
                    }
                });

                document.querySelectorAll('.apontamento-delete-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const apontamentoId = this.dataset.id;
                        // Usa o pop-up de confirmação do navegador
                        if (confirm("Tem certeza que deseja excluir este apontamento?")) {
                            excluirApontamento(apontamentoId);
                        }
                    });
                });

            } else {
                contentArea.innerHTML = `<h2>Meus Apontamentos</h2><p style="color:red;">Erro: ${data.mensagem}</p>`;
            }
        }).catch(error => {
            console.error('Erro ao buscar apontamentos:', error);
            contentArea.innerHTML = '<h2>Meus Apontamentos</h2><p style="color:red;">Erro de conexão.</p>';
        });
    }

    async function excluirApontamento(apontamentoId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/apontamentos/${apontamentoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.status !== 'sucesso') {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            alert("Erro de conexão ao excluir.");
        } finally {
            // Sempre recarrega a lista para mostrar o resultado da exclusão
            carregarApontamentos(); 
        }
    }

    function tornarEditavel(spanElement) {
        const apontamentoId = spanElement.dataset.id;
        const valorAtual = spanElement.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = valorAtual;
        input.className = 'apontamento-duracao'; // Usa a mesma classe para manter o estilo
        
        spanElement.replaceWith(input);
        input.focus(); // Foca no campo

        // Evento para salvar ao pressionar "Enter"
        input.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                const novoValor = input.value.trim();
                const partes = novoValor.split(':');
                if (partes.length === 3) {
                    const segundos = (+partes[0]) * 3600 + (+partes[1]) * 60 + (+partes[2]);
                    salvarEdicao(apontamentoId, segundos);
                } else {
                    alert("Formato inválido. Use HH:MM:SS");
                    carregarApontamentos(); // Cancela a edição
                }
            }
        });

        // Evento para cancelar se clicar fora
        input.addEventListener('blur', function() {
            carregarApontamentos();
        });
    }

    async function salvarEdicao(apontamentoId, durationInSeconds) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/apontamentos/${apontamentoId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ duration_seconds: durationInSeconds })
            });
            const result = await response.json();
            if (result.status !== 'sucesso') {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch (error) {
            alert("Erro de conexão ao salvar.");
        } finally {
            carregarApontamentos(); // Sempre recarrega a lista para mostrar o valor final
        }
    }
    
    // --- 4. FUNÇÕES DO CRONÔMETRO ---
    function formatarTempo(segundos) {
        const h = Math.floor(segundos / 3600).toString().padStart(2, '0');
        const m = Math.floor((segundos % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(segundos % 60).toString().padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    async function iniciarCronometro() {
        if (!pilarSelect.value || !projetoSelect.value) {
            alert("Por favor, selecione um Pilar e um Projeto.");
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
            carregarApontamentos(); // Atualiza a lista para mostrar o item "Rodando..."
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

    async function verificarApontamentoAtivo() {
        try {
            const response = await fetch('http://127.0.0.1:5000/apontamentos/ativo', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.status === 'sucesso' && data.apontamento) {
                const ap = data.apontamento;
                apontamentoAtivoId = ap.ID_Apontamento;
                const dataInicio = new Date(ap.Data_Inicio);
                const agora = new Date();
                segundosPassados = Math.floor((agora - dataInicio) / 1000);
                startStopBtn.textContent = 'PARAR';
                startStopBtn.style.backgroundColor = '#dc3545';
                [pilarSelect, projetoSelect, observacaoInput].forEach(el => el.disabled = true);
                observacaoInput.value = ap.Descricao;
                timerInterval = setInterval(() => {
                    segundosPassados++;
                    timerDisplay.textContent = formatarTempo(segundosPassados);
                }, 1000);
            }
        } catch (error) {
            console.error("Erro ao verificar apontamento ativo:", error);
        }
    }

    // --- 5. EVENT LISTENERS ---
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        alert("Você saiu da sua conta.");
        window.location.href = 'login.html';
    });

    pilarSelect.addEventListener('change', () => carregarProjetos(pilarSelect.value));

    startStopBtn.addEventListener('click', () => {
        if (timerInterval) {
            pararCronometro();
        } else {
            iniciarCronometro();
        }
    });

    function carregarPlanilha() {
        if (!planilhaContainer) return;
        planilhaContainer.innerHTML = 'Carregando...';

        fetch('http://127.0.0.1:5000/planilha', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                planilhaContainer.innerHTML = ''; 
                const table = document.createElement('table');
                table.className = 'planilha-table';
                
                const thead = document.createElement('thead');
                let headerRow = '<tr><th>Atividade / Projeto</th>';
                const diasDaSemana = [];
                for (let i = 0; i < 7; i++) {
                    const dia = new Date(data.inicio_semana);
                    dia.setUTCDate(dia.getUTCDate() + i);
                    headerRow += `<th>${dia.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' })}<br>${dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</th>`;
                    diasDaSemana.push(dia.toISOString().split('T')[0]);
                }
                thead.innerHTML = headerRow + '</tr>';
                table.appendChild(thead);

                const tbody = document.createElement('tbody');
                const tarefas = Object.keys(data.planilha);

                tarefas.forEach(tarefaKey => {
                    const tarefaInfo = data.planilha[tarefaKey];
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${tarefaKey}</td>`;

                    diasDaSemana.forEach(diaKey => {
                        const horas = tarefaInfo.dias[diaKey] || '-';
                        const td = document.createElement('td');
                        td.textContent = horas;
                        
                        // A MÁGICA: Guardamos o ID do projeto e a data na própria célula
                        td.dataset.projetoId = tarefaInfo.projetoId;
                        td.dataset.date = diaKey;
                        
                        td.addEventListener('click', () => tornarCelulaEditavel(td));
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                table.appendChild(tbody);
                planilhaContainer.appendChild(table);
            } else {
                planilhaContainer.textContent = `Erro: ${data.mensagem}`;
            }
        })
        .catch(error => {
            console.error('Erro ao carregar planilha:', error);
            planilhaContainer.textContent = 'Erro de conexão.';
        });
    }

    function tornarCelulaEditavel(tdElement) {
        // Se já houver um input dentro, não faz nada (evita cliques duplos)
        if (tdElement.querySelector('input')) return;

        const valorAtual = tdElement.textContent === '-' ? '' : tdElement.textContent;
        tdElement.innerHTML = ''; // Limpa a célula

        const input = document.createElement('input');
        input.type = 'text';
        input.value = valorAtual;
        input.placeholder = "HH:MM";

        // Evento para salvar quando o campo perde o foco (clica fora)
        input.addEventListener('blur', () => {
            salvarAlteracaoPlanilha(tdElement, input.value);
        });

        // Evento para salvar quando a tecla "Enter" é pressionada
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                salvarAlteracaoPlanilha(tdElement, input.value);
            }
        });

        tdElement.appendChild(input);
        input.focus(); // Foca automaticamente no campo de texto
    }

    async function salvarAlteracaoPlanilha(tdElement, novoValor) {
        // Pega as informações que guardamos na célula
        const projetoId = tdElement.dataset.projetoId;
        const data = tdElement.dataset.date;

        let duracaoSegundos = 0;
        const partes = novoValor.trim().split(':');
        
        // Converte "HH:MM" para segundos
        if (partes.length === 2 && novoValor.trim() !== '') {
            const horas = parseInt(partes[0]) || 0;
            const minutos = parseInt(partes[1]) || 0;
            duracaoSegundos = (horas * 3600) + (minutos * 60);
        }

        try {
            const response = await fetch('http://127.0.0.1:5000/planilha/salvar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({
                    projeto_id: projetoId,
                    data: data,
                    duracao_segundos: duracaoSegundos
                })
            });
            const result = await response.json();
            if (result.status !== 'sucesso') {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch(error) {
            alert("Erro de conexão ao salvar.");
        } finally {
            // Sempre recarrega a planilha para mostrar o dado atualizado
            carregarPlanilha(); 
        }
    }

    navCronometro.addEventListener('click', (e) => { e.preventDefault(); showView('cronometro-view'); });
    navPlanilha.addEventListener('click', (e) => { 
        e.preventDefault(); 
        showView('planilha-view'); 
        carregarPlanilha();
    });
    navRelatorioDetalhado.addEventListener('click', (e) => { e.preventDefault(); showView('relatorio-detalhado-view'); });
    navGestao.addEventListener('click', (e) => { e.preventDefault(); showView('gestao-view'); });

    // --- 6. INICIALIZAÇÃO DA PÁGINA ---
    showView('cronometro-view');
    carregarPilares();
    carregarApontamentos();
    verificarApontamentoAtivo();
});