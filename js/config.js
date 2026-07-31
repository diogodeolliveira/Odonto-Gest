// ============================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================

// Definição das configurações (tornando global)
window.CONFIG = {
    SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',  // Substitua pela sua URL
    SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_AQUI',          // Substitua pela sua chave
    STORAGE_KEY: 'odontogest_pacientes'
};

// ============================================================
// INICIALIZAÇÃO DO SUPABASE (UMA ÚNICA VEZ)
// ============================================================

// Verifica se o supabase já foi inicializado
if (!window.supabase) {
    window.supabase = window.supabase.createClient(
        window.CONFIG.SUPABASE_URL,
        window.CONFIG.SUPABASE_ANON_KEY
    );
    console.log('✅ Supabase inicializado em config.js');
}

// ============================================================
// MAPEAMENTO STATUS (Global)
// ============================================================

window.STATUS_MAP = {
    'encaminhado': { label: 'Encaminhado', class: 'status-encaminhado', dot: 'dot-encaminhado', pdfClass: 'status-encaminhado-pdf' },
    'espera': { label: 'Em espera', class: 'status-espera', dot: 'dot-espera', pdfClass: 'status-espera-pdf' },
    'atendimento': { label: 'Em atendimento', class: 'status-atendimento', dot: 'dot-atendimento', pdfClass: 'status-atendimento-pdf' },
    'concluido': { label: 'Concluído', class: 'status-concluido', dot: 'dot-concluido', pdfClass: 'status-concluido-pdf' }
};

window.STATUS_KEYS = ['encaminhado', 'espera', 'atendimento', 'concluido'];

console.log('✅ Configuração carregada!');
console.log('🔗 Supabase URL:', window.CONFIG.SUPABASE_URL);