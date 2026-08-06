// ============================================================
// AUTENTICAÇÃO - LOGIN MANUAL COM SESSION STORAGE
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
    const usuarioLogado = document.getElementById('usuarioLogado');

    // ============================================================
    // GERENCIAMENTO DE SESSÃO - USANDO sessionStorage
    // ============================================================
    
    // sessionStorage: os dados são apagados quando o navegador é fechado
    function salvarSessao(usuario) {
        try {
            sessionStorage.setItem('odontogest_sessao', JSON.stringify(usuario));
            // Também salva timestamp para controle de inatividade
            sessionStorage.setItem('odontogest_ultima_atividade', Date.now().toString());
        } catch (e) {
            console.error('Erro ao salvar sessão:', e);
        }
    }

    function carregarSessao() {
        try {
            const data = sessionStorage.getItem('odontogest_sessao');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    function limparSessao() {
        try {
            sessionStorage.removeItem('odontogest_sessao');
            sessionStorage.removeItem('odontogest_ultima_atividade');
            // Também limpa o localStorage de pacientes para não manter dados órfãos
            localStorage.removeItem(APP.CONFIG?.STORAGE_KEY || 'odontogest_pacientes');
        } catch (e) {
            console.error('Erro ao limpar sessão:', e);
        }
    }

    // ============================================================
    // CONTROLE DE INATIVIDADE
    // ============================================================
    
    const TEMPO_INATIVIDADE = 30 * 60 * 1000; // 30 minutos
    let timeoutInatividade = null;

    function resetarTimeoutInatividade() {
        if (timeoutInatividade) {
            clearTimeout(timeoutInatividade);
        }
        // Atualiza timestamp da última atividade
        sessionStorage.setItem('odontogest_ultima_atividade', Date.now().toString());
        
        timeoutInatividade = setTimeout(() => {
            console.log('⏰ Tempo de inatividade expirado - fazendo logout automático');
            if (APP.usuarioAtual) {
                APP.mostrarToast('⏰ Sessão expirada por inatividade', '#8a6a3a');
                fazerLogout();
            }
        }, TEMPO_INATIVIDADE);
    }

    function registrarAtividade() {
        if (APP.usuarioAtual) {
            resetarTimeoutInatividade();
        }
    }

    // ============================================================
    // VERIFICAR SESSÃO
    // ============================================================
    
    APP.verificarSessao = async function() {
        const sessao = carregarSessao();
        
        if (sessao && sessao.id) {
            // Verifica se a sessão não expirou por inatividade
            const ultimaAtividade = sessionStorage.getItem('odontogest_ultima_atividade');
            if (ultimaAtividade) {
                const tempoDecorrido = Date.now() - parseInt(ultimaAtividade);
                if (tempoDecorrido > TEMPO_INATIVIDADE) {
                    console.log('⏰ Sessão expirada por inatividade');
                    limparSessao();
                    mostrarLogin();
                    return false;
                }
            }

            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('id', sessao.id)
                    .eq('ativo', true)
                    .single();

                // Só derruba a sessão quando temos certeza de que o usuário
                // não existe mais ou foi desativado (código PGRST116 = "no rows
                // found" do PostgREST). Qualquer outro erro (rede instável,
                // RLS temporariamente bloqueando, timeout, etc.) NÃO deve
                // forçar login de novo — mantemos a sessão local, como já
                // fazíamos no catch abaixo. Antes, qualquer erro aqui já
                // deslogava o usuário a cada F5, mesmo com sessão válida.
                if (error && error.code === 'PGRST116') {
                    console.log('🔒 Usuário não encontrado ou inativo - encerrando sessão');
                    limparSessao();
                    mostrarLogin();
                    return false;
                }

                if (error || !data) {
                    console.warn('⚠️ Não foi possível revalidar no Supabase, mantendo sessão local:', error);
                    APP.usuarioAtual = sessao;
                    mostrarSistema();
                    resetarTimeoutInatividade();
                    return true;
                }

                APP.usuarioAtual = data;
                mostrarSistema();
                
                // Inicia o timer de inatividade
                resetarTimeoutInatividade();
                
                return true;
            } catch (e) {
                // Fallback: usa sessão local
                console.warn('⚠️ Erro de rede ao revalidar sessão, mantendo sessão local:', e);
                APP.usuarioAtual = sessao;
                mostrarSistema();
                resetarTimeoutInatividade();
                return true;
            }
        }
        mostrarLogin();
        return false;
    };

    // ============================================================
    // MOSTRAR LOGIN
    // ============================================================
    
    function mostrarLogin() {
        if (loginContainer) loginContainer.style.display = 'flex';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
        
        if (loginUsername) loginUsername.value = '';
        if (loginPassword) loginPassword.value = '';
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
        
        // Limpa timeout de inatividade
        if (timeoutInatividade) {
            clearTimeout(timeoutInatividade);
            timeoutInatividade = null;
        }
    }

    // ============================================================
    // MOSTRAR SISTEMA
    // ============================================================
    
    function mostrarSistema() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'block';

        if (APP.usuarioAtual && usuarioLogado) {
            const nome = APP.escapeHTML(APP.usuarioAtual.nome_completo || APP.usuarioAtual.username);
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${nome}`;
        }

        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
        
        // Inicia o timer de inatividade
        resetarTimeoutInatividade();
        
        // Registra eventos de atividade
        document.addEventListener('click', registrarAtividade);
        document.addEventListener('keydown', registrarAtividade);
        document.addEventListener('scroll', registrarAtividade);
        document.addEventListener('mousemove', registrarAtividade);
    }

    // ============================================================
    // FAZER LOGIN
    // ============================================================
    
    async function fazerLogin() {
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
                loginError.textContent = '❌ Usuário ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            if (usuario.senha !== password) {
                loginError.textContent = '❌ Usuário ou senha incorretos';
                loginError.style.display = 'block';
                return;
            }

            APP.usuarioAtual = usuario;
            salvarSessao(usuario);

            loginSuccess.textContent = '✅ Login realizado com sucesso!';
            loginSuccess.style.display = 'block';

            setTimeout(() => {
                mostrarSistema();
                APP.mostrarToast(`👋 Bem-vindo, ${usuario.nome_completo || usuario.username}!`, '#1a4a58');
            }, 500);

        } catch (e) {
            console.error('Erro no login:', e);
            loginError.textContent = '❌ Erro ao conectar. Tente novamente.';
            loginError.style.display = 'block';
        } finally {
            btnLogin.disabled = false;
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
        }
    }

    // ============================================================
    // FAZER LOGOUT
    // ============================================================
    
    async function fazerLogout() {
        console.log('🟢 Fazendo logout...');
        
        // Remove eventos de atividade
        document.removeEventListener('click', registrarAtividade);
        document.removeEventListener('keydown', registrarAtividade);
        document.removeEventListener('scroll', registrarAtividade);
        document.removeEventListener('mousemove', registrarAtividade);
        
        if (timeoutInatividade) {
            clearTimeout(timeoutInatividade);
            timeoutInatividade = null;
        }
        
        limparSessao();
        APP.usuarioAtual = null;
        APP.pacientes = [];
        
        if (typeof APP.mostrarToast === 'function') {
            APP.mostrarToast('👋 Você saiu do sistema', '#1a4a58');
        }
        
        mostrarLogin();
    }

    // ============================================================
    // CONFIGURAR EVENTOS
    // ============================================================
    
    if (btnLogin) {
        btnLogin.addEventListener('click', fazerLogin);
    }
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

    // ============================================================
    // EXPORTAR FUNÇÕES
    // ============================================================
    
    APP.fazerLogin = fazerLogin;
    APP.fazerLogout = fazerLogout;
    APP.registrarAtividade = registrarAtividade;

    console.log('✅ Auth inicializado com sessionStorage e timeout de inatividade');

})();