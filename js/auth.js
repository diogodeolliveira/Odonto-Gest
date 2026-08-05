// ============================================================
// AUTENTICAÇÃO - APENAS LOGIN (SEM REGISTRO)
// ============================================================
(function() {

    const APP = window.APP;
    const supabase = APP.supabase;

    // ============================================================
    // DOM ELEMENTOS
    // ============================================================
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

    // ============================================================
    // VERIFICAÇÃO DE SESSÃO
    // ============================================================
    APP.verificarSessao = async function() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                APP.usuarioAtual = session.user;
                await carregarUsuarioAtual();
                mostrarSistema();
                return true;
            }
            mostrarLogin();
            return false;
        } catch (e) {
            console.error('❌ Erro ao verificar sessão:', e);
            mostrarLogin();
            return false;
        }
    };

    // ============================================================
    // CARREGAR DADOS DO USUÁRIO ATUAL
    // ============================================================
    async function carregarUsuarioAtual() {
        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('username, nome_completo, perfil')
                .eq('id', APP.usuarioAtual.id)
                .single();

            if (error) throw error;
            APP.usuarioDados = data;
        } catch (e) {
            console.warn('⚠️ Não foi possível carregar dados do usuário:', e);
            APP.usuarioDados = null;
        }
    }

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
            const nome = APP.usuarioDados?.nome_completo || APP.usuarioAtual.email;
            const username = APP.usuarioDados?.username || '';
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${APP.escapeHTML ? APP.escapeHTML(nome) : nome} (${APP.escapeHTML ? APP.escapeHTML(username) : username})`;
        }
        
        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
    }

    // ============================================================
    // FUNÇÃO DE LOGIN (POR USERNAME)
    // ============================================================
    async function fazerLogin() {
        console.log('🟢 Tentando login...');
        const username = loginUsername.value.trim();
        const password = loginPassword.value.trim();

        if (!username || !password) {
            loginError.textContent = '❌ Preencha apelido e senha';
            loginError.style.display = 'block';
            return;
        }

        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        btnLogin.disabled = true;
        const textoOriginal = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            // 1. Buscar o email associado ao username
            const { data: usuario, error: userError } = await supabase
                .from('usuarios')
                .select('id')
                .eq('username', username)
                .eq('ativo', true)
                .single();

            if (userError) {
                console.error('❌ Usuário não encontrado:', userError);
                loginError.textContent = '❌ Apelido ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            if (!usuario) {
                loginError.textContent = '❌ Apelido ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            // 2. Buscar o email do usuário no auth.users
            const { data: authUser, error: authError } = await supabase
                .from('auth.users')
                .select('email')
                .eq('id', usuario.id)
                .single();

            if (authError) {
                console.error('❌ Erro ao buscar email:', authError);
                loginError.textContent = '❌ Erro ao autenticar. Tente novamente.';
                loginError.style.display = 'block';
                return;
            }

            // 3. Fazer login com o email encontrado
            const { data, error } = await supabase.auth.signInWithPassword({
                email: authUser.email,
                password: password
            });

            if (error) {
                console.error('❌ Erro no login:', error);
                loginError.textContent = '❌ Apelido ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            console.log('✅ Login bem-sucedido!', data.user);
            APP.usuarioAtual = data.user;
            await carregarUsuarioAtual();
            
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
            btnLogin.innerHTML = textoOriginal;
        }
    }

    // ============================================================
    // FUNÇÃO DE LOGOUT
    // ============================================================
    async function fazerLogout() {
        const { error } = await supabase.auth.signOut();
        if (error) {
            if (typeof APP.mostrarToast === 'function') {
                APP.mostrarToast('❌ Erro ao sair: ' + error.message, '#7a3a3a');
            }
        } else {
            APP.usuarioAtual = null;
            APP.usuarioDados = null;
            APP.pacientes = [];
            if (typeof APP.mostrarToast === 'function') {
                APP.mostrarToast('👋 Você saiu do sistema', '#1a4a58');
            }
            mostrarLogin();
        }
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
    if (loginUsername) {
        loginUsername.addEventListener('keydown', function(e) {
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
