// ============================================================
// AUTENTICAÇÃO - LOGIN FIXO (SISTEMA FECHADO)
// ============================================================
// Sistema sem cadastro de usuários. Acesso liberado apenas com
// as credenciais fixas abaixo. Para trocar o usuário/senha,
// edite CREDENCIAIS_FIXAS.
(function() {

    const APP = window.APP;

    // ============================================================
    // CREDENCIAIS FIXAS
    // ============================================================
    const CREDENCIAIS_FIXAS = {
        usuario: 'Admin',
        senha: 'admin123'
    };

    // Chave usada no localStorage para manter o login entre acessos
    const LOGIN_STORAGE_KEY = 'odontogest_logado';

    // ============================================================
    // DOM ELEMENTOS
    // ============================================================
    const loginContainer = document.getElementById('loginContainer');
    const sistemaPrincipal = document.getElementById('sistemaPrincipal');
    const loginForm = document.getElementById('loginForm');

    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const btnLogin = document.getElementById('btnLogin');
    const loginError = document.getElementById('loginError');
    const loginSuccess = document.getElementById('loginSuccess');

    const btnLogout = document.getElementById('btnLogout');
    const usuarioLogado = document.getElementById('usuarioLogado');

    // ============================================================
    // VERIFICAÇÃO DE SESSÃO (LOCAL, SEM SUPABASE AUTH)
    // ============================================================
    APP.verificarSessao = async function() {
        const logado = localStorage.getItem(LOGIN_STORAGE_KEY) === 'true';
        if (logado) {
            APP.usuarioAtual = { nome: CREDENCIAIS_FIXAS.usuario };
            mostrarSistema();
            return true;
        }
        mostrarLogin();
        return false;
    };

    function mostrarLogin() {
        if (loginContainer) loginContainer.style.display = 'flex';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
        if (loginPassword) loginPassword.value = '';
    }

    function mostrarSistema() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'block';
        if (APP.usuarioAtual && usuarioLogado) {
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${APP.escapeHTML ? APP.escapeHTML(APP.usuarioAtual.nome) : APP.usuarioAtual.nome}`;
        }
        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
    }

    // ============================================================
    // FUNÇÃO DE LOGIN
    // ============================================================
    function fazerLogin() {
        console.log('🟢 Tentando login...');
        const usuario = loginEmail.value.trim();
        const senha = loginPassword.value.trim();

        if (!usuario || !senha) {
            loginError.textContent = '❌ Preencha usuário e senha';
            loginError.style.display = 'block';
            return;
        }

        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';

        if (usuario === CREDENCIAIS_FIXAS.usuario && senha === CREDENCIAIS_FIXAS.senha) {
            console.log('✅ Login bem-sucedido!');
            localStorage.setItem(LOGIN_STORAGE_KEY, 'true');
            APP.usuarioAtual = { nome: CREDENCIAIS_FIXAS.usuario };

            loginSuccess.textContent = '✅ Login realizado com sucesso!';
            loginSuccess.style.display = 'block';

            setTimeout(() => {
                mostrarSistema();
            }, 400);
        } else {
            console.warn('❌ Credenciais inválidas');
            loginError.textContent = '❌ Usuário ou senha inválidos';
            loginError.style.display = 'block';
        }
    }

    // ============================================================
    // FUNÇÃO DE LOGOUT
    // ============================================================
    function fazerLogout() {
        localStorage.removeItem(LOGIN_STORAGE_KEY);
        APP.usuarioAtual = null;
        APP.pacientes = [];
        if (typeof APP.mostrarToast === 'function') {
            APP.mostrarToast('👋 Você saiu do sistema', '#1a4a58');
        }
        mostrarLogin();
    }

    // ============================================================
    // EVENTOS
    // ============================================================
    if (btnLogin) btnLogin.addEventListener('click', fazerLogin);
    if (loginPassword) {
        loginPassword.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }
    if (loginEmail) {
        loginEmail.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }

    if (btnLogout) btnLogout.addEventListener('click', fazerLogout);

    // ============================================================
    // EXPORTA FUNÇÕES
    // ============================================================
    APP.fazerLogin = fazerLogin;
    APP.fazerLogout = fazerLogout;

})();
