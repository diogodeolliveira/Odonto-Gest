// ============================================================
// APP - PONTO DE ENTRADA PRINCIPAL
// ============================================================

const APP = window.APP;

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
APP.pacientes = APP.pacientes || [];
APP.encaminhamentosTemp = [];
APP.dentesSelecionados = new Set();

// ============================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================================

APP.init = async function() {
    console.log('🚀 OdontoGest iniciado!');

    try {
        // 1. Configurar busca
        APP.configurarBusca();

        // 2. Testar conexão e carregar dados
        await APP.testarConexao();
        await APP.carregarPacientes();

        // 3. Renderizar odontograma
        APP.renderOdontogramaCadastro();

        // 4. Configurar eventos
        APP.configurarEventos();

        // 5. Sincronizar a cada 5 minutos
        setInterval(() => {
            if (navigator.onLine) {
                APP.sincronizar();
            }
        }, 300000);

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

    // Mudança nos filtros
    document.getElementById('filtroLocal')?.addEventListener('change', APP.renderizarTabela);
    document.getElementById('filtroEncaminhamento')?.addEventListener('change', APP.renderizarTabela);
    document.getElementById('filtroStatus')?.addEventListener('change', APP.renderizarTabela);

    // Fechar modais
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

    // Enter no campo de encaminhamento
    document.getElementById('modalEncSelect')?.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            APP.adicionarEncaminhamento();
        }
    });

    console.log('✅ Eventos configurados!');
};

// ============================================================
// FUNÇÕES DE CADASTRO (ÚNICAS)
// ============================================================

APP.abrirCadastro = function() {
    console.log('🟢 Abrindo cadastro...');
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
    APP.encaminhamentosTemp = [];
    APP.dentesSelecionados = new Set();
    APP.atualizarListaEncaminhamentos();
    APP.renderOdontogramaCadastro();
    document.getElementById('modalCadastro').classList.add('active');
    document.getElementById('modalNome').focus();
};

APP.salvarPaciente = async function() {
    console.log('🟢 Salvando paciente...');
    const nome = document.getElementById('modalNome').value.trim();
    const telefone = document.getElementById('modalTelefone').value.trim();
    const idade = parseInt(document.getElementById('modalIdade').value);
    const local = document.getElementById('modalLocal').value.trim();
    const observacao = document.getElementById('modalObservacao').value.trim();
    const comorbidades = document.getElementById('modalComorbidades').value.split(',').map(s => s.trim()).filter(s => s);
    const medicacoes = document.getElementById('modalMedicacoes').value.split(',').map(s => s.trim()).filter(s => s);
    const exames = APP.getExamesSelecionados();
    const status = document.getElementById('modalStatus').value;
    const editId = document.getElementById('modalEditId').value;

    if (!nome) { APP.mostrarToast('❌ Informe o nome do paciente', '#7a3a3a'); document.getElementById('modalNome').focus(); return; }
    if (!local) { APP.mostrarToast('❌ Informe o local de origem', '#7a3a3a'); document.getElementById('modalLocal').focus(); return; }
    if (APP.encaminhamentosTemp.length === 0) { APP.mostrarToast('❌ Adicione pelo menos um encaminhamento', '#7a3a3a'); return; }

    const dentesArray = Array.from(APP.dentesSelecionados).sort((a, b) => a - b);

    const paciente = {
        nome,
        telefone: telefone || '',
        idade: isNaN(idade) ? null : idade,
        local,
        encaminhamentos: [...APP.encaminhamentosTemp],
        dentes: dentesArray,
        observacao: observacao || '',
        comorbidades: comorbidades,
        medicacoes: medicacoes,
        exames: exames,
        status: status
    };

    try {
        const supabase = APP.supabase;
        if (editId) {
            paciente.id = parseInt(editId);
            const { data, error } = await supabase
                .from('pacientes')
                .update(paciente)
                .eq('id', paciente.id)
                .select();
            if (error) throw error;
            const index = APP.pacientes.findIndex(p => p.id === paciente.id);
            if (index !== -1) APP.pacientes[index] = data[0];
            APP.mostrarToast('✅ Paciente atualizado!');
        } else {
            const { data, error } = await supabase
                .from('pacientes')
                .insert(paciente)
                .select();
            if (error) throw error;
            APP.pacientes.push(data[0]);
            APP.mostrarToast('✅ Paciente cadastrado!');
        }

        APP.salvarDadosLocal();
        APP.popularSelects();
        APP.renderizarTabela();
        document.getElementById('modalCadastro').classList.remove('active');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        APP.mostrarToast('❌ Erro ao salvar: ' + error.message, '#7a3a3a');
    }
};

// ============================================================
// FUNÇÕES DE ENCAMINHAMENTOS E EXAMES (ÚNICAS)
// ============================================================

APP.atualizarListaEncaminhamentos = function() {
    const modalEncList = document.getElementById('modalEncList');
    if (!modalEncList) return;
    modalEncList.innerHTML = '';
    if (APP.encaminhamentosTemp.length === 0) {
        const span = document.createElement('span');
        span.style.color = '#8ba3ae';
        span.style.fontSize = '0.85rem';
        span.textContent = 'Nenhum encaminhamento adicionado';
        modalEncList.appendChild(span);
        return;
    }
    APP.encaminhamentosTemp.forEach((enc, index) => {
        const tag = document.createElement('span');
        tag.className = 'enc-tag';
        tag.innerHTML = `${enc} <i class="fas fa-times-circle" data-index="${index}"></i>`;
        tag.querySelector('i').addEventListener('click', function(e) {
            const idx = parseInt(this.dataset.index);
            APP.encaminhamentosTemp.splice(idx, 1);
            APP.atualizarListaEncaminhamentos();
        });
        modalEncList.appendChild(tag);
    });
};

APP.adicionarEncaminhamento = function() {
    let valor = document.getElementById('modalEncSelect').value;
    if (valor === 'outro') {
        const custom = prompt('Digite o nome do encaminhamento:');
        if (custom && custom.trim() !== '') valor = custom.trim();
        else return;
    }
    if (!valor) return;
    if (APP.encaminhamentosTemp.includes(valor)) {
        alert('Este encaminhamento já foi adicionado.');
        return;
    }
    APP.encaminhamentosTemp.push(valor);
    APP.atualizarListaEncaminhamentos();
};

APP.getExamesSelecionados = function() {
    const selecionados = [];
    document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selecionados.push(cb.value);
    });
    return selecionados;
};

// ============================================================
// FUNÇÕES DE DETALHES, EDIÇÃO E EXCLUSÃO (ÚNICAS)
// ============================================================

APP.abrirDetalhes = function(id) {
    const paciente = APP.pacientes.find(p => p.id === id);
    if (!paciente) return;

    document.getElementById('detalhesNome').textContent = paciente.nome;
    document.getElementById('detalhesTelefone').textContent = paciente.telefone || '—';
    document.getElementById('detalhesIdade').textContent = paciente.idade ? `${paciente.idade} anos` : '—';
    document.getElementById('detalhesLocal').innerHTML = `<span class="badge badge-local"><i class="fas fa-map-marker-alt"></i> ${paciente.local}</span>`;
    document.getElementById('detalhesStatus').innerHTML = APP.getStatusBadge(paciente.status, false);

    const encBadges = (paciente.encaminhamentos || []).map(e =>
        `<span class="badge badge-encaminhamento"><i class="fas fa-arrow-right"></i> ${e}</span>`
    ).join(' ');
    document.getElementById('detalhesEncaminhamentos').innerHTML = encBadges || '—';

    document.getElementById('detalhesComorbidades').innerHTML = APP.formatarLista(paciente.comorbidades);
    document.getElementById('detalhesMedicacoes').innerHTML = APP.formatarLista(paciente.medicacoes);
    document.getElementById('detalhesExames').innerHTML = APP.formatarExames(paciente.exames);

    const dentesStr = APP.formatarDentes(paciente.dentes);
    document.getElementById('detalhesDentes').innerHTML = `<span class="badge badge-odontograma"><i class="fas fa-teeth"></i> ${dentesStr}</span>`;
    document.getElementById('detalhesObservacao').textContent = paciente.observacao || 'Nenhuma observação registrada.';

    APP.renderOdontogramaDetalhes(paciente.dentes);
    document.getElementById('modalDetalhes').classList.add('active');
};

APP.editarPaciente = function(id) {
    console.log('🟢 Editando paciente:', id);
    const paciente = APP.pacientes.find(p => p.id === id);
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

    APP.encaminhamentosTemp = [...(paciente.encaminhamentos || [])];
    APP.atualizarListaEncaminhamentos();

    APP.dentesSelecionados = new Set(paciente.dentes || []);
    APP.renderOdontogramaCadastro();

    document.getElementById('modalCadastro').classList.add('active');
};

APP.removerPaciente = async function(id) {
    console.log('🟢 Removendo paciente:', id);
    if (!confirm('Remover este paciente?')) return;

    try {
        const { error } = await APP.supabase
            .from('pacientes')
            .delete()
            .eq('id', id);
        if (error) throw error;

        APP.pacientes = APP.pacientes.filter(p => p.id !== id);
        APP.salvarDadosLocal();
        APP.renderizarTabela();
        APP.popularSelects();
        APP.mostrarToast('🗑️ Paciente removido!', '#1a4a58');
    } catch (error) {
        console.error('Erro ao deletar:', error);
        APP.mostrarToast('❌ Erro ao remover: ' + error.message, '#7a3a3a');
    }
};

APP.alterarStatus = async function(pacienteId, novoStatus) {
    console.log('🟢 Alterando status:', pacienteId, '->', novoStatus);
    const paciente = APP.pacientes.find(p => p.id === pacienteId);
    if (!paciente) return;

    try {
        const { error } = await APP.supabase
            .from('pacientes')
            .update({ status: novoStatus })
            .eq('id', pacienteId);
        if (error) throw error;

        paciente.status = novoStatus;
        APP.salvarDadosLocal();
        APP.renderizarTabela();

        if (document.getElementById('modalDetalhes').classList.contains('active')) {
            APP.abrirDetalhes(pacienteId);
        }

        APP.mostrarToast(`Status alterado para ${APP.STATUS_MAP[novoStatus]?.label || novoStatus}`);
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        APP.mostrarToast('❌ Erro ao alterar status', '#7a3a3a');
    }
};

// ============================================================
// FUNÇÕES DE PDF E EXPORT (ÚNICAS)
// ============================================================

APP.gerarPDF = function() {
    console.log('🟢 Gerando PDF...');
    const filtrados = APP.getPacientesFiltrados();
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
    if (filtroLocal && filtroLocal.value !== 'todos') filtrosAplicados.push(`Local: ${filtroLocal.value}`);
    if (filtroEncaminhamento && filtroEncaminhamento.value !== 'todos') filtrosAplicados.push(`Encaminhamento: ${filtroEncaminhamento.value}`);
    if (filtroStatus && filtroStatus.value !== 'todos') {
        const statusLabel = APP.STATUS_MAP[filtroStatus.value]?.label || filtroStatus.value;
        filtrosAplicados.push(`Status: ${statusLabel}`);
    }
    document.getElementById('relatorioFiltros').textContent = filtrosAplicados.length ? filtrosAplicados.join(' | ') : 'Todos os pacientes';

    let html = '';
    filtrados.forEach((p, index) => {
        const encaminhamentosStr = (p.encaminhamentos || []).join(', ');
        const dentesStr = APP.formatarDentes(p.dentes);
        const statusLabel = APP.STATUS_MAP[p.status]?.label || p.status || '—';
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${p.nome}</td>
                <td>${p.idade || '—'}</td>
                <td>${p.telefone || '—'}</td>
                <td>${encaminhamentosStr || '—'}</td>
                <td><span class="status-badge-pdf ${APP.STATUS_MAP[p.status]?.pdfClass || ''}">${statusLabel}</span></td>
                <td>${dentesStr}</td>
            </tr>
        `;
    });
    document.getElementById('relatorioCorpo').innerHTML = html;

    const element = document.getElementById('relatorioContainer');
    html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
        .then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('relatorio_pacientes_odontogest.pdf');
            APP.mostrarToast('📄 PDF gerado!', '#1a7a3a');
        })
        .catch(err => {
            console.error('Erro ao gerar PDF:', err);
            alert('Erro ao gerar o PDF. Tente novamente.');
        });
};

APP.exportarJSON = function() {
    console.log('🟢 Exportando dados...');
    const dados = APP.pacientes;
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `odontogest_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    APP.mostrarToast('📥 Dados exportados!');
};

APP.importarJSON = function() {
    console.log('🟢 Importando dados...');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function(ev) {
            try {
                const dados = JSON.parse(ev.target.result);
                if (Array.isArray(dados) && dados.length > 0) {
                    if (confirm(`Deseja importar ${dados.length} pacientes? Isso substituirá todos os dados atuais.`)) {
                        await APP.enviarParaSupabase(dados);
                        APP.pacientes = dados;
                        APP.salvarDadosLocal();
                        APP.popularSelects();
                        APP.renderizarTabela();
                        APP.mostrarToast(`📤 ${dados.length} pacientes importados!`);
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
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================

// Inicia o sistema quando a página carregar
document.addEventListener('DOMContentLoaded', APP.init);