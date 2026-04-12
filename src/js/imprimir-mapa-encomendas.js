(function() {
    var PRINT_LOGO_SRC = 'src/assets/images/jwaylogoazul.png';

    function normalizarCabecalho(txt) {
        return String(txt || '')
            .toUpperCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    function formatarDataPt(dataIso) {
        if (!dataIso) return '-';
        var partes = String(dataIso).split('-');
        if (partes.length !== 3) return dataIso;
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    function sanitizarTabelaParaImpressao(origTable) {
        var table = origTable.cloneNode(true);

        table.dataset.temFinanceiro = window.userCanSeeSensitiveMapa ? '1' : '0';

        table.querySelectorAll('.th-acoes, td.action-btns').forEach(function(el) {
            el.remove();
        });

        if (!window.userCanSeeSensitiveMapa) {
            table.querySelectorAll('.sensitive-finance, .sensitive-client-code').forEach(function(el) {
                el.remove();
            });
        }

        table.querySelectorAll('select').forEach(function(selectEl) {
            var span = document.createElement('span');
            span.textContent = (selectEl.options[selectEl.selectedIndex] && selectEl.options[selectEl.selectedIndex].textContent) || '';
            selectEl.replaceWith(span);
        });

        table.querySelectorAll('input[type="date"]').forEach(function(inputEl) {
            var span = document.createElement('span');
            span.textContent = formatarDataPt(inputEl.value || '');
            inputEl.replaceWith(span);
        });

        table.querySelectorAll('.custom-tooltip, .progress-bar-bg').forEach(function(el) {
            el.remove();
        });

        table.querySelectorAll('.quant-underline, .date-underline, .texto-desc, .montante-val').forEach(function(el) {
            el.style.borderBottom = 'none';
            el.style.textDecoration = 'none';
            el.style.color = '#000';
            el.style.whiteSpace = 'normal';
        });

        table.querySelectorAll('.date-overdue, .date-warning').forEach(function(el) {
            el.classList.remove('date-overdue', 'date-warning');
        });

        var headRow = table.querySelector('thead tr');
        if (headRow) {
            var ths = Array.prototype.slice.call(headRow.querySelectorAll('th'));
            var idxPO = -1;
            var idxOF = -1;
            var idxCliente = -1;
            var idxTipo = -1;
            var idxRef = -1;
            var idxQuant = -1;
            var idxPreco = -1;
            var idxMontante = -1;
            var idxEstado = -1;
            var idxTinturaria = -1;
            var idxEntrega = -1;
            var idxAprovacao = -1;
            var idxCodCli = -1;
            var idxCor = -1;
            var idxDescricao = -1;

            ths.forEach(function(th, idx) {
                var titulo = normalizarCabecalho(th.textContent);
                if (titulo.indexOf('CLIENTE') !== -1) idxCliente = idx;
                if (titulo.indexOf('PO') !== -1) idxPO = idx;
                if (titulo === 'OF') idxOF = idx;
                if (titulo.indexOf('TIPO') !== -1) idxTipo = idx;
                if (titulo.indexOf('REF') !== -1) idxRef = idx;
                if (titulo.indexOf('QUANT') !== -1) idxQuant = idx;
                if (titulo.indexOf('PRECO') !== -1) idxPreco = idx;
                if (titulo.indexOf('MONTANTE') !== -1) idxMontante = idx;
                if (titulo.indexOf('ESTADO') !== -1) idxEstado = idx;
                if (titulo.indexOf('TINTURARIA') !== -1) idxTinturaria = idx;
                if (titulo.indexOf('ENTREGA') !== -1) idxEntrega = idx;
                if (titulo.indexOf('APROVACAO') !== -1) idxAprovacao = idx;
                if (titulo.indexOf('COD') !== -1 && titulo.indexOf('CLI') !== -1) idxCodCli = idx;
                if (titulo.indexOf('COR') !== -1) idxCor = idx;
                if (titulo.indexOf('DESCRICAO') !== -1) idxDescricao = idx;
            });

            function marcarColuna(idx, className) {
                if (idx < 0) return;
                var allRows = table.querySelectorAll('tr');
                allRows.forEach(function(row) {
                    var cells = row.children;
                    if (cells[idx]) cells[idx].classList.add(className);
                });
            }

            marcarColuna(idxCliente, 'col-cliente-print');
            marcarColuna(idxPO, 'col-po-print');
            marcarColuna(idxOF, 'col-of-print');
            marcarColuna(idxTipo, 'col-tipo-print');
            marcarColuna(idxRef, 'col-ref-print');
            marcarColuna(idxQuant, 'col-quant-print');
            marcarColuna(idxPreco, 'col-preco-print');
            marcarColuna(idxMontante, 'col-montante-print');
            marcarColuna(idxEstado, 'col-estado-print');
            marcarColuna(idxTinturaria, 'col-tinturaria-print');
            marcarColuna(idxEntrega, 'col-entrega-print');
            marcarColuna(idxAprovacao, 'col-aprovacao-print');
            marcarColuna(idxCodCli, 'col-codcli-print');
            marcarColuna(idxCor, 'col-cor-print');
            marcarColuna(idxDescricao, 'col-descricao-print');

            var thAnotacoes = document.createElement('th');
            thAnotacoes.textContent = 'Anotações';
            thAnotacoes.className = 'col-anotacoes-print';
            headRow.appendChild(thAnotacoes);

            table.querySelectorAll('tbody tr').forEach(function(row) {
                var tdAnotacoes = document.createElement('td');
                tdAnotacoes.className = 'col-anotacoes-print anotacoes-cell-print';
                tdAnotacoes.innerHTML = '&nbsp;';
                row.appendChild(tdAnotacoes);
            });

            inserirColgroupA4(table, idxCodCli >= 0, idxPreco >= 0 || idxMontante >= 0);
        }

        return table;
    }

    function inserirColgroupA4(table, temCodCli, temFinanceiro) {
        var colgroup = document.createElement('colgroup');

        function addCol(mm) {
            var col = document.createElement('col');
            col.style.width = mm + 'mm';
            colgroup.appendChild(col);
        }

        addCol(20); // Cliente
        addCol(16); // PO
        addCol(9);  // OF
        addCol(14); // Tipo
        addCol(15); // Ref
        addCol(61); // Descricao
        if (temCodCli) addCol(8); // Cod Cli
        addCol(12); // Cor
        addCol(8);  // Quant
        if (temFinanceiro) {
            addCol(8);  // Preco
            addCol(11); // Montante
        }
        addCol(14); // Estado
        addCol(14); // Tinturaria
        addCol(15); // Entrega
        addCol(14); // Aprovacao
        addCol(47); // Anotacoes

        var antigo = table.querySelector('colgroup');
        if (antigo) antigo.remove();
        table.insertBefore(colgroup, table.firstChild);
    }

    function extrairResumoCards() {
        var origem = document.getElementById('dashboards-wrapper');
        if (!origem) return '';

        var clone = origem.cloneNode(true);
        clone.querySelectorAll('#grafico-wrapper, canvas, select').forEach(function(el) {
            el.remove();
        });
        clone.querySelectorAll('.clickable-card').forEach(function(el) {
            el.classList.remove('clickable-card', 'active-card');
        });

        return clone.innerHTML;
    }

    function montarHtmlImpressao(tableHtml, cardsHtml) {
        var dataAtual = new Date().toLocaleString('pt-PT');
        var sess = window.JwaySession ? window.JwaySession.get() : null;
        var utilizador = (sess && sess.nome) || 'Utilizador';

        return [
            '<!DOCTYPE html>',
            '<html lang="pt-pt">',
            '<head>',
            '  <meta charset="UTF-8">',
            '  <title>Mapa de Encomendas</title>',
            '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
            '  <style>',
            '    body { font-family: "Segoe UI", Arial, sans-serif; color: #333; margin: 0; padding: 0; font-size: 11px; }',
            '    .print-page { width: 287mm; max-width: 287mm; margin: 0 auto; }',
            '    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00a8ff; padding-bottom: 10px; margin-bottom: 15px; }',
            '    .header-left { display: flex; align-items: center; gap: 15px; }',
            '    .header img { height: 40px; }',
            '    .title { font-size: 18px; font-weight: 700; color: #000; margin: 0; text-transform: uppercase; }',
            '    .header-info { font-size: 10px; color: #333; text-align: right; }',
            '    table { width: 100%; max-width: 100%; border-collapse: collapse; table-layout: fixed; margin: 0 auto; }',
            '    th { background-color: #00a8ff; color: #fff; padding: 5px 6px; text-align: left; font-size: 8px; text-transform: uppercase; border: 1px solid #0077b3; }',
            '    td { padding: 4px 6px; border: 1px solid #ccc; font-size: 8px; vertical-align: top; color: #000; line-height: 1.1; word-break: break-word; }',
            '    tr:nth-child(even) { background-color: #f9f9f9; }',
            '    th.col-po-print, td.col-po-print { font-size: 5.5px; white-space: nowrap; }',
            '    th.col-of-print, td.col-of-print { font-size: 7px; white-space: nowrap; }',
            '    th.col-codcli-print, td.col-codcli-print { font-size: 6.5px; }',
            '    th.col-cor-print, td.col-cor-print { font-size: 7px; }',
            '    th.col-quant-print, td.col-quant-print, th.col-preco-print, td.col-preco-print, th.col-montante-print, td.col-montante-print { font-size: 7px; white-space: nowrap; }',
            '    th.col-ref-print, td.col-ref-print { white-space: nowrap; }',
            '    th.col-montante-print, td.col-montante-print { white-space: nowrap !important; word-break: normal !important; overflow-wrap: normal !important; }',
            '    td.col-montante-print .montante-val, td.col-montante-print span { white-space: nowrap !important; word-break: normal !important; overflow-wrap: normal !important; }',
            '    th.col-estado-print, td.col-estado-print { white-space: nowrap; font-size: 6.5px; }',
            '    th.col-tinturaria-print, td.col-tinturaria-print { white-space: nowrap; font-size: 6.5px; }',
            '    th.col-entrega-print, td.col-entrega-print, th.col-aprovacao-print, td.col-aprovacao-print { white-space: nowrap; }',
            '    th.col-descricao-print, td.col-descricao-print { font-size: 7px; }',
            '    .texto-desc { display: block; max-width: 61mm !important; white-space: normal !important; word-break: break-word; }',
            '    td.anotacoes-cell-print { min-height: 22px; }',
            '    .dashboards-grid { display: flex; gap: 6px; margin-top: 10px; }',
            '    .summary-dashboard { flex: 1; border: 1px solid #ccc; padding: 5px; border-radius: 4px; background: #fff; }',
            '    .summary-dashboard h3 { margin: 0 0 4px 0; font-size: 9px; text-transform: uppercase; color: #000; }',
            '    .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }',
            '    .month-card { border: 1px solid #ddd; padding: 4px; background: #fafafa; }',
            '    .month-card-title { font-size: 7px; font-weight: 700; color: #000; border-bottom: 1px solid #ddd; margin-bottom: 3px; padding-bottom: 2px; text-transform: uppercase; }',
            '    .month-val-row { display: flex; justify-content: space-between; gap: 6px; font-size: 7px; margin-bottom: 2px; }',
            '    .total-row { border-top: 1px dashed #ccc; padding-top: 2px; margin-top: 2px; }',
            '    .print-footer { margin-top: 10px; text-align: center; font-size: 9px; color: #888; }',
            '    @media print {',
            '      @page { margin: 5mm; size: landscape; }',
            '      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
            '    }',
            '  </style>',
            '</head>',
            '<body>',
            '  <div class="print-page">',
            '  <div class="header">',
            '    <div class="header-left">',
            '      <img src="' + PRINT_LOGO_SRC + '" alt="JWAY Logo">',
            '      <h1 class="title">Mapa de Encomendas</h1>',
            '    </div>',
            '    <div class="header-info">',
            '      <strong>Gerado a:</strong> ' + dataAtual + '<br>',
            '      <strong>Por:</strong> ' + utilizador,
            '    </div>',
            '  </div>',
            tableHtml,
            cardsHtml ? ('<div style="margin-top:10px;">' + cardsHtml + '</div>') : '',
            '  <div class="print-footer">MAPA ENCOMENDAS - JWAY NEXUS &copy; ' + new Date().getFullYear() + ' | Alecgroup</div>',
            '  </div>',
            '</body>',
            '</html>'
        ].join('');
    }

    function imprimirMapa() {
        if (typeof window.showToast === 'function') {
            window.showToast('A preparar impressão do mapa...', 'info');
        }

        var tabelaOrigem = document.getElementById('tabela-encomendas');
        if (!tabelaOrigem) {
            if (typeof window.showToast === 'function') {
                window.showToast('Tabela não encontrada para imprimir.', 'error');
            }
            return;
        }

        var tabelaPrint = sanitizarTabelaParaImpressao(tabelaOrigem);
        var cardsPrint = extrairResumoCards();
        var html = montarHtmlImpressao(tabelaPrint.outerHTML, cardsPrint);

        var janelaImpressao = window.open('', '', 'width=1200,height=800');
        if (!janelaImpressao) {
            if (typeof window.showToast === 'function') {
                window.showToast('Popup bloqueado. Permita popups para imprimir.', 'error');
            }
            return;
        }

        janelaImpressao.document.open();
        janelaImpressao.document.write(html);
        janelaImpressao.document.close();

        setTimeout(function() {
            janelaImpressao.focus();
            janelaImpressao.print();
        }, 700);
    }

    window.abrirImpressaoMapa = imprimirMapa;
})();

