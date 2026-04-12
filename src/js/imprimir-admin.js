// imprimir-admin.js

function imprimirRelatorioAdmin() {
    // 1. Preparar os dados atuais da fábrica
    const maquinasArray = [];
    let stats = { 'PRODUÇÃO': 0, 'PREPARAÇÃO PRODUÇÃO': 0, 'DESENVOLVIMENTO AMOSTRAS': 0, 'MANUTENÇÃO': 0, 'PARADO': 0, 'AVARIADA': 0 };

    // Passar por todas as máquinas na Base de Dados
    Object.keys(db.maquinas).forEach(idTear => {
        const m = db.maquinas[idTear];
        const status = m.status || 'PARADO';
        
        if(stats[status] !== undefined) stats[status]++;

        // Garantir que a fila tem 3 posições lidas corretamente
        let fila = Array.isArray(m.fila) ? m.fila : Object.values(m.fila || {});
        while(fila.length < 3) { fila.push({tipo:'PARADO', cliente:'', modelo:'', desenhador:''}); }

        maquinasArray.push({
            id: idTear,
            modelo: m.tipo || '-',
            pol: m.pol ? String(m.pol).replace(/"/g,'') + '"' : '-',
            status: status,
            cliente: m.cliente || '',
            artigo: m.modelo || '',
            tecnico: m.desenhador || '',
            fila: fila.slice(0, 3) 
        });
    });

    // 2. Ordenação Numérica
    maquinasArray.sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true, sensitivity: 'base'}));

    // 3. Criar janela de impressão
    const janelaImpressao = window.open('', '', 'width=1100,height=800');
    const dataAtual = new Date().toLocaleString('pt-PT');

    // 4. Desenhar HTML (Larguras ajustadas conforme pedido)
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-pt">
    <head>
        <meta charset="UTF-8">
        <title>Planeamento Teares</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 0; padding: 20px; font-size: 11px; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00a8ff; padding-bottom: 10px; margin-bottom: 15px; }
            .header img { height: 40px; }
            .title { font-size: 18px; font-weight: bold; color: #000; margin: 0; text-transform: uppercase; }
            
            .stats-container { display: flex; gap: 8px; margin-bottom: 15px; flex-wrap: wrap; }
            .stat-box { flex: 1; border: 1px solid #ccc; padding: 8px; text-align: center; border-radius: 4px; background: #f9f9f9; }
            .stat-box .val { font-size: 16px; font-weight: bold; color: #000; }
            .stat-box .lbl { font-size: 8px; text-transform: uppercase; font-weight: bold; color: #555; display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 2px; }
            
            table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
            th { background-color: #00a8ff; color: white; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; border: 1px solid #0077b3; }
            td { padding: 6px 8px; border: 1px solid #ccc; font-size: 10px; vertical-align: top; overflow: hidden; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            
            /* Ajuste de Larguras de Coluna */
            .col-tear { width: 35px; text-align: center; }
            .col-modelo { width: 90px; } /* Aumentado */
            .col-estado { width: 150px; } /* Aumentado */
            .col-atividade { width: 170px; }
            /* A coluna da Fila não tem largura fixa, ocupando o restante espaço disponível (que agora é menor) */

            .st-producao { color: #70AD47; font-weight: 900; }
            .st-preparacao { color: #FFC000; font-weight: 900; }
            .st-amostras { color: #44546A; font-weight: 900; }
            .st-manutencao { color: #FF0000; font-weight: 900; }
            .st-parado { color: #ED7D31; font-weight: 900; }
            .st-avariada { color: #19232D; font-weight: 900; }
            
            .atividade-atual { font-size: 10px; line-height: 1.4; }
            .atividade-atual strong { font-size: 8px; color: #888; text-transform: uppercase; }
            
            .fila-list { margin: 0; padding: 0; list-style: none; font-size: 9px; }
            .fila-list li { margin-bottom: 4px; padding-bottom: 4px; border-bottom: 1px dashed #eee; display: flex; align-items: baseline; gap: 5px; }
            .fila-list li:last-child { border-bottom: none; }
            .fila-index { font-weight: bold; color: #aaa; font-size: 8px; width: 10px; }
            .fila-tag { font-weight: bold; font-size: 7px; padding: 2px 4px; border-radius: 3px; background: #eee; border: 1px solid #ddd; white-space: nowrap; }
            
            @media print {
                @page { margin: 1cm; size: landscape; }
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div style="display:flex; align-items:center; gap: 15px;">
                <img src="src/assets/images/jwaylogoazul.png" alt="JWAY Logo">
                <h1 class="title">Planeamento Teares</h1>
            </div>
            <div class="header-info">
                <strong>Gerado a:</strong> ${dataAtual}<br>
                    <strong>Por:</strong> ${(window.JwaySession && window.JwaySession.get().nome) || 'Administrador'}
            </div>
        </div>

        <div class="stats-container">
            <div class="stat-box" style="border-bottom: 3px solid #70AD47;"><div class="val" style="color: #70AD47;">${stats['PRODUÇÃO']}</div><div class="lbl"><i class="fa-solid fa-gear"></i> Produção</div></div>
            <div class="stat-box" style="border-bottom: 3px solid #FFC000;"><div class="val" style="color: #FFC000;">${stats['PREPARAÇÃO PRODUÇÃO']}</div><div class="lbl"><i class="fa-solid fa-screwdriver-wrench"></i> Preparação</div></div>
            <div class="stat-box" style="border-bottom: 3px solid #44546A;"><div class="val" style="color: #44546A;">${stats['DESENVOLVIMENTO AMOSTRAS']}</div><div class="lbl"><i class="fa-brands fa-laravel"></i> Amostras</div></div>
            <div class="stat-box" style="border-bottom: 3px solid #FF0000;"><div class="val" style="color: #FF0000;">${stats['MANUTENÇÃO']}</div><div class="lbl"><i class="fa-solid fa-wrench"></i> Manutenção</div></div>
            <div class="stat-box" style="border-bottom: 3px solid #ED7D31;"><div class="val" style="color: #ED7D31;">${stats['PARADO']}</div><div class="lbl"><i class="fa-solid fa-circle-pause"></i> Parados</div></div>
            <div class="stat-box" style="border-bottom: 3px solid #19232D;"><div class="val" style="color: #19232D;">${stats['AVARIADA']}</div><div class="lbl"><i class="fa-solid fa-ban"></i> Avariadas</div></div>
        </div>

        <table>
            <thead>
                <tr>
                    <th class="col-tear">Tear</th>
                    <th class="col-modelo">Modelo</th>
                    <th class="col-estado">Estado</th>
                    <th class="col-atividade">Atividade Atual</th>
                    <th>Fila de Planeamento</th>
                </tr>
            </thead>
            <tbody>
                ${maquinasArray.map(m => {
                    let stClass = ''; let stIcon = '';
                    if(m.status === 'PRODUÇÃO') { stClass = 'st-producao'; stIcon = '<i class="fa-solid fa-gear"></i>'; }
                    else if(m.status === 'PREPARAÇÃO PRODUÇÃO') { stClass = 'st-preparacao'; stIcon = '<i class="fa-solid fa-screwdriver-wrench"></i>'; }
                    else if(m.status === 'DESENVOLVIMENTO AMOSTRAS') { stClass = 'st-amostras'; stIcon = '<i class="fa-brands fa-laravel"></i>'; }
                    else if(m.status === 'MANUTENÇÃO') { stClass = 'st-manutencao'; stIcon = '<i class="fa-solid fa-wrench"></i>'; }
                    else if(m.status === 'PARADO') { stClass = 'st-parado'; stIcon = '<i class="fa-solid fa-circle-pause"></i>'; }
                    else if(m.status === 'AVARIADA') { stClass = 'st-avariada'; stIcon = '<i class="fa-solid fa-ban"></i>'; }
                    
                    let atividadeHtml = '';
                    if(m.status === 'PRODUÇÃO' || m.status === 'PREPARAÇÃO PRODUÇÃO') {
                        atividadeHtml = `<div><strong>CLI:</strong> ${m.cliente || '-'}</div><div><strong>ART:</strong> ${m.artigo || '-'}</div>`;
                    } else if (m.status === 'DESENVOLVIMENTO AMOSTRAS') {
                        atividadeHtml = `<div><strong>TÉC:</strong> ${m.tecnico || '-'}</div><div><strong>ART:</strong> ${m.artigo || '-'}</div>`;
                    } else {
                        atividadeHtml = `<span style="color:#aaa; font-style:italic;">Sem atividade</span>`;
                    }

                    let filaHtmlArray = m.fila.map((tarefa, idx) => {
                        if (!tarefa || tarefa.tipo === 'PARADO') return ''; 
                        let dest = '';
                        if (tarefa.tipo === 'DESENVOLVIMENTO AMOSTRAS') dest = tarefa.desenhador ? `<strong>TÉC:</strong> ${tarefa.desenhador}` : '';
                        else if (tarefa.tipo === 'PRODUÇÃO' || tarefa.tipo === 'PREPARAÇÃO PRODUÇÃO') dest = (tarefa.cliente ? `<strong>CLI:</strong> ${tarefa.cliente} ` : '') + (tarefa.modelo ? `<strong>ART:</strong> ${tarefa.modelo}` : '');
                        else if (tarefa.tipo === 'MANUTENÇÃO' || tarefa.tipo === 'AVARIADA') dest = 'Manutenção';
                        return `<li><span class="fila-index">${idx+1}.</span><span class="fila-tag">${tarefa.tipo}</span> <span>${dest}</span></li>`;
                    }).filter(html => html !== ''); 

                    let filaHtml = filaHtmlArray.length > 0 ? `<ul class="fila-list">${filaHtmlArray.join('')}</ul>` : `<span style="color:#aaa; font-style:italic;">Sem tarefas planeadas</span>`;

                    return `
                    <tr>
                        <td class="col-tear" style="font-weight: bold; font-size:14px;">${m.id}</td>
                        <td class="col-modelo" style="font-size:9px; color:#555;">${m.modelo}<br>${m.pol}</td>
                        <td class="col-estado ${stClass}">${stIcon} ${m.status}</td>
                        <td class="col-atividade atividade-atual">${atividadeHtml}</td>
                        <td>${filaHtml}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 20px; text-align: center; font-size: 9px; color: #aaa;">
            JWAY NEXUS &copy; ${new Date().getFullYear()} | Alecgroup
        </div>
    </body>
    </html>
    `;

    janelaImpressao.document.open();
    janelaImpressao.document.write(htmlContent);
    janelaImpressao.document.close();

    setTimeout(() => {
        janelaImpressao.print();
    }, 800);
}


