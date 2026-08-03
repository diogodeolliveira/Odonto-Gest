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
    // INICIALIZAÇÃO
    // ============================================================
    APP.init = async function() {
        if (APP._iniciado) {
            console.warn('⚠️ APP.init() chamado mais de uma vez — ignorando.');
            return;
        }
        APP._iniciado = true;

        console.log('🚀 OdontoGest iniciado!');

        try {
            await APP.verificarSessao();

            if (document.getElementById('sistemaPrincipal').style.display !== 'none') {
                APP.configurarBusca();
                APP.renderOdontogramaCadastro();
                APP.configurarEventos();

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
    // CONFIGURAÇÃO DE EVENTOS
    // ============================================================
    APP.configurarEventos = function() {
        console.log('🔧 Configurando eventos...');

        // Botão NOVO
        const btnNovo = document.getElementById('btnAbrirModalCadastro');
        if (btnNovo) {
            btnNovo.addEventListener('click', function() {
                console.log('🟢 Botão NOVO clicado!');
                APP.abrirCadastro();
            });
        }

        // Botão SALVAR
        const btnSalvar = document.getElementById('btnSalvarPaciente');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', function() {
                console.log('🟢 Botão SALVAR clicado!');
                APP.salvarPaciente();
            });
        }

        // Botão SINCRONIZAR
        const btnSincronizar = document.getElementById('btnSincronizar');
        if (btnSincronizar) {
            btnSincronizar.addEventListener('click', function() {
                console.log('🟢 Botão SINCRONIZAR clicado!');
                APP.sincronizar();
            });
        }

        // Botão PDF
        const btnPDF = document.getElementById('btnGerarPDF');
        if (btnPDF) {
            btnPDF.addEventListener('click', function() {
                console.log('🟢 Botão PDF clicado!');
                APP.gerarPDF();
            });
        }

        // Botão EXPORTAR
        const btnExportar = document.getElementById('btnExportarJSON');
        if (btnExportar) {
            btnExportar.addEventListener('click', function() {
                console.log('🟢 Botão EXPORTAR clicado!');
                APP.exportarJSON();
            });
        }

        // Botão IMPORTAR
        const btnImportar = document.getElementById('btnImportarJSON');
        if (btnImportar) {
            btnImportar.addEventListener('click', function() {
                console.log('🟢 Botão IMPORTAR clicado!');
                APP.importarJSON();
            });
        }

        // Botão ADICIONAR ENCAMINHAMENTO
        const btnAddEnc = document.getElementById('btnAddEncaminhamento');
        if (btnAddEnc) {
            btnAddEnc.addEventListener('click', function() {
                console.log('🟢 Adicionar encaminhamento!');
                APP.adicionarEncaminhamento();
            });
        }

        // Filtros
        const btnFiltrar = document.getElementById('btnFiltrar');
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', function() {
                console.log('🟢 Filtrar!');
                APP.renderizarTabela();
            });
        }

        const btnLimparFiltros = document.getElementById('btnLimparFiltros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', function() {
                console.log('🟢 Limpar filtros!');
                const filtroLocal = document.getElementById('filtroLocal');
                const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
                const filtroStatus = document.getElementById('filtroStatus');
                if (filtroLocal) filtroLocal.value = 'todos';
                if (filtroEncaminhamento) filtroEncaminhamento.value = 'todos';
                if (filtroStatus) filtroStatus.value = 'todos';
                APP.renderizarTabela();
            });
        }

        document.getElementById('filtroLocal')?.addEventListener('change', APP.renderizarTabela);
        document.getElementById('filtroEncaminhamento')?.addEventListener('change', APP.renderizarTabela);
        document.getElementById('filtroStatus')?.addEventListener('change', APP.renderizarTabela);

        document.getElementById('btnCancelarCadastro')?.addEventListener('click', function() {
            document.getElementById('modalCadastro').classList.remove('active');
        });
        document.getElementById('fecharCadastro')?.addEventListener('click', function() {
            document.getElementById('modalCadastro').classList.remove('active');
        });
        document.getElementById('fecharDetalhes')?.addEventListener('click', function() {
            document.getElementById('modalDetalhes').classList.remove('active');
        });
        document.getElementById('fecharDetalhesBtn')?.addEventListener('click', function() {
            document.getElementById('modalDetalhes').classList.remove('active');
        });

        document.getElementById('modalCadastro')?.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
        document.getElementById('modalDetalhes')?.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });

        document.getElementById('modalEncSelect')?.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                APP.adicionarEncaminhamento();
            }
        });

        console.log('✅ Eventos configurados!');
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