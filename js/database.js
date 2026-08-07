// ============================================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================================
(function() {

    const APP = window.APP;
    const supabase = APP.supabase;
    const CONFIG = APP.CONFIG;

    // ============================================================
    // ESCAPE HTML (Anti-XSS)
    // ============================================================
    APP.escapeHTML = function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // ============================================================
    // TESTAR CONEXÃO
    // ============================================================
    APP.testarConexao = async function() {
        try {
            console.log('🔍 Testando conexão...');
            const { error } = await supabase.from('pacientes').select('count', { count: 'exact', head: true });
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

    // ============================================================
    // CARREGAR PACIENTES
    // ============================================================
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

            if (typeof APP.renderizarTabela === 'function') APP.renderizarTabela();
            if (typeof APP.popularSelects === 'function') APP.popularSelects();
            return APP.pacientes;
        } catch (error) {
            console.error('❌ Erro ao carregar:', error);
            const local = localStorage.getItem(CONFIG.STORAGE_KEY);
            APP.pacientes = local ? JSON.parse(local) : [];
            if (typeof APP.renderizarTabela === 'function') APP.renderizarTabela();
            if (typeof APP.popularSelects === 'function') APP.popularSelects();
            APP.mostrarToast('⚠️ Offline - usando dados locais', '#8a6a3a');
            return APP.pacientes;
        }
    };

    // ============================================================
    // SALVAR DADOS LOCALMENTE
    // ============================================================
    APP.salvarDadosLocal = function() {
        try {
            const dados = APP.pacientes || [];
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dados));
            localStorage.setItem(CONFIG.STORAGE_KEY + '_backup', JSON.stringify(dados));
        } catch (e) {
            console.error('Erro ao salvar dados locais:', e);
        }
    };

    // ============================================================
    // ENVIAR PARA SUPABASE (UPSERT)
    // ============================================================
    APP.enviarParaSupabase = async function(dados) {
        try {
            if (!dados || dados.length === 0) {
                APP.mostrarToast('ℹ️ Nenhum dado para enviar', '#8a8a3a');
                return true;
            }

            const dadosComTimestamp = dados.map(p => ({
                ...p,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('pacientes')
                .upsert(dadosComTimestamp, { onConflict: 'id' });

            if (error) throw error;

            APP.mostrarToast(`📤 ${dados.length} pacientes sincronizados!`, '#1a6a4a');
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar:', error);
            APP.mostrarToast('❌ Erro ao sincronizar: ' + error.message, '#7a3a3a');
            return false;
        }
    };

    // ============================================================
    // SINCRONIZAR (MERGE POR TIMESTAMP)
    // ============================================================
    APP.sincronizar = async function() {
        const btnSincronizar = document.getElementById('btnSincronizar');
        if (btnSincronizar) {
            btnSincronizar.classList.add('sincronizando');
            btnSincronizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }

        try {
            const conectado = await APP.testarConexao();
            if (!conectado) {
                if (btnSincronizar) {
                    btnSincronizar.classList.remove('sincronizando');
                    btnSincronizar.innerHTML = '<i class="fas fa-sync"></i>';
                }
                return;
            }

            const { data: dadosNuvem, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            const local = APP.pacientes || [];
            const dadosNuvemMap = new Map(dadosNuvem.map(p => [p.id, p]));

            // Merge inteligente
            const merged = local.map(p => {
                const nuvem = dadosNuvemMap.get(p.id);
                if (nuvem && new Date(nuvem.updated_at) > new Date(p.updated_at || 0)) {
                    return nuvem;
                }
                return p;
            });

            dadosNuvem.forEach(p => {
                if (!merged.some(m => m.id === p.id)) {
                    merged.push(p);
                }
            });

            if (JSON.stringify(merged.sort((a, b) => a.id - b.id)) !== JSON.stringify(local.sort((a, b) => a.id - b.id))) {
                APP.pacientes = merged;
                APP.salvarDadosLocal();
                APP.renderizarTabela();
                APP.popularSelects();
                APP.mostrarToast(`✅ ${merged.length} pacientes sincronizados!`, '#1a6a4a');
            } else {
                APP.mostrarToast('✅ Dados já estão sincronizados!', '#1a6a4a');
            }

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            APP.mostrarToast('❌ Erro ao sincronizar: ' + error.message, '#7a3a3a');
        }

        if (btnSincronizar) {
            btnSincronizar.classList.remove('sincronizando');
            btnSincronizar.innerHTML = '<i class="fas fa-sync"></i>';
        }
    };

})();
