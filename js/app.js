// ============================================================
// APP - PONTO DE ENTRADA PRINCIPAL
// ============================================================
(function() {

    const APP = window.APP;

    // ============================================================
    // VARIÁVEIS GLOBAIS
    // ============================================================
    APP.pacientes = APP.pacientes || [];
    APP.encaminhamentosTemp = APP.encaminhamentosTemp || [];
    APP.dentesSelecionados = APP.dentesSelecionados || new Set();
    APP.usuarioAtual = APP.usuarioAtual || null;

    // ============================================================
    // FUNÇÕES DE INICIALIZAÇÃO
    // ============================================================

    APP.init = async function() {
        // Protege contra dupla inicialização
        if (APP._iniciado) {
            console.warn('⚠️ APP.init() chamado mais de uma vez — ignorando.');
            return;
        }
        APP._iniciado = true;

        console.log('🚀 OdontoGest iniciado!');

        try {
            // 1. Verifica se o usuário está logado
            await APP.verificarSessao();

            // 2. Configurar busca (se o sistema estiver visível)
            if (document.getElementById('sistemaPrincipal').style.display !== 'none') {
                APP.configurarBusca();
                APP.renderOdontogramaCadastro();
                APP.configurarEventos();
                
                // Sincronizar a cada 5 minutos
                setInterval(() => {
                    if (navigator.onLine && APP.usuarioAtual) {
                        APP.sincronizar();
                    }
                }, 300000);
            }

            APP.mostrarToast('📂 Sistema OdontoGest carregado!', '#1a4a58');
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            APP.mostrarToast('❌ Erro ao carregar o sistema', '#7a3a3a');
        }
    };

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', APP.init);
    } else {
        APP.init();
    }

})();