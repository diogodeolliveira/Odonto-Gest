// ============================================================
// AUTENTICAÇÃO - LOGIN MANUAL
// ============================================================
(function() {

    const APP = window.APP;
    const supabase = APP.supabase;

    const loginContainer = document.getElementById('loginContainer');
    const sistemaPrincipal = document.getElementById('sistemaPrincipal');
    const loginForm = document.getElementById('loginForm');

    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const btnLogin = document.getElementById('btnLogin');
    const loginError = document.getElementById('loginError');
    const loginSuccess = document.getElementById('loginSuccess');

    const btnLogout = document.getElementById('btnLogout');
    const usuarioLogado = document.getElementById('usuarioLogado');

    function salvarSessao(usuario) {
        localStorage.setItem('odontogest_sessao', JSON.stringify(usuario));
    }

    function carregarSessao() {
        try {
            const data = localStorage.getItem('odontogest_sessao');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function limparSessao() {
        localStorage.removeItem('odontogest_sessao');
    }

    APP.verificarSessao = async function() {
        const sessao = carregarSessao();
        if (sessao) {
            APP.usuarioAtual = sessao;
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
    }

    function mostrarSistema() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'block';

        if (APP.usuarioAtual && usuarioLogado) {
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${APP.escapeHTML ? APP.escapeHTML(APP.usuarioAtual.nome_completo) : APP.usuarioAtual.nome_completo}`;
        }

        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
    }

    async function fazerLogin() {
        console.log('🟢 Tentando login...');
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (!username || !password) {
            loginError.textContent = '❌ Preencha usuário e senha';
            loginError.style.display = 'block';
            return;
        }

        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        btnLogin.disabled = true;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('username', username)
                .eq('ativo', true)
                .single();

            if (error || !usuario) {
                console.error('❌ Usuário não encontrado:', error);
                loginError.textContent = '❌ Usuário ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            if (usuario.senha !== password) {
                loginError.textContent = '❌ Usuário ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            console.log('✅ Login bem-sucedido!', usuario);
            APP.usuarioAtual = usuario;
            salvarSessao(usuario);

            loginSuccess.textContent = '✅ Login realizado com sucesso!';
            loginSuccess.style.display = 'block';

            setTimeout(() => {
                mostrarSistema();
            }, 500);

        } catch (e) {
            console.error('❌ Erro inesperado:', e);
            loginError.textContent = '❌ Erro ao conectar. Tente novamente.';
            loginError.style.display = 'block';
        } finally {
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    }

    async function fazerLogout() {
        limparSessao();
        APP.usuarioAtual = null;
        APP.pacientes = [];
        if (typeof APP.mostrarToast === 'function') {
            APP.mostrarToast('👋 Você saiu do sistema', '#1a4a58');
        }
        mostrarLogin();
    }

    if (btnLogin) btnLogin.addEventListener('click', fazerLogin);
    if (loginPassword) {
        loginPassword.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }
    if (loginUsername) {
        loginUsername.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }

    if (btnLogout) btnLogout.addEventListener('click', fazerLogout);

    APP.fazerLogin = fazerLogin;
    APP.fazerLogout = fazerLogout;

})();
