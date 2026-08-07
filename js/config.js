// ============================================================
// CONFIGURAÇÃO SUPABASE
// ============================================================
(function() {

    // Cria o namespace global
    window.APP = window.APP || {};

    // ============================================================
    // CONFIGURAÇÕES — SUBSTITUA PELAS SUAS
    // ============================================================
    // ⚠️ IMPORTANTE: os valores abaixo são placeholders. Se o arquivo
    // publicado ainda tiver 'SEU_PROJETO' ou 'SUA_CHAVE_ANON_AQUI',
    // NENHUMA chamada ao Supabase vai funcionar (login, registro,
    // carregar pacientes) — e o navegador costuma mostrar isso como
    // um erro de CORS, mesmo o problema real sendo a URL/chave errada.
    //
    // Onde pegar os valores reais:
    // Painel do Supabase → seu projeto → Project Settings → API
    //   - Project URL          → SUPABASE_URL
    //   - anon / public key    → SUPABASE_ANON_KEY
    window.APP.CONFIG = {
        SUPABASE_URL: 'https://dijpcvwznpuuaophiggp.supabase.co',
        SUPABASE_ANON_KEY: 'sb_publishable_MoKsyXrJJ0wlE8-f-nJHwQ_PBfc8TvV',
        STORAGE_KEY: 'odontogest_pacientes'
    };

    // ============================================================
    // INICIALIZA O SUPABASE (APENAS UMA VEZ)
    // ============================================================
    if (!window.APP.supabase) {
        window.APP.supabase = window.supabase.createClient(
            window.APP.CONFIG.SUPABASE_URL,
            window.APP.CONFIG.SUPABASE_ANON_KEY
        );
        console.log('✅ Supabase inicializado');
    }

    // ============================================================
    // MAPEAMENTO DE STATUS
    // ============================================================
    // Fonte única de verdade para os status. Os <select> do HTML
    // (modalStatus / filtroStatus) são preenchidos a partir daqui
    // por APP.popularStatusSelects() em ui.js — não edite as
    // <option> no HTML na mão, edite só aqui.
    window.APP.STATUS_MAP = {
        'encaminhado': { label: 'Encaminhado', class: 'status-encaminhado', dot: 'dot-encaminhado', pdfClass: 'status-encaminhado-pdf' },
        'espera': { label: 'Em espera', class: 'status-espera', dot: 'dot-espera', pdfClass: 'status-espera-pdf' },
        'atendimento': { label: 'Em atendimento', class: 'status-atendimento', dot: 'dot-atendimento', pdfClass: 'status-atendimento-pdf' },
        'concluido': { label: 'Concluído', class: 'status-concluido', dot: 'dot-concluido', pdfClass: 'status-concluido-pdf' }
    };

    window.APP.STATUS_KEYS = ['encaminhado', 'espera', 'atendimento', 'concluido'];
    window.APP.STATUS_PADRAO = 'espera';

    console.log('✅ Configuração carregada!');

})();
