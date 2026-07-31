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
        // 1. Configurar busca
        if (typeof configurarBusca === 'function') {
            configurarBusca();
        }
        
        // 2. Testar conexão e carregar dados
        await testarConexao();
        await carregarPacientes();
        
        // 3. Renderizar odontograma
        if (typeof renderOdontogramaCadastro === 'function') {
            renderOdontogramaCadastro();
        }
        
        // 4. Configurar eventos
        if (typeof configurarEventos === 'function') {
            configurarEventos();
        }
        
        // 5. Sincronizar a cada 5 minutos
        setInterval(() => {
            if (navigator.onLine && typeof sincronizar === 'function') {
                sincronizar();
            }
        }, 300000);
        
        mostrarToast('📂 Sistema OdontoGest carregado!', '#1a4a58');
    } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        mostrarToast('❌ Erro ao carregar o sistema', '#7a3a3a');
    }
}

// ============================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================

function configurarEventos() {
    // Filtros
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimparFiltros = document.getElementById('btnLimparFiltros');
    const filtroLocal = document.getElementById('filtroLocal');
    const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
    const filtroStatus = document.getElementById('filtroStatus');
    
    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', function() {
            if (typeof renderizarTabela === 'function') {
                renderizarTabela();
            }
        });
    }
    
    if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', function() {
            if (filtroLocal) filtroLocal.value = 'todos';
            if (filtroEncaminhamento) filtroEncaminhamento.value = 'todos';
            if (filtroStatus) filtroStatus.value = 'todos';
            if (typeof renderizarTabela === 'function') {
                renderizarTabela();
            }
        });
    }
    
    if (filtroLocal) filtroLocal.addEventListener('change', function() {
        if (typeof renderizarTabela === 'function') renderizarTabela();
    });
    if (filtroEncaminhamento) filtroEncaminhamento.addEventListener('change', function() {
        if (typeof renderizarTabela === 'function') renderizarTabela();
    });
    if (filtroStatus) filtroStatus.addEventListener('change', function() {
        if (typeof renderizarTabela === 'function') renderizarTabela();
    });

    // Botões principais
    const btnGerarPDF = document.getElementById('btnGerarPDF');
    const btnExportarJSON = document.getElementById('btnExportarJSON');
    const btnImportarJSON = document.getElementById('btnImportarJSON');
    const btnSincronizar = document.getElementById('btnSincronizar');
    const btnAbrirModalCadastro = document.getElementById('btnAbrirModalCadastro');
    const btnSalvarPaciente = document.getElementById('btnSalvarPaciente');
    const btnAddEncaminhamento = document.getElementById('btnAddEncaminhamento');
    
    if (btnGerarPDF) btnGerarPDF.addEventListener('click', function() {
        if (typeof gerarPDF === 'function') gerarPDF();
    });
    if (btnExportarJSON) btnExportarJSON.addEventListener('click', function() {
        if (typeof exportarJSON === 'function') exportarJSON();
    });
    if (btnImportarJSON) btnImportarJSON.addEventListener('click', function() {
        if (typeof importarJSON === 'function') importarJSON();
    });
    if (btnSincronizar) btnSincronizar.addEventListener('click', function() {
        if (typeof sincronizar === 'function') sincronizar();
    });
    if (btnAbrirModalCadastro) btnAbrirModalCadastro.addEventListener('click', function() {
        if (typeof abrirCadastro === 'function') abrirCadastro();
    });
    if (btnSalvarPaciente) btnSalvarPaciente.addEventListener('click', function() {
        if (typeof salvarPaciente === 'function') salvarPaciente();
    });
    if (btnAddEncaminhamento) btnAddEncaminhamento.addEventListener('click', function() {
        if (typeof adicionarEncaminhamento === 'function') adicionarEncaminhamento();
    });

    // Modais - Fechar
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

    // Enter no campo de encaminhamento
    const modalEncSelect = document.getElementById('modalEncSelect');
    if (modalEncSelect) {
        modalEncSelect.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (typeof adicionarEncaminhamento === 'function') {
                    adicionarEncaminhamento();
                }
            }
        });
    }
}

// ============================================================
// FUNÇÕES DE PACIENTES (CRUD) - COM SUPABASE
// ============================================================

// Abre o modal de cadastro
function abrirCadastro() {
    const modalCadastro = document.getElementById('modalCadastro');
    if (!modalCadastro) return;
    
    document.getElementById('modalEditId').value = '';
    document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-user-md"></i> Novo Paciente';
    document.getElementById('modalSubtitulo').textContent = 'Preencha todos os dados abaixo';
    
    document.getElementById('modalNome').value = '';
    document.getElementById('modalTelefone').value = '';
    document.getElementById('modalIdade').value = '';
    document.getElementById('modalLocal').value = '';
    document.getElementById('modalObservacao').value = '';
    document.getElementById('modalComorbidades').value = '';
    document.getElementById('modalMedicacoes').value = '';
    document.getElementById('modalStatus').value = 'espera';
    
    document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => cb.checked = false);
    window.encaminhamentosTemp = [];
    window.dentesSelecionados = new Set();
    
    if (typeof atualizarListaEncaminhamentos === 'function') {
        atualizarListaEncaminhamentos();
    }
    if (typeof renderOdontogramaCadastro === 'function') {
        renderOdontogramaCadastro();
    }
    
    modalCadastro.classList.add('active');
    document.getElementById('modalNome').focus();
}

// Salva paciente (novo ou editado)
async function salvarPaciente() {
    const supabase = window.supabase;
    if (!supabase) {
        mostrarToast('❌ Erro: Supabase não inicializado', '#7a3a3a');
        return;
    }
    
    const nome = document.getElementById('modalNome').value.trim();
    const telefone = document.getElementById('modalTelefone').value.trim();
    const idade = parseInt(document.getElementById('modalIdade').value);
    const local = document.getElementById('modalLocal').value.trim();
    const observacao = document.getElementById('modalObservacao').value.trim();
    const comorbidades = document.getElementById('modalComorbidades').value.split(',').map(s => s.trim()).filter(s => s);
    const medicacoes = document.getElementById('modalMedicacoes').value.split(',').map(s => s.trim()).filter(s => s);
    const exames = getExamesSelecionados();
    const status = document.getElementById('modalStatus').value;
    const editId = document.getElementById('modalEditId').value;
    
    if (!nome) { mostrarToast('❌ Informe o nome do paciente', '#7a3a3a'); document.getElementById('modalNome').focus(); return; }
    if (!local) { mostrarToast('❌ Informe o local de origem', '#7a3a3a'); document.getElementById('modalLocal').focus(); return; }
    if (window.encaminhamentosTemp.length === 0) { mostrarToast('❌ Adicione pelo menos um encaminhamento', '#7a3a3a'); return; }
    
    const dentesArray = Array.from(window.dentesSelecionados).sort((a, b) => a - b);
    
    const paciente = {
        nome,
        telefone: telefone || '',
        idade: isNaN(idade) ? null : idade,
        local,
        encaminhamentos: [...window.encaminhamentosTemp],
        dentes: dentesArray,
        observacao: observacao || '',
        comorbidades: comorbidades,
        medicacoes: medicacoes,
        exames: exames,
        status: status
    };
    
    try {
        if (editId) {
            paciente.id = parseInt(editId);
            const { data, error } = await supabase
                .from('pacientes')
                .update(paciente)
                .eq('id', paciente.id)
                .select();
            
            if (error) throw error;
            
            const index = window.pacientes.findIndex(p => p.id === paciente.id);
            if (index !== -1) {
                window.pacientes[index] = data[0];
            }
            mostrarToast('✅ Paciente atualizado com sucesso!');
        } else {
            const { data, error } = await supabase
                .from('pacientes')
                .insert(paciente)
                .select();
            
            if (error) throw error;
            
            window.pacientes.push(data[0]);
            mostrarToast('✅ Paciente cadastrado com sucesso!');
        }
        
        if (typeof salvarDadosLocal === 'function') {
            salvarDadosLocal();
        }
        if (typeof popularSelects === 'function') {
            popularSelects();
        }
        if (typeof renderizarTabela === 'function') {
            renderizarTabela();
        }
        
        const modalCadastro = document.getElementById('modalCadastro');
        if (modalCadastro) modalCadastro.classList.remove('active');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarToast('❌ Erro ao salvar: ' + error.message, '#7a3a3a');
    }
}

// Função global para editar paciente
window.editarPaciente = function(id) {
    const paciente = window.pacientes.find(p => p.id === id);
    if (!paciente) return;
    
    document.getElementById('modalEditId').value = id;
    document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-user-edit"></i> Editar Paciente';
    document.getElementById('modalSubtitulo').textContent = 'Altere os dados necessários abaixo';
    
    document.getElementById('modalNome').value = paciente.nome;
    document.getElementById('modalTelefone').value = paciente.telefone || '';
    document.getElementById('modalIdade').value = paciente.idade || '';
    document.getElementById('modalLocal').value = paciente.local;
    document.getElementById('modalStatus').value = paciente.status || 'espera';
    document.getElementById('modalObservacao').value = paciente.observacao || '';
    document.getElementById('modalComorbidades').value = (paciente.comorbidades || []).join(', ');
    document.getElementById('modalMedicacoes').value = (paciente.medicacoes || []).join(', ');
    
    document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
        cb.checked = (paciente.exames || []).includes(cb.value);
    });
    
    window.encaminhamentosTemp = [...(paciente.encaminhamentos || [])];
    if (typeof atualizarListaEncaminhamentos === 'function') {
        atualizarListaEncaminhamentos();
    }
    
    window.dentesSelecionados = new Set(paciente.dentes || []);
    if (typeof renderOdontogramaCadastro === 'function') {
        renderOdontogramaCadastro();
    }
    
    const modalCadastro = document.getElementById('modalCadastro');
    if (modalCadastro) modalCadastro.classList.add('active');
};

// Função global para remover paciente
window.removerPaciente = async function(id) {
    if (!confirm('Remover este paciente?')) return;
    
    const supabase = window.supabase;
    if (!supabase) {
        mostrarToast('❌ Erro: Supabase não inicializado', '#7a3a3a');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('pacientes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        window.pacientes = window.pacientes.filter(p => p.id !== id);
        if (typeof salvarDadosLocal === 'function') {
            salvarDadosLocal();
        }
        if (typeof renderizarTabela === 'function') {
            renderizarTabela();
        }
        if (typeof popularSelects === 'function') {
            popularSelects();
        }
        mostrarToast('🗑️ Paciente removido com sucesso!', '#1a4a58');
    } catch (error) {
        console.error('Erro ao deletar:', error);
        mostrarToast('❌ Erro ao remover: ' + error.message, '#7a3a3a');
    }
};

// ============================================================
// FUNÇÕES DE ENCAMINHAMENTOS E EXAMES
// ============================================================

function atualizarListaEncaminhamentos() {
    const modalEncList = document.getElementById('modalEncList');
    if (!modalEncList) return;
    
    modalEncList.innerHTML = '';
    if (window.encaminhamentosTemp.length === 0) {
        const span = document.createElement('span');
        span.style.color = '#8ba3ae';
        span.style.fontSize = '0.85rem';
        span.textContent = 'Nenhum encaminhamento adicionado';
        modalEncList.appendChild(span);
        return;
    }
    window.encaminhamentosTemp.forEach((enc, index) => {
        const tag = document.createElement('span');
        tag.className = 'enc-tag';
        tag.innerHTML = `${enc} <i class="fas fa-times-circle" data-index="${index}"></i>`;
        tag.querySelector('i').addEventListener('click', function(e) {
            const idx = parseInt(this.dataset.index);
            window.encaminhamentosTemp.splice(idx, 1);
            if (typeof atualizarListaEncaminhamentos === 'function') {
                atualizarListaEncaminhamentos();
            }
        });
        modalEncList.appendChild(tag);
    });
}

function adicionarEncaminhamento() {
    let valor = document.getElementById('modalEncSelect').value;
    if (valor === 'outro') {
        const custom = prompt('Digite o nome do encaminhamento:');
        if (custom && custom.trim() !== '') valor = custom.trim();
        else return;
    }
    if (!valor) return;
    if (window.encaminhamentosTemp.includes(valor)) {
        alert('Este encaminhamento já foi adicionado.');
        return;
    }
    window.encaminhamentosTemp.push(valor);
    if (typeof atualizarListaEncaminhamentos === 'function') {
        atualizarListaEncaminhamentos();
    }
}

function getExamesSelecionados() {
    const selecionados = [];
    document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selecionados.push(cb.value);
    });
    return selecionados;
}

// ============================================================
// FUNÇÕES DE DETALHES
// ============================================================

function abrirDetalhes(id) {
    const paciente = window.pacientes.find(p => p.id === id);
    if (!paciente) return;
    
    document.getElementById('detalhesNome').textContent = paciente.nome;
    document.getElementById('detalhesTelefone').textContent = paciente.telefone || '—';
    document.getElementById('detalhesIdade').textContent = paciente.idade ? `${paciente.idade} anos` : '—';
    document.getElementById('detalhesLocal').innerHTML = `<span class="badge badge-local"><i class="fas fa-map-marker-alt"></i> ${paciente.local}</span>`;
    document.getElementById('detalhesStatus').innerHTML = getStatusBadge(paciente.status, false);
    
    const encBadges = (paciente.encaminhamentos || []).map(e =>
        `<span class="badge badge-encaminhamento"><i class="fas fa-arrow-right"></i> ${e}</span>`
    ).join(' ');
    document.getElementById('detalhesEncaminhamentos').innerHTML = encBadges || '—';
    
    document.getElementById('detalhesComorbidades').innerHTML = formatarLista(paciente.comorbidades);
    document.getElementById('detalhesMedicacoes').innerHTML = formatarLista(paciente.medicacoes);
    document.getElementById('detalhesExames').innerHTML = formatarExames(paciente.exames);
    
    const dentesStr = formatarDentes(paciente.dentes);
    document.getElementById('detalhesDentes').innerHTML = `<span class="badge badge-odontograma"><i class="fas fa-teeth"></i> ${dentesStr}</span>`;
    
    document.getElementById('detalhesObservacao').textContent = paciente.observacao || 'Nenhuma observação registrada.';
    
    if (typeof renderOdontogramaDetalhes === 'function') {
        renderOdontogramaDetalhes(paciente.dentes);
    }
    
    const modalDetalhes = document.getElementById('modalDetalhes');
    if (modalDetalhes) modalDetalhes.classList.add('active');
}

// ============================================================
// FUNÇÕES DE STATUS
// ============================================================

async function alterarStatus(pacienteId, novoStatus) {
    const paciente = window.pacientes.find(p => p.id === pacienteId);
    if (!paciente) return;
    
    const supabase = window.supabase;
    if (!supabase) {
        mostrarToast('❌ Erro: Supabase não inicializado', '#7a3a3a');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('pacientes')
            .update({ status: novoStatus })
            .eq('id', pacienteId);
        
        if (error) throw error;
        
        paciente.status = novoStatus;
        if (typeof salvarDadosLocal === 'function') {
            salvarDadosLocal();
        }
        if (typeof renderizarTabela === 'function') {
            renderizarTabela();
        }
        
        const modalDetalhes = document.getElementById('modalDetalhes');
        if (modalDetalhes && modalDetalhes.classList.contains('active')) {
            abrirDetalhes(pacienteId);
        }
        
        const STATUS_MAP = window.STATUS_MAP || {};
        mostrarToast(`Status alterado para ${STATUS_MAP[novoStatus] ? STATUS_MAP[novoStatus].label : novoStatus}`);
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        mostrarToast('❌ Erro ao alterar status', '#7a3a3a');
    }
}

// ============================================================
// FUNÇÕES DE PDF E EXPORT
// ============================================================

function gerarPDF() {
    const filtrados = getPacientesFiltrados();
    
    if (filtrados.length === 0) {
        alert('Não há pacientes para gerar o relatório.');
        return;
    }
    
    document.getElementById('relatorioData').textContent = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    
    const filtrosAplicados = [];
    const filtroLocal = document.getElementById('filtroLocal');
    const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
    const filtroStatus = document.getElementById('filtroStatus');
    const STATUS_MAP = window.STATUS_MAP || {};
    
    if (filtroLocal && filtroLocal.value !== 'todos') filtrosAplicados.push(`Local: ${filtroLocal.value}`);
    if (filtroEncaminhamento && filtroEncaminhamento.value !== 'todos') filtrosAplicados.push(`Encaminhamento: ${filtroEncaminhamento.value}`);
    if (filtroStatus && filtroStatus.value !== 'todos') {
        const statusLabel = STATUS_MAP[filtroStatus.value]?.label || filtroStatus.value;
        filtrosAplicados.push(`Status: ${statusLabel}`);
    }
    document.getElementById('relatorioFiltros').textContent = filtrosAplicados.length ? filtrosAplicados.join(' | ') : 'Todos os pacientes';
    
    let html = '';
    filtrados.forEach((p, index) => {
        const encaminhamentosStr = (p.encaminhamentos || []).join(', ');
        const dentesStr = formatarDentes(p.dentes);
        const statusLabel = STATUS_MAP[p.status]?.label || p.status || '—';
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${p.nome}</td>
                <td>${p.idade || '—'}</td>
                <td>${p.telefone || '—'}</td>
                <td>${encaminhamentosStr || '—'}</td>
                <td><span class="status-badge-pdf ${STATUS_MAP[p.status]?.pdfClass || ''}">${statusLabel}</span></td>
                <td>${dentesStr}</td>
            </tr>
        `;
    });
    document.getElementById('relatorioCorpo').innerHTML = html;
    
    const element = document.getElementById('relatorioContainer');
    
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('relatorio_pacientes_odontogest.pdf');
        mostrarToast('📄 PDF gerado com sucesso!', '#1a7a3a');
    }).catch(err => {
        console.error('Erro ao gerar PDF:', err);
        alert('Erro ao gerar o PDF. Tente novamente.');
    });
}

function exportarJSON() {
    const dados = window.pacientes || [];
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `odontogest_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast('📥 Dados exportados com sucesso!');
}

function importarJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const dados = JSON.parse(ev.target.result);
                if (Array.isArray(dados) && dados.length > 0) {
                    if (confirm(`Deseja importar ${dados.length} pacientes? Isso substituirá todos os dados atuais.`)) {
                        await enviarParaSupabase(dados);
                        window.pacientes = dados;
                        if (typeof salvarDadosLocal === 'function') {
                            salvarDadosLocal();
                        }
                        if (typeof popularSelects === 'function') {
                            popularSelects();
                        }
                        if (typeof renderizarTabela === 'function') {
                            renderizarTabela();
                        }
                        mostrarToast(`📤 ${dados.length} pacientes importados com sucesso!`);
                    }
                } else {
                    alert('Arquivo inválido ou vazio.');
                }
            } catch (err) {
                alert('Erro ao ler o arquivo. Certifique-se de que é um JSON válido.');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Inicia o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', init);