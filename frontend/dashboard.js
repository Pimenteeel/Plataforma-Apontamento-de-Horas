// VERSÃO FINAL E COMPLETA DO DASHBOARD.JS
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. CONFIGURAÇÃO INICIAL E PROTEÇÃO ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
        return; 
    }

    // Captura de todos os elementos da página
    const logoutButton = document.getElementById('logout-btn');
    const pilarSelect = document.getElementById('pilar-select');
    const projetoSelect = document.getElementById('projeto-select');
    const observacaoInput = document.getElementById('observacao-input');
    const timerDisplay = document.getElementById('timer-display');
    const startStopBtn = document.getElementById('start-stop-btn');
    const contentArea = document.querySelector('#cronometro-view .content-area');
    const planilhaContainer = document.getElementById('planilha-container');
    const navCronometro = document.getElementById('nav-cronometro');
    const navPlanilha = document.getElementById('nav-planilha');
    const navRelatorioDetalhado = document.getElementById('nav-relatorio-detalhado');
    const navGestao = document.getElementById('nav-gestao');
    const views = document.querySelectorAll('.view');
    const prevWeekBtn = document.getElementById('prev-week-btn');
    const nextWeekBtn = document.getElementById('next-week-btn');

    // Variáveis de estado
    let timerInterval = null;
    let segundosPassados = 0;
    let apontamentoAtivoId = null;
    let currentWeekDate = new Date();

    // --- 2. LÓGICA DE NAVEGAÇÃO ENTRE TELAS ---
    function showView(viewId) {
        views.forEach(view => view.style.display = 'none');
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) viewToShow.style.display = 'block';
    }

    // --- 3. FUNÇÕES DE CARREGAMENTO DE DADOS (APIs) ---
    function carregarPilares() {
        fetch('http://127.0.0.1:5000/pilares', { headers: { 'Authorization': `Bearer ${token}` } })
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
        fetch(`http://127.0.0.1:5000/projetos?pilar_id=${pilarId}`, { headers: { 'Authorization': `Bearer ${token}` } })
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
        fetch('http://127.0.0.1:5000/apontamentos', { headers: { 'Authorization': `Bearer ${token}` } })
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
                    itemDiv.innerHTML = `
                        <span class="apontamento-descricao">${ap.NomePilar} | ${ap.NomeProjeto} | ${ap.Descricao}</span>
                        <span>${inicio} - ${fim}</span>
                        <span class="apontamento-duracao" data-id="${ap.ID_Apontamento}">${ap.Duracao || 'Rodando...'}</span>
                        <button class="apontamento-delete-btn" data-id="${ap.ID_Apontamento}"><i class="fas fa-trash-alt"></i></button>
                    `;
                    contentArea.appendChild(itemDiv);
                });

                document.querySelectorAll('.apontamento-duracao').forEach(span => {
                    if (span.textContent.trim() !== 'Rodando...') {
                        span.addEventListener('click', function() { tornarEditavel(this); });
                    }
                });
                document.querySelectorAll('.apontamento-delete-btn').forEach(button => {
                    button.addEventListener('click', function() {
                        const apontamentoId = this.dataset.id;
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

    function carregarPlanilha(date) {
        if (!planilhaContainer || !date) return;
        planilhaContainer.innerHTML = 'Carregando...';
        const dateString = date.toISOString().split('T')[0];
        fetch(`http://127.0.0.1:5000/planilha?data=${dateString}`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                const table = planilhaContainer.querySelector('.planilha-table') || document.createElement('table');
                table.className = 'planilha-table';
                
                const thead = table.querySelector('thead') || document.createElement('thead');
                let headerRow = '<tr><th>Pilar</th><th>Projeto</th><th>Observação</th>';
                const diasDaSemana = [];
                for (let i = 0; i < 7; i++) {
                    const dia = new Date(data.inicio_semana);
                    dia.setUTCDate(dia.getUTCDate() + i);
                    headerRow += `<th>${dia.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' })}<br>${dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })}</th>`;
                    diasDaSemana.push(dia.toISOString().split('T')[0]);
                }
                thead.innerHTML = headerRow + '</tr>';
                if (!table.tHead) table.appendChild(thead);

                const tbody = table.querySelector('tbody') || document.createElement('tbody');
                tbody.id = 'planilha-body';
                tbody.innerHTML = '';
                
                const tarefas = Object.keys(data.planilha);
                tarefas.forEach(tarefaKey => {
                    const tarefaInfo = data.planilha[tarefaKey];
                    const [pilar, projeto, descricao] = tarefaKey.split(' | ');
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${pilar}</td><td>${projeto}</td><td>${descricao}</td>`;
                    diasDaSemana.forEach(diaKey => {
                        const horas = tarefaInfo.dias[diaKey] || '-';
                        const td = document.createElement('td');
                        td.textContent = horas;
                        td.dataset.projetoId = tarefaInfo.projetoId;
                        td.dataset.descricao = descricao;
                        td.dataset.date = diaKey;
                        td.addEventListener('click', () => tornarCelulaEditavel(td));
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });
                if (!table.tBodies.length) table.appendChild(tbody);

                const tfoot = table.querySelector('tfoot') || document.createElement('tfoot');
                tfoot.id = 'planilha-footer';
                if (!table.tFoot) table.appendChild(tfoot);

                if (!planilhaContainer.querySelector('table')) planilhaContainer.innerHTML = '';
                if (!planilhaContainer.querySelector('table')) planilhaContainer.appendChild(table);

                criarLinhaDeAdicao(tfoot, diasDaSemana);
            } else {
                planilhaContainer.innerHTML = `<p style="color:red">Erro: ${data.mensagem}</p>`;
            }
        }).catch(error => {
            console.error('Erro ao carregar planilha:', error);
            planilhaContainer.innerHTML = '<p style="color:red">Erro de conexão.</p>';
        });
    }
    
    // --- 4. FUNÇÕES DO CRONÔMETRO, EDIÇÃO E PLANILHA ---
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
            timerDisplay.value = formatarTempo(segundosPassados);
            timerInterval = setInterval(() => {
                segundosPassados++;
                timerDisplay.value = formatarTempo(segundosPassados);
            }, 1000);
            carregarApontamentos();
        } else {
            alert(`Erro: ${result.mensagem}`);
        }
    }
    
    async function pararCronometro() {
        clearInterval(timerInterval);
        const tempoFinalString = timerDisplay.value;
        const partes = tempoFinalString.split(':');
        let durationInSeconds = 0;
        if (partes.length === 3) {
            durationInSeconds = (+partes[0]) * 3600 + (+partes[1]) * 60 + (+partes[2]);
        }
        const response = await fetch('http://127.0.0.1:5000/apontamentos/parar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ 
                apontamento_id: apontamentoAtivoId,
                duration_seconds: durationInSeconds
            })
        });
        const result = await response.json();
        if (result.status === 'sucesso') {
            timerInterval = null;
            apontamentoAtivoId = null;
            startStopBtn.textContent = 'INICIAR';
            startStopBtn.style.backgroundColor = '#007bff';
            timerDisplay.value = '00:00:00';
            timerDisplay.disabled = true;
            [pilarSelect, projetoSelect, observacaoInput].forEach(el => el.disabled = false);
            observacaoInput.value = '';
            alert("Apontamento finalizado com sucesso!");
            carregarApontamentos();
        } else {
            alert(`Erro: ${result.mensagem}`);
            timerInterval = setInterval(() => { // Reinicia o timer se der erro
                segundosPassados++;
                timerDisplay.value = formatarTempo(segundosPassados);
            }, 1000);
        }
    }

    async function verificarApontamentoAtivo() {
        try {
            const response = await fetch('http://127.0.0.1:5000/apontamentos/ativo', { headers: { 'Authorization': `Bearer ${token}` } });
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
                timerDisplay.disabled = false;
                timerDisplay.value = formatarTempo(segundosPassados);
                timerInterval = setInterval(() => {
                    segundosPassados++;
                    timerDisplay.value = formatarTempo(segundosPassados);
                }, 1000);
            }
        } catch (error) {
            console.error("Erro ao verificar apontamento ativo:", error);
        }
    }

    function tornarEditavel(spanElement) {
        const apontamentoId = spanElement.dataset.id;
        const valorAtual = spanElement.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = valorAtual;
        input.className = 'apontamento-duracao';
        spanElement.replaceWith(input);
        input.focus();
        const salvarOuCancelar = (event) => {
            if (event.type === 'keydown' && event.key !== 'Enter') return;
            const novoValor = input.value.trim();
            const partes = novoValor.split(':');
            if (novoValor !== valorAtual && partes.length === 3) {
                const segundos = (+partes[0]) * 3600 + (+partes[1]) * 60 + (+partes[2]);
                salvarEdicao(apontamentoId, segundos);
            } else {
                carregarApontamentos();
            }
        };
        input.addEventListener('keydown', salvarOuCancelar);
        input.addEventListener('blur', salvarOuCancelar);
    }

    async function salvarEdicao(apontamentoId, durationInSeconds) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/apontamentos/${apontamentoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ duration_seconds: durationInSeconds })
            });
            const result = await response.json();
            if (result.status !== 'sucesso') alert(`Erro: ${result.mensagem}`);
        } catch (error) {
            alert("Erro de conexão ao salvar.");
        } finally {
            carregarApontamentos(); 
        }
    }

    async function excluirApontamento(apontamentoId) {
        try {
            const response = await fetch(`http://127.0.0.1:5000/apontamentos/${apontamentoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.status !== 'sucesso') alert(`Erro: ${result.mensagem}`);
        } catch (error) {
            alert("Erro de conexão ao excluir.");
        } finally {
            carregarApontamentos(); 
        }
    }

    function criarLinhaDeAdicao(footer, diasDaSemana) {
        const tr = document.createElement('tr');
        tr.id = 'add-entry-row';
        const pilarTd = document.createElement('td');
        const pilarSelectNew = document.createElement('select');
        pilarSelectNew.id = 'new-pilar-select';
        pilarSelectNew.innerHTML = document.getElementById('pilar-select').innerHTML;
        pilarTd.appendChild(pilarSelectNew);
        const projetoTd = document.createElement('td');
        const projetoSelectNew = document.createElement('select');
        projetoSelectNew.id = 'new-projeto-select';
        projetoSelectNew.innerHTML = '<option value="">Selecione Projeto</option>';
        projetoSelectNew.disabled = true;
        projetoTd.appendChild(projetoSelectNew);
        const descTd = document.createElement('td');
        const descInputNew = document.createElement('input');
        descInputNew.type = 'text';
        descInputNew.id = 'new-descricao-input';
        descInputNew.placeholder = 'Nova observação...';
        descTd.appendChild(descInputNew);
        tr.appendChild(pilarTd);
        tr.appendChild(projetoTd);
        tr.appendChild(descTd);
        diasDaSemana.forEach(diaKey => {
            const td = document.createElement('td');
            td.textContent = '-';
            td.dataset.date = diaKey;
            td.addEventListener('click', () => tornarCelulaEditavel(td));
            tr.appendChild(td);
        });
        footer.innerHTML = ''; // Limpa o rodapé antes de adicionar
        footer.appendChild(tr);
        pilarSelectNew.addEventListener('change', () => {
            const pilarId = pilarSelectNew.value;
            fetch(`http://127.0.0.1:5000/projetos?pilar_id=${pilarId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => {
                if (data.status === 'sucesso') {
                    projetoSelectNew.innerHTML = '<option value="">Selecione Projeto</option>';
                    data.projetos.forEach(p => {
                        projetoSelectNew.innerHTML += `<option value="${p.ID_Projeto}">${p.NomeProjeto}</option>`;
                    });
                    projetoSelectNew.disabled = false;
                }
            });
        });
    }

    function tornarCelulaEditavel(tdElement) {
        if (tdElement.querySelector('input')) return;
        const valorAtual = tdElement.textContent.trim();
        const input = document.createElement('input');
        input.type = 'text';
        input.value = valorAtual === '-' ? '' : valorAtual;
        input.placeholder = "HH:MM";
        const salvar = () => {
            salvarAlteracaoPlanilha(tdElement, input.value);
        };
        input.addEventListener('blur', salvar);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') salvar();
        });
        tdElement.innerHTML = '';
        tdElement.appendChild(input);
        input.focus();
    }
    
    async function salvarAlteracaoPlanilha(tdElement, novoValor) {
        const parentRow = tdElement.parentElement;
        let projetoId, descricao;
        if (parentRow.id === 'add-entry-row') {
            projetoId = parentRow.querySelector('#new-projeto-select').value;
            descricao = parentRow.querySelector('#new-descricao-input').value;
            if (!projetoId) {
                alert("Para adicionar um novo apontamento, ao menos um Projeto deve ser selecionado.");
                carregarPlanilha(currentWeekDate);
                return;
            }
        } else {
            projetoId = tdElement.dataset.projetoId;
            descricao = tdElement.dataset.descricao;
        }
        const data = tdElement.dataset.date;
        let duracaoSegundos = 0;
        const partes = novoValor.trim().split(':');
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
                    projeto_id: projetoId, data: data, duracao_segundos: duracaoSegundos, descricao: descricao
                })
            });
            const result = await response.json();
            if (result.status !== 'sucesso') {
                alert(`Erro: ${result.mensagem}`);
            }
        } catch(error) {
            alert("Erro de conexão ao salvar.");
        } finally {
            carregarPlanilha(currentWeekDate);
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
        if (timerInterval) pararCronometro();
        else iniciarCronometro();
    });
    prevWeekBtn.addEventListener('click', () => {
        currentWeekDate.setDate(currentWeekDate.getDate() - 7);
        carregarPlanilha(currentWeekDate);
    });
    nextWeekBtn.addEventListener('click', () => {
        currentWeekDate.setDate(currentWeekDate.getDate() + 7);
        carregarPlanilha(currentWeekDate);
    });
    navCronometro.addEventListener('click', (e) => { e.preventDefault(); showView('cronometro-view'); carregarApontamentos(); });
    navPlanilha.addEventListener('click', (e) => { e.preventDefault(); showView('planilha-view'); currentWeekDate = new Date(); carregarPlanilha(currentWeekDate); });
    navRelatorioDetalhado.addEventListener('click', (e) => { e.preventDefault(); showView('relatorio-detalhado-view'); });
    navGestao.addEventListener('click', (e) => { e.preventDefault(); showView('gestao-view'); });

    // --- 6. INICIALIZAÇÃO DA PÁGINA ---
    showView('cronometro-view');
    carregarPilares();
    carregarApontamentos();
    verificarApontamentoAtivo();
});