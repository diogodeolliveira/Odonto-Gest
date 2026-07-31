// ============================================================
// FUNÇÕES DE INTERFACE - UI
// ============================================================

let termoBusca = '';

// ============================================================
// FUNÇÃO DE BUSCA (NOVA)
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
    
    // Busca em tempo real
    buscaInput.addEventListener('input', function() {
        termoBusca = this.value;
        buscaLimpar.style.display = termoBusca ? 'inline' : 'none';
        renderizarTabela();
    });
    
    // Limpar busca
    buscaLimpar.addEventListener('click', function() {
        buscaInput.value = '';
        termoBusca = '';
        this.style.display = 'none';
        renderizarTabela();
        buscaInput.focus();
    });
    
    // Tecla ESC limpa a busca
    buscaInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            this.value = '';
            termoBusca = '';
            buscaLimpar.style.display = 'none';
            renderizarTabela();
            this.blur();
        }
    });
}

// ============================================================
// FUNÇÕES DE RENDERIZAÇÃO DA TABELA
// ============================================================

function getPacientesFiltrados() {
    const localFiltro = document.getElementById('filtroLocal').value;
    const encFiltro = document.getElementById('filtroEncaminhamento').value;
    const statusFiltro = document.getElementById('filtroStatus').value;

    let filtrados = pacientes;
    
    // Aplica filtros
    if (localFiltro !== 'todos') {
        filtrados = filtrados.filter(p => p.local === localFiltro);
    }
    if (encFiltro !== 'todos') {
        filtrados = filtrados.filter(p => p.encaminhamentos && p.encaminhamentos.includes(encFiltro));
    }
    if (statusFiltro !== 'todos') {
        filtrados = filtrados.filter(p => p.status === statusFiltro);
    }
    
    // Aplica busca textual
    return filtrarPorBusca(filtrados);
}

function renderizarTabela() {
    const filtrados = getPacientesFiltrados();

    if (filtrados.length === 0) {
        const mensagem = termoBusca ? 
            `<i class="fas fa-search"></i> Nenhum paciente encontrado para "${termoBusca}"` :
            `<i class="fas fa-info-circle"></i> Nenhum paciente cadastrado.`;
        corpoTabela.innerHTML = `<tr><td colspan="5" class="empty-message">${mensagem}</td></tr>`;
        contadorRegistros.textContent = '0 pacientes';
        return;
    }

    let html = '';
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
                                    <span class="dot ${info.dot}"></span> ${info.label}
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
    contadorRegistros.textContent = `${filtrados.length} paciente${filtrados.length > 1 ? 's' : ''}`;

    // Eventos da tabela
    document.querySelectorAll('.nome-clicavel').forEach(el => {
        el.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            abrirDetalhes(id);
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
            dropdown.classList.toggle('active');
        });
    });

    document.querySelectorAll('.status-option').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const status = this.dataset.status;
            alterarStatus(id, status);
            const dropdown = this.closest('.status-dropdown-content');
            if (dropdown) dropdown.classList.remove('active');
        });
    });

    document.addEventListener('click', function() {
        document.querySelectorAll('.status-dropdown-content').forEach(d => d.classList.remove('active'));
    });
}

// ============================================================
// FUNÇÕES AUXILIARES DE INTERFACE
// ============================================================

function getStatusBadge(status, clickable = true) {
    const s = STATUS_MAP[status];
    if (!s) return `<span class="badge status-padrao">${status || '—'}</span>`;
    const clickClass = clickable ? ' status-badge' : '';
    return `<span class="badge ${s.class}${clickClass}" data-status="${status}">${s.label}</span>`;
}

function getLocais() {
    const locais = new Set();
    pacientes.forEach(p => locais.add(p.local));
    return Array.from(locais).sort();
}

function getTodosEncaminhamentos() {
    const encSet = new Set();
    pacientes.forEach(p => (p.encaminhamentos || []).forEach(e => encSet.add(e)));
    return Array.from(encSet).sort();
}

function popularSelects() {
    const locais = getLocais();
    const localAtual = document.getElementById('filtroLocal').value;
    const filtroLocal = document.getElementById('filtroLocal');
    filtroLocal.innerHTML = '<option value="todos">Todos os locais</option>';
    locais.forEach(local => {
        const opt = document.createElement('option');
        opt.value = local;
        opt.textContent = local;
        filtroLocal.appendChild(opt);
    });
    if (locais.includes(localAtual)) filtroLocal.value = localAtual;

    const encs = getTodosEncaminhamentos();
    const encAtual = document.getElementById('filtroEncaminhamento').value;
    const filtroEnc = document.getElementById('filtroEncaminhamento');
    filtroEnc.innerHTML = '<option value="todos">Todos</option>';
    encs.forEach(enc => {
        const opt = document.createElement('option');
        opt.value = enc;
        opt.textContent = enc;
        filtroEnc.appendChild(opt);
    });
    if (encs.includes(encAtual)) filtroEnc.value = encAtual;
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
    toast.textContent = mensagem;
    toast.style.background = cor;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}