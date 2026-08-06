// ============================================================
// INTERFACE - UI
// ============================================================
(function() {

    const APP = window.APP;
    let termoBusca = '';
    let timeoutBusca = null;

    // ============================================================
    // CONFIGURAR BUSCA
    // ============================================================
    APP.configurarBusca = function() {
        const buscaInput = document.getElementById('buscaPacientes');
        const buscaLimpar = document.getElementById('buscaLimpar');
        if (!buscaInput) return;

        buscaInput.addEventListener('input', function() {
            clearTimeout(timeoutBusca);
            timeoutBusca = setTimeout(() => {
                termoBusca = this.value;
                if (buscaLimpar) buscaLimpar.style.display = termoBusca ? 'inline' : 'none';
                APP.renderizarTabela();
            }, 300);
        });

        if (buscaLimpar) {
            buscaLimpar.addEventListener('click', function() {
                buscaInput.value = '';
                termoBusca = '';
                this.style.display = 'none';
                clearTimeout(timeoutBusca);
                APP.renderizarTabela();
                buscaInput.focus();
            });
        }

        buscaInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                this.value = '';
                termoBusca = '';
                if (buscaLimpar) buscaLimpar.style.display = 'none';
                clearTimeout(timeoutBusca);
                APP.renderizarTabela();
                this.blur();
            }
        });
    };

    // ============================================================
    // POPULAR SELECTS
    // ============================================================
    APP.popularStatusSelects = function() {
        const STATUS_MAP = APP.STATUS_MAP || {};
        const STATUS_KEYS = APP.STATUS_KEYS || [];
        const padrao = APP.STATUS_PADRAO || 'espera';

        const modalStatus = document.getElementById('modalStatus');
        if (modalStatus && modalStatus.options.length === 0) {
            STATUS_KEYS.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = STATUS_MAP[key]?.label || key;
                if (key === padrao) opt.selected = true;
                modalStatus.appendChild(opt);
            });
        }

        const filtroStatus = document.getElementById('filtroStatus');
        if (filtroStatus && filtroStatus.options.length <= 1) {
            STATUS_KEYS.forEach(key => {
                const opt = document.createElement('option');
                opt.value = key;
                opt.textContent = STATUS_MAP[key]?.label || key;
                filtroStatus.appendChild(opt);
            });
        }
    };

    APP.popularSelects = function() {
        const pacientes = APP.pacientes || [];
        const filtroLocal = document.getElementById('filtroLocal');
        const filtroEnc = document.getElementById('filtroEncaminhamento');

        if (!filtroLocal && !filtroEnc) return;

        const locais = [...new Set(pacientes.map(p => p && p.local).filter(Boolean))].sort();
        if (filtroLocal) {
            const current = filtroLocal.value;
            filtroLocal.innerHTML = '<option value="todos">Todos os locais</option>';
            locais.forEach(local => {
                const opt = document.createElement('option');
                opt.value = local;
                opt.textContent = local;
                filtroLocal.appendChild(opt);
            });
            if (locais.includes(current)) filtroLocal.value = current;
        }

        const encs = [...new Set(pacientes.flatMap(p => p && p.encaminhamentos || []))].sort();
        if (filtroEnc) {
            const current = filtroEnc.value;
            filtroEnc.innerHTML = '<option value="todos">Todos</option>';
            encs.forEach(enc => {
                const opt = document.createElement('option');
                opt.value = enc;
                opt.textContent = enc;
                filtroEnc.appendChild(opt);
            });
            if (encs.includes(current)) filtroEnc.value = current;
        }
    };

    // ============================================================
    // FILTRAR PACIENTES
    // ============================================================
    APP.getPacientesFiltrados = function() {
        const pacientes = APP.pacientes || [];
        const filtroLocal = document.getElementById('filtroLocal');
        const filtroEnc = document.getElementById('filtroEncaminhamento');
        const filtroStatus = document.getElementById('filtroStatus');

        let filtrados = pacientes;

        if (filtroLocal && filtroLocal.value !== 'todos') {
            filtrados = filtrados.filter(p => p.local === filtroLocal.value);
        }
        if (filtroEnc && filtroEnc.value !== 'todos') {
            filtrados = filtrados.filter(p => p.encaminhamentos && p.encaminhamentos.includes(filtroEnc.value));
        }
        if (filtroStatus && filtroStatus.value !== 'todos') {
            filtrados = filtrados.filter(p => p.status === filtroStatus.value);
        }

        const termo = termoBusca.toLowerCase().trim();
        if (termo) {
            filtrados = filtrados.filter(p => {
                return (p.nome && p.nome.toLowerCase().includes(termo)) ||
                       (p.telefone && p.telefone.includes(termo)) ||
                       (p.local && p.local.toLowerCase().includes(termo));
            });
        }

        return filtrados;
    };

    // ============================================================
    // RENDERIZAR TABELA
    // ============================================================
    APP.renderizarTabela = function() {
        const corpoTabela = document.getElementById('corpoTabela');
        const contador = document.getElementById('contadorRegistros');
        if (!corpoTabela) return;

        const filtrados = APP.getPacientesFiltrados();

        if (!filtrados || filtrados.length === 0) {
            const msg = termoBusca ? 
                `<i class="fas fa-search"></i> Nenhum paciente encontrado para "${APP.escapeHTML(termoBusca)}"` :
                `<i class="fas fa-info-circle"></i> Nenhum paciente cadastrado.`;
            corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-message">${msg}</td></tr>`;
            if (contador) contador.textContent = '0 pacientes';
            return;
        }

        let html = '';
        const STATUS_MAP = APP.STATUS_MAP || {};
        const STATUS_KEYS = APP.STATUS_KEYS || [];

        filtrados.forEach(p => {
            const encBadges = (p.encaminhamentos || []).map(e =>
                `<span class="badge badge-encaminhamento"><i class="fas fa-arrow-right"></i> ${APP.escapeHTML(e)}</span>`
            ).join(' ');

            const statusInfo = STATUS_MAP[p.status] || { label: p.status || '—', class: 'status-padrao' };

            html += `
                <tr>
                    <td>
                        <span class="nome-clicavel" data-id="${p.id}">
                            <i class="fas fa-user-circle"></i> ${APP.escapeHTML(p.nome)}
                        </span>
                    </td>
                    <td><span class="badge badge-local"><i class="fas fa-map-marker-alt"></i> ${APP.escapeHTML(p.local)}</span></td>
                    <td>${encBadges || '<span style="color:#999;font-size:0.75rem;">—</span>'}</td>
                    <td>
                        <div class="status-dropdown">
                            <span class="badge ${statusInfo.class} status-badge" data-id="${p.id}" style="cursor:pointer;">
                                ${statusInfo.label} <i class="fas fa-chevron-down" style="font-size:0.6rem;margin-left:4px;"></i>
                            </span>
                            <div class="status-dropdown-content" data-id="${p.id}">
                                ${STATUS_KEYS.map(s => {
                                    const info = STATUS_MAP[s];
                                    return `<div class="status-option" data-status="${s}" data-id="${p.id}">
                                        <span class="dot ${info ? info.dot : ''}"></span> ${info ? info.label : s}
                                    </div>`;
                                }).join('')}
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="acoes-cell">
                            <button class="btn btn-edit" data-id="${p.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-outline" data-id="${p.id}" style="padding:0.2rem 0.7rem;font-size:0.75rem;">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        corpoTabela.innerHTML = html;
        if (contador) contador.textContent = `${filtrados.length} paciente${filtrados.length > 1 ? 's' : ''}`;

        // Eventos
        document.querySelectorAll('.nome-clicavel').forEach(el => {
            el.addEventListener('click', function() {
                APP.abrirDetalhes(parseInt(this.dataset.id));
            });
        });

        document.querySelectorAll('.btn-edit').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                APP.editarPaciente(parseInt(this.dataset.id));
            });
        });

        document.querySelectorAll('.acoes-cell .btn-outline').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                APP.removerPaciente(parseInt(this.dataset.id));
            });
        });

        document.querySelectorAll('.status-badge').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const dropdown = this.closest('.status-dropdown').querySelector('.status-dropdown-content');
                document.querySelectorAll('.status-dropdown-content').forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                dropdown.classList.toggle('active');
            });
        });

        document.querySelectorAll('.status-option').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                APP.alterarStatus(parseInt(this.dataset.id), this.dataset.status);
                this.closest('.status-dropdown-content').classList.remove('active');
            });
        });
    };

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', function() {
        document.querySelectorAll('.status-dropdown-content').forEach(d => d.classList.remove('active'));
    });

    // ============================================================
    // UTILITÁRIOS
    // ============================================================
    APP.getStatusBadge = function(status, clickable = true) {
        const s = APP.STATUS_MAP[status];
        if (!s) return `<span class="badge status-padrao">${status || '—'}</span>`;
        const clickClass = clickable ? ' status-badge' : '';
        return `<span class="badge ${s.class}${clickClass}">${s.label}</span>`;
    };

    APP.mostrarToast = function(mensagem, cor = '#1a4a58') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = mensagem;
        toast.style.background = cor;
        toast.classList.add('show');
        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    APP.formatarDentes = function(dentes) {
        if (!dentes || dentes.length === 0) return '—';
        return [...dentes].sort((a, b) => a - b).join(', ');
    };

    APP.formatarLista = function(arr) {
        if (!arr || arr.length === 0) return '—';
        return arr.map(item => `<span class="badge badge-comorbidade">${APP.escapeHTML(item)}</span>`).join(' ');
    };

    APP.formatarExames = function(arr) {
        if (!arr || arr.length === 0) return '—';
        return arr.map(item => `<span class="badge badge-exame"><i class="fas fa-check-circle"></i> ${APP.escapeHTML(item)}</span>`).join(' ');
    };

})();