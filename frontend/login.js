document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('login-form');
    const mensagemDiv = document.getElementById('mensagem');

    form.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        const dados = {
            Email: email,
            Senha: senha
        };

        fetch('http://127.0.0.1:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'sucesso' && data.token) {
                // SUCESSO! O backend nos deu o token.
                mensagemDiv.textContent = 'Login bem-sucedido! Redirecionando...';
                mensagemDiv.style.color = 'green';

                // **PASSO CRUCIAL: Salvar o token no navegador**
                // O localStorage é um "pequeno cofre" no navegador onde podemos
                // guardar informações que persistem mesmo se a página for fechada.
                localStorage.setItem('token', data.token);

                // Redireciona o usuário para a página principal do sistema após 2 segundos
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);

            } else {
                // Mostra a mensagem de erro que veio do backend
                mensagemDiv.textContent = 'Erro: ' + data.mensagem;
                mensagemDiv.style.color = 'red';
            }
        })
        .catch(error => {
            console.error('Erro na requisição:', error);
            mensagemDiv.textContent = 'Erro de conexão com o servidor.';
            mensagemDiv.style.color = 'red';
        });
    });
});