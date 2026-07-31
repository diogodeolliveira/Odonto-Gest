// ============================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================

// Cria um namespace global para todo o sistema
window.APP = window.APP || {};

// Configurações
window.APP.CONFIG = {
    SUPABASE_URL: 'https://cccukpzwbdaycdwmvdyp.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_ygGdsS-kgYQN3KOXfB7pSQ_QknXJgah',
    STORAGE_KEY: 'odontogest_pacientes'
};

// Inicializa o Supabase (APENAS UMA VEZ)
window.APP.supabase = window.supabase.createClient(
    window.APP.CONFIG.SUPABASE_URL,
    window.APP.CONFIG.SUPABASE_ANON_KEY
);

// Mapeamento de status
window.APP.STATUS_MAP = {
    'encaminhado': { label: 'Encaminhado', class: 'status-encaminhado', dot: 'dot-encaminhado', pdfClass: 'status-encaminhado-pdf' },
    'espera': { label: 'Em espera', class: 'status-espera', dot: 'dot-espera', pdfClass: 'status-espera-pdf' },
    'atendimento': { label: 'Em atendimento', class: 'status-atendimento', dot: 'dot-atendimento', pdfClass: 'status-atendimento-pdf' },
    'concluido': { label: 'Concluído', class: 'status-concluido', dot: 'dot-concluido', pdfClass: 'status-concluido-pdf' }
};

window.APP.STATUS_KEYS = ['encaminhado', 'espera', 'atendimento', 'concluido'];

console.log('✅ Configuração carregada!');