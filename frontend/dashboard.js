document.addEventListener('DOMContentLoaded', function() {
    
    // 1. LÓGICA DE PROTEÇÃO DA PÁGINA
    // Pega o token que salvamos no localStorage durante o login
    const token = localStorage.getItem('token');

    // Se NÃO houver um token...
    if (!token) {
        // Redireciona o usuário de volta para a tela de login, pois ele não está autenticado.
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = 'login.html';
    }

    // 2. LÓGICA DO BOTÃO DE LOGOUT
    const logoutButton = document.getElementById('logout-btn');

    // Se o botão existir na página...
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            // Remove o token do "cofre" do navegador
            localStorage.removeItem('token');

            // Avisa o usuário e o redireciona para a tela de login
            alert("Você saiu da sua conta.");
            window.location.href = 'login.html';
        });
    }

});