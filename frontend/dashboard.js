document.addEventListener('DOMContentLoaded', function() {
    
    // --- LÓGICA DE PROTEÇÃO E LOGOUT ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
        return;
    }

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            alert("Você saiu da sua conta.");
            window.location.href = 'login.html';
        });
    }

    // --- LÓGICA DO CRONÔMETRO (CARREGAR DADOS) ---
    const pilarSelect = document.getElementById('pilar-select');
    const projetoSelect = document.getElementById('projeto-select');
    
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
        })
        .catch(error => console.error('Erro ao buscar pilares:', error));
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
        })
        .catch(error => console.error('Erro ao buscar projetos:', error));
    }

    pilarSelect.addEventListener('change', function() {
        const pilarSelecionadoId = pilarSelect.value;
        carregarProjetos(pilarSelecionadoId);
    });

    carregarPilares();

    // --- LÓGICA DE NAVEGAÇÃO ENTRE AS TELAS ---
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

    navCronometro.addEventListener('click', function(event) {
        event.preventDefault();
        showView('cronometro-view');
    });

    navPlanilha.addEventListener('click', function(event) {
        event.preventDefault();
        showView('planilha-view');
    });

    navRelatorioDetalhado.addEventListener('click', function(event) {
        event.preventDefault();
        showView('relatorio-detalhado-view');
    });

    navGestao.addEventListener('click', function(event) {
        event.preventDefault();
        showView('gestao-view');
    });
    
    // Inicia mostrando a tela do cronômetro por padrão
    showView('cronometro-view');
});