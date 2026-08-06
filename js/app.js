// ============================================================
// APP - PONTO DE ENTRADA PRINCIPAL
// ============================================================
(function() {

    const APP = window.APP;

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
            const autenticado = await APP.verificarSessao();

            if (autenticado) {
                APP.configurarBusca();
                APP.renderOdontogramaCadastro();
                APP.configurarEventos();
                initNovasConfiguracoes();

                // Sincronização automática a cada 5 minutos
                setInterval(() => {
                    if (navigator.onLine && APP.usuarioAtual) {
                        APP.sincronizar();
                    }
                }, 300000);

                APP.mostrarToast('📂 Sistema OdontoGest carregado!', '#1a4a58');
            }
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

        const btnNovo = document.getElementById('btnAbrirModalCadastro');
        if (btnNovo) {
            // Remove listeners antigos para evitar duplicação
            const novoBtnNovo = btnNovo.cloneNode(true);
            btnNovo.parentNode.replaceChild(novoBtnNovo, btnNovo);
            novoBtnNovo.addEventListener('click', function() {
                console.log('🟢 Botão NOVO clicado!');
                APP.abrirCadastro();
            });
        }

        const btnSalvar = document.getElementById('btnSalvarPaciente');
        if (btnSalvar) {
            const novoBtnSalvar = btnSalvar.cloneNode(true);
            btnSalvar.parentNode.replaceChild(novoBtnSalvar, btnSalvar);
            novoBtnSalvar.addEventListener('click', function() {
                console.log('🟢 Botão SALVAR clicado!');
                APP.salvarPaciente();
            });
        }

        const btnAddEnc = document.getElementById('btnAddEncaminhamento');
        if (btnAddEnc) {
            const novoBtnAddEnc = btnAddEnc.cloneNode(true);
            btnAddEnc.parentNode.replaceChild(novoBtnAddEnc, btnAddEnc);
            novoBtnAddEnc.addEventListener('click', function() {
                console.log('🟢 Adicionar encaminhamento!');
                APP.adicionarEncaminhamento();
            });
        }

        const btnFiltrar = document.getElementById('btnFiltrar');
        if (btnFiltrar) {
            const novoBtnFiltrar = btnFiltrar.cloneNode(true);
            btnFiltrar.parentNode.replaceChild(novoBtnFiltrar, btnFiltrar);
            novoBtnFiltrar.addEventListener('click', function() {
                console.log('🟢 Filtrar!');
                APP.renderizarTabela();
            });
        }

        const btnLimparFiltros = document.getElementById('btnLimparFiltros');
        if (btnLimparFiltros) {
            const novoBtnLimparFiltros = btnLimparFiltros.cloneNode(true);
            btnLimparFiltros.parentNode.replaceChild(novoBtnLimparFiltros, btnLimparFiltros);
            novoBtnLimparFiltros.addEventListener('click', function() {
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

        // Filtros - usar evento change com debounce
        const filtroLocal = document.getElementById('filtroLocal');
        const filtroEnc = document.getElementById('filtroEncaminhamento');
        const filtroStatus = document.getElementById('filtroStatus');
        
        if (filtroLocal) filtroLocal.addEventListener('change', APP.renderizarTabela);
        if (filtroEnc) filtroEnc.addEventListener('change', APP.renderizarTabela);
        if (filtroStatus) filtroStatus.addEventListener('change', APP.renderizarTabela);

        // Modais
        const btnCancelar = document.getElementById('btnCancelarCadastro');
        if (btnCancelar) {
            const novoBtnCancelar = btnCancelar.cloneNode(true);
            btnCancelar.parentNode.replaceChild(novoBtnCancelar, btnCancelar);
            novoBtnCancelar.addEventListener('click', function() {
                document.getElementById('modalCadastro').classList.remove('active');
            });
        }

        const fecharCadastro = document.getElementById('fecharCadastro');
        if (fecharCadastro) {
            const novoFecharCadastro = fecharCadastro.cloneNode(true);
            fecharCadastro.parentNode.replaceChild(novoFecharCadastro, fecharCadastro);
            novoFecharCadastro.addEventListener('click', function() {
                document.getElementById('modalCadastro').classList.remove('active');
            });
        }

        const fecharDetalhes = document.getElementById('fecharDetalhes');
        if (fecharDetalhes) {
            const novoFecharDetalhes = fecharDetalhes.cloneNode(true);
            fecharDetalhes.parentNode.replaceChild(novoFecharDetalhes, fecharDetalhes);
            novoFecharDetalhes.addEventListener('click', function() {
                document.getElementById('modalDetalhes').classList.remove('active');
            });
        }

        const fecharDetalhesBtn = document.getElementById('fecharDetalhesBtn');
        if (fecharDetalhesBtn) {
            const novoFecharDetalhesBtn = fecharDetalhesBtn.cloneNode(true);
            fecharDetalhesBtn.parentNode.replaceChild(novoFecharDetalhesBtn, fecharDetalhesBtn);
            novoFecharDetalhesBtn.addEventListener('click', function() {
                document.getElementById('modalDetalhes').classList.remove('active');
            });
        }

        // Fechar modais clicando fora
        const modalCadastro = document.getElementById('modalCadastro');
        if (modalCadastro) {
            const novoModalCadastro = modalCadastro.cloneNode(true);
            modalCadastro.parentNode.replaceChild(novoModalCadastro, modalCadastro);
            novoModalCadastro.addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('active');
            });
        }

        const modalDetalhes = document.getElementById('modalDetalhes');
        if (modalDetalhes) {
            const novoModalDetalhes = modalDetalhes.cloneNode(true);
            modalDetalhes.parentNode.replaceChild(novoModalDetalhes, modalDetalhes);
            novoModalDetalhes.addEventListener('click', function(e) {
                if (e.target === this) this.classList.remove('active');
            });
        }

        const modalEncSelect = document.getElementById('modalEncSelect');
        if (modalEncSelect) {
            const novoModalEncSelect = modalEncSelect.cloneNode(true);
            modalEncSelect.parentNode.replaceChild(novoModalEncSelect, modalEncSelect);
            novoModalEncSelect.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    APP.adicionarEncaminhamento();
                }
            });
        }

        console.log('✅ Eventos configurados!');
    };

    // ============================================================
    // FUNÇÕES DE CADASTRO
    // ============================================================

    APP.abrirCadastro = function() {
        console.log('🟢 Abrindo cadastro...');
        const modalEditId = document.getElementById('modalEditId');
        const modalTitulo = document.getElementById('modalTitulo');
        const modalSubtitulo = document.getElementById('modalSubtitulo');
        
        if (modalEditId) modalEditId.value = '';
        if (modalTitulo) modalTitulo.innerHTML = '<i class="fas fa-user-md"></i> Novo Paciente';
        if (modalSubtitulo) modalSubtitulo.textContent = 'Preencha todos os dados abaixo';

        const campos = ['modalNome', 'modalTelefone', 'modalIdade', 'modalLocal', 'modalObservacao', 'modalComorbidades', 'modalMedicacoes'];
        campos.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const modalStatus = document.getElementById('modalStatus');
        if (modalStatus) modalStatus.value = APP.STATUS_PADRAO || 'espera';

        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        APP.encaminhamentosTemp = [];
        APP.dentesSelecionados = new Set();
        APP.atualizarListaEncaminhamentos();
        APP.renderOdontogramaCadastro();
        
        const modalCadastro = document.getElementById('modalCadastro');
        if (modalCadastro) modalCadastro.classList.add('active');
        
        const modalNome = document.getElementById('modalNome');
        if (modalNome) modalNome.focus();
    };

    APP.salvarPaciente = async function() {
        console.log('🟢 Salvando paciente...');
        
        const nome = document.getElementById('modalNome')?.value?.trim() || '';
        const telefone = document.getElementById('modalTelefone')?.value?.trim() || '';
        const idade = parseInt(document.getElementById('modalIdade')?.value) || null;
        const local = document.getElementById('modalLocal')?.value?.trim() || '';
        const observacao = document.getElementById('modalObservacao')?.value?.trim() || '';
        const comorbidades = (document.getElementById('modalComorbidades')?.value || '')
            .split(',').map(s => s.trim()).filter(s => s);
        const medicacoes = (document.getElementById('modalMedicacoes')?.value || '')
            .split(',').map(s => s.trim()).filter(s => s);
        const exames = APP.getExamesSelecionados();
        const status = document.getElementById('modalStatus')?.value || APP.STATUS_PADRAO;
        const editId = document.getElementById('modalEditId')?.value || '';

        // Validações
        if (!nome) { 
            APP.mostrarToast('❌ Informe o nome do paciente', '#7a3a3a'); 
            document.getElementById('modalNome')?.focus(); 
            return; 
        }
        if (!local) { 
            APP.mostrarToast('❌ Informe o local de origem', '#7a3a3a'); 
            document.getElementById('modalLocal')?.focus(); 
            return; 
        }
        if (APP.encaminhamentosTemp.length === 0) { 
            APP.mostrarToast('❌ Adicione pelo menos um encaminhamento', '#7a3a3a'); 
            return; 
        }

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
            status: status,
            updated_at: new Date().toISOString()
        };

        const btnSalvar = document.getElementById('btnSalvarPaciente');
        const textoOriginal = btnSalvar ? btnSalvar.innerHTML : '';
        if (btnSalvar) {
            btnSalvar.disabled = true;
            btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        }

        try {
            const supabase = APP.supabase;
            
            if (editId) {
                // UPDATE
                paciente.id = parseInt(editId);
                const { data, error } = await supabase
                    .from('pacientes')
                    .update(paciente)
                    .eq('id', paciente.id)
                    .select();
                    
                if (error) throw error;
                
                // Verifica se data[0] existe
                if (data && data.length > 0) {
                    const index = APP.pacientes.findIndex(p => p.id === paciente.id);
                    if (index !== -1) {
                        APP.pacientes[index] = data[0];
                    } else {
                        APP.pacientes.push(data[0]);
                    }
                } else {
                    // Se não retornou dados, atualiza localmente
                    const index = APP.pacientes.findIndex(p => p.id === paciente.id);
                    if (index !== -1) {
                        APP.pacientes[index] = paciente;
                    }
                }
                APP.mostrarToast('✅ Paciente atualizado!');
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('pacientes')
                    .insert(paciente)
                    .select();
                    
                if (error) throw error;
                
                if (data && data.length > 0) {
                    APP.pacientes.push(data[0]);
                } else {
                    // Fallback: cria um ID temporário
                    paciente.id = Date.now();
                    APP.pacientes.push(paciente);
                }
                APP.mostrarToast('✅ Paciente cadastrado!');
            }

            APP.salvarDadosLocal();
            APP.popularSelects();
            APP.renderizarTabela();
            
            const modalCadastro = document.getElementById('modalCadastro');
            if (modalCadastro) modalCadastro.classList.remove('active');
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            APP.mostrarToast('❌ Erro ao salvar: ' + error.message, '#7a3a3a');
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = textoOriginal;
            }
        }
    };

    // ============================================================
    // FUNÇÕES DE ENCAMINHAMENTOS E EXAMES
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
            const textoNode = document.createTextNode(enc + ' ');
            tag.appendChild(textoNode);
            const icone = document.createElement('i');
            icone.className = 'fas fa-times-circle';
            icone.dataset.index = index;
            icone.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                APP.encaminhamentosTemp.splice(idx, 1);
                APP.atualizarListaEncaminhamentos();
            });
            tag.appendChild(icone);
            modalEncList.appendChild(tag);
        });
    };

    APP.adicionarEncaminhamento = function() {
        const modalEncSelect = document.getElementById('modalEncSelect');
        if (!modalEncSelect) return;
        
        let valor = modalEncSelect.value;
        
        if (valor === 'outro') {
            const custom = prompt('Digite o nome do encaminhamento:');
            if (custom && custom.trim() !== '') {
                valor = custom.trim();
            } else {
                return;
            }
        }
        
        if (!valor) return;
        
        if (APP.encaminhamentosTemp.includes(valor)) {
            APP.mostrarToast('⚠️ Este encaminhamento já foi adicionado', '#8a6a3a');
            return;
        }
        
        APP.encaminhamentosTemp.push(valor);
        APP.atualizarListaEncaminhamentos();
        
        // Reset select
        modalEncSelect.value = '';
    };

    APP.getExamesSelecionados = function() {
        const selecionados = [];
        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
            if (cb.checked) selecionados.push(cb.value);
        });
        return selecionados;
    };

    // ============================================================
    // FUNÇÕES DE DETALHES, EDIÇÃO E EXCLUSÃO
    // ============================================================

    APP.abrirDetalhes = function(id) {
        const paciente = APP.pacientes.find(p => p && p.id === id);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        const detalhesNome = document.getElementById('detalhesNome');
        const detalhesTelefone = document.getElementById('detalhesTelefone');
        const detalhesIdade = document.getElementById('detalhesIdade');
        const detalhesLocal = document.getElementById('detalhesLocal');
        const detalhesStatus = document.getElementById('detalhesStatus');
        const detalhesEncaminhamentos = document.getElementById('detalhesEncaminhamentos');
        const detalhesComorbidades = document.getElementById('detalhesComorbidades');
        const detalhesMedicacoes = document.getElementById('detalhesMedicacoes');
        const detalhesExames = document.getElementById('detalhesExames');
        const detalhesDentes = document.getElementById('detalhesDentes');
        const detalhesObservacao = document.getElementById('detalhesObservacao');

        if (detalhesNome) detalhesNome.textContent = paciente.nome;
        if (detalhesTelefone) detalhesTelefone.textContent = paciente.telefone || '—';
        if (detalhesIdade) detalhesIdade.textContent = paciente.idade ? `${paciente.idade} anos` : '—';
        if (detalhesLocal) detalhesLocal.innerHTML = `<span class="badge badge-local"><i class="fas fa-map-marker-alt"></i> ${APP.escapeHTML(paciente.local)}</span>`;
        if (detalhesStatus) detalhesStatus.innerHTML = APP.getStatusBadge(paciente.status, false);

        if (detalhesEncaminhamentos) {
            const encBadges = (paciente.encaminhamentos || []).map(e =>
                `<span class="badge badge-encaminhamento"><i class="fas fa-arrow-right"></i> ${APP.escapeHTML(e)}</span>`
            ).join(' ');
            detalhesEncaminhamentos.innerHTML = encBadges || '—';
        }

        if (detalhesComorbidades) detalhesComorbidades.innerHTML = APP.formatarLista(paciente.comorbidades);
        if (detalhesMedicacoes) detalhesMedicacoes.innerHTML = APP.formatarLista(paciente.medicacoes);
        if (detalhesExames) detalhesExames.innerHTML = APP.formatarExames(paciente.exames);

        if (detalhesDentes) {
            const dentesStr = APP.formatarDentes(paciente.dentes);
            detalhesDentes.innerHTML = `<span class="badge badge-odontograma"><i class="fas fa-teeth"></i> ${dentesStr}</span>`;
        }
        
        if (detalhesObservacao) detalhesObservacao.textContent = paciente.observacao || 'Nenhuma observação registrada.';

        APP.renderOdontogramaDetalhes(paciente.dentes);
        
        const modalDetalhes = document.getElementById('modalDetalhes');
        if (modalDetalhes) modalDetalhes.classList.add('active');
    };

    APP.editarPaciente = function(id) {
        console.log('🟢 Editando paciente:', id);
        const paciente = APP.pacientes.find(p => p && p.id === id);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        const modalEditId = document.getElementById('modalEditId');
        const modalTitulo = document.getElementById('modalTitulo');
        const modalSubtitulo = document.getElementById('modalSubtitulo');
        
        if (modalEditId) modalEditId.value = id;
        if (modalTitulo) modalTitulo.innerHTML = '<i class="fas fa-user-edit"></i> Editar Paciente';
        if (modalSubtitulo) modalSubtitulo.textContent = 'Altere os dados necessários abaixo';

        const campos = {
            'modalNome': paciente.nome,
            'modalTelefone': paciente.telefone || '',
            'modalIdade': paciente.idade || '',
            'modalLocal': paciente.local,
            'modalStatus': paciente.status || (APP.STATUS_PADRAO || 'espera'),
            'modalObservacao': paciente.observacao || '',
            'modalComorbidades': (paciente.comorbidades || []).join(', '),
            'modalMedicacoes': (paciente.medicacoes || []).join(', ')
        };

        Object.keys(campos).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = campos[id];
        });

        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
            cb.checked = (paciente.exames || []).includes(cb.value);
        });

        APP.encaminhamentosTemp = [...(paciente.encaminhamentos || [])];
        APP.atualizarListaEncaminhamentos();

        APP.dentesSelecionados = new Set(paciente.dentes || []);
        APP.renderOdontogramaCadastro();

        const modalCadastro = document.getElementById('modalCadastro');
        if (modalCadastro) modalCadastro.classList.add('active');
    };

    APP.removerPaciente = async function(id) {
        console.log('🟢 Removendo paciente:', id);

        if (!confirm('⚠️ Tem certeza que deseja remover este paciente? Esta ação é irreversível.')) {
            APP.mostrarToast('❌ Remoção cancelada', '#7a3a3a');
            return;
        }

        if (!confirm('✅ Confirme novamente: deseja remover permanentemente este paciente?')) {
            APP.mostrarToast('❌ Remoção cancelada', '#7a3a3a');
            return;
        }

        try {
            const { error } = await APP.supabase
                .from('pacientes')
                .delete()
                .eq('id', id);
            if (error) throw error;

            APP.pacientes = APP.pacientes.filter(p => p && p.id !== id);
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
        const paciente = APP.pacientes.find(p => p && p.id === pacienteId);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        try {
            const { error } = await APP.supabase
                .from('pacientes')
                .update({ status: novoStatus, updated_at: new Date().toISOString() })
                .eq('id', pacienteId);
            if (error) throw error;

            paciente.status = novoStatus;
            APP.salvarDadosLocal();
            APP.renderizarTabela();

            // Se o modal de detalhes estiver aberto, atualiza
            const modalDetalhes = document.getElementById('modalDetalhes');
            if (modalDetalhes && modalDetalhes.classList.contains('active')) {
                APP.abrirDetalhes(pacienteId);
            }

            APP.mostrarToast(`Status alterado para ${APP.STATUS_MAP[novoStatus]?.label || novoStatus}`);
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            APP.mostrarToast('❌ Erro ao alterar status', '#7a3a3a');
        }
    };

    // ============================================================
    // FUNÇÕES DE PDF E EXPORT
    // ============================================================

    APP.gerarPDF = function() {
        console.log('🟢 Gerando PDF...');
        const filtrados = APP.getPacientesFiltrados();
        
        if (!filtrados || filtrados.length === 0) {
            APP.mostrarToast('⚠️ Não há pacientes para gerar o relatório', '#8a6a3a');
            return;
        }

        const relatorioData = document.getElementById('relatorioData');
        if (relatorioData) {
            relatorioData.textContent = new Date().toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }

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
        
        const relatorioFiltros = document.getElementById('relatorioFiltros');
        if (relatorioFiltros) {
            relatorioFiltros.textContent = filtrosAplicados.length ? filtrosAplicados.join(' | ') : 'Todos os pacientes';
        }

        let html = '';
        filtrados.forEach((p, index) => {
            const encaminhamentosStr = APP.escapeHTML((p.encaminhamentos || []).join(', '));
            const dentesStr = APP.formatarDentes(p.dentes);
            const statusLabel = APP.STATUS_MAP[p.status]?.label || p.status || '—';
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${APP.escapeHTML(p.nome)}</td>
                    <td>${p.idade || '—'}</td>
                    <td>${APP.escapeHTML(p.telefone || '—')}</td>
                    <td>${encaminhamentosStr || '—'}</td>
                    <td><span class="status-badge-pdf ${APP.STATUS_MAP[p.status]?.pdfClass || ''}">${statusLabel}</span></td>
                    <td>${dentesStr}</td>
                </tr>
            `;
        });
        
        const relatorioCorpo = document.getElementById('relatorioCorpo');
        if (relatorioCorpo) relatorioCorpo.innerHTML = html;

        const element = document.getElementById('relatorioContainer');
        if (!element) {
            APP.mostrarToast('❌ Elemento do relatório não encontrado', '#7a3a3a');
            return;
        }

        // Verifica se html2canvas está disponível
        if (typeof html2canvas === 'undefined') {
            APP.mostrarToast('❌ Biblioteca html2canvas não carregada', '#7a3a3a');
            return;
        }

        html2canvas(element, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
            .then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                if (typeof window.jspdf === 'undefined') {
                    APP.mostrarToast('❌ Biblioteca jsPDF não carregada', '#7a3a3a');
                    return;
                }
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
                APP.mostrarToast('❌ Erro ao gerar o PDF. Tente novamente.', '#7a3a3a');
            });
    };

    APP.exportarJSON = function() {
        console.log('🟢 Exportando dados...');
        const dados = APP.pacientes || [];
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `odontogest_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        APP.mostrarToast('📥 Dados exportados!');
    };

    APP.importarJSON = function() {
        console.log('🟢 Importando dados...');

        if (!confirm('⚠️ ATENÇÃO: Isso substituirá TODOS os pacientes atuais por um arquivo JSON. Deseja continuar?')) {
            APP.mostrarToast('❌ Importação cancelada', '#7a3a3a');
            return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async function(e) {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm(`⚠️ Tem certeza que deseja importar ${file.name}? Isso substituirá todos os dados atuais.`)) {
                APP.mostrarToast('❌ Importação cancelada', '#7a3a3a');
                return;
            }

            const reader = new FileReader();
            reader.onload = async function(ev) {
                try {
                    const dados = JSON.parse(ev.target.result);
                    if (Array.isArray(dados) && dados.length > 0) {
                        if (confirm(`📤 Deseja importar ${dados.length} pacientes?`)) {
                            await APP.enviarParaSupabase(dados);
                            APP.pacientes = APP.sanitizarPacientes(dados);
                            APP.salvarDadosLocal();
                            APP.popularSelects();
                            APP.renderizarTabela();
                            APP.mostrarToast(`📤 ${APP.pacientes.length} pacientes importados!`);
                        }
                    } else {
                        APP.mostrarToast('❌ Arquivo inválido ou vazio', '#7a3a3a');
                    }
                } catch (err) {
                    APP.mostrarToast('❌ Erro ao ler o arquivo. Verifique se é um JSON válido.', '#7a3a3a');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // ============================================================
    // MENU MAIS E SINCRONIZAÇÃO FLUTUANTE (CORRIGIDO)
    // ============================================================

    function configurarMenuMais() {
        console.log('🔧 Configurando menu "Mais"...');
        const btnMais = document.getElementById('btnMais');
        const dropdown = document.getElementById('dropdownMais');

        if (!btnMais || !dropdown) {
            console.warn('⚠️ Menu "Mais" não encontrado no HTML');
            return;
        }

        // Remove listeners antigos clonando
        const novoBtnMais = btnMais.cloneNode(true);
        btnMais.parentNode.replaceChild(novoBtnMais, btnMais);

        // Função para fechar o menu
        const fecharMenu = function() {
            dropdown.classList.remove('active');
        };

        // Abrir/fechar menu
        novoBtnMais.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('active');
            console.log(`🔄 Menu ${dropdown.classList.contains('active') ? 'aberto' : 'fechado'}`);
        });

        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (dropdown.classList.contains('active') && !dropdown.contains(e.target) && e.target !== novoBtnMais) {
                dropdown.classList.remove('active');
            }
        });

        // Fechar ao pressionar ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });

        // Configurar itens do dropdown
        const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            // Remove listeners antigos
            const novoItem = item.cloneNode(true);
            item.parentNode.replaceChild(novoItem, item);
            
            // Adiciona evento para fechar o menu ao clicar
            novoItem.addEventListener('click', function() {
                dropdown.classList.remove('active');
            });
        });

        console.log('✅ Menu "Mais" configurado');
    }

    function configurarSincronizacaoFlutuante() {
        console.log('🔧 Configurando sincronização flutuante...');
        
        // Verifica se já existe
        if (document.getElementById('btnSincronizarFlutuante')) {
            console.log('   - Botão de sincronização já existe');
            return;
        }

        const syncBtn = document.createElement('button');
        syncBtn.id = 'btnSincronizarFlutuante';
        syncBtn.className = 'btn-sync-float';
        syncBtn.innerHTML = '<i class="fas fa-cloud-upload-alt"></i>';
        syncBtn.title = 'Sincronizar com a nuvem';
        syncBtn.setAttribute('aria-label', 'Sincronizar com a nuvem');
        document.body.appendChild(syncBtn);

        syncBtn.addEventListener('click', function() {
            if (typeof APP.sincronizar === 'function') {
                APP.sincronizar();
            } else {
                console.warn('⚠️ APP.sincronizar não disponível');
            }
        });

        console.log('✅ Sincronização flutuante configurada');
    }

    function initNovasConfiguracoes() {
        console.log('🔧 Inicializando novas configurações...');

        configurarMenuMais();
        configurarSincronizacaoFlutuante();

        // Configurar os botões do dropdown manualmente (após a clonagem)
        const btnPDF = document.getElementById('btnGerarPDF');
        if (btnPDF && typeof APP.gerarPDF === 'function') {
            // Remove listener antigo
            const novoBtnPDF = btnPDF.cloneNode(true);
            btnPDF.parentNode.replaceChild(novoBtnPDF, btnPDF);
            novoBtnPDF.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 PDF via menu');
                APP.gerarPDF();
                // Fecha o dropdown
                const dropdown = document.getElementById('dropdownMais');
                if (dropdown) dropdown.classList.remove('active');
            });
            console.log('   - Evento PDF reconectado');
        }

        const btnExportar = document.getElementById('btnExportarJSON');
        if (btnExportar && typeof APP.exportarJSON === 'function') {
            const novoBtnExportar = btnExportar.cloneNode(true);
            btnExportar.parentNode.replaceChild(novoBtnExportar, btnExportar);
            novoBtnExportar.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 Exportar via menu');
                APP.exportarJSON();
                const dropdown = document.getElementById('dropdownMais');
                if (dropdown) dropdown.classList.remove('active');
            });
            console.log('   - Evento Exportar reconectado');
        }

        const btnImportar = document.getElementById('btnImportarJSON');
        if (btnImportar && typeof APP.importarJSON === 'function') {
            const novoBtnImportar = btnImportar.cloneNode(true);
            btnImportar.parentNode.replaceChild(novoBtnImportar, btnImportar);
            novoBtnImportar.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 Importar via menu');
                APP.importarJSON();
                const dropdown = document.getElementById('dropdownMais');
                if (dropdown) dropdown.classList.remove('active');
            });
            console.log('   - Evento Importar reconectado');
        }

        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout && typeof APP.fazerLogout === 'function') {
            const novoBtnLogout = btnLogout.cloneNode(true);
            btnLogout.parentNode.replaceChild(novoBtnLogout, btnLogout);
            novoBtnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🟢 Logout via menu');
                // Fecha o dropdown antes de fazer logout
                const dropdown = document.getElementById('dropdownMais');
                if (dropdown) dropdown.classList.remove('active');
                APP.fazerLogout();
            });
            console.log('   - Evento Logout reconectado');
        }

        console.log('✅ Novas configurações finalizadas!');
    }

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', APP.init);
    } else {
        APP.init();
    }

})();