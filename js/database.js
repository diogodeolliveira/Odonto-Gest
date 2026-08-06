// ============================================================
// BANCO DE DADOS - OPERAÇÕES
// ============================================================
(function() {

    const APP = window.APP;
    const supabase = APP.supabase;
    const CONFIG = APP.CONFIG;

    // ============================================================
    // ESCAPE HTML
    // ============================================================
    APP.escapeHTML = function(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    // ============================================================
    // SANITIZAR PACIENTES
    // ============================================================
    APP.sanitizarPacientes = function(arr) {
        return (Array.isArray(arr) ? arr : [])
            .filter(p => p && typeof p === 'object' && p.nome && p.nome.trim() !== '');
    };

    // ============================================================
    // CARREGAR PACIENTES
    // ============================================================
    APP.carregarPacientes = async function() {
        try {
            const sessao = localStorage.getItem('odontogest_sessao');
            if (!sessao) {
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

            if (error) {
                console.error('Erro Supabase:', error);
                const local = localStorage.getItem(CONFIG.STORAGE_KEY);
                APP.pacientes = local ? JSON.parse(local) : [];
                if (typeof APP.renderizarTabela === 'function') APP.renderizarTabela();
                if (typeof APP.popularSelects === 'function') APP.popularSelects();
                APP.mostrarToast('⚠️ Usando dados locais', '#8a6a3a');
                return APP.pacientes;
            }

            const dadosValidos = (data || []).filter(p => p && p.nome);
            
            if (dadosValidos.length > 0) {
                APP.pacientes = dadosValidos;
                APP.salvarDadosLocal();
                APP.mostrarToast(`📥 ${APP.pacientes.length} pacientes carregados`, '#1a6a4a');
            } else {
                const local = localStorage.getItem(CONFIG.STORAGE_KEY);
                APP.pacientes = local ? JSON.parse(local) : [];
                if (APP.pacientes.length > 0) {
                    APP.mostrarToast(`📥 ${APP.pacientes.length} pacientes do cache`, '#1a6a4a');
                }
            }

            if (typeof APP.renderizarTabela === 'function') APP.renderizarTabela();
            if (typeof APP.popularSelects === 'function') APP.popularSelects();
            return APP.pacientes;

        } catch (error) {
            console.error('Erro ao carregar:', error);
            const local = localStorage.getItem(CONFIG.STORAGE_KEY);
            APP.pacientes = local ? JSON.parse(local) : [];
            if (typeof APP.renderizarTabela === 'function') APP.renderizarTabela();
            if (typeof APP.popularSelects === 'function') APP.popularSelects();
            APP.mostrarToast('⚠️ Offline - dados locais', '#8a6a3a');
            return APP.pacientes;
        }
    };

    // ============================================================
    // SALVAR DADOS LOCAL
    // ============================================================
    APP.salvarDadosLocal = function() {
        try {
            const dados = APP.sanitizarPacientes(APP.pacientes || []);
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dados));
        } catch (e) {
            console.error('Erro ao salvar local:', e);
        }
    };

    // ============================================================
    // SINCRONIZAR
    // ============================================================
    APP.sincronizar = async function() {
        const btnSync = document.getElementById('btnSincronizarFlutuante');
        if (btnSync) btnSync.classList.add('sincronizando');

        try {
            const sessao = localStorage.getItem('odontogest_sessao');
            if (!sessao) {
                APP.mostrarToast('⚠️ Faça login para sincronizar', '#8a6a3a');
                if (btnSync) btnSync.classList.remove('sincronizando');
                return;
            }

            const { data: nuvem, error } = await supabase
                .from('pacientes')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            const localValidos = APP.sanitizarPacientes(APP.pacientes || []);
            const nuvemValidos = (nuvem || []).filter(p => p && p.nome);

            const nuvemMap = new Map(nuvemValidos.map(p => [p.id, p]));

            const merged = localValidos.map(p => {
                const nuvemItem = nuvemMap.get(p.id);
                if (nuvemItem) {
                    const localDate = p.updated_at ? new Date(p.updated_at) : new Date(0);
                    const nuvemDate = nuvemItem.updated_at ? new Date(nuvemItem.updated_at) : new Date(0);
                    return nuvemDate > localDate ? nuvemItem : p;
                }
                return p;
            });

            nuvemValidos.forEach(p => {
                if (!merged.some(m => m.id === p.id)) {
                    merged.push(p);
                }
            });

            const mergedOrdenado = merged
                .filter(p => p && p.id)
                .sort((a, b) => a.id - b.id);

            if (JSON.stringify(mergedOrdenado) !== JSON.stringify(localValidos)) {
                APP.pacientes = mergedOrdenado;
                APP.salvarDadosLocal();
                APP.renderizarTabela();
                APP.popularSelects();
                APP.mostrarToast(`✅ ${mergedOrdenado.length} pacientes sincronizados`, '#1a6a4a');
            } else {
                APP.mostrarToast('✅ Dados sincronizados', '#1a6a4a');
            }

        } catch (error) {
            console.error('Erro na sincronização:', error);
            APP.mostrarToast('❌ Erro ao sincronizar', '#7a3a3a');
        }

        if (btnSync) btnSync.classList.remove('sincronizando');
    };

})();