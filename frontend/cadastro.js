// Espera o HTML ser completamente carregado para executar o script
document.addEventListener('DOMContentLoaded', function() {

    // 1. Seleciona os elementos do HTML com os quais vamos trabalhar
    const form = document.getElementById('cadastro-form');
    const mensagemDiv = document.getElementById('mensagem');

    // 2. Adiciona um "escutador de eventos" para o envio do formulário
    form.addEventListener('submit', function(event) {
        
        // 3. Previne o comportamento padrão do formulário (que é recarregar a página)
        event.preventDefault();

        // 4. Captura os valores digitados nos campos do formulário
        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const timeId = document.getElementById('time').value;

        // 5. Monta o objeto de dados (payload) que será enviado para a API
        // As chaves (NomeUsuario, Email, etc.) devem ser EXATAMENTE as mesmas que o backend espera!
        const dados = {
            NomeUsuario: nome,
            Email: email,
            Senha: senha,
            fk_ID_Time: parseInt(timeId) // Converte o ID do time para número inteiro
        };

        // 6. Envia os dados para o backend usando a API Fetch
        fetch('http://127.0.0.1:5000/cadastro', {
            method: 'POST', // Método da requisição
            headers: {
                'Content-Type': 'application/json' // Avisa que estamos enviando dados em formato JSON
            },
            body: JSON.stringify(dados) // Converte o objeto JavaScript para uma string JSON
        })
        .then(response => response.json()) // Converte a resposta do servidor de JSON para objeto
        .then(data => {
            // 7. Trata a resposta do servidor
            if (data.status === 'sucesso') {
                mensagemDiv.textContent = data.mensagem; // Exibe a mensagem de sucesso
                mensagemDiv.style.color = 'green';
                form.reset(); // Limpa o formulário
            } else {
                mensagemDiv.textContent = 'Erro: ' + data.mensagem; // Exibe a mensagem de erro
                mensagemDiv.style.color = 'red';
            }
        })
        .catch(error => {
            // Trata erros de conexão com a API
            console.error('Erro na requisição:', error);
            mensagemDiv.textContent = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
            mensagemDiv.style.color = 'red';
        });
    });
});