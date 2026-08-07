// ============================================================
// AUTENTICAÇÃO - LOGIN, REGISTRO E RECUPERAÇÃO DE SENHA
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
    const registroForm = document.getElementById('registroForm');
    const recuperacaoForm = document.getElementById('recuperacaoForm');
    const novaSenhaForm = document.getElementById('novaSenhaForm');

    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const btnLogin = document.getElementById('btnLogin');
    const loginError = document.getElementById('loginError');
    const loginSuccess = document.getElementById('loginSuccess');

    const regNome = document.getElementById('regNome');
    const regEmail = document.getElementById('regEmail');
    const regPassword = document.getElementById('regPassword');
    const btnRegistrar = document.getElementById('btnRegistrar');
    const regError = document.getElementById('regError');

    const btnMostrarRegistro = document.getElementById('btnMostrarRegistro');
    const btnVoltarLogin = document.getElementById('btnVoltarLogin');

    const btnEsqueciSenha = document.getElementById('btnEsqueciSenha');
    const btnVoltarLoginRecuperacao = document.getElementById('btnVoltarLoginRecuperacao');
    const recuperacaoEmail = document.getElementById('recuperacaoEmail');
    const btnEnviarRecuperacao = document.getElementById('btnEnviarRecuperacao');
    const recuperacaoMensagem = document.getElementById('recuperacaoMensagem');

    const novaSenha = document.getElementById('novaSenha');
    const novaSenhaConfirmar = document.getElementById('novaSenhaConfirmar');
    const btnSalvarNovaSenha = document.getElementById('btnSalvarNovaSenha');
    const novaSenhaError = document.getElementById('novaSenhaError');

    const btnLogout = document.getElementById('btnLogout');
    const usuarioLogado = document.getElementById('usuarioLogado');

    // ============================================================
    // FORMULÁRIOS DE TELA DE LOGIN (helper)
    // ============================================================
    function esconderTodosFormularios() {
        if (loginForm) loginForm.style.display = 'none';
        if (registroForm) registroForm.style.display = 'none';
        if (recuperacaoForm) recuperacaoForm.style.display = 'none';
        if (novaSenhaForm) novaSenhaForm.style.display = 'none';
    }

    // ============================================================
    // VERIFICAÇÃO DE SESSÃO
    // ============================================================
    APP.verificarSessao = async function() {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                APP.usuarioAtual = session.user;
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

    function mostrarLogin() {
        if (loginContainer) loginContainer.style.display = 'flex';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'none';
        esconderTodosFormularios();
        if (loginForm) loginForm.style.display = 'block';
        if (loginError) loginError.style.display = 'none';
        if (loginSuccess) loginSuccess.style.display = 'none';
    }

    function mostrarSistema() {
        if (loginContainer) loginContainer.style.display = 'none';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'block';
        if (APP.usuarioAtual && usuarioLogado) {
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${APP.escapeHTML ? APP.escapeHTML(APP.usuarioAtual.email) : APP.usuarioAtual.email}`;
        }
        if (typeof APP.popularStatusSelects === 'function') {
            APP.popularStatusSelects();
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
    }

    // Mostra a tela de "defina sua nova senha", usada quando o link
    // de recuperação de e-mail é aberto (evento PASSWORD_RECOVERY).
    function mostrarNovaSenha() {
        if (loginContainer) loginContainer.style.display = 'flex';
        if (sistemaPrincipal) sistemaPrincipal.style.display = 'none';
        esconderTodosFormularios();
        if (novaSenhaForm) novaSenhaForm.style.display = 'block';
        if (novaSenhaError) novaSenhaError.style.display = 'none';
    }

    // ============================================================
    // REAGE A MUDANÇAS DE SESSÃO (login em outra aba, link de
    // recuperação de senha clicado, expiração, etc.)
    // ============================================================
    supabase.auth.onAuthStateChange((event, session) => {
        console.log('🔔 Evento de auth:', event);

        if (event === 'PASSWORD_RECOVERY') {
            // O usuário clicou no link do e-mail de recuperação.
            // O Supabase já criou uma sessão temporária; pedimos a
            // nova senha antes de liberar o sistema.
            mostrarNovaSenha();
            return;
        }

        if (event === 'SIGNED_OUT') {
            APP.usuarioAtual = null;
            mostrarLogin();
        }
    });

    // ============================================================
    // FUNÇÃO DE LOGIN
    // ============================================================
    async function fazerLogin() {
        console.log('🟢 Tentando login...');
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();

        if (!email || !password) {
            loginError.textContent = '❌ Preencha email e senha';
            loginError.style.display = 'block';
            return;
        }

        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
        btnLogin.disabled = true;
        const textoOriginal = btnLogin.innerHTML;
        btnLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) {
                console.error('❌ Erro no login:', error);
                loginError.textContent = `❌ ${error.message}`;
                loginError.style.display = 'block';
                return;
            }

            console.log('✅ Login bem-sucedido!', data.user);
            APP.usuarioAtual = data.user;
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
    // FUNÇÃO DE REGISTRO
    // ============================================================
    async function fazerRegistro() {
        console.log('🟢 Tentando registro...');

        const nome = regNome.value.trim();
        const email = regEmail.value.trim();
        const password = regPassword.value.trim();

        console.log('📝 Dados:', { nome, email, password: '***' });

        // ============================================================
        // VALIDAÇÕES ESPECÍFICAS
        // ============================================================
        if (!nome) {
            regError.textContent = '❌ Digite seu nome completo';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            regNome.focus();
            return;
        }

        if (!email) {
            regError.textContent = '❌ Digite seu email';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            regEmail.focus();
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            regError.textContent = '❌ Digite um email válido (ex: usuario@email.com)';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            regEmail.focus();
            return;
        }

        if (!password) {
            regError.textContent = '❌ Digite sua senha';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            regPassword.focus();
            return;
        }

        if (password.length < 6) {
            regError.textContent = '❌ A senha deve ter pelo menos 6 caracteres';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            regPassword.focus();
            return;
        }

        regError.style.display = 'none';
        btnRegistrar.disabled = true;
        const textoOriginal = btnRegistrar.innerHTML;
        btnRegistrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando conta...';

        try {
            console.log('🔄 Enviando para Supabase...');

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: nome
                    },
                    emailRedirectTo: window.location.origin + window.location.pathname
                }
            });

            console.log('📩 Resposta:', { data, error });

            if (error) {
                console.error('❌ Erro:', error);

                if (error.message.includes('User already registered')) {
                    regError.textContent = '❌ Este email já está cadastrado. Faça login.';
                } else if (error.message.includes('captcha') || error.message.includes('no captcha_token')) {
                    regError.textContent = '❌ Proteção CAPTCHA ativada no Supabase. Desative em Authentication → Settings, ou configure um provedor de captcha.';
                } else if (error.message.includes('Database error saving new user')) {
                    regError.textContent = '❌ Erro no banco ao criar o usuário. Verifique os triggers da tabela auth.users no Supabase.';
                } else if (error.message.toLowerCase().includes('rate limit')) {
                    regError.textContent = '❌ Muitas tentativas em pouco tempo. Aguarde alguns minutos.';
                } else {
                    regError.textContent = `❌ ${error.message}`;
                }
                regError.style.display = 'block';
                regError.style.color = '#c0392b';
                return;
            }

            if (!data || !data.user) {
                console.error('❌ Resposta inesperada:', data);
                regError.textContent = '❌ Resposta inesperada do servidor. Tente novamente.';
                regError.style.display = 'block';
                regError.style.color = '#c0392b';
                return;
            }

            // Se a confirmação de e-mail estiver ativada no Supabase,
            // data.session vem nulo — o usuário precisa confirmar o
            // e-mail antes de conseguir logar.
            const precisaConfirmarEmail = !data.session;

            console.log('✅ Registro bem-sucedido!', data.user);

            regError.textContent = precisaConfirmarEmail
                ? '✅ Conta criada! Verifique seu e-mail para confirmar antes de entrar.'
                : '✅ Conta criada com sucesso! Faça login.';
            regError.style.display = 'block';
            regError.style.color = '#2e8b7a';

            regNome.value = '';
            regEmail.value = '';
            regPassword.value = '';

            setTimeout(() => {
                registroForm.style.display = 'none';
                loginForm.style.display = 'block';
                regError.style.display = 'none';
                loginEmail.value = email;
                loginPassword.focus();
                if (typeof APP.mostrarToast === 'function') {
                    APP.mostrarToast(
                        precisaConfirmarEmail ? '📧 Confirme seu e-mail para continuar' : '✅ Conta criada! Faça login.',
                        '#1a6a4a'
                    );
                }
            }, 2500);

        } catch (e) {
            console.error('❌ Erro inesperado:', e);
            regError.textContent = '❌ Erro ao registrar. Tente novamente.';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
        } finally {
            btnRegistrar.disabled = false;
            btnRegistrar.innerHTML = textoOriginal;
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
            APP.pacientes = [];
            if (typeof APP.mostrarToast === 'function') {
                APP.mostrarToast('👋 Você saiu do sistema', '#1a4a58');
            }
            mostrarLogin();
        }
    }

    // ============================================================
    // RECUPERAÇÃO DE SENHA — passo 1: enviar o link por e-mail
    // ============================================================
    async function enviarRecuperacao() {
        const email = recuperacaoEmail.value.trim();

        if (!email) {
            recuperacaoMensagem.style.display = 'block';
            recuperacaoMensagem.style.color = '#c0392b';
            recuperacaoMensagem.textContent = '❌ Digite seu email';
            return;
        }

        try {
            btnEnviarRecuperacao.disabled = true;
            btnEnviarRecuperacao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + window.location.pathname
            });

            if (error) throw error;

            recuperacaoMensagem.style.display = 'block';
            recuperacaoMensagem.style.color = '#2e8b7a';
            recuperacaoMensagem.textContent = '✅ Link de recuperação enviado para ' + email;
            recuperacaoEmail.value = '';

        } catch (error) {
            console.error('❌ Erro na recuperação:', error);
            recuperacaoMensagem.style.display = 'block';
            recuperacaoMensagem.style.color = '#c0392b';
            recuperacaoMensagem.textContent = '❌ Erro: ' + error.message;
        } finally {
            btnEnviarRecuperacao.disabled = false;
            btnEnviarRecuperacao.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar link';
        }
    }

    // ============================================================
    // RECUPERAÇÃO DE SENHA — passo 2: definir a nova senha
    // (chamada depois que o evento PASSWORD_RECOVERY dispara)
    // ============================================================
    async function salvarNovaSenha() {
        const senha1 = novaSenha.value.trim();
        const senha2 = novaSenhaConfirmar.value.trim();

        if (!senha1 || senha1.length < 6) {
            novaSenhaError.textContent = '❌ A senha deve ter pelo menos 6 caracteres';
            novaSenhaError.style.display = 'block';
            novaSenhaError.style.color = '#c0392b';
            novaSenha.focus();
            return;
        }

        if (senha1 !== senha2) {
            novaSenhaError.textContent = '❌ As senhas não coincidem';
            novaSenhaError.style.display = 'block';
            novaSenhaError.style.color = '#c0392b';
            novaSenhaConfirmar.focus();
            return;
        }

        novaSenhaError.style.display = 'none';
        btnSalvarNovaSenha.disabled = true;
        const textoOriginal = btnSalvarNovaSenha.innerHTML;
        btnSalvarNovaSenha.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            const { error } = await supabase.auth.updateUser({ password: senha1 });
            if (error) throw error;

            novaSenhaError.textContent = '✅ Senha atualizada! Entrando...';
            novaSenhaError.style.display = 'block';
            novaSenhaError.style.color = '#2e8b7a';

            novaSenha.value = '';
            novaSenhaConfirmar.value = '';

            setTimeout(() => {
                mostrarSistema();
            }, 1000);

        } catch (error) {
            console.error('❌ Erro ao atualizar senha:', error);
            novaSenhaError.textContent = '❌ Erro: ' + error.message;
            novaSenhaError.style.display = 'block';
            novaSenhaError.style.color = '#c0392b';
        } finally {
            btnSalvarNovaSenha.disabled = false;
            btnSalvarNovaSenha.innerHTML = textoOriginal;
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
    if (loginEmail) {
        loginEmail.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') fazerLogin();
        });
    }

    if (btnMostrarRegistro) {
        btnMostrarRegistro.addEventListener('click', function() {
            esconderTodosFormularios();
            registroForm.style.display = 'block';
            regError.style.display = 'none';
            regNome.focus();
        });
    }

    if (btnRegistrar) btnRegistrar.addEventListener('click', fazerRegistro);
    if (regPassword) {
        regPassword.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                fazerRegistro();
            }
        });
    }

    if (btnVoltarLogin) {
        btnVoltarLogin.addEventListener('click', function() {
            esconderTodosFormularios();
            loginForm.style.display = 'block';
        });
    }

    if (btnEsqueciSenha) {
        btnEsqueciSenha.addEventListener('click', function(e) {
            e.preventDefault();
            esconderTodosFormularios();
            recuperacaoForm.style.display = 'block';
            recuperacaoMensagem.style.display = 'none';
            recuperacaoEmail.focus();
        });
    }

    if (btnEnviarRecuperacao) btnEnviarRecuperacao.addEventListener('click', enviarRecuperacao);
    if (recuperacaoEmail) {
        recuperacaoEmail.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                enviarRecuperacao();
            }
        });
    }

    if (btnVoltarLoginRecuperacao) {
        btnVoltarLoginRecuperacao.addEventListener('click', function() {
            esconderTodosFormularios();
            loginForm.style.display = 'block';
        });
    }

    if (btnSalvarNovaSenha) btnSalvarNovaSenha.addEventListener('click', salvarNovaSenha);
    if (novaSenhaConfirmar) {
        novaSenhaConfirmar.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                salvarNovaSenha();
            }
        });
    }

    if (btnLogout) btnLogout.addEventListener('click', fazerLogout);

    // ============================================================
    // EXPORTA FUNÇÕES
    // ============================================================
    APP.fazerLogin = fazerLogin;
    APP.fazerRegistro = fazerRegistro;
    APP.fazerLogout = fazerLogout;
    APP.salvarNovaSenha = salvarNovaSenha;

})();
