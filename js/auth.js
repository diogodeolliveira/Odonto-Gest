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
        try {
            localStorage.setItem('odontogest_sessao', JSON.stringify(usuario));
        } catch (e) {
            console.error('Erro ao salvar sessão:', e);
        }
    }

    function carregarSessao() {
        try {
            const data = localStorage.getItem('odontogest_sessao');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Erro ao carregar sessão:', e);
            return null;
        }
    }

    function limparSessao() {
        try {
            localStorage.removeItem('odontogest_sessao');
        } catch (e) {
            console.error('Erro ao limpar sessão:', e);
        }
    }

    APP.verificarSessao = async function() {
        const sessao = carregarSessao();
        if (sessao && sessao.username) {
            // Verifica se o usuário ainda existe no banco
            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('username', sessao.username)
                    .eq('ativo', true)
                    .single();
                    
                if (error || !data) {
                    limparSessao();
                    mostrarLogin();
                    return false;
                }
                
                APP.usuarioAtual = data;
                mostrarSistema();
                return true;
            } catch (e) {
                // Fallback: aceita a sessão local
                APP.usuarioAtual = sessao;
                mostrarSistema();
                return true;
            }
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
        
        // Limpa campos
        if (loginUsername) loginUsername.value = '';
        if (loginPassword) loginPassword.value = '';
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    }

    function mostrarSistema() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'block';

        if (APP.usuarioAtual && usuarioLogado) {
            const nome = APP.escapeHTML ? APP.escapeHTML(APP.usuarioAtual.nome_completo || APP.usuarioAtual.username) : (APP.usuarioAtual.nome_completo || APP.usuarioAtual.username);
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${nome}`;
        }

        // Carrega dados
        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
    }

    async function fazerLogin() {
        console.log('🟢 Tentando login...');
        const username = loginUsername ? loginUsername.value.trim() : '';
        const password = loginPassword ? loginPassword.value.trim() : '';

        if (!username || !password) {
            if (loginError) {
                loginError.textContent = '❌ Preencha usuário e senha';
                loginError.style.display = 'block';
            }
            return;
        }

        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
        if (btnLogin) {
            btnLogin.disabled = true;
            btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        }

        try {
            const { data: usuario, error } = await supabase
                .from('usuarios')
                .select('*')
                .eq('username', username)
                .eq('ativo', true)
                .single();

            if (error || !usuario) {
                console.error('❌ Usuário não encontrado:', error);
                if (loginError) {
                    loginError.textContent = '❌ Usuário ou senha incorretos';
                    loginError.style.display = 'block';
                }
                return;
            }

            if (usuario.senha !== password) {
                if (loginError) {
                    loginError.textContent = '❌ Usuário ou senha incorretos';
                    loginError.style.display = 'block';
                }
                return;
            }

            console.log('✅ Login bem-sucedido!', usuario);
            APP.usuarioAtual = usuario;
            salvarSessao(usuario);

            if (loginSuccess) {
                loginSuccess.textContent = '✅ Login realizado com sucesso!';
                loginSuccess.style.display = 'block';
            }

            setTimeout(() => {
                mostrarSistema();
            }, 500);

        } catch (e) {
            console.error('❌ Erro inesperado:', e);
            if (loginError) {
                loginError.textContent = '❌ Erro ao conectar. Tente novamente.';
                loginError.style.display = 'block';
            }
        } finally {
            if (btnLogin) {
                btnLogin.disabled = false;
                btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            }
        }
    }

    async function fazerLogout() {
        console.log('🟢 Fazendo logout...');
        limparSessao();
        APP.usuarioAtual = null;
        APP.pacientes = [];
        if (typeof APP.mostrarToast === 'function') {
            APP.mostrarToast('👋 Você saiu do sistema', '#1a4a58');
        }
        mostrarLogin();
    }

    // Configura eventos de login
    if (btnLogin) {
        const novoBtnLogin = btnLogin.cloneNode(true);
        btnLogin.parentNode.replaceChild(novoBtnLogin, btnLogin);
        novoBtnLogin.addEventListener('click', fazerLogin);
    }

    if (loginPassword) {
        const novoLoginPassword = loginPassword.cloneNode(true);
        loginPassword.parentNode.replaceChild(novoLoginPassword, loginPassword);
        novoLoginPassword.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }

    if (loginUsername) {
        const novoLoginUsername = loginUsername.cloneNode(true);
        loginUsername.parentNode.replaceChild(novoLoginUsername, loginUsername);
        novoLoginUsername.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }

    // O logout é configurado em app.js, mas mantemos como fallback
    if (btnLogout) {
        // Não substituímos aqui para não conflitar com app.js
        // O app.js já configura o logout
    }

    APP.fazerLogin = fazerLogin;
    APP.fazerLogout = fazerLogout;

})();