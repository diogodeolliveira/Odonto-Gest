// ============================================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================================
(function() {

    // Usa o namespace global
    const APP = window.APP;
    const supabase = APP.supabase;
    const CONFIG = APP.CONFIG;

    // ============================================================
    // FUNÇÕES EXPORTADAS PARA APP
    // ============================================================

    APP.testarConexao = async function() {
        try {
            console.log('🔍 Testando conexão...');
            const { data, error } = await supabase.from('pacientes').select('count', { count: 'exact', head: true });
            if (error) throw error;

            const statusConexao = document.getElementById('statusConexao');
            if (statusConexao) {
                statusConexao.className = 'status-online';
                statusConexao.innerHTML = '<i class="fas fa-cloud"></i> Conectado';
            }
            console.log('✅ Conexão OK!');
            return true;
        } catch (error) {
            console.error('❌ Erro de conexão:', error);
            const statusConexao = document.getElementById('statusConexao');
            if (statusConexao) {
                statusConexao.className = 'status-offline';
                statusConexao.innerHTML = '<i class="fas fa-cloud"></i> Offline';
            }
            return false;
        }
    };

    APP.carregarPacientes = async function() {
        try {
            console.log('🔄 Carregando pacientes...');
            const { data, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                APP.pacientes = data;
                APP.salvarDadosLocal();
                APP.mostrarToast(`📥 ${APP.pacientes.length} pacientes carregados!`, '#1a6a4a');
            } else {
                const local = localStorage.getItem(CONFIG.STORAGE_KEY);
                APP.pacientes = local ? JSON.parse(local) : [];
            }

            if (typeof APP.renderizarTabela === 'function') {
                APP.renderizarTabela();
            }
            if (typeof APP.popularSelects === 'function') {
                APP.popularSelects();
            }
            return APP.pacientes;
        } catch (error) {
            console.error('❌ Erro ao carregar:', error);
            const local = localStorage.getItem(CONFIG.STORAGE_KEY);
            APP.pacientes = local ? JSON.parse(local) : [];
            if (typeof APP.renderizarTabela === 'function') {
                APP.renderizarTabela();
            }
            if (typeof APP.popularSelects === 'function') {
                APP.popularSelects();
            }
            APP.mostrarToast('⚠️ Offline - usando dados locais', '#8a6a3a');
            return APP.pacientes;
        }
    };

    APP.salvarDadosLocal = function() {
        try {
            const dados = APP.pacientes || [];
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dados));
            localStorage.setItem(CONFIG.STORAGE_KEY + '_backup', JSON.stringify(dados));
        } catch (e) {
            console.error('Erro ao salvar dados locais:', e);
        }
    };

    APP.enviarParaSupabase = async function(dados) {
        try {
            const { error: deleteError } = await supabase
                .from('pacientes')
                .delete()
                .neq('id', 0);

            if (deleteError) throw deleteError;

            if (dados && dados.length > 0) {
                const { error: insertError } = await supabase
                    .from('pacientes')
                    .insert(dados);

                if (insertError) throw insertError;
            }

            APP.mostrarToast(`📤 ${dados ? dados.length : 0} pacientes enviados!`, '#1a6a4a');
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar:', error);
            APP.mostrarToast('❌ Erro ao sincronizar', '#7a3a3a');
            return false;
        }
    };

    APP.sincronizar = async function() {
        const btnSincronizar = document.getElementById('btnSincronizar');
        if (btnSincronizar) {
            btnSincronizar.classList.add('sincronizando');
            btnSincronizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
        }

        try {
            const conectado = await APP.testarConexao();
            if (!conectado) {
                if (btnSincronizar) {
                    btnSincronizar.classList.remove('sincronizando');
                    btnSincronizar.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
                }
                return;
            }

            const { data: dadosNuvem, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            const local = APP.pacientes || [];

            if (dadosNuvem && dadosNuvem.length > local.length) {
                APP.pacientes = dadosNuvem;
                APP.salvarDadosLocal();
                APP.mostrarToast(`📥 ${APP.pacientes.length} pacientes carregados da nuvem!`, '#1a6a4a');
            } else if (local.length > (dadosNuvem ? dadosNuvem.length : 0)) {
                await APP.enviarParaSupabase(local);
                APP.mostrarToast(`📤 ${local.length} pacientes enviados para a nuvem!`, '#1a6a4a');
            } else if (local.length > 0) {
                if (JSON.stringify(local) !== JSON.stringify(dadosNuvem)) {
                    await APP.enviarParaSupabase(local);
                    APP.mostrarToast('🔄 Dados sincronizados!', '#1a6a4a');
                } else {
                    APP.mostrarToast('✅ Dados já sincronizados!', '#1a6a4a');
                }
            } else {
                APP.mostrarToast('ℹ️ Nenhum dado para sincronizar', '#8a8a3a');
            }

            if (typeof APP.renderizarTabela === 'function') {
                APP.renderizarTabela();
            }
            if (typeof APP.popularSelects === 'function') {
                APP.popularSelects();
            }

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            APP.mostrarToast('❌ Erro ao sincronizar', '#7a3a3a');
        }

        if (btnSincronizar) {
            btnSincronizar.classList.remove('sincronizando');
            btnSincronizar.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
        }
    };

})();
