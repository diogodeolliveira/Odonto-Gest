// ============================================================
// FUNÇÕES DE INTERFACE - UI
// ============================================================

let termoBusca = '';

// ============================================================
// FUNÇÃO DE BUSCA
// ============================================================

// Filtra pacientes por termo de busca
function filtrarPorBusca(pacientesLista) {
    const termo = termoBusca.toLowerCase().trim();
    if (!termo) return pacientesLista;
    
    return pacientesLista.filter(p => {
        return p.nome.toLowerCase().includes(termo) ||
               (p.telefone && p.telefone.includes(termo)) ||
               p.local.toLowerCase().includes(termo);
    });
}

// Configura a barra de busca
function configurarBusca() {
    const buscaInput = document.getElementById('buscaPacientes');
    const buscaLimpar = document.getElementById('buscaLimpar');
    
    if (!buscaInput) return;
    
    buscaInput.addEventListener('input', function() {
        termoBusca = this.value;
        if (buscaLimpar) {
            buscaLimpar.style.display = termoBusca ? 'inline' : 'none';
        }
        renderizarTabela();
    });
    
    if (buscaLimpar) {
        buscaLimpar.addEventListener('click', function() {
            buscaInput.value = '';
            termoBusca = '';
            this.style.display = 'none';
            renderizarTabela();
            buscaInput.focus();
        });
    }
    
    buscaInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            termoBusca = '';
            if (buscaLimpar) {
                buscaLimpar.style.display = 'none';
            }
            renderizarTabela();
            this.blur();
        }
    });
}

// ============================================================
// FUNÇÕES DE RENDERIZAÇÃO
// ============================================================

function getPacientesFiltrados() {
    const pacientes = window.pacientes || [];
    const filtroLocal = document.getElementById('filtroLocal');
    const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
    const filtroStatus = document.getElementById('filtroStatus');

    const localFiltro = filtroLocal ? filtroLocal.value : 'todos';
    const encFiltro = filtroEncaminhamento ? filtroEncaminhamento.value : 'todos';
    const statusFiltro = filtroStatus ? filtroStatus.value : 'todos';

    let filtrados = pacientes;
    if (localFiltro !== 'todos') {
        filtrados = filtrados.filter(p => p.local === localFiltro);
    }
    if (encFiltro !== 'todos') {
        filtrados = filtrados.filter(p => p.encaminhamentos && p.encaminhamentos.includes(encFiltro));
    }
    if (statusFiltro !== 'todos') {
        filtrados = filtrados.filter(p => p.status === statusFiltro);
    }
    
    return filtrarPorBusca(filtrados);
}

function renderizarTabela() {
    const corpoTabela = document.getElementById('corpoTabela');
    const contadorRegistros = document.getElementById('contadorRegistros');
    const filtrados = getPacientesFiltrados();

    if (!corpoTabela) return;

    if (filtrados.length === 0) {
        const mensagem = termoBusca ? 
            `<i class="fas fa-search"></i> Nenhum paciente encontrado para "${termoBusca}"` :
            `<i class="fas fa-info-circle"></i> Nenhum paciente cadastrado.`;
        corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-message">${mensagem}</td></tr>`;
        if (contadorRegistros) contadorRegistros.textContent = '0 pacientes';
        return;
    }

    let html = '';
    const STATUS_MAP = window.STATUS_MAP || {};
    const STATUS_KEYS = window.STATUS_KEYS || [];

    filtrados.forEach(p => {
        const encBadges = (p.encaminhamentos || []).map(e =>
            `<span class="badge badge-encaminhamento"><i class="fas fa-arrow-right"></i> ${e}</span>`
        ).join(' ');

        const statusInfo = STATUS_MAP[p.status] || { label: p.status || '—', class: 'status-padrao' };

        html += `
            <tr>
                <td>
                    <span class="nome-clicavel" data-id="${p.id}">
                        <i class="fas fa-user-circle"></i> ${p.nome}
                    </span>
                </td>
                <td><span class="badge badge-local"><i class="fas fa-map-marker-alt"></i> ${p.local}</span></td>
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
                        <button class="btn btn-edit" onclick="editarPaciente(${p.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline" style="padding: 0.2rem 0.7rem; font-size: 0.75rem;" onclick="removerPaciente(${p.id})">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    corpoTabela.innerHTML = html;
    if (contadorRegistros) contadorRegistros.textContent = `${filtrados.length} paciente${filtrados.length > 1 ? 's' : ''}`;

    // Eventos da tabela
    document.querySelectorAll('.nome-clicavel').forEach(el => {
        el.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            if (typeof abrirDetalhes === 'function') {
                abrirDetalhes(id);
            }
        });
    });

    document.querySelectorAll('.status-badge').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = this.dataset.id;
            const dropdown = this.closest('.status-dropdown').querySelector('.status-dropdown-content');
            document.querySelectorAll('.status-dropdown-content').forEach(d => {
                if (d !== dropdown) d.classList.remove('active');
            });
            if (dropdown) dropdown.classList.toggle('active');
        });
    });

    document.querySelectorAll('.status-option').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const status = this.dataset.status;
            if (typeof alterarStatus === 'function') {
                alterarStatus(id, status);
            }
            const dropdown = this.closest('.status-dropdown-content');
            if (dropdown) dropdown.classList.remove('active');
        });
    });

    document.addEventListener('click', function() {
        document.querySelectorAll('.status-dropdown-content').forEach(d => d.classList.remove('active'));
    });
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

function getStatusBadge(status, clickable = true) {
    const STATUS_MAP = window.STATUS_MAP || {};
    const s = STATUS_MAP[status];
    if (!s) return `<span class="badge status-padrao">${status || '—'}</span>`;
    const clickClass = clickable ? ' status-badge' : '';
    return `<span class="badge ${s.class}${clickClass}" data-status="${status}">${s.label}</span>`;
}

function getLocais() {
    const pacientes = window.pacientes || [];
    const locais = new Set();
    pacientes.forEach(p => locais.add(p.local));
    return Array.from(locais).sort();
}

function getTodosEncaminhamentos() {
    const pacientes = window.pacientes || [];
    const encSet = new Set();
    pacientes.forEach(p => (p.encaminhamentos || []).forEach(e => encSet.add(e)));
    return Array.from(encSet).sort();
}

function popularSelects() {
    const filtroLocal = document.getElementById('filtroLocal');
    const filtroEncaminhamento = document.getElementById('filtroEncaminhamento');
    
    if (!filtroLocal && !filtroEncaminhamento) return;

    const locais = getLocais();
    const localAtual = filtroLocal ? filtroLocal.value : 'todos';
    if (filtroLocal) {
        filtroLocal.innerHTML = '<option value="todos">Todos os locais</option>';
        locais.forEach(local => {
            const opt = document.createElement('option');
            opt.value = local;
            opt.textContent = local;
            filtroLocal.appendChild(opt);
        });
        if (locais.includes(localAtual)) filtroLocal.value = localAtual;
    }

    const encs = getTodosEncaminhamentos();
    const encAtual = filtroEncaminhamento ? filtroEncaminhamento.value : 'todos';
    if (filtroEncaminhamento) {
        filtroEncaminhamento.innerHTML = '<option value="todos">Todos</option>';
        encs.forEach(enc => {
            const opt = document.createElement('option');
            opt.value = enc;
            opt.textContent = enc;
            filtroEncaminhamento.appendChild(opt);
        });
        if (encs.includes(encAtual)) filtroEncaminhamento.value = encAtual;
    }
}

function formatarDentes(dentes) {
    if (!dentes || dentes.length === 0) return '—';
    return dentes.sort((a, b) => a - b).join(', ');
}

function formatarLista(arr) {
    if (!arr || arr.length === 0) return '—';
    return arr.map(item => `<span class="badge badge-comorbidade">${item}</span>`).join(' ');
}

function formatarExames(arr) {
    if (!arr || arr.length === 0) return '—';
    return arr.map(item => `<span class="badge badge-exame"><i class="fas fa-check-circle"></i> ${item}</span>`).join(' ');
}

function mostrarToast(mensagem, cor = '#1a4a58') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = mensagem;
    toast.style.background = cor;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}