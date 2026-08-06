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
            console.warn('⚠️ APP.init já foi chamado');
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

                APP.mostrarToast('📂 OdontoGest carregado!', '#1a4a58');
            }
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            APP.mostrarToast('❌ Erro ao carregar o sistema', '#7a3a3a');
        }
    };

    // ============================================================
    // CONFIGURAR EVENTOS
    // ============================================================
    APP.configurarEventos = function() {
        console.log('🔧 Configurando eventos...');

        // Botão Novo
        const btnNovo = document.getElementById('btnAbrirModalCadastro');
        if (btnNovo) {
            btnNovo.addEventListener('click', function() {
                console.log('🟢 Novo paciente');
                APP.abrirCadastro();
            });
        }

        // Botão Salvar
        const btnSalvar = document.getElementById('btnSalvarPaciente');
        if (btnSalvar) {
            btnSalvar.addEventListener('click', function() {
                console.log('🟢 Salvar paciente');
                APP.salvarPaciente();
            });
        }

        // Adicionar Encaminhamento
        const btnAddEnc = document.getElementById('btnAddEncaminhamento');
        if (btnAddEnc) {
            btnAddEnc.addEventListener('click', function() {
                console.log('🟢 Adicionar encaminhamento');
                APP.adicionarEncaminhamento();
            });
        }

        // Filtrar
        const btnFiltrar = document.getElementById('btnFiltrar');
        if (btnFiltrar) {
            btnFiltrar.addEventListener('click', function() {
                console.log('🟢 Filtrar');
                APP.renderizarTabela();
            });
        }

        // Limpar Filtros
        const btnLimparFiltros = document.getElementById('btnLimparFiltros');
        if (btnLimparFiltros) {
            btnLimparFiltros.addEventListener('click', function() {
                console.log('🟢 Limpar filtros');
                const filtroLocal = document.getElementById('filtroLocal');
                const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
                const filtroStatus = document.getElementById('filtroStatus');
                if (filtroLocal) filtroLocal.value = 'todos';
                if (filtroEncaminhamento) filtroEncaminhamento.value = 'todos';
                if (filtroStatus) filtroStatus.value = 'todos';
                APP.renderizarTabela();
            });
        }

        // Filtros change
        document.getElementById('filtroLocal')?.addEventListener('change', APP.renderizarTabela);
        document.getElementById('filtroEncaminhamento')?.addEventListener('change', APP.renderizarTabela);
        document.getElementById('filtroStatus')?.addEventListener('change', APP.renderizarTabela);

        // Fechar modais
        document.getElementById('btnCancelarCadastro')?.addEventListener('click', () => {
            document.getElementById('modalCadastro').classList.remove('active');
        });
        document.getElementById('fecharCadastro')?.addEventListener('click', () => {
            document.getElementById('modalCadastro').classList.remove('active');
        });
        document.getElementById('fecharDetalhes')?.addEventListener('click', () => {
            document.getElementById('modalDetalhes').classList.remove('active');
        });
        document.getElementById('fecharDetalhesBtn')?.addEventListener('click', () => {
            document.getElementById('modalDetalhes').classList.remove('active');
        });

        // Fechar modais ao clicar fora
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
    // ABRIR CADASTRO
    // ============================================================
    APP.abrirCadastro = function() {
        console.log('🟢 Abrindo cadastro...');
        document.getElementById('modalEditId').value = '';
        document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-user-md"></i> Novo Paciente';
        document.getElementById('modalSubtitulo').textContent = 'Preencha todos os dados abaixo';

        ['modalNome', 'modalTelefone', 'modalIdade', 'modalLocal', 'modalObservacao', 
         'modalComorbidades', 'modalMedicacoes'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        document.getElementById('modalStatus').value = APP.STATUS_PADRAO || 'espera';
        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]').forEach(cb => cb.checked = false);
        
        APP.encaminhamentosTemp = [];
        APP.dentesSelecionados = new Set();
        APP.atualizarListaEncaminhamentos();
        APP.renderOdontogramaCadastro();
        
        document.getElementById('modalCadastro').classList.add('active');
        document.getElementById('modalNome').focus();
    };

    // ============================================================
    // SALVAR PACIENTE
    // ============================================================
    APP.salvarPaciente = async function() {
        console.log('🟢 Salvando paciente...');
        
        const nome = document.getElementById('modalNome').value.trim();
        const telefone = document.getElementById('modalTelefone').value.trim();
        const idade = parseInt(document.getElementById('modalIdade').value) || null;
        const local = document.getElementById('modalLocal').value.trim();
        const observacao = document.getElementById('modalObservacao').value.trim();
        const comorbidades = document.getElementById('modalComorbidades').value.split(',').map(s => s.trim()).filter(s => s);
        const medicacoes = document.getElementById('modalMedicacoes').value.split(',').map(s => s.trim()).filter(s => s);
        const exames = APP.getExamesSelecionados();
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
            idade: idade,
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
        const textoOriginal = btnSalvar.innerHTML;
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';

        try {
            let result;
            
            if (editId) {
                // UPDATE
                paciente.id = parseInt(editId);
                result = await supabase
                    .from('pacientes')
                    .update(paciente)
                    .eq('id', paciente.id)
                    .select();
            } else {
                // INSERT
                result = await supabase
                    .from('pacientes')
                    .insert(paciente)
                    .select();
            }

            if (result.error) throw result.error;

            const data = result.data;
            if (data && data.length > 0) {
                const saved = data[0];
                if (editId) {
                    const index = APP.pacientes.findIndex(p => p.id === saved.id);
                    if (index !== -1) {
                        APP.pacientes[index] = saved;
                    } else {
                        APP.pacientes.push(saved);
                    }
                } else {
                    APP.pacientes.push(saved);
                }
            }

            APP.salvarDadosLocal();
            APP.popularSelects();
            APP.renderizarTabela();
            document.getElementById('modalCadastro').classList.remove('active');
            APP.mostrarToast(editId ? '✅ Paciente atualizado!' : '✅ Paciente cadastrado!');

        } catch (error) {
            console.error('Erro ao salvar:', error);
            APP.mostrarToast(`❌ ${error.message}`, '#7a3a3a');
        } finally {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = textoOriginal;
        }
    };

    // ============================================================
    // ENCAMINHAMENTOS
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
            tag.textContent = enc;
            
            const icone = document.createElement('i');
            icone.className = 'fas fa-times-circle';
            icone.style.marginLeft = '6px';
            icone.style.cursor = 'pointer';
            icone.addEventListener('click', function() {
                APP.encaminhamentosTemp.splice(index, 1);
                APP.atualizarListaEncaminhamentos();
            });
            
            tag.appendChild(icone);
            modalEncList.appendChild(tag);
        });
    };

    APP.adicionarEncaminhamento = function() {
        const select = document.getElementById('modalEncSelect');
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
        APP.atualizarListaEncaminhamentos();
        select.value = '';
    };

    APP.getExamesSelecionados = function() {
        const selecionados = [];
        document.querySelectorAll('#examesCheckboxGroup input[type="checkbox"]:checked').forEach(cb => {
            selecionados.push(cb.value);
        });
        return selecionados;
    };

    // ============================================================
    // DETALHES, EDIÇÃO E EXCLUSÃO
    // ============================================================
    APP.abrirDetalhes = function(id) {
        const paciente = APP.pacientes.find(p => p.id === id);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        document.getElementById('detalhesNome').textContent = paciente.nome;
        document.getElementById('detalhesTelefone').textContent = paciente.telefone || '—';
        document.getElementById('detalhesIdade').textContent = paciente.idade ? `${paciente.idade} anos` : '—';
        document.getElementById('detalhesLocal').innerHTML = `<span class="badge badge-local"><i class="fas fa-map-marker-alt"></i> ${APP.escapeHTML(paciente.local)}</span>`;
        document.getElementById('detalhesStatus').innerHTML = APP.getStatusBadge(paciente.status, false);

        const encBadges = (paciente.encaminhamentos || []).map(e =>
            `<span class="badge badge-encaminhamento"><i class="fas fa-arrow-right"></i> ${APP.escapeHTML(e)}</span>`
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
        const paciente = APP.pacientes.find(p => p.id === id);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        document.getElementById('modalEditId').value = id;
        document.getElementById('modalTitulo').innerHTML = '<i class="fas fa-user-edit"></i> Editar Paciente';
        document.getElementById('modalSubtitulo').textContent = 'Altere os dados necessários abaixo';

        document.getElementById('modalNome').value = paciente.nome;
        document.getElementById('modalTelefone').value = paciente.telefone || '';
        document.getElementById('modalIdade').value = paciente.idade || '';
        document.getElementById('modalLocal').value = paciente.local;
        document.getElementById('modalStatus').value = paciente.status || APP.STATUS_PADRAO;
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
        if (!confirm('⚠️ Tem certeza que deseja remover este paciente?')) {
            APP.mostrarToast('❌ Remoção cancelada', '#7a3a3a');
            return;
        }

        if (!confirm('✅ Confirme novamente: deseja remover permanentemente?')) {
            APP.mostrarToast('❌ Remoção cancelada', '#7a3a3a');
            return;
        }

        try {
            const { error } = await supabase.from('pacientes').delete().eq('id', id);
            if (error) throw error;

            APP.pacientes = APP.pacientes.filter(p => p.id !== id);
            APP.salvarDadosLocal();
            APP.renderizarTabela();
            APP.popularSelects();
            APP.mostrarToast('🗑️ Paciente removido!', '#1a4a58');
        } catch (error) {
            console.error('Erro ao deletar:', error);
            APP.mostrarToast(`❌ ${error.message}`, '#7a3a3a');
        }
    };

    APP.alterarStatus = async function(pacienteId, novoStatus) {
        const paciente = APP.pacientes.find(p => p.id === pacienteId);
        if (!paciente) {
            APP.mostrarToast('❌ Paciente não encontrado', '#7a3a3a');
            return;
        }

        try {
            const { error } = await supabase
                .from('pacientes')
                .update({ status: novoStatus, updated_at: new Date().toISOString() })
                .eq('id', pacienteId);
                
            if (error) throw error;

            paciente.status = novoStatus;
            APP.salvarDadosLocal();
            APP.renderizarTabela();

            const modalDetalhes = document.getElementById('modalDetalhes');
            if (modalDetalhes && modalDetalhes.classList.contains('active')) {
                APP.abrirDetalhes(pacienteId);
            }

            const label = APP.STATUS_MAP[novoStatus]?.label || novoStatus;
            APP.mostrarToast(`Status alterado para ${label}`);
        } catch (error) {
            console.error('Erro ao alterar status:', error);
            APP.mostrarToast(`❌ ${error.message}`, '#7a3a3a');
        }
    };

    // ============================================================
    // PDF E EXPORT
    // ============================================================
    APP.gerarPDF = function() {
        const filtrados = APP.getPacientesFiltrados();
        if (!filtrados || filtrados.length === 0) {
            APP.mostrarToast('⚠️ Não há pacientes para o relatório', '#8a6a3a');
            return;
        }

        document.getElementById('relatorioData').textContent = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        const filtros = [];
        const filtroLocal = document.getElementById('filtroLocal');
        const filtroEnc = document.getElementById('filtroEncaminhamento');
        const filtroStatus = document.getElementById('filtroStatus');
        
        if (filtroLocal && filtroLocal.value !== 'todos') filtros.push(`Local: ${filtroLocal.value}`);
        if (filtroEnc && filtroEnc.value !== 'todos') filtros.push(`Encaminhamento: ${filtroEnc.value}`);
        if (filtroStatus && filtroStatus.value !== 'todos') {
            filtros.push(`Status: ${APP.STATUS_MAP[filtroStatus.value]?.label || filtroStatus.value}`);
        }
        document.getElementById('relatorioFiltros').textContent = filtros.length ? filtros.join(' | ') : 'Todos os pacientes';

        let html = '';
        filtrados.forEach((p, index) => {
            const statusLabel = APP.STATUS_MAP[p.status]?.label || p.status || '—';
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${APP.escapeHTML(p.nome)}</td>
                    <td>${p.idade || '—'}</td>
                    <td>${APP.escapeHTML(p.telefone || '—')}</td>
                    <td>${APP.escapeHTML((p.encaminhamentos || []).join(', ')) || '—'}</td>
                    <td><span class="status-badge-pdf ${APP.STATUS_MAP[p.status]?.pdfClass || ''}">${statusLabel}</span></td>
                    <td>${APP.formatarDentes(p.dentes)}</td>
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
                APP.mostrarToast('❌ Erro ao gerar o PDF', '#7a3a3a');
            });
    };

    APP.exportarJSON = function() {
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
        if (!confirm('⚠️ ATENÇÃO: Isso substituirá TODOS os pacientes atuais. Deseja continuar?')) {
            APP.mostrarToast('❌ Importação cancelada', '#7a3a3a');
            return;
        }

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
                        if (!confirm(`📤 Importar ${dados.length} pacientes?`)) return;
                        
                        const { error } = await supabase
                            .from('pacientes')
                            .upsert(dados, { onConflict: 'id' });
                            
                        if (error) throw error;
                        
                        APP.pacientes = APP.sanitizarPacientes(dados);
                        APP.salvarDadosLocal();
                        APP.popularSelects();
                        APP.renderizarTabela();
                        APP.mostrarToast(`📤 ${APP.pacientes.length} pacientes importados!`);
                    } else {
                        APP.mostrarToast('❌ Arquivo inválido ou vazio', '#7a3a3a');
                    }
                } catch (err) {
                    APP.mostrarToast('❌ Erro ao ler o arquivo', '#7a3a3a');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    };

    // ============================================================
    // MENU MAIS (3 PONTINHOS) - CONFIGURAÇÃO
    // ============================================================
    function configurarMenuMais() {
        console.log('🔧 Configurando menu 3 pontinhos...');
        
        const btnMais = document.getElementById('btnMais');
        const dropdown = document.getElementById('dropdownMais');

        if (!btnMais || !dropdown) {
            console.error('❌ Menu 3 pontinhos não encontrado no HTML');
            return;
        }

        // Remover listeners antigos (prevenir duplicação)
        const novoBtnMais = btnMais.cloneNode(true);
        btnMais.parentNode.replaceChild(novoBtnMais, btnMais);

        // Abrir/fechar ao clicar no botão
        novoBtnMais.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            dropdown.classList.toggle('active');
            console.log(`🔄 Menu ${dropdown.classList.contains('active') ? 'aberto' : 'fechado'}`);
        });

        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (dropdown.classList.contains('active') && 
                !dropdown.contains(e.target) && 
                e.target !== novoBtnMais) {
                dropdown.classList.remove('active');
            }
        });

        // Fechar ao pressionar ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });

        // Fechar ao clicar em qualquer item e executar ação
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            const novoItem = item.cloneNode(true);
            item.parentNode.replaceChild(novoItem, item);
            
            novoItem.addEventListener('click', function() {
                dropdown.classList.remove('active');
            });
        });

        console.log('✅ Menu 3 pontinhos configurado!');
    }

    function configurarSincronizacaoFlutuante() {
        console.log('🔧 Configurando sincronização flutuante...');
        
        if (document.getElementById('btnSincronizarFlutuante')) {
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
            }
        });

        console.log('✅ Sincronização flutuante configurada');
    }

    function initNovasConfiguracoes() {
        console.log('🔧 Inicializando configurações...');
        
        // Configurar menu 3 pontinhos
        configurarMenuMais();
        
        // Configurar botão de sincronização
        configurarSincronizacaoFlutuante();
        
        console.log('✅ Configurações finalizadas!');
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