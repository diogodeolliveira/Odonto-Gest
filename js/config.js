// ============================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================
const CONFIG = {
    SUPABASE_URL: 'https://SEU_PROJETO.supabase.co',
    SUPABASE_ANON_KEY: 'SUA_CHAVE_ANON_AQUI',
    STORAGE_KEY: 'odontogest_pacientes'
};

// Inicializa o Supabase
const supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ============================================================
// MAPEAMENTO STATUS
// ============================================================
const STATUS_MAP = {
    'encaminhado': { label: 'Encaminhado', class: 'status-encaminhado', dot: 'dot-encaminhado', pdfClass: 'status-encaminhado-pdf' },
    'espera': { label: 'Em espera', class: 'status-espera', dot: 'dot-espera', pdfClass: 'status-espera-pdf' },
    'atendimento': { label: 'Em atendimento', class: 'status-atendimento', dot: 'dot-atendimento', pdfClass: 'status-atendimento-pdf' },
    'concluido': { label: 'Concluído', class: 'status-concluido', dot: 'dot-concluido', pdfClass: 'status-concluido-pdf' }
};
const STATUS_KEYS = ['encaminhado', 'espera', 'atendimento', 'concluido'];