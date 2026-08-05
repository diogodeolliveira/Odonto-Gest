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
            console.log('✅ Conexão OK!');
            return true;
        } catch (error) {
            console.error('❌ Erro de conexão:', error);
            return false;
        }
    };

    // ============================================================
    // CARREGAR PACIENTES
    // ============================================================
    APP.carregarPacientes = async function() {
        try {
            console.log('🔄 Carregando pacientes...');

            const sessao = localStorage.getItem('odontogest_sessao');
            if (!sessao) {
                console.warn('⚠️ Usuário não autenticado.');
                const local = localStorage.getItem(CONFIG.STORAGE_KEY);
                APP.pacientes = local ? JSON.parse(local) : [];
                if (typeof APP.renderizarTabela === 'function') APP.renderizarTabela();
                if (typeof APP.popularSelects === 'function') APP.popularSelects();
                return APP.pacientes;
            }

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
    // ENVIAR PARA SUPABASE (UPSERT - SEGURO)
    // ============================================================
    APP.enviarParaSupabase = async function(dados) {
        try {
            if (!dados || dados.length === 0) {
                APP.mostrarToast('ℹ️ Nenhum dado para enviar', '#8a8a3a');
                return true;
            }

            const sessao = localStorage.getItem('odontogest_sessao');
            if (!sessao) {
                APP.mostrarToast('⚠️ Faça login para sincronizar', '#8a6a3a');
                return false;
            }

            const dadosComTimestamp = dados.map(p => ({
                ...p,
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('pacientes')
                .upsert(dadosComTimestamp, { onConflict: 'id' });

            if (error) throw error;

            APP.pacientes = dados;
            APP.salvarDadosLocal();

            APP.mostrarToast(`📤 ${dados.length} pacientes sincronizados!`, '#1a6a4a');
            return true;
        } catch (error) {
            console.error('❌ Erro ao enviar:', error);
            APP.mostrarToast('❌ Erro ao sincronizar: ' + error.message, '#7a3a3a');
            return false;
        }
    };

    // ============================================================
    // SINCRONIZAR (CORRIGIDO - COM FILTRO DE DADOS INVÁLIDOS)
    // ============================================================
    APP.sincronizar = async function() {
        const btnSync = document.getElementById('btnSincronizarFlutuante');
        if (btnSync) {
            btnSync.classList.add('sincronizando');
        }

        try {
            const conectado = await APP.testarConexao();
            if (!conectado) {
                if (btnSync) btnSync.classList.remove('sincronizando');
                return;
            }

            const sessao = localStorage.getItem('odontogest_sessao');
            if (!sessao) {
                APP.mostrarToast('⚠️ Faça login para sincronizar', '#8a6a3a');
                if (btnSync) btnSync.classList.remove('sincronizando');
                return;
            }

            const { data: dadosNuvem, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            // ✅ FILTRA PACIENTES INVÁLIDOS
            const local = (APP.pacientes || []).filter(p => p && p.id !== undefined && p.id !== null);
            const nuvem = (dadosNuvem || []).filter(p => p && p.id !== undefined && p.id !== null);

            const dadosNuvemMap = new Map(nuvem.map(p => [p.id, p]));

            // Merge inteligente
            const merged = local.map(p => {
                const nuvemItem = dadosNuvemMap.get(p.id);
                if (nuvemItem && new Date(nuvemItem.updated_at) > new Date(p.updated_at || 0)) {
                    return nuvemItem;
                }
                return p;
            });

            // Adiciona itens que só existem na nuvem
            nuvem.forEach(p => {
                if (!merged.some(m => m.id === p.id)) {
                    merged.push(p);
                }
            });

            // ✅ ORDENAÇÃO COM VERIFICAÇÃO DE SEGURANÇA
            const mergedOrdenado = merged
                .filter(p => p && p.id !== undefined && p.id !== null)
                .sort((a, b) => (a.id || 0) - (b.id || 0));

            const localOrdenado = local
                .filter(p => p && p.id !== undefined && p.id !== null)
                .sort((a, b) => (a.id || 0) - (b.id || 0));

            if (JSON.stringify(mergedOrdenado) !== JSON.stringify(localOrdenado)) {
                APP.pacientes = mergedOrdenado;
                APP.salvarDadosLocal();
                APP.renderizarTabela();
                APP.popularSelects();
                APP.mostrarToast(`✅ ${mergedOrdenado.length} pacientes sincronizados!`, '#1a6a4a');
            } else {
                APP.mostrarToast('✅ Dados já estão sincronizados!', '#1a6a4a');
            }

        } catch (error) {
            console.error('❌ Erro na sincronização:', error);
            APP.mostrarToast('❌ Erro ao sincronizar: ' + error.message, '#7a3a3a');
        }

        if (btnSync) {
            btnSync.classList.remove('sincronizando');
        }
    };

})();
