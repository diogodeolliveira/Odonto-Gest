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

        // Remover listeners antigos
        const novoBtnMais = btnMais.cloneNode(true);
        btnMais.parentNode.replaceChild(novoBtnMais, btnMais);

        novoBtnMais.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            dropdown.classList.toggle('active');
            console.log(`🔄 Menu ${dropdown.classList.contains('active') ? 'aberto' : 'fechado'}`);
        });

        document.addEventListener('click', function(e) {
            if (dropdown.classList.contains('active') && 
                !dropdown.contains(e.target) && 
                e.target !== novoBtnMais) {
                dropdown.classList.remove('active');
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && dropdown.classList.contains('active')) {
                dropdown.classList.remove('active');
            }
        });

        // Configurar itens do dropdown
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            const novoItem = item.cloneNode(true);
            item.parentNode.replaceChild(novoItem, item);
            
            // Fechar menu ao clicar no item
            novoItem.addEventListener('click', function() {
                dropdown.classList.remove('active');
            });
        });

        // ============================================================
        // CONFIGURAR LOGOUT - FECHAR DROPDOWN E FAZER LOGOUT
        // ============================================================
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            const novoBtnLogout = btnLogout.cloneNode(true);
            btnLogout.parentNode.replaceChild(novoBtnLogout, btnLogout);
            
            novoBtnLogout.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dropdown.classList.remove('active');
                // Pequeno delay para o dropdown fechar antes do logout
                setTimeout(() => {
                    if (typeof APP.fazerLogout === 'function') {
                        APP.fazerLogout();
                    }
                }, 100);
            });
        }

        // ============================================================
        // CONFIGURAR OS DEMAIS BOTÕES DO MENU
        // ============================================================
        
        // PDF
        const btnPDF = document.getElementById('btnGerarPDF');
        if (btnPDF && typeof APP.gerarPDF === 'function') {
            const novoBtnPDF = btnPDF.cloneNode(true);
            btnPDF.parentNode.replaceChild(novoBtnPDF, btnPDF);
            novoBtnPDF.addEventListener('click', function() {
                dropdown.classList.remove('active');
                APP.gerarPDF();
            });
        }

        // Exportar
        const btnExportar = document.getElementById('btnExportarJSON');
        if (btnExportar && typeof APP.exportarJSON === 'function') {
            const novoBtnExportar = btnExportar.cloneNode(true);
            btnExportar.parentNode.replaceChild(novoBtnExportar, btnExportar);
            novoBtnExportar.addEventListener('click', function() {
                dropdown.classList.remove('active');
                APP.exportarJSON();
            });
        }

        // Importar
        const btnImportar = document.getElementById('btnImportarJSON');
        if (btnImportar && typeof APP.importarJSON === 'function') {
            const novoBtnImportar = btnImportar.cloneNode(true);
            btnImportar.parentNode.replaceChild(novoBtnImportar, btnImportar);
            novoBtnImportar.addEventListener('click', function() {
                dropdown.classList.remove('active');
                APP.importarJSON();
            });
        }

        console.log('✅ Menu 3 pontinhos configurado!');
    }