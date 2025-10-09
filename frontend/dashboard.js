document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. LÓGICA DE PROTEÇÃO E LOGOUT (Já existente) ---
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
        return; // Para a execução do script se não houver token
    }

    const logoutButton = document.getElementById('logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            localStorage.removeItem('token');
            alert("Você saiu da sua conta.");
            window.location.href = 'login.html';
        });
    }

    // --- 2. CAPTURAR OS NOVOS ELEMENTOS DO HTML ---
    const pilarSelect = document.getElementById('pilar-select');
    const projetoSelect = document.getElementById('projeto-select');
    
    // --- 3. FUNÇÃO PARA BUSCAR E PREENCHER OS PILARES ---
    function carregarPilares() {
        fetch('http://127.0.0.1:5000/pilares', {
            method: 'GET',
            headers: {
                // No futuro, enviaremos o token aqui para rotas protegidas
                // 'Authorization': `Bearer ${token}` 
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso') {
                // Limpa o select antes de adicionar novas opções
                pilarSelect.innerHTML = '<option value="">Selecione o Pilar</option>';
                
                // Para cada pilar retornado pela API, cria um <option>
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

    // --- 4. FUNÇÃO PARA BUSCAR PROJETOS QUANDO UM PILAR É SELECIONADO ---
    function carregarProjetos(pilarId) {
        // Se nenhum pilar for selecionado, desabilita e limpa o select de projetos
        if (!pilarId) {
            projetoSelect.innerHTML = '<option value="">Selecione o Projeto</option>';
            projetoSelect.disabled = true;
            return;
        }

        // Busca os projetos filtrando pelo pilar selecionado
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
                // Habilita o select de projetos
                projetoSelect.disabled = false;
            }
        })
        .catch(error => console.error('Erro ao buscar projetos:', error));
    }

    // --- 5. ADICIONAR OS "ESCUTADORES DE EVENTOS" ---
    
    // Quando o usuário muda o valor do select de Pilar...
    pilarSelect.addEventListener('change', function() {
        const pilarSelecionadoId = pilarSelect.value;
        carregarProjetos(pilarSelecionadoId);
    });

    // --- 6. INICIALIZAÇÃO ---
    // Carrega a lista de pilares assim que a página é carregada
    carregarPilares();

});