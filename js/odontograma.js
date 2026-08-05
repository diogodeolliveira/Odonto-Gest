// ============================================================
// FUNÇÕES DO ODONTOGRAMA
// ============================================================
(function() {

    const APP = window.APP;

    const DENTES = {
        SUPERIOR_ESQUERDA: [18, 17, 16, 15, 14, 13, 12, 11],
        SUPERIOR_DIREITA: [21, 22, 23, 24, 25, 26, 27, 28],
        INFERIOR_ESQUERDA: [38, 37, 36, 35, 34, 33, 32, 31],
        INFERIOR_DIREITA: [41, 42, 43, 44, 45, 46, 47, 48]
    };

    APP.renderOdontogramaCadastro = function() {
        const arcadaSuperior = document.getElementById('arcadaSuperiorCadastro');
        const arcadaInferior = document.getElementById('arcadaInferiorCadastro');
        if (!arcadaSuperior || !arcadaInferior) return;

        arcadaSuperior.innerHTML = '';
        arcadaInferior.innerHTML = '';

        function criarDente(num) {
            const btn = document.createElement('button');
            btn.className = 'dente-btn';
            if (APP.dentesSelecionados && APP.dentesSelecionados.has(num)) {
                btn.classList.add('selecionado');
            }
            btn.dataset.dente = num;
            btn.innerHTML = `<span class="icone-dente">🦷</span><span class="numero">${num}</span>`;
            btn.addEventListener('click', function() {
                const dente = parseInt(this.dataset.dente);
                if (APP.dentesSelecionados.has(dente)) {
                    APP.dentesSelecionados.delete(dente);
                    this.classList.remove('selecionado');
                } else {
                    APP.dentesSelecionados.add(dente);
                    this.classList.add('selecionado');
                }
            });
            return btn;
        }

        DENTES.SUPERIOR_ESQUERDA.forEach(num => arcadaSuperior.appendChild(criarDente(num)));
        const espaco = document.createElement('span');
        espaco.style.width = '12px';
        arcadaSuperior.appendChild(espaco);
        DENTES.SUPERIOR_DIREITA.forEach(num => arcadaSuperior.appendChild(criarDente(num)));

        DENTES.INFERIOR_ESQUERDA.forEach(num => arcadaInferior.appendChild(criarDente(num)));
        const espaco2 = document.createElement('span');
        espaco2.style.width = '12px';
        arcadaInferior.appendChild(espaco2);
        DENTES.INFERIOR_DIREITA.forEach(num => arcadaInferior.appendChild(criarDente(num)));
    };

    APP.renderOdontogramaDetalhes = function(dentesArray) {
        const arcadaSuperior = document.getElementById('detalhesArcadaSuperior');
        const arcadaInferior = document.getElementById('detalhesArcadaInferior');
        if (!arcadaSuperior || !arcadaInferior) return;

        arcadaSuperior.innerHTML = '';
        arcadaInferior.innerHTML = '';
        const dentesSet = new Set(dentesArray || []);

        function criarDenteStatic(num) {
            const div = document.createElement('div');
            div.className = 'dente-static';
            if (dentesSet.has(num)) div.classList.add('selecionado');
            div.innerHTML = `<span class="icone-dente">🦷</span><span class="numero">${num}</span>`;
            return div;
        }

        DENTES.SUPERIOR_ESQUERDA.forEach(num => arcadaSuperior.appendChild(criarDenteStatic(num)));
        const espaco = document.createElement('span');
        espaco.style.width = '12px';
        arcadaSuperior.appendChild(espaco);
        DENTES.SUPERIOR_DIREITA.forEach(num => arcadaSuperior.appendChild(criarDenteStatic(num)));

        DENTES.INFERIOR_ESQUERDA.forEach(num => arcadaInferior.appendChild(criarDenteStatic(num)));
        const espaco2 = document.createElement('span');
        espaco2.style.width = '12px';
        arcadaInferior.appendChild(espaco2);
        DENTES.INFERIOR_DIREITA.forEach(num => arcadaInferior.appendChild(criarDenteStatic(num)));
    };

})();
