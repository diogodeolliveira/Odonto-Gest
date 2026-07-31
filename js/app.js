// ============================================================
// APP - PONTO DE ENTRADA PRINCIPAL
// ============================================================

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
window.pacientes = window.pacientes || [];
window.encaminhamentosTemp = [];
window.dentesSelecionados = new Set();

// ============================================================
// INICIALIZAÇÃO
// ============================================================

async function init() {
    console.log('🚀 OdontoGest iniciado!');
    
    try {
        // ✅ Usa as funções do window (exportadas pelo database.js)
        
        // 1. Configurar busca
        if (typeof window.configurarBusca === 'function') {
            window.configurarBusca();
        }
        
        // 2. Testar conexão e carregar dados
        if (typeof window.testarConexao === 'function') {
            await window.testarConexao();
        } else {
            console.error('❌ testarConexao não está definida!');
        }
        
        if (typeof window.carregarPacientes === 'function') {
            await window.carregarPacientes();
        } else {
            console.error('❌ carregarPacientes não está definida!');
        }
        
        // 3. Renderizar odontograma
        if (typeof window.renderOdontogramaCadastro === 'function') {
            window.renderOdontogramaCadastro();
        }
        
        // 4. Configurar eventos
        if (typeof window.configurarEventos === 'function') {
            window.configurarEventos();
        } else {
            // Fallback: configura eventos localmente
            configurarEventosLocal();
        }
        
        // 5. Sincronizar a cada 5 minutos
        setInterval(() => {
            if (navigator.onLine && typeof window.sincronizar === 'function') {
                window.sincronizar();
            }
        }, 300000);
        
        window.mostrarToast('📂 Sistema OdontoGest carregado!', '#1a4a58');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        window.mostrarToast('❌ Erro ao carregar o sistema', '#7a3a3a');
    }
}

// ============================================================
// CONFIGURAÇÃO DE EVENTOS (FALLBACK)
// ============================================================

function configurarEventosLocal() {
    console.log('🔧 Configurando eventos (fallback)...');
    
    // Filtros
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const filtroLocal = document.getElementById('filtroLocal');
    const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
    const filtroStatus = document.getElementById('filtroStatus');
    
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function() {
            if (typeof window.renderizarTabela === 'function') {
                window.renderizarTabela();
            }
        });
    }
    
    if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', function() {
            if (filtroLocal) filtroLocal.value = 'todos';
            if (filtroEncaminhamento) filtroEncaminhamento.value = 'todos';
            if (filtroStatus) filtroStatus.value = 'todos';
            if (typeof window.renderizarTabela === 'function') {
                window.renderizarTabela();
            }
        });
    }
    
    if (filtroLocal) filtroLocal.addEventListener('change', function() {
        if (typeof window.renderizarTabela === 'function') window.renderizarTabela();
    });
    if (filtroEncaminhamento) filtroEncaminhamento.addEventListener('change', function() {
        if (typeof window.renderizarTabela === 'function') window.renderizarTabela();
    });
    if (filtroStatus) filtroStatus.addEventListener('change', function() {
        if (typeof window.renderizarTabela === 'function') window.renderizarTabela();
    });

    // Botão Novo
    const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
    if (btnAbrirModalCadastro) {
        btnAbrirModalCadastro.addEventListener('click', function() {
            if (typeof window.abrirCadastro === 'function') {
                window.abrirCadastro();
            }
        });
    }
    
    // Botão Salvar
    const btnSalvarPaciente = document.getElementById('btnSalvarPaciente');
    if (btnSalvarPaciente) {
        btnSalvarPaciente.addEventListener('click', function() {
            if (typeof window.salvarPaciente === 'function') {
                window.salvarPaciente();
            }
        });
    }
    
    // Botão Sincronizar
    const btnSincronizar = document.getElementById('btnSincronizar');
    if (btnSincronizar) {
        btnSincronizar.addEventListener('click', function() {
            if (typeof window.sincronizar === 'function') {
                window.sincronizar();
            }
        });
    }
    
    // Botão PDF
    const btnGerarPDF = document.getElementById('btnGerarPDF');
    if (btnGerarPDF) {
        btnGerarPDF.addEventListener('click', function() {
            if (typeof window.gerarPDF === 'function') {
                window.gerarPDF();
            }
        });
    }
    
    // Botão Exportar
    const btnExportarJSON = document.getElementById('btnExportarJSON');
    if (btnExportarJSON) {
        btnExportarJSON.addEventListener('click', function() {
            if (typeof window.exportarJSON === 'function') {
                window.exportarJSON();
            }
        });
    }
    
    // Botão Importar
    const btnImportarJSON = document.getElementById('btnImportarJSON');
    if (btnImportarJSON) {
        btnImportarJSON.addEventListener('click', function() {
            if (typeof window.importarJSON === 'function') {
                window.importarJSON();
            }
        });
    }
    
    // Modal - Fechar
    const btnCancelarCadastro = document.getElementById('btnCancelarCadastro');
    const fecharCadastro = document.getElementById('fecharCadastro');
    const fecharDetalhes = document.getElementById('fecharDetalhes');
    const fecharDetalhesBtn = document.getElementById('fecharDetalhesBtn');
    const modalCadastro = document.getElementById('modalCadastro');
    const modalDetalhes = document.getElementById('modalDetalhes');
    
    if (btnCancelarCadastro) btnCancelarCadastro.addEventListener('click', function() {
        if (modalCadastro) modalCadastro.classList.remove('active');
    });
    if (fecharCadastro) fecharCadastro.addEventListener('click', function() {
        if (modalCadastro) modalCadastro.classList.remove('active');
    });
    if (fecharDetalhes) fecharDetalhes.addEventListener('click', function() {
        if (modalDetalhes) modalDetalhes.classList.remove('active');
    });
    if (fecharDetalhesBtn) fecharDetalhesBtn.addEventListener('click', function() {
        if (modalDetalhes) modalDetalhes.classList.remove('active');
    });
    
    if (modalCadastro) {
        modalCadastro.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    }
    if (modalDetalhes) {
        modalDetalhes.addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });
    }
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Inicia o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', init);