// ============================================================
// FUNÇÕES DE BANCO DE DADOS
// ============================================================

// Carrega pacientes do Supabase
async function carregarPacientes() {
    try {
        const { data, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
            pacientes = data;
            salvarDadosLocal();
            mostrarToast(`📥 ${pacientes.length} pacientes carregados da nuvem!`, '#1a6a4a');
        } else {
            const local = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (local) {
                pacientes = JSON.parse(local);
                await enviarParaSupabase(pacientes);
            } else {
                pacientes = [];
            }
        }

        renderizarTabela();
        popularSelects();
        return pacientes;
    } catch (error) {
        console.error('Erro ao carregar do Supabase:', error);
        const local = localStorage.getItem(CONFIG.STORAGE_KEY);
        pacientes = local ? JSON.parse(local) : [];
        renderizarTabela();
        popularSelects();
        mostrarToast('⚠️ Offline - usando dados locais', '#8a6a3a');
        return pacientes;
    }
}

// Envia dados para o Supabase
async function enviarParaSupabase(dados) {
    try {
        const { error: deleteError } = await supabase
            .from('pacientes')
            .delete()
            .neq('id', 0);

        if (deleteError) throw deleteError;

        if (dados.length > 0) {
            const { error: insertError } = await supabase
                .from('pacientes')
                .insert(dados);

            if (insertError) throw insertError;
        }

        mostrarToast(`📤 ${dados.length} pacientes enviados para a nuvem!`, '#1a6a4a');
        return true;
    } catch (error) {
        console.error('Erro ao enviar para Supabase:', error);
        mostrarToast('❌ Erro ao sincronizar com a nuvem', '#7a3a3a');
        return false;
    }
}

// Salva dados localmente
function salvarDadosLocal() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(pacientes));
        localStorage.setItem(CONFIG.STORAGE_KEY + '_backup', JSON.stringify(pacientes));
    } catch (e) {
        console.error('Erro ao salvar dados locais:', e);
    }
}

// Testa conexão com Supabase
async function testarConexao() {
    try {
        const { data, error } = await supabase.from('pacientes').select('count', { count: 'exact', head: true });
        if (error) throw error;
        statusConexao.className = 'status-online';
        statusConexao.innerHTML = '<i class="fas fa-cloud"></i> Conectado';
        return true;
    } catch (error) {
        console.error('Erro de conexão:', error);
        statusConexao.className = 'status-offline';
        statusConexao.innerHTML = '<i class="fas fa-cloud"></i> Offline';
        return false;
    }
}

// Sincroniza dados entre local e nuvem
async function sincronizar() {
    btnSincronizar.classList.add('sincronizando');
    btnSincronizar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sincronizando...';

    try {
        const conectado = await testarConexao();
        if (!conectado) {
            mostrarToast('❌ Sem conexão com a nuvem', '#7a3a3a');
            btnSincronizar.classList.remove('sincronizando');
            btnSincronizar.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
            return;
        }

        const { data: dadosNuvem, error } = await supabase
            .from('pacientes')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        const dadosLocal = localStorage.getItem(CONFIG.STORAGE_KEY);
        const local = dadosLocal ? JSON.parse(dadosLocal) : [];

        if (dadosNuvem && dadosNuvem.length > local.length) {
            pacientes = dadosNuvem;
            salvarDadosLocal();
            mostrarToast(`📥 ${pacientes.length} pacientes carregados da nuvem!`, '#1a6a4a');
        } else if (local.length > (dadosNuvem ? dadosNuvem.length : 0)) {
            await enviarParaSupabase(local);
            pacientes = local;
            mostrarToast(`📤 ${pacientes.length} pacientes enviados para a nuvem!`, '#1a6a4a');
        } else if (local.length > 0) {
            if (JSON.stringify(local) !== JSON.stringify(dadosNuvem)) {
                await enviarParaSupabase(local);
                mostrarToast('🔄 Dados sincronizados com a nuvem!', '#1a6a4a');
            } else {
                mostrarToast('✅ Dados já estão sincronizados!', '#1a6a4a');
            }
            pacientes = local;
        } else {
            mostrarToast('ℹ️ Nenhum dado para sincronizar', '#8a8a3a');
        }

        renderizarTabela();
        popularSelects();

    } catch (error) {
        console.error('Erro na sincronização:', error);
        mostrarToast('❌ Erro ao sincronizar', '#7a3a3a');
    }

    btnSincronizar.classList.remove('sincronizando');
    btnSincronizar.innerHTML = '<i class="fas fa-sync"></i> Sincronizar';
}