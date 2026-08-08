// ============================================================
// AUTENTICAÇÃO - LOGIN VIA TABELA "usuarios" (SISTEMA FECHADO)
// ============================================================
// Não usa o Supabase Auth (signInWithPassword). O login é
// validado consultando diretamente a tabela `usuarios`:
//   id, username, senha, nome_completo, perfil, ativo
//
// ⚠️ IMPORTANTE (segurança):
// A tabela `usuarios` é lida com a chave anônima do Supabase,
// então é preciso existir uma policy de RLS liberando SELECT
// nessa tabela para o role "anon" (Authentication → Policies).
// Sem isso, a consulta abaixo sempre retornará vazio/erro.
// Além disso, a senha está sendo comparada em texto puro — para
// um sistema fechado de uso interno isso já resolve, mas não é
// uma prática segura para produção real.
(function() {

    const APP = window.APP;
    const supabase = APP.supabase;

    // Chave usada no localStorage para manter o login entre acessos
    const LOGIN_STORAGE_KEY = 'odontogest_usuario';

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
    // VERIFICAÇÃO DE SESSÃO (LOCAL — usuário salvo após login)
    // ============================================================
    APP.verificarSessao = async function() {
        try {
            const salvo = localStorage.getItem(LOGIN_STORAGE_KEY);
            if (salvo) {
                APP.usuarioAtual = JSON.parse(salvo);
                mostrarSistema();
                return true;
            }
        } catch (e) {
            console.warn('⚠️ Sessão local inválida, removendo.', e);
            localStorage.removeItem(LOGIN_STORAGE_KEY);
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
            const nome = APP.usuarioAtual.nome_completo || APP.usuarioAtual.username || 'Usuário';
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${APP.escapeHTML ? APP.escapeHTML(nome) : nome}`;
        }
        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
        // Garante que busca, odontograma, botões (Novo, Sincronizar, PDF,
        // Exportar, Importar, filtros, menu "⋮" etc.) e a sincronização
        // automática sejam configurados tanto no carregamento com sessão
        // já salva quanto imediatamente após um login novo — sem precisar
        // de F5.
        if (typeof APP.finalizarLogin === 'function') {
            APP.finalizarLogin();
        }
    }

    // ============================================================
    // FUNÇÃO DE LOGIN — CONSULTA A TABELA "usuarios"
    // ============================================================
    async function fazerLogin() {
        console.log('🟢 Tentando login...');
        const username = loginEmail.value.trim();
        const senha = loginPassword.value.trim();

        if (!username || !senha) {
            loginError.textContent = '❌ Preencha usuário e senha';
            loginError.style.display = 'block';
            return;
        }

        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        btnLogin.disabled = true;
        const textoOriginal = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            const { data, error } = await supabase
                .from('usuarios')
                .select('id, username, nome_completo, perfil, ativo')
                .eq('username', username)
                .eq('senha', senha)
                .eq('ativo', true)
                .maybeSingle();

            if (error) {
                console.error('❌ Erro ao consultar usuarios:', error);
                loginError.textContent = '❌ Erro ao conectar. Verifique a permissão de leitura (RLS) da tabela usuarios.';
                loginError.style.display = 'block';
                return;
            }

            if (!data) {
                console.warn('❌ Usuário/senha não encontrados ou usuário inativo');
                loginError.textContent = '❌ Usuário ou senha inválidos';
                loginError.style.display = 'block';
                return;
            }

            console.log('✅ Login bem-sucedido!', data);
            APP.usuarioAtual = data;
            localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(data));

            loginSuccess.textContent = '✅ Login realizado com sucesso!';
            loginSuccess.style.display = 'block';

            setTimeout(() => {
                mostrarSistema();
            }, 400);

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
