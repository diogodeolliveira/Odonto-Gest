// ============================================================
// APP.JS — LÓGICA PRINCIPAL (CRUD, MODAIS, FILTROS, PDF, MENU)
// ============================================================
(function() {

    const APP = window.APP;

    // Estado global
    APP.pacientes = APP.pacientes || [];
    APP.dentesSelecionados = new Set();
    APP.encaminhamentosTemp = [];

    // ============================================================
    // INICIALIZAÇÃO
    // ============================================================
    async function init() {
        console.log('🚀 Inicializando OdontoGest...');

        configurarMenuMais();
        configurarBotoesPrincipais();
        configurarModalCadastro();
        configurarModalDetalhes();

        if (typeof APP.configurarBusca === 'function') {
            APP.configurarBusca();
        }

        if (typeof APP.verificarSessao === 'function') {
            await APP.verificarSessao();
        }

        console.log('✅ OdontoGest inicializado!');
    }

    // ============================================================
    // BOTÕES PRINCIPAIS
    // ============================================================
    function configurarBotoesPrincipais() {
        // Botão Novo
        const btnNovo = document.getElementById('btnAbrirModalCadastro');
        if (btnNovo) {
            btnNovo.addEventListener('click', function() {
                abrirModalCadastro(null);
            });
        }

        // Botão Filtrar
        const btnFiltrar = document.getElementById('btnFiltrar');
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', function() {
                APP.renderizarTabela();
            });
        }

        // Botão Limpar Filtros
        const btnLimpar = document.getElementById('btnLimparFiltros');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', function() {
                const filtroLocal = document.getElementById('filtroLocal');
                const filtroEnc = document.getElementById('filtroEncaminhamento');
                const filtroStatus = document.getElementById('filtroStatus');
                if (filtroLocal) filtroLocal.value = 'todos';
                if (filtroEnc) filtroEnc.value = 'todos';
                if (filtroStatus) filtroStatus.value = 'todos';

                const busca = document.getElementById('buscaPacientes');
                const buscaLimpar = document.getElementById('buscaLimpar');
                if (busca) busca.value = '';
                if (buscaLimpar) buscaLimpar.style.display = 'none';

                APP.renderizarTabela();
            });
        }
    }

    // ============================================================
    // MENU MAIS (3 PONTINHOS)
    // ============================================================
    function configurarMenuMais() {
        console.log('🔧 Configurando menu 3 pontinhos...');

        const btnMais = document.getElementById('btnMais');
        const dropdown = document.getElementById('dropdownMais');

        if (!btnMais || !dropdown) {
            console.error('❌ Menu 3 pontinhos não encontrado no HTML');
            return;
        }

        // Remove listeners antigos e recria
        const novoBtnMais = btnMais.cloneNode(true);
        btnMais.parentNode.replaceChild(novoBtnMais, btnMais);

        // Abrir/fechar
        novoBtnMais.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            dropdown.classList.toggle('active');
        });

        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (dropdown.classList.contains('active') &&
                !dropdown.contains(e.target) &&
                e.target !== novoBtnMais) {
                dropdown.classList.remove('active');
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });

        // ---- Logout ----
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            const novoBtnLogout = btnLogout.cloneNode(true);
            btnLogout.parentNode.replaceChild(novoBtnLogout, btnLogout);
            novoBtnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.remove('active');
                setTimeout(() => {
                    if (typeof APP.fazerLogout === 'function') {
                        APP.fazerLogout();
                    }
                }, 100);
            });
        }

        // ---- PDF ----
        const btnPDF = document.getElementById('btnGerarPDF');
        if (btnPDF) {
            const novoBtnPDF = btnPDF.cloneNode(true);
            btnPDF.parentNode.replaceChild(novoBtnPDF, btnPDF);
            novoBtnPDF.addEventListener('click', function() {
                dropdown.classList.remove('active');
                APP.gerarPDF();
            });
        }

        // ---- Exportar ----
        const btnExportar = document.getElementById('btnExportarJSON');
        if (btnExportar) {
            const novoBtnExportar = btnExportar.cloneNode(true);
            btnExportar.parentNode.replaceChild(novoBtnExportar, btnExportar);
            novoBtnExportar.addEventListener('click', function() {
                dropdown.classList.remove('active');
                APP.exportarJSON();
            });
        }

        // ---- Importar ----
        const btnImportar = document.getElementById('btnImportarJSON');
        if (btnImportar) {
            const novoBtnImportar = btnImportar.cloneNode(true);
            btnImportar.parentNode.replaceChild(novoBtnImportar, btnImportar);
            novoBtnImportar.addEventListener('click', function() {
                dropdown.classList.remove('active');
                APP.importarJSON();
            });
        }

        console.log('✅ Menu 3 pontinhos configurado!');
    }

    // ============================================================
    // MODAL DE CADASTRO/EDIÇÃO
    // ============================================================
    function configurarModalCadastro() {
        const modal = document.getElementById('modalCadastro');
        const fecharX = document.getElementById('fecharCadastro');
        const btnCancelar = document.getElementById('btnCancelarCadastro');
        const btnSalvar = document.getElementById('btnSalvarPaciente');
        const btnAddEnc = document.getElementById('btnAddEncaminhamento');

        if (fecharX) fecharX.addEventListener('click', fecharModalCadastro);
        if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCadastro);
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) fecharModalCadastro();
            });
        }
        if (btnSalvar) btnSalvar.addEventListener('click', salvarPaciente);
        if (btnAddEnc) btnAddEnc.addEventListener('click', adicionarEncaminhamento);
    }

    // ============================================================
    // ABRIR MODAL CADASTRO
    // ============================================================
    function abrirModalCadastro(paciente) {
        const modal = document.getElementById('modalCadastro');
        const titulo = document.getElementById('modalTitulo');
        const subtitulo = document.getElementById('modalSubtitulo');

        // Limpa campos
        document.getElementById('modalEditId').value = paciente ? paciente.id : '';
        document.getElementById('modalNome').value = paciente ? (paciente.nome || '') : '';
        document.getElementById('modalTelefone').value = paciente ? (paciente.telefone || '') : '';
        document.getElementById('modalIdade').value = paciente && paciente.idade !== null && paciente.idade !== undefined ? paciente.idade : '';
        document.getElementById('modalLocal').value = paciente ? (paciente.local || '') : '';
        document.getElementById('modalStatus').value = paciente ? (paciente.status || APP.STATUS_PADRAO) : APP.STATUS_PADRAO;
        document.getElementById('modalComorbidades').value = paciente && paciente.comorbidades ? paciente.comorbidades.join(', ') : '';
        document.getElementById('modalMedicacoes').value = paciente && paciente.medicacoes ? paciente.medicacoes.join(', ') : '';
        document.getElementById('modalObservacao').value = paciente ? (paciente.observacao || '') : '';

        // Exames
        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
            cb.checked = !!(paciente && paciente.exames && paciente.exames.includes(cb.value));
        });

        // Encaminhamentos
        APP.encaminhamentosTemp = paciente && paciente.encaminhamentos ? [...paciente.encaminhamentos] : [];
        atualizarListaEncaminhamentos();

        // Odontograma
        APP.dentesSelecionados = new Set(paciente && paciente.dentes ? paciente.dentes : []);
        if (typeof APP.renderOdontogramaCadastro === 'function') {
            APP.renderOdontogramaCadastro();
        }

        // Título
        if (titulo) {
            titulo.innerHTML = paciente ?
                '<i class="fas fa-user-edit"></i> Editar Paciente' :
                '<i class="fas fa-user-plus"></i> Novo Paciente';
        }
        if (subtitulo) {
            subtitulo.textContent = paciente ?
                'Atualize os dados abaixo' :
                'Preencha todos os dados abaixo';
        }

        if (modal) modal.classList.add('active');
        document.getElementById('modalNome').focus();
    }

    // ============================================================
    // FECHAR MODAL CADASTRO
    // ============================================================
    function fecharModalCadastro() {
        const modal = document.getElementById('modalCadastro');
        if (modal) modal.classList.remove('active');
    }

    // ============================================================
    // ENCAMINHAMENTOS
    // ============================================================
    function atualizarListaEncaminhamentos() {
        const lista = document.getElementById('modalEncList');
        if (!lista) return;
        lista.innerHTML = '';

        if (APP.encaminhamentosTemp.length === 0) {
            const span = document.createElement('span');
            span.style.color = '#8ba3ae';
            span.style.fontSize = '0.85rem';
            span.textContent = 'Nenhum encaminhamento adicionado';
            lista.appendChild(span);
            return;
        }

        APP.encaminhamentosTemp.forEach((enc, index) => {
            const tag = document.createElement('span');
            tag.className = 'enc-tag';
            tag.appendChild(document.createTextNode(enc + ' '));

            const icone = document.createElement('i');
            icone.className = 'fas fa-times-circle';
            icone.style.cursor = 'pointer';
            icone.addEventListener('click', function() {
                APP.encaminhamentosTemp.splice(index, 1);
                atualizarListaEncaminhamentos();
            });
            tag.appendChild(icone);
            lista.appendChild(tag);
        });
    }

    function adicionarEncaminhamento() {
        const select = document.getElementById('modalEncSelect');
        if (!select) return;
        let valor = select.value;

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
        atualizarListaEncaminhamentos();
        select.value = '';
    }

    function getExamesSelecionados() {
        const selecionados = [];
        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => {
            if (cb.checked) selecionados.push(cb.value);
        });
        return selecionados;
    }

    // ============================================================
    // SALVAR PACIENTE
    // ============================================================
    async function salvarPaciente() {
        const nome = document.getElementById('modalNome').value.trim();
        const telefone = document.getElementById('modalTelefone').value.trim();
        const idadeRaw = document.getElementById('modalIdade').value;
        const idade = idadeRaw === '' ? null : parseInt(idadeRaw);
        const local = document.getElementById('modalLocal').value.trim();
        const observacao = document.getElementById('modalObservacao').value.trim();
        const comorbidades = document.getElementById('modalComorbidades').value.split(',').map(s => s.trim()).filter(Boolean);
        const medicacoes = document.getElementById('modalMedicacoes').value.split(',').map(s => s.trim()).filter(Boolean);
        const exames = getExamesSelecionados();
        const status = document.getElementById('modalStatus').value;
        const editId = document.getElementById('modalEditId').value;

        // Validações
        if (!nome) {
            APP.mostrarToast('❌ Informe o nome do paciente', '#7a3a3a');
            document.getElementById('modalNome').focus();
            return;
        }
        if (!local) {
            APP.mostrarToast('❌ Informe o local de origem', '#7a3a3a');
            document.getElementById('modalLocal').focus();
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
            idade: (idade === null || isNaN(idade)) ? null : idade,
            local,
            encaminhamentos: [...APP.encaminhamentosTemp],
            dentes: dentesArray,
            observacao: observacao || '',
            comorbidades,
            medicacoes,
            exames,
            status,
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

                const registroAtualizado = (data && data[0]) ? data[0] : paciente;
                const index = APP.pacientes.findIndex(p => p && p.id === paciente.id);
                if (index !== -1) APP.pacientes[index] = registroAtualizado;
                APP.mostrarToast('✅ Paciente atualizado!');
            } else {
                // INSERT
                const { data, error } = await supabase
                    .from('pacientes')
                    .insert(paciente)
                    .select();
                if (error) throw error;

                if (data && data[0]) {
                    APP.pacientes.push(data[0]);
                } else {
                    console.warn('⚠️ INSERT sem retorno. Recarregando...');
                    await APP.carregarPacientes();
                }
                APP.mostrarToast('✅ Paciente cadastrado!');
            }

            APP.salvarDadosLocal();
            APP.popularSelects();
            APP.renderizarTabela();
            fecharModalCadastro();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            APP.mostrarToast('❌ Erro ao salvar: ' + error.message, '#7a3a3a');
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = textoOriginal;
            }
        }
    }

    // ============================================================
    // MODAL DE DETALHES
    // ============================================================
    function configurarModalDetalhes() {
        const modal = document.getElementById('modalDetalhes');
        const fecharX = document.getElementById('fecharDetalhes');
        const fecharBtn = document.getElementById('fecharDetalhesBtn');

        if (fecharX) fecharX.addEventListener('click', fecharModalDetalhes);
        if (fecharBtn) fecharBtn.addEventListener('click', fecharModalDetalhes);
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) fecharModalDetalhes();
            });
        }
    }

    function fecharModalDetalhes() {
        const modal = document.getElementById('modalDetalhes');
        if (modal) modal.classList.remove('active');
    }

    // ============================================================
    // EXPORTAR FUNÇÕES PARA O APP (PÚBLICO)
    // ============================================================
    
    // Compatibilidade com chamadas externas
    APP.abrirCadastro = function() {
        abrirModalCadastro(null);
    };

    // Funções de encaminhamento
    APP.atualizarListaEncaminhamentos = atualizarListaEncaminhamentos;
    APP.adicionarEncaminhamento = adicionarEncaminhamento;
    APP.getExamesSelecionados = getExamesSelecionados;
    APP.salvarPaciente = salvarPaciente;

    // CRUD
    APP.editarPaciente = function(id) {
        const paciente = APP.pacientes.find(p => p && p.id === id);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }
        abrirModalCadastro(paciente);
    };

    APP.removerPaciente = async function(id) {
        const paciente = APP.pacientes.find(p => p && p.id === id);
        if (!paciente) return;

        if (!confirm(`Remover o paciente "${paciente.nome}"? Essa ação não pode ser desfeita.`)) {
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
            APP.popularSelects();
            APP.renderizarTabela();
            APP.mostrarToast('🗑️ Paciente removido', '#1a4a58');
        } catch (error) {
            console.error('Erro ao remover:', error);
            APP.mostrarToast('❌ Erro ao remover: ' + error.message, '#7a3a3a');
        }
    };

    APP.alterarStatus = async function(id, novoStatus) {
        const paciente = APP.pacientes.find(p => p && p.id === id);
        if (!paciente) return;

        const statusAnterior = paciente.status;
        paciente.status = novoStatus;
        paciente.updated_at = new Date().toISOString();
        APP.renderizarTabela();

        try {
            const { error } = await APP.supabase
                .from('pacientes')
                .update({ status: novoStatus, updated_at: paciente.updated_at })
                .eq('id', id);
            if (error) throw error;

            APP.salvarDadosLocal();
            const label = (APP.STATUS_MAP[novoStatus] && APP.STATUS_MAP[novoStatus].label) || novoStatus;
            APP.mostrarToast(`✅ Status alterado para "${label}"`, '#1a6a4a');
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            paciente.status = statusAnterior;
            APP.renderizarTabela();
            APP.mostrarToast('❌ Erro ao alterar status: ' + error.message, '#7a3a3a');
        }
    };

    APP.abrirDetalhes = function(id) {
        const p = APP.pacientes.find(item => item && item.id === id);
        if (!p) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        document.getElementById('detalhesNome').textContent = p.nome || '—';
        document.getElementById('detalhesTelefone').textContent = p.telefone || '—';
        document.getElementById('detalhesIdade').textContent = (p.idade !== null && p.idade !== undefined) ? p.idade : '—';
        document.getElementById('detalhesLocal').textContent = p.local || '—';
        document.getElementById('detalhesStatus').innerHTML = APP.getStatusBadge(p.status, false);
        document.getElementById('detalhesEncaminhamentos').innerHTML = APP.formatarLista(p.encaminhamentos);
        document.getElementById('detalhesComorbidades').innerHTML = APP.formatarLista(p.comorbidades);
        document.getElementById('detalhesMedicacoes').innerHTML = APP.formatarLista(p.medicacoes);
        document.getElementById('detalhesExames').innerHTML = APP.formatarExames(p.exames);
        document.getElementById('detalhesDentes').textContent = APP.formatarDentes(p.dentes);
        document.getElementById('detalhesObservacao').textContent = p.observacao || '—';

        if (typeof APP.renderOdontogramaDetalhes === 'function') {
            APP.renderOdontogramaDetalhes(p.dentes);
        }

        const modal = document.getElementById('modalDetalhes');
        if (modal) modal.classList.add('active');
    };

    // ============================================================
    // GERAR PDF
    // ============================================================
    APP.gerarPDF = async function() {
        const container = document.getElementById('relatorioContainer');
        if (!container || typeof html2canvas === 'undefined' || !window.jspdf) {
            APP.mostrarToast('❌ Biblioteca de PDF não carregada', '#7a3a3a');
            return;
        }

        const filtrados = APP.getPacientesFiltrados();
        const corpo = document.getElementById('relatorioCorpo');
        const dataEl = document.getElementById('relatorioData');
        const filtrosEl = document.getElementById('relatorioFiltros');

        if (dataEl) dataEl.textContent = new Date().toLocaleDateString('pt-BR');
        if (filtrosEl) {
            const filtroLocal = document.getElementById('filtroLocal');
            const filtroStatus = document.getElementById('filtroStatus');
            const partes = [];
            if (filtroLocal && filtroLocal.value !== 'todos') partes.push('Local: ' + filtroLocal.value);
            if (filtroStatus && filtroStatus.value !== 'todos') {
                const info = APP.STATUS_MAP[filtroStatus.value];
                partes.push('Status: ' + (info ? info.label : filtroStatus.value));
            }
            filtrosEl.textContent = partes.length ? partes.join(' · ') : 'Todos os pacientes';
        }

        if (corpo) {
            corpo.innerHTML = filtrados.map((p, i) => {
                const statusInfo = APP.STATUS_MAP[p.status] || { label: p.status || '—' };
                return `
                    <tr>
                        <td>${i + 1}</td>
                        <td>${APP.escapeHTML(p.nome)}</td>
                        <td>${p.idade ?? '—'}</td>
                        <td>${APP.escapeHTML(p.telefone || '—')}</td>
                        <td>${(p.encaminhamentos || []).map(e => APP.escapeHTML(e)).join(', ') || '—'}</td>
                        <td>${statusInfo.label}</td>
                        <td>${APP.formatarDentes(p.dentes)}</td>
                    </tr>
                `;
            }).join('');
        }

        APP.mostrarToast('📄 Gerando PDF...', '#1a4a58');

        try {
            container.style.display = 'block';
            const canvas = await html2canvas(container, { scale: 2 });
            container.style.display = 'none';

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const imgWidth = pageWidth - 20;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const imgData = canvas.toDataURL('image/png');
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= (pdf.internal.pageSize.getHeight() - 20);

            while (heightLeft > 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= (pdf.internal.pageSize.getHeight() - 20);
            }

            pdf.save(`odontogest-relatorio-${new Date().toISOString().slice(0, 10)}.pdf`);
            APP.mostrarToast('✅ PDF gerado!', '#1a6a4a');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            container.style.display = 'none';
            APP.mostrarToast('❌ Erro ao gerar PDF: ' + error.message, '#7a3a3a');
        }
    };

    // ============================================================
    // EXPORTAR / IMPORTAR JSON
    // ============================================================
    APP.exportarJSON = function() {
        const dados = APP.pacientes || [];
        if (dados.length === 0) {
            APP.mostrarToast('ℹ️ Nenhum paciente para exportar', '#8a8a3a');
            return;
        }

        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `odontogest-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        APP.mostrarToast(`📤 ${dados.length} pacientes exportados!`, '#1a6a4a');
    };

    APP.importarJSON = function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.addEventListener('change', function() {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const importados = JSON.parse(e.target.result);
                    if (!Array.isArray(importados)) {
                        throw new Error('Arquivo inválido: esperado uma lista de pacientes');
                    }

                    const validos = APP.sanitizarPacientes(importados);
                    if (validos.length === 0) {
                        APP.mostrarToast('⚠️ Nenhum paciente válido no arquivo', '#8a6a3a');
                        return;
                    }

                    if (!confirm(`Importar ${validos.length} paciente(s)?`)) {
                        return;
                    }

                    const paraInserir = validos.map(p => {
                        const { id, ...resto } = p;
                        return { ...resto, updated_at: new Date().toISOString() };
                    });

                    const { data, error } = await APP.supabase
                        .from('pacientes')
                        .insert(paraInserir)
                        .select();

                    if (error) throw error;

                    if (data && data.length > 0) {
                        APP.pacientes = APP.pacientes.concat(data);
                    } else {
                        await APP.carregarPacientes();
                    }

                    APP.salvarDadosLocal();
                    APP.popularSelects();
                    APP.renderizarTabela();
                    APP.mostrarToast(`📥 ${validos.length} pacientes importados!`, '#1a6a4a');
                } catch (error) {
                    console.error('Erro ao importar:', error);
                    APP.mostrarToast('❌ Erro ao importar: ' + error.message, '#7a3a3a');
                }
            };
            reader.readAsText(file);
        });

        input.click();
    };

    // ============================================================
    // START
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();