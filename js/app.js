// ============================================================
// APP - PONTO DE ENTRADA PRINCIPAL
// ============================================================

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let pacientes = [];
let encaminhamentosTemp = [];
let dentesSelecionados = new Set();

// ============================================================
// REFERÊNCIAS DOM
// ============================================================
const corpoTabela = document.getElementById('corpoTabela');
const filtroLocal = document.getElementById('filtroLocal');
const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
const filtroStatus = document.getElementById('filtroStatus');
const contadorRegistros = document.getElementById('contadorRegistros');
const toast = document.getElementById('toast');
const btnSincronizar = document.getElementById('btnSincronizar');
const statusConexao = document.getElementById('statusConexao');

// ============================================================
// FUNÇÕES DE INICIALIZAÇÃO
// ============================================================

async function init() {
    console.log('🚀 OdontoGest iniciado com Supabase!');
    
    // 1. Configura barra de busca
    configurarBusca();
    
    // 2. Testa conexão e carrega dados
    await testarConexao();
    await carregarPacientes();
    
    // 3. Renderiza odontograma
    renderOdontogramaCadastro();
    
    // 4. Configura eventos
    configurarEventos();
    
    // 5. Sincroniza a cada 5 minutos
    setInterval(() => {
        if (navigator.onLine) {
            sincronizar();
        }
    }, 300000);
    
    mostrarToast('📂 Sistema OdontoGest carregado!', '#1a4a58');
}

// ============================================================
// CONFIGURAÇÃO DE EVENTOS
// ============================================================

function configurarEventos() {
    // Filtros
    document.getElementById('btnFiltrar').addEventListener('click', renderizarTabela);
    document.getElementById('btnLimparFiltros').addEventListener('click', function() {
        filtroLocal.value = 'todos';
        filtroEncaminhamento.value = 'todos';
        filtroStatus.value = 'todos';
        renderizarTabela();
    });
    
    filtroLocal.addEventListener('change', renderizarTabela);
    filtroEncaminhamento.addEventListener('change', renderizarTabela);
    filtroStatus.addEventListener('change', renderizarTabela);
    
    // Botões principais
    document.getElementById('btnGerarPDF').addEventListener('click', gerarPDF);
    document.getElementById('btnExportarJSON').addEventListener('click', exportarJSON);
    document.getElementById('btnImportarJSON').addEventListener('click', importarJSON);
    document.getElementById('btnSincronizar').addEventListener('click', sincronizar);
    document.getElementById('btnAbrirModalCadastro').addEventListener('click', abrirCadastro);
    document.getElementById('btnSalvarPaciente').addEventListener('click', salvarPaciente);
    document.getElementById('btnAddEncaminhamento').addEventListener('click', adicionarEncaminhamento);
    
    // Modais
    document.getElementById('btnCancelarCadastro').addEventListener('click', function() {
        document.getElementById('modalCadastro').classList.remove('active');
    });
    document.getElementById('fecharCadastro').addEventListener('click', function() {
        document.getElementById('modalCadastro').classList.remove('active');
    });
    document.getElementById('fecharDetalhes').addEventListener('click', function() {
        document.getElementById('modalDetalhes').classList.remove('active');
    });
    document.getElementById('fecharDetalhesBtn').addEventListener('click', function() {
        document.getElementById('modalDetalhes').classList.remove('active');
    });
    
    // Clique fora do modal
    document.getElementById('modalCadastro').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('active');
    });
    document.getElementById('modalDetalhes').addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('active');
    });
    
    // Enter no campo de encaminhamento
    document.getElementById('modalEncSelect').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btnAddEncaminhamento').click();
        }
    });
}

// ============================================================
// FUNÇÕES DE PACIENTES (CRUD)
// ============================================================

// Abre o modal de cadastro
function abrirCadastro() {
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
    encaminhamentosTemp = [];
    dentesSelecionados = new Set();
    atualizarListaEncaminhamentos();
    renderOdontogramaCadastro();
    document.getElementById('modalCadastro').classList.add('active');
    document.getElementById('modalNome').focus();
}

// Salva paciente (novo ou editado)
async function salvarPaciente() {
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
    if (encaminhamentosTemp.length === 0) { mostrarToast('❌ Adicione pelo menos um encaminhamento', '#7a3a3a'); return; }
    
    const dentesArray = Array.from(dentesSelecionados).sort((a, b) => a - b);
    
    const paciente = {
        nome,
        telefone: telefone || '',
        idade: isNaN(idade) ? null : idade,
        local,
        encaminhamentos: [...encaminhamentosTemp],
        dentes: dentesArray,
        observacao: observacao || '',
        comorbidades: comorbidades,
        medicacoes: medicacoes,
        exames: exames,
        status: status
    };
    
    try {
        let resultado;
        
        if (editId) {
            // Edição
            paciente.id = parseInt(editId);
            const { data, error } = await supabase
                .from('pacientes')
                .update(paciente)
                .eq('id', paciente.id)
                .select();
            
            if (error) throw error;
            
            const index = pacientes.findIndex(p => p.id === paciente.id);
            if (index !== -1) {
                pacientes[index] = data[0];
            }
            resultado = data[0];
            mostrarToast('✅ Paciente atualizado com sucesso!');
        } else {
            // Novo
            const { data, error } = await supabase
                .from('pacientes')
                .insert(paciente)
                .select();
            
            if (error) throw error;
            
            pacientes.push(data[0]);
            resultado = data[0];
            mostrarToast('✅ Paciente cadastrado com sucesso!');
        }
        
        salvarDadosLocal();
        popularSelects();
        renderizarTabela();
        document.getElementById('modalCadastro').classList.remove('active');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        mostrarToast('❌ Erro ao salvar: ' + error.message, '#7a3a3a');
    }
}

// Remove paciente
async function removerPaciente(id) {
    if (!confirm('Remover este paciente?')) return;
    
    try {
        const { error } = await supabase
            .from('pacientes')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        pacientes = pacientes.filter(p => p.id !== id);
        salvarDadosLocal();
        renderizarTabela();
        popularSelects();
        mostrarToast('🗑️ Paciente removido com sucesso!', '#1a4a58');
    } catch (error) {
        console.error('Erro ao deletar:', error);
        mostrarToast('❌ Erro ao remover: ' + error.message, '#7a3a3a');
    }
}

// Altera status do paciente
async function alterarStatus(pacienteId, novoStatus) {
    const paciente = pacientes.find(p => p.id === pacienteId);
    if (!paciente) return;
    
    try {
        const { error } = await supabase
            .from('pacientes')
            .update({ status: novoStatus })
            .eq('id', pacienteId);
        
        if (error) throw error;
        
        paciente.status = novoStatus;
        salvarDadosLocal();
        renderizarTabela();
        
        if (document.getElementById('modalDetalhes').classList.contains('active')) {
            abrirDetalhes(pacienteId);
        }
        
        mostrarToast(`Status alterado para ${STATUS_MAP[novoStatus].label}`);
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        mostrarToast('❌ Erro ao alterar status', '#7a3a3a');
    }
}

// ============================================================
// FUNÇÕES DE DETALHES
// ============================================================

function abrirDetalhes(id) {
    const paciente = pacientes.find(p => p.id === id);
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
    
    renderOdontogramaDetalhes(paciente.dentes);
    document.getElementById('modalDetalhes').classList.add('active');
}

// ============================================================
// FUNÇÕES DE ENCAMINHAMENTOS E EXAMES
// ============================================================

function atualizarListaEncaminhamentos() {
    const modalEncList = document.getElementById('modalEncList');
    modalEncList.innerHTML = '';
    if (encaminhamentosTemp.length === 0) {
        const span = document.createElement('span');
        span.style.color = '#8ba3ae';
        span.style.fontSize = '0.85rem';
        span.textContent = 'Nenhum encaminhamento adicionado';
        modalEncList.appendChild(span);
        return;
    }
    encaminhamentosTemp.forEach((enc, index) => {
        const tag = document.createElement('span');
        tag.className = 'enc-tag';
        tag.innerHTML = `${enc} <i class="fas fa-times-circle" data-index="${index}"></i>`;
        tag.querySelector('i').addEventListener('click', function(e) {
            const idx = parseInt(this.dataset.index);
            encaminhamentosTemp.splice(idx, 1);
            atualizarListaEncaminhamentos();
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
    if (encaminhamentosTemp.includes(valor)) {
        alert('Este encaminhamento já foi adicionado.');
        return;
    }
    encaminhamentosTemp.push(valor);
    atualizarListaEncaminhamentos();
}

function getExamesSelecionados() {
    const selecionados = [];
    document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
        if (cb.checked) selecionados.push(cb.value);
    });
    return selecionados;
}

// ============================================================
// FUNÇÕES DE EDIÇÃO (GLOBAIS)
// ============================================================

window.editarPaciente = function(id) {
    const paciente = pacientes.find(p => p.id === id);
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
    
    encaminhamentosTemp = [...(paciente.encaminhamentos || [])];
    atualizarListaEncaminhamentos();
    
    dentesSelecionados = new Set(paciente.dentes || []);
    renderOdontogramaCadastro();
    
    document.getElementById('modalCadastro').classList.add('active');
};

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
    if (filtroLocal.value !== 'todos') filtrosAplicados.push(`Local: ${filtroLocal.value}`);
    if (filtroEncaminhamento.value !== 'todos') filtrosAplicados.push(`Encaminhamento: ${filtroEncaminhamento.value}`);
    if (filtroStatus.value !== 'todos') {
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
    const dados = pacientes;
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
                        pacientes = dados;
                        salvarDadosLocal();
                        popularSelects();
                        renderizarTabela();
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

// Exporta funções globais
window.removerPaciente = removerPaciente;
window.editarPaciente = window.editarPaciente;
window.abrirCadastro = abrirCadastro;