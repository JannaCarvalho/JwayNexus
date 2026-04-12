(function() {
    var PRINT_LOGO_SRC = 'src/assets/images/jwaylogoazul.png';

    function formatarDataPt(dataIso) {
        if (!dataIso) return '-';
        var partes = String(dataIso).split('-');
        if (partes.length !== 3) return dataIso;
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    function limparTexto(txt) {
        return String(txt || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function temValorVisivel(txt) {
        var valor = limparTexto(txt);
        return valor !== '' && valor !== '-' && valor !== '--';
    }

    function removerColuna(table, idx) {
        if (idx < 0) return;
        table.querySelectorAll('tr').forEach(function(row) {
            var cell = row.children[idx];
            if (cell) cell.remove();
        });
    }

    function removerColunaApenasLinhasPrincipais(table, idx) {
        if (idx < 0) return;
        table.querySelectorAll('thead tr, tbody tr.master-row, tfoot tr').forEach(function(row) {
            var cell = row.children[idx];
            if (cell) cell.remove();
        });
    }

    function sanitizarTabelaTinturaria(origTable) {
        var table = origTable.cloneNode(true);

        // Remove control buttons and non-print UI nodes.
        table.querySelectorAll('button, .expand-icon, .btn-add-partida, .btn-sub-action, .btn-sub-delete').forEach(function(el) {
            el.remove();
        });

        // Inputs/selects become plain text for print.
        table.querySelectorAll('input, select, textarea').forEach(function(el) {
            var span = document.createElement('span');
            var tag = (el.tagName || '').toLowerCase();
            var type = (el.getAttribute('type') || '').toLowerCase();

            if (type === 'checkbox') {
                span.textContent = el.checked ? 'Sim' : 'Não';
            } else if (type === 'date') {
                span.textContent = formatarDataPt(el.value || '');
            } else if (tag === 'select') {
                var txt = '';
                if (el.options && el.selectedIndex >= 0 && el.options[el.selectedIndex]) {
                    txt = el.options[el.selectedIndex].textContent || '';
                }
                span.textContent = limparTexto(txt);
            } else {
                span.textContent = limparTexto(el.value || el.textContent || '');
            }

            el.replaceWith(span);
        });

        // Reaproveita a coluna "Progresso" com resumo das partidas por OF/Cor.
        var headRowLimpo = table.querySelector('thead tr');
        if (headRowLimpo) {
            var headersLimpos = Array.prototype.slice.call(headRowLimpo.children);
            var idxEncs = -1;
            var idxProgresso = -1;
            var idxCor = -1;
            var idxModelo = -1;
            var idxTinturaria = -1;
            var idxPartidas = -1;
            var idxPesoTotal = -1;
            var idxCliente = -1;

            headersLimpos.forEach(function(th, idx) {
                var t = limparTexto(th.textContent).toUpperCase();
                if (t.indexOf('ENC') !== -1) idxEncs = idx;
                if (t.indexOf('PROGRESSO') !== -1) idxProgresso = idx;
                if (t.indexOf('COR') !== -1) idxCor = idx;
                if (t.indexOf('MODELO') !== -1) idxModelo = idx;
                if (t.indexOf('TINTURARIA') !== -1) idxTinturaria = idx;
                if (t.indexOf('PARTIDA') !== -1) idxPartidas = idx;
                if (t.indexOf('PESO') !== -1) idxPesoTotal = idx;
                if (t.indexOf('CLIENTE') !== -1) idxCliente = idx;
            });

            function marcarColuna(idx, className) {
                if (idx < 0) return;
                table.querySelectorAll('tr').forEach(function(row) {
                    var cells = row.children;
                    if (cells[idx]) cells[idx].classList.add(className);
                });
            }

            function valorCelula(tr, idx) {
                if (!tr || idx < 0 || !tr.children[idx]) return '';
                return limparTexto(tr.children[idx].textContent);
            }

            function resumirPartidas(detailRow) {
                if (!detailRow) return '--';
                var linhas = detailRow.querySelectorAll('.sub-table tbody tr:not(.add-partida-row)');
                if (!linhas || linhas.length === 0) return '--';

                var resumo = [];
                linhas.forEach(function(tr) {
                    var nome = valorCelula(tr, 0) || 'Partida';
                    var peso = valorCelula(tr, 1) || '--';
                    var guia = valorCelula(tr, 4) || '--';
                    var dataEnvio = valorCelula(tr, 5) || '--';
                    var dataRececao = valorCelula(tr, 6) || '--';

                    var partes = [nome + ' | ' + peso + ' kg'];
                    if (temValorVisivel(guia)) partes.push('Guia ' + guia);
                    if (temValorVisivel(dataEnvio)) partes.push('DE - ' + dataEnvio);
                    if (temValorVisivel(dataRececao)) partes.push('DR - ' + dataRececao);

                    resumo.push(partes.join(' | '));
                });

                return resumo.join('\n');
            }

            table.querySelectorAll('tbody tr.master-row').forEach(function(masterRow) {
                var detailRow = masterRow.nextElementSibling;
                if (!detailRow || !detailRow.classList.contains('detail-row')) return;
                if (idxProgresso < 0 || !masterRow.children[idxProgresso]) return;

                var cell = masterRow.children[idxProgresso];
                cell.classList.add('col-progresso-print');
                cell.textContent = resumirPartidas(detailRow);
                cell.style.color = '#000';
                cell.style.webkitTextFillColor = '#000';
            });

            marcarColuna(idxEncs, 'col-encs-print');
            marcarColuna(idxCliente, 'col-cliente-print');
            marcarColuna(idxModelo, 'col-modelo-print');
            marcarColuna(idxCor, 'col-cor-print');
            marcarColuna(idxProgresso, 'col-progresso-print');
            marcarColuna(idxTinturaria, 'col-tinturaria-print');
            marcarColuna(idxPartidas, 'col-partidas-print');
            marcarColuna(idxPesoTotal, 'col-peso-print');

            // Remove ações e coluna expansora apenas depois de ler os detalhes.
            table.querySelectorAll('th.col-acoes, td.col-acoes').forEach(function(el) {
                el.remove();
            });

            removerColunaApenasLinhasPrincipais(table, 0);
        }

        // Remove detalhe expandido e subtabelas do print.
        table.querySelectorAll('.detail-row').forEach(function(row) {
            row.remove();
        });

        // Remove tfoot para não repetir em todas as páginas.
        var tfoot = table.querySelector('tfoot');
        if (tfoot) tfoot.remove();

        return table;
    }

    function extrairResumoCards() {
        return '';
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
            '  <title>Mapa de Partidas Tinturaria</title>',
            '  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
            '  <style>',
            '    body { font-family: "Segoe UI", Arial, sans-serif; color: #222; margin: 0; padding: 0; font-size: 10px; }',
            '    .print-page { width: 287mm; max-width: 287mm; margin: 0 auto; }',
            '    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00a8ff; padding-bottom: 8px; margin-bottom: 10px; }',
            '    .header-left { display: flex; align-items: center; gap: 12px; }',
            '    .header img { height: 34px; }',
            '    .title { font-size: 16px; font-weight: 700; color: #000; margin: 0; text-transform: uppercase; }',
            '    .header-info { font-size: 9px; color: #333; text-align: right; }',
            '    table { width: 100%; border-collapse: collapse; table-layout: fixed; }',
            '    #tinturaria-table th { background: #00a8ff; color: #fff; border: 1px solid #0077b3; padding: 4px; font-size: 7px; text-transform: uppercase; }',
            '    #tinturaria-table td { border: 1px solid #cfcfcf; padding: 4px; font-size: 7px; vertical-align: middle; color: #000; word-break: break-word; }',
            '    #tinturaria-table th { vertical-align: middle; }',
            '    .master-row td { background: #fff; }',
            '    #tinturaria-table td, #tinturaria-table td * { color: #000 !important; -webkit-text-fill-color: #000 !important; }',
            '    th.col-encs-print, td.col-encs-print { width: 11mm; font-size: 6px; }',
            '    th.col-cliente-print, td.col-cliente-print { width: 20mm; font-size: 6px; }',
            '    th.col-modelo-print, td.col-modelo-print { width: 14mm; font-size: 6px; }',
            '    th.col-cor-print, td.col-cor-print { width: 30mm; font-size: 6.5px; }',
            '    th.col-tinturaria-print, td.col-tinturaria-print { width: 14mm; font-size: 6px; }',
            '    th.col-partidas-print, td.col-partidas-print { width: 12mm; font-size: 6px; }',
            '    th.col-progresso-print, td.col-progresso-print { width: 42mm; font-size: 6px; white-space: pre-line; line-height: 1.2; }',
            '    th.col-peso-print, td.col-peso-print { width: 12mm; font-size: 6px; text-align: center; }',
            '    td.col-progresso-print { color: #000 !important; }',
            '    td.col-progresso-print * { color: #000 !important; }',
            '    .print-footer { margin-top: 10px; text-align: center; font-size: 8px; color: #777; }',
            '    @media print {',
            '      @page { size: A4 landscape; margin: 5mm; }',
            '      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }',
            '    }',
            '  </style>',
            '</head>',
            '<body>',
            '  <div class="print-page">',
            '    <div class="header">',
            '      <div class="header-left">',
            '        <img src="' + PRINT_LOGO_SRC + '" alt="JWAY Logo">',
            '        <h1 class="title">Mapa de Partidas Tinturaria</h1>',
            '      </div>',
            '      <div class="header-info">',
            '        <strong>Gerado a:</strong> ' + dataAtual + '<br>',
            '        <strong>Por:</strong> ' + utilizador,
            '      </div>',
            '    </div>',
            tableHtml,
            '    <div class="print-footer">MAPA TINTURARIA - JWAY NEXUS &copy; ' + new Date().getFullYear() + ' | Alecgroup</div>',
            '  </div>',
            '</body>',
            '</html>'
        ].join('');
    }

    function imprimirMapaTinturaria() {
        if (typeof window.showToast === 'function') {
            window.showToast('A preparar impressão do mapa de tinturaria...', 'info');
        }

        var tabelaOrigem = document.getElementById('tinturaria-table');
        if (!tabelaOrigem) {
            if (typeof window.showToast === 'function') {
                window.showToast('Tabela de tinturaria não encontrada para imprimir.', 'error');
            }
            return;
        }

        var tabelaPrint = sanitizarTabelaTinturaria(tabelaOrigem);
        var cardsPrint = extrairResumoCards();
        var html = montarHtmlImpressao(tabelaPrint.outerHTML, cardsPrint);

        var janelaImpressao = window.open('', '', 'width=1300,height=850');
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

    window.abrirImpressaoMapaTinturaria = imprimirMapaTinturaria;
})();

