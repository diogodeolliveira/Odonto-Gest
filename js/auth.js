// ============================================================
// AUTENTICAÇÃO - LOGIN E REGISTRO
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
        loginContainer.style.display = 'flex';
        sistemaPrincipal.style.display = 'none';
        loginForm.style.display = 'block';
        registroForm.style.display = 'none';
        recuperacaoForm.style.display = 'none';
        loginError.style.display = 'none';
        loginSuccess.style.display = 'none';
    }

    function mostrarSistema() {
        loginContainer.style.display = 'none';
        sistemaPrincipal.style.display = 'block';
        if (APP.usuarioAtual) {
            usuarioLogado.innerHTML = `<i class="fas fa-user"></i> ${APP.usuarioAtual.email}`;
        }
        if (typeof APP.carregarPacientes === 'function') {
            APP.carregarPacientes();
        }
    }

    // ============================================================
    // LOGIN
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
        }
    }

    // ============================================================
    // REGISTRO - CORRIGIDO COM LOGS DETALHADOS
    // ============================================================
    async function fazerRegistro() {
        console.log('🟢 Tentando registro...');
        
        const nome = regNome.value.trim();
        const email = regEmail.value.trim();
        const password = regPassword.value.trim();

        console.log('📝 Dados:', { nome, email, password: '***' });

        // Validações
        if (!nome || !email || !password) {
            regError.textContent = '❌ Preencha todos os campos';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            return;
        }

        if (password.length < 6) {
            regError.textContent = '❌ A senha deve ter pelo menos 6 caracteres';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            regError.textContent = '❌ Digite um email válido';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
            return;
        }

        regError.style.display = 'none';

        try {
            console.log('🔄 Enviando para Supabase...');

            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: nome
                    }
                }
            });

            console.log('📩 Resposta do Supabase:', { data, error });

            if (error) {
                console.error('❌ Erro do Supabase:', error);
                
                if (error.message.includes('User already registered')) {
                    regError.textContent = '❌ Este email já está cadastrado. Faça login.';
                } else if (error.message.includes('Database error saving new user')) {
                    regError.textContent = '❌ Erro no banco de dados. Verifique a configuração.';
                } else {
                    regError.textContent = `❌ ${error.message}`;
                }
                regError.style.display = 'block';
                regError.style.color = '#c0392b';
                return;
            }

            // Verifica se o usuário foi criado
            if (!data || !data.user) {
                console.error('❌ Resposta inesperada:', data);
                regError.textContent = '❌ Resposta inesperada do servidor. Tente novamente.';
                regError.style.display = 'block';
                regError.style.color = '#c0392b';
                return;
            }

            // ✅ Sucesso!
            console.log('✅ Registro bem-sucedido!', data.user);

            regError.textContent = '✅ Conta criada com sucesso! Faça login.';
            regError.style.display = 'block';
            regError.style.color = '#2e8b7a';

            // Limpa campos
            regNome.value = '';
            regEmail.value = '';
            regPassword.value = '';

            // Redireciona para login após 2 segundos
            setTimeout(() => {
                registroForm.style.display = 'none';
                loginForm.style.display = 'block';
                regError.style.display = 'none';
                loginEmail.value = email;
                loginPassword.focus();
                if (typeof APP.mostrarToast === 'function') {
                    APP.mostrarToast('✅ Conta criada! Faça login.', '#1a6a4a');
                }
            }, 2000);

        } catch (e) {
            console.error('❌ Erro inesperado no registro:', e);
            regError.textContent = '❌ Erro ao registrar. Tente novamente.';
            regError.style.display = 'block';
            regError.style.color = '#c0392b';
        }
    }

    // ============================================================
    // LOGOUT
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
    // RECUPERAÇÃO DE SENHA
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
                redirectTo: window.location.origin + window.location.pathname + '?reset=true'
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
    // EVENTOS
    // ============================================================
    
    // Login
    if (btnLogin) {
        btnLogin.addEventListener('click', fazerLogin);
    }
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

    // Registro
    if (btnMostrarRegistro) {
        btnMostrarRegistro.addEventListener('click', function() {
            loginForm.style.display = 'none';
            recuperacaoForm.style.display = 'none';
            registroForm.style.display = 'block';
            regError.style.display = 'none';
            regNome.focus();
        });
    }

    if (btnRegistrar) {
        btnRegistrar.addEventListener('click', fazerRegistro);
    }
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
            registroForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // Recuperação de senha
    if (btnEsqueciSenha) {
        btnEsqueciSenha.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            registroForm.style.display = 'none';
            recuperacaoForm.style.display = 'block';
            recuperacaoMensagem.style.display = 'none';
            recuperacaoEmail.focus();
        });
    }

    if (btnEnviarRecuperacao) {
        btnEnviarRecuperacao.addEventListener('click', enviarRecuperacao);
    }
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
            recuperacaoForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }

    // Logout
    if (btnLogout) {
        btnLogout.addEventListener('click', fazerLogout);
    }

    // ============================================================
    // EXPORTA FUNÇÕES
    // ============================================================
    APP.fazerLogin = fazerLogin;
    APP.fazerRegistro = fazerRegistro;
    APP.fazerLogout = fazerLogout;

})();