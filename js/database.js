// ============================================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================================

// ✅ NÃO redeclara o supabase - usa o que já existe no window
const CONFIG = window.CONFIG;
// const supabase = window.supabase;  // ❌ REMOVA ESTA LINHA

// ============================================================
// FUNÇÕES
// ============================================================

// Testa conexão com Supabase
async function testarConexao() {
    try {
        console.log('🔍 Testando conexão...');
        
        // ✅ Usa o supabase do window
        if (!window.supabase) {
            throw new Error('Supabase não inicializado');
        }
        
        const { data, error } = await window.supabase
            .from('pacientes')
            .select('count', { count: 'exact', head: true });
            
        if (error) throw error;
        
        const statusConexao = document.getElementById('statusConexao');
        if (statusConexao) {
            statusConexao.className = 'status-online';
            statusConexao.innerHTML = '<i class="fas fa-cloud"></i> Conectado';
        }
        
        console.log('✅ Conexão com Supabase OK!');
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
}

// Carrega pacientes do Supabase
async function carregarPacientes() {
    try {
        console.log('🔄 Carregando pacientes...');
        
        if (!window.supabase) {
            throw new Error('Supabase não inicializado');
        }
        
        const { data, error } = await window.supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            window.pacientes = data;
            salvarDadosLocal();
            mostrarToast(`📥 ${window.pacientes.length} pacientes carregados!`, '#1a6a4a');
        } else {
            const local = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (local) {
                window.pacientes = JSON.parse(local);
            } else {
                window.pacientes = [];
            }
        }

        if (typeof renderizarTabela === 'function') {
            renderizarTabela();
        }
        if (typeof popularSelects === 'function') {
            popularSelects();
        }
        return window.pacientes;
    } catch (error) {
        console.error('❌ Erro ao carregar:', error);
        const local = localStorage.getItem(CONFIG.STORAGE_KEY);
        window.pacientes = local ? JSON.parse(local) : [];
        if (typeof renderizarTabela === 'function') {
            renderizarTabela();
        }
        if (typeof popularSelects === 'function') {
            popularSelects();
        }
        mostrarToast('⚠️ Offline - usando dados locais', '#8a6a3a');
        return window.pacientes;
    }
}

// Salva dados localmente
function salvarDadosLocal() {
    try {
        const dados = window.pacientes || [];
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(dados));
        localStorage.setItem(CONFIG.STORAGE_KEY + '_backup', JSON.stringify(dados));
    } catch (e) {
        console.error('Erro ao salvar dados locais:', e);
    }
}

// Envia dados para o Supabase
async function enviarParaSupabase(dados) {
    try {
        if (!window.supabase) {
            throw new Error('Supabase não inicializado');
        }
        
        const { error: deleteError } = await window.supabase
            .from('pacientes')
            .delete()
            .neq('id', 0);

        if (deleteError) throw deleteError;

        if (dados && dados.length > 0) {
            const { error: insertError } = await window.supabase
                .from('pacientes')
                .insert(dados);

            if (insertError) throw insertError;
        }

        mostrarToast(`📤 ${dados ? dados.length : 0} pacientes enviados para a nuvem!`, '#1a6a4a');
        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar:', error);
        mostrarToast('❌ Erro ao sincronizar com a nuvem', '#7a3a3a');
        return false;
    }
}

// Sincroniza dados entre local e nuvem
async function sincronizar() {
    const btnSincronizar = document.getElementById('btnSincronizar');
    if (btnSincronizar) {
        btnSincronizar.classList.add('sincronizando');
        btnSincronizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';
    }

    try {
        const conectado = await testarConexao();
        if (!conectado) {
            if (btnSincronizar) {
                btnSincronizar.classList.remove('sincronizando');
                btnSincronizar.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
            }
            return;
        }

        const { data: dadosNuvem, error } = await window.supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        const local = window.pacientes || [];

        if (dadosNuvem && dadosNuvem.length > local.length) {
            window.pacientes = dadosNuvem;
            salvarDadosLocal();
            mostrarToast(`📥 ${window.pacientes.length} pacientes carregados da nuvem!`, '#1a6a4a');
        } else if (local.length > (dadosNuvem ? dadosNuvem.length : 0)) {
            await enviarParaSupabase(local);
            mostrarToast(`📤 ${local.length} pacientes enviados para a nuvem!`, '#1a6a4a');
        } else if (local.length > 0) {
            if (JSON.stringify(local) !== JSON.stringify(dadosNuvem)) {
                await enviarParaSupabase(local);
                mostrarToast('🔄 Dados sincronizados com a nuvem!', '#1a6a4a');
            } else {
                mostrarToast('✅ Dados já estão sincronizados!', '#1a6a4a');
            }
        } else {
            mostrarToast('ℹ️ Nenhum dado para sincronizar', '#8a8a3a');
        }

        if (typeof renderizarTabela === 'function') {
            renderizarTabela();
        }
        if (typeof popularSelects === 'function') {
            popularSelects();
        }

    } catch (error) {
        console.error('❌ Erro na sincronização:', error);
        mostrarToast('❌ Erro ao sincronizar', '#7a3a3a');
    }

    if (btnSincronizar) {
        btnSincronizar.classList.remove('sincronizando');
        btnSincronizar.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
    }
}

// ============================================================
// EXPORTA AS FUNÇÕES PARA O ESCOPO GLOBAL
// ============================================================
window.testarConexao = testarConexao;
window.carregarPacientes = carregarPacientes;
window.salvarDadosLocal = salvarDadosLocal;
window.enviarParaSupabase = enviarParaSupabase;
window.sincronizar = sincronizar;