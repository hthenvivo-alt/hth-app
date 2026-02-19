import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import autoTable from 'jspdf-autotable';
import api from '../lib/api';

export const generateRoadmapPDF = (funcion: any, logistica: any) => {
    console.log('Generating PDF for:', funcion, logistica);
    // ... (placeholder for future implementation)
};

export const generateLiquidacionPDF = async (funcion: any, liqData: any, gastos: any[] = [], comprobantes: any[] = []) => {
    const doc = new jsPDF();
    const obraNombre = funcion.obra?.nombre || 'Liquidación';
    const d = new Date(funcion.fecha);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const fechaStr = `${day}/${month}/${year}`;
    const symbol = liqData.moneda === 'ARS' ? '$' : 'U$D';

    // COLORS
    const primary = [220, 38, 38]; // HTH Red
    const dark = [30, 30, 30];

    // HEADER
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LIQUIDACIÓN DE FUNCIÓN', 15, 20);

    doc.setFontSize(14);
    doc.text(obraNombre.toUpperCase(), 15, 30);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const infoHeader = `${fechaStr} - ${funcion.salaNombre} (${funcion.ciudad})`;
    doc.text(infoHeader, 15, 38);

    let y = 55;

    // HELPER: Format Currency
    const fmt = (val: any) => `${symbol} ${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // SECTION 1: INGRESOS Y DEDUCCIONES
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INGRESOS Y DEDUCCIONES', 15, y);
    y += 5;

    const montoAcuerdo = liqData.acuerdoSobre === 'Bruta'
        ? (liqData.recaudacionBruta * liqData.acuerdoPorcentaje) / 100
        : (liqData.recaudacionNeta * liqData.acuerdoPorcentaje) / 100;

    autoTable(doc, {
        startY: y,
        head: [['Concepto', 'Porcentaje', 'Importe']],
        body: [
            ['Entradas vendidas', '-', funcion.vendidas || '0'],
            ['Facturación Bruta Total', '-', fmt(liqData.facturacionTotal)],
            ['Costos de Venta (Ticketeras/Otros)', '-', `- ${fmt(liqData.costosVenta)}`],
            [{ content: 'RECAUDACIÓN BRUTA (Base de Cálculo)', styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }, '-', { content: fmt(liqData.recaudacionBruta), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }],
            ...liqData.items.filter((i: any) => i.tipo === 'Deduccion').map((i: any) => [
                i.concepto,
                i.porcentaje ? `${i.porcentaje}%` : '-',
                `- ${fmt(i.monto)}`
            ]),
            [{ content: 'RECAUDACIÓN NETA', styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }, '-', { content: fmt(liqData.recaudacionNeta), styles: { fontStyle: 'bold', fillColor: [230, 230, 230] } }],
            ['Sala / Prod. Loc', `${liqData.acuerdoPorcentaje}%`, `- ${fmt(montoAcuerdo)}`],
            [{ content: 'RESULTADO COMPAÑÍA', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }, '-', { content: fmt(liqData.resultadoCompania), styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: dark as any },
        columnStyles: {
            2: { halign: 'right' }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // SECTION 3: GASTOS DE PRODUCCIÓN E IMPUESTOS
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.text('GASTOS Y COSTOS OPERATIVOS', 15, y);
    y += 5;

    // FILTERS
    const revenueBasedPayouts = liqData.repartos.filter((r: any) => r.base === 'Bruta' || r.base === 'Neta');
    const utilityBasedPayouts = liqData.repartos.filter((r: any) => r.base === 'Utilidad');

    const totalRevenuePayouts = revenueBasedPayouts.reduce((acc: number, r: any) => acc + (Number(r.monto) || 0), 0);
    const totalUtilityPayouts = utilityBasedPayouts.reduce((acc: number, r: any) => acc + (Number(r.monto) || 0), 0);

    const totalGastosOperativos = liqData.items.filter((i: any) => i.tipo === 'Gasto').reduce((acc: number, i: any) => acc + (Number(i.monto) || 0), 0);
    const totalImpuestos = Number(liqData.impuestoTransferencias) || 0;

    // Total Expenses for Section 3 (Excludes Utility Payouts)
    const totalSection3 = totalGastosOperativos + totalImpuestos + totalRevenuePayouts;

    // Operating Result (Before Utility Share)
    const resultadoOperativo = Number(liqData.resultadoCompania) - totalSection3;

    autoTable(doc, {
        startY: y,
        head: [['Detalle del Gasto', 'Importe']],
        body: [
            ...liqData.items.filter((i: any) => i.tipo === 'Gasto').map((i: any) => [i.concepto, `- ${fmt(i.monto)}`]),
            ...(totalRevenuePayouts > 0 ? [['Reparto Artistas (Sobre Bruta/Neta)', `- ${fmt(totalRevenuePayouts)}`]] : []),
            ['Impuesto Transferencias', `- ${fmt(liqData.impuestoTransferencias)}`],
            [{ content: 'TOTAL GASTOS OPERATIVOS', styles: { fontStyle: 'bold' } }, { content: fmt(totalSection3), styles: { fontStyle: 'bold' } }],
        ],
        theme: 'striped',
        headStyles: { fillColor: dark as any },
        columnStyles: {
            1: { halign: 'right' }
        }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // PAGE BREAK CHECK
    if (y > 200) {
        doc.addPage();
        y = 20;
    }

    // SECTION 4: RESULTADO FINAL (Simplified)
    const boxHeight = 45;
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(15, y, 180, boxHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    let lineY = y + 12;
    doc.text(`Ingreso Compañía: ${fmt(liqData.resultadoCompania)}`, 25, lineY);
    lineY += 7;
    doc.text(`Total Gastos: - ${fmt(totalSection3)}`, 25, lineY);
    lineY += 7;

    // Draw line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(25, lineY - 3, 100, lineY - 3);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`UTILIDAD: ${fmt(resultadoOperativo)}`, 25, lineY + 2);

    y += 55;

    // SECTION 5: REPARTO RESUMIDO
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    const isRevenueOnly = liqData.repartos.length > 0 && !liqData.repartos.some((r: any) => r.base === 'Utilidad');
    doc.text(isRevenueOnly ? 'PORCENTAJE ARTISTAS' : 'RESUMEN DE REPARTO', 15, y);
    y += 8;

    // Calculate HTH Share %
    // If we have utility payouts, HTH share is the remainder of 100 - sum(payouts)
    // If we have revenue payouts only, HTH gets the "result" which is effectively 100% of the untaxed profit (or whatever is left)

    let hthLabel = '';
    if (isRevenueOnly) {
        hthLabel = '100% (Remanente)';
    } else {
        const totalUtilityPercent = liqData.repartos
            .filter((r: any) => r.base === 'Utilidad')
            .reduce((acc: number, r: any) => acc + (Number(r.porcentaje) || 0), 0);
        const hthPercent = Math.max(0, 100 - totalUtilityPercent);
        hthLabel = `${hthPercent}% s/ Utilidad`;
    }

    const repartoRows = [
        ...liqData.repartos.map((r: any) => [
            r.nombreArtista.toUpperCase(),
            `${r.porcentaje}% s/ ${r.base}${r.aplicaAAA ? ' (+ AAA)' : ''}`,
            { content: fmt(r.monto), styles: { fontStyle: 'bold' } }
        ]),
        ['HTH GESTIÓN / PRODUCCIÓN', hthLabel, { content: fmt(liqData.repartoProduccionMonto), styles: { fontStyle: 'bold' } }]
    ];

    autoTable(doc, {
        startY: y,
        body: repartoRows,
        theme: 'grid',
        styles: { cellPadding: 5 },
        columnStyles: {
            2: { halign: 'right' }
        }
    });



    // FOOTER HELPER
    const addFooter = (doc: jsPDF) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generado por HTH Gestión - ${new Date().toLocaleString('es-AR')}`, 15, 285);
            doc.text(`Página ${i} de ${pageCount}`, 180, 285);
        }
    };

    // PAGE 2: BORDEREAUX IMAGE (Only if NOT PDF)
    if (liqData.bordereauxImage && !liqData.bordereauxImage.toLowerCase().endsWith('.pdf')) {
        doc.addPage();
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('COMPROBANTE BORDEREAUX ADJUNTO', 15, 13);

        try {
            const imgUrl = `${api.defaults.baseURL?.replace('/api', '')}${liqData.bordereauxImage}`;
            const img = new Image();
            img.src = imgUrl;

            await new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve;
            });

            if (img.complete && img.naturalWidth > 0) {
                const imgWidth = 180;
                const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;
                const maxHeight = 240;
                let finalWidth = imgWidth;
                let finalHeight = imgHeight;

                if (imgHeight > maxHeight) {
                    finalHeight = maxHeight;
                    finalWidth = (img.naturalWidth * finalHeight) / img.naturalHeight;
                }

                doc.addImage(img, 'JPEG', (210 - finalWidth) / 2, 30, finalWidth, finalHeight);
            } else {
                doc.setTextColor(100, 100, 100);
                doc.text('No se pudo cargar la imagen del bordereaux.', 15, 40);
            }
        } catch (e) {
            console.error('Error adding image to PDF:', e);
        }
    }

    // SECTION 6: COMPROBANTES / VOUCHERS (New Section)
    if (comprobantes && comprobantes.length > 0) {
        for (const docEntry of comprobantes) {
            doc.addPage();
            doc.setFillColor(dark[0], dark[1], dark[2]);
            doc.rect(0, 0, 210, 20, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.text(`COMPROBANTE: ${docEntry.nombreDocumento.toUpperCase()}`, 15, 13);

            const isImage = /\.(jpg|jpeg|png|webp)$/i.test(docEntry.linkDrive);

            if (isImage) {
                try {
                    const imgUrl = `${api.defaults.baseURL?.replace('/api', '')}${docEntry.linkDrive}`;
                    const img = new Image();
                    img.src = imgUrl;

                    await new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve;
                    });

                    if (img.complete && img.naturalWidth > 0) {
                        const imgWidth = 180;
                        const imgHeight = (img.naturalHeight * imgWidth) / img.naturalWidth;
                        const maxHeight = 240;
                        let finalWidth = imgWidth;
                        let finalHeight = imgHeight;

                        if (imgHeight > maxHeight) {
                            finalHeight = maxHeight;
                            finalWidth = (img.naturalWidth * finalHeight) / img.naturalHeight;
                        }

                        doc.addImage(img, 'JPEG', (210 - finalWidth) / 2, 30, finalWidth, finalHeight);
                    } else {
                        doc.setTextColor(100, 100, 100);
                        doc.text('No se pudo cargar la imagen del comprobante.', 15, 40);
                    }
                } catch (e) {
                    console.error('Error adding voucher image to PDF:', e);
                }
            } else {
                doc.setTextColor(100, 100, 100);
                doc.setFontSize(12);
                doc.text('Documento adjunto (PDF / Otro)', 15, 40);
                doc.setFontSize(10);
                doc.text(`Nombre: ${docEntry.nombreDocumento}`, 15, 50);
                doc.text('Este documento no se puede visualizar directamente en el PDF.', 15, 60);
            }
        }
    }



    addFooter(doc);


    const finalFileName = `Liquidacion_${obraNombre.replace(/\s+/g, '_')}_${fechaStr.replace(/\//g, '-')}.pdf`;

    // PDF MERGE LOGIC FOR BORDEREAUX
    if (liqData.bordereauxImage && liqData.bordereauxImage.toLowerCase().endsWith('.pdf')) {
        try {
            const reportPdfBytes = doc.output('arraybuffer');
            const reportPdfDoc = await PDFDocument.load(reportPdfBytes);

            const bordereauxUrl = `${api.defaults.baseURL?.replace('/api', '')}${liqData.bordereauxImage}`;
            const response = await fetch(bordereauxUrl);
            const bordereauxBytes = await response.arrayBuffer();
            const bordereauxPdfDoc = await PDFDocument.load(bordereauxBytes);

            const copiedPages = await reportPdfDoc.copyPages(bordereauxPdfDoc, bordereauxPdfDoc.getPageIndices());
            copiedPages.forEach((page) => reportPdfDoc.addPage(page));

            const pdfBytes = await reportPdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = finalFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error merging PDF:', error);
            alert('Error al fusionar el bordereaux PDF. Se descargará solo el reporte.');
            doc.save(finalFileName);
        }
    } else {
        doc.save(finalFileName);
    }
};

export const generateBatchLiquidacionPDF = async (data: any) => {
    const { grupal } = data;
    const doc = new jsPDF();
    const symbol = '$';
    const primary = [220, 38, 38];
    const dark = [30, 30, 30];

    const fmt = (val: any) => `${symbol} ${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // HEADER
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('LIQUIDACIÓN CONSOLIDADA', 15, 20);
    doc.setFontSize(14);
    doc.text(grupal.nombre.toUpperCase(), 15, 30);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 15, 38);

    let y = 55;

    // 1) REMOVE CONSOLIDATED SUMMARY (Skipped as requested)

    // 2) LISTADO DE FUNCIONES
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE DE FUNCIONES', 15, y);
    y += 5;

    const liquidacionesOrdenadas = [...(grupal.liquidaciones || [])].sort((a, b) =>
        new Date(a.funcion.fecha).getTime() - new Date(b.funcion.fecha).getTime()
    );

    const functionData = liquidacionesOrdenadas.map((l: any) => {
        const deducciones = (l.items || []).filter((i: any) => i.tipo === 'Deduccion').reduce((acc: number, i: any) => acc + (Number(i.monto) || 0), 0);
        const sala = (Number(l.recaudacionNeta) || 0) - (Number(l.resultadoCompania) || 0);

        return {
            fecha: new Date(l.funcion.fecha).toLocaleDateString('es-AR'),
            entradas: Number(l.funcion.vendidas) || 0,
            totalVenta: Number(l.facturacionTotal) || 0,
            decTarjeta: Number(l.costosVenta) || 0,
            recBruta: Number(l.recaudacionBruta) || 0,
            deducciones: deducciones,
            sala: sala,
            ingresoCia: Number(l.resultadoCompania) || 0
        };
    });

    const totals = functionData.reduce((acc: any, curr: any) => ({
        entradas: acc.entradas + curr.entradas,
        totalVenta: acc.totalVenta + curr.totalVenta,
        decTarjeta: acc.decTarjeta + curr.decTarjeta,
        recBruta: acc.recBruta + curr.recBruta,
        deducciones: acc.deducciones + curr.deducciones,
        sala: acc.sala + curr.sala,
        ingresoCia: acc.ingresoCia + curr.ingresoCia
    }), { entradas: 0, totalVenta: 0, decTarjeta: 0, recBruta: 0, deducciones: 0, sala: 0, ingresoCia: 0 });

    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Entradas', 'Total Venta', 'Dec. Tarjeta', 'Rec. Bruta', 'Deducciones', 'Sala', 'Ingreso Cía']],
        body: [
            ...functionData.map((d: any) => [
                d.fecha,
                d.entradas,
                fmt(d.totalVenta),
                fmt(d.decTarjeta),
                fmt(d.recBruta),
                fmt(d.deducciones),
                fmt(d.sala),
                fmt(d.ingresoCia)
            ]),
            [
                { content: 'TOTALES', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: totals.entradas.toString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'center' } },
                { content: fmt(totals.totalVenta), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: fmt(totals.decTarjeta), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: fmt(totals.recBruta), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: fmt(totals.deducciones), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: fmt(totals.sala), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
                { content: fmt(totals.ingresoCia), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
            ]
        ],
        theme: 'grid',
        headStyles: { fillColor: dark as any },
        styles: { fontSize: 7 },
        columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // 3) LISTADO DE GASTOS (Conditional logic: if payout base is "Utilidad")
    const anyUtilityBase = (grupal.consolidatedRepartos || []).some((r: any) => r.base === 'Utilidad');
    const expenses = (grupal.allItems || []).filter((i: any) => i.tipo === 'Gasto');
    const totalGastos = expenses.reduce((acc: number, i: any) => acc + (Number(i.monto) || 0), 0);

    if (anyUtilityBase && expenses.length > 0) {
        if (y > 230) { doc.addPage(); y = 20; }
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.text('LISTADO DE GASTOS', 15, y);
        y += 5;

        autoTable(doc, {
            startY: y,
            head: [['Concepto', 'Nivel', 'Importe']],
            body: [
                ...expenses.map((i: any) => [
                    i.concepto,
                    i.isGroupLevel ? 'GRUPO' : 'FUNCIÓN',
                    fmt(i.monto)
                ]),
                [{ content: 'TOTAL GASTOS', colSpan: 2, styles: { fontStyle: 'bold', halign: 'right', fillColor: [245, 245, 245] } }, { content: fmt(totalGastos), styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }]
            ],
            theme: 'striped',
            headStyles: { fillColor: dark as any },
            styles: { fontSize: 8 },
            columnStyles: { 2: { halign: 'right' } }
        });

        y = (doc as any).lastAutoTable.finalY + 15;
    }

    // 4) CLARIFICACION DEL RESULTADO DEL PERIODO
    if (y > 240) { doc.addPage(); y = 20; }

    const resultPeriodo = totals.ingresoCia - totalGastos;

    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(15, y, 180, 45, 'F');
    doc.setTextColor(255, 255, 255);

    doc.setFontSize(10);
    doc.text(`Total Ingreso Compañía: ${fmt(totals.ingresoCia)}`, 25, y + 12);
    doc.text(`Total Gastos Período: - ${fmt(totalGastos)}`, 25, y + 20);

    doc.setDrawColor(255, 255, 255);
    doc.line(25, y + 24, 100, y + 24);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`RESULTADO DEL PERÍODO: ${fmt(resultPeriodo)}`, 25, y + 36);

    y += 60;

    // 5) DIVISIÓN HTH Y ARTISTA
    if (y > 230) { doc.addPage(); y = 20; }
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(12);
    const isRevenueOnlyGrupal = (grupal.consolidatedRepartos || []).length > 0 && !(grupal.consolidatedRepartos || []).some((r: any) => r.base === 'Utilidad');
    doc.text(isRevenueOnlyGrupal ? 'PORCENTAJE ARTISTAS' : 'REPARTO Y DIVISIÓN DE RESULTADOS', 15, y);
    y += 8;

    const hthPercent = resultPeriodo > 0 ? (Number(grupal.finalBalance) / resultPeriodo) * 100 : 0;

    autoTable(doc, {
        startY: y,
        head: [['Beneficiario', 'Base', 'Monto Bruto / Retenciones', 'Saldo Neto']],
        body: [
            ...(grupal.consolidatedRepartos || []).map((r: any) => [
                `${r.nombreArtista.toUpperCase()} (${r.porcentaje}%)`,
                r.base,
                `${fmt(r.monto)} ${r.retencionAAA > 0 ? `(AAA: -${fmt(r.retencionAAA)})` : ''}`,
                { content: fmt(r.monto - (r.retencionAAA || 0)), styles: { fontStyle: 'bold' } }
            ]),
            [{ content: `HTH (${hthPercent.toFixed(1)}%)`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, '-', { content: fmt(grupal.finalBalance), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]
        ],
        theme: 'grid',
        headStyles: { fillColor: dark as any },
        columnStyles: { 3: { halign: 'right' } }
    });

    // --- 6) PÁGINAS INDIVIDUALES POR ARTISTA ---
    for (const r of (grupal.consolidatedRepartos || [])) {
        doc.addPage();

        // Header for Artist Page
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(0, 0, 210, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('LIQUIDACIÓN INDIVIDUAL CONSOLIDADA', 15, 15);
        doc.setFontSize(12);
        doc.text(r.nombreArtista.toUpperCase(), 15, 25);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(`Obra: ${grupal.nombre} - Período Consolidado`, 15, 32);

        let curY = 50;
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('DESGLOSE POR FUNCIÓN', 15, curY);
        curY += 6;

        const artistFunctionRows = liquidacionesOrdenadas.map((l: any) => {
            const deducciones = (l.items || []).filter((i: any) => i.tipo === 'Deduccion').reduce((acc: number, i: any) => acc + (Number(i.monto) || 0), 0);
            return [
                new Date(l.funcion.fecha).toLocaleDateString('es-AR'),
                l.funcion.salaNombre || '-',
                l.funcion.vendidas || 0,
                fmt(l.facturacionTotal),
                fmt(l.costosVenta),
                fmt(l.recaudacionBruta),
                fmt(deducciones),
                fmt(l.recaudacionNeta)
            ];
        });

        // Totals for this artist's view
        const totalEntradas = liquidacionesOrdenadas.reduce((sum, l) => sum + (Number(l.funcion.vendidas) || 0), 0);
        const totalVenta = liquidacionesOrdenadas.reduce((sum, l) => sum + (Number(l.facturacionTotal) || 0), 0);
        const totalCostos = liquidacionesOrdenadas.reduce((sum, l) => sum + (Number(l.costosVenta) || 0), 0);
        const totalRecBruta = liquidacionesOrdenadas.reduce((sum, l) => sum + (Number(l.recaudacionBruta) || 0), 0);
        const totalDeds = liquidacionesOrdenadas.reduce((sum, l) => {
            const d = (l.items || []).filter((i: any) => i.tipo === 'Deduccion').reduce((acc: number, i: any) => acc + (Number(i.monto) || 0), 0);
            return sum + d;
        }, 0);
        const totalRecNeta = liquidacionesOrdenadas.reduce((sum, l) => sum + (Number(l.recaudacionNeta) || 0), 0);

        artistFunctionRows.push([
            { content: 'TOTALES', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            '-',
            { content: totalEntradas.toString(), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: fmt(totalVenta), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: fmt(totalCostos), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: fmt(totalRecBruta), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: fmt(totalDeds), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: fmt(totalRecNeta), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
        ]);

        autoTable(doc, {
            startY: curY,
            head: [['Fecha', 'Sala', 'Entradas', 'Venta Tot.', 'Costo Vta.', 'Rec. Bruta', 'Deducc.', 'Rec. Neta']],
            body: artistFunctionRows,
            theme: 'grid',
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: dark as any },
            columnStyles: { 2: { halign: 'center' }, 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' }, 7: { halign: 'right' } }
        });

        curY = (doc as any).lastAutoTable.finalY + 15;

        // Artist Final Summary on their page
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.setFontSize(11);
        doc.text('RESUMEN DE LIQUIDACIÓN', 15, curY);
        curY += 5;

        let baseMonto = 0;
        if (r.base === 'Bruta') baseMonto = totalRecBruta;
        else if (r.base === 'Neta') baseMonto = totalRecNeta;
        else if (r.base === 'Utilidad') baseMonto = resultPeriodo;

        autoTable(doc, {
            startY: curY,
            body: [
                ['Concepto de Base', `Acordado sobre ${r.base}`],
                ['Monto Base Imponible (Total)', fmt(baseMonto)],
                ['Porcentaje Acordado', `${r.porcentaje}%`],
                [{ content: 'Total Bruto a Percibir', styles: { fontStyle: 'bold' } }, { content: fmt(r.monto), styles: { fontStyle: 'bold' } }],
                ...(r.retencionAAA && r.retencionAAA > 0 ? [
                    [{ content: 'Retención AAA', styles: { textColor: [200, 0, 0] as [number, number, number] } }, `- ${fmt(r.retencionAAA)}`]
                ] : []),
                [{ content: 'SALDO NETO A COBRAR', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, { content: fmt(Number(r.monto) - (r.retencionAAA || 0)), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]
            ],
            theme: 'grid',
            styles: { cellPadding: 5, fontSize: 10 },
            columnStyles: { 1: { halign: 'right' } }
        });

        // Signatures Placeholder
        curY = (doc as any).lastAutoTable.finalY + 25;
        doc.setDrawColor(200, 200, 200);
        doc.line(30, curY, 90, curY);
        doc.line(120, curY, 180, curY);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text('Firma Artista / Representante', 40, curY + 5);
        doc.text('Firma HTH Producciones', 135, curY + 5);
    }

    // --- 7) DETALLE INDIVIDUAL DE CADA FUNCIÓN ---
    for (const l of liquidacionesOrdenadas) {
        doc.addPage();

        // Header for Individual Section
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALLE INDIVIDUAL DE FUNCIÓN', 15, 12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${l.funcion.obra.nombre} - ${new Date(l.funcion.fecha).toLocaleDateString('es-AR')} - ${l.funcion.salaNombre}`, 15, 22);

        let curY = 45;

        // Income table
        doc.setTextColor(primary[0], primary[1], primary[2]);
        doc.setFontSize(11);
        doc.text('INGRESOS Y DEDUCCIONES', 15, curY);
        curY += 5;

        autoTable(doc, {
            startY: curY,
            head: [['Concepto', 'Porcentaje', 'Importe']],
            body: [
                ['Venta Bruta Total', '-', fmt(l.facturacionTotal)],
                ['Costos de Venta (Ticketeras)', '-', `- ${fmt(l.costosVenta)}`],
                [{ content: 'RECAUDACIÓN BRUTA', styles: { fontStyle: 'bold' } }, '-', { content: fmt(l.recaudacionBruta), styles: { fontStyle: 'bold' } }],
                ...(l.items || []).filter((i: any) => i.tipo === 'Deduccion').map((i: any) => [
                    i.concepto,
                    i.porcentaje ? `${i.porcentaje}%` : '-',
                    `- ${fmt(i.monto)}`
                ]),
                [{ content: 'RECAUDACIÓN NETA', styles: { fontStyle: 'bold' } }, '-', { content: fmt(l.recaudacionNeta), styles: { fontStyle: 'bold' } }],
                ['Sala / Prod. Loc', `${l.acuerdoPorcentaje}%`, `- ${fmt((Number(l.recaudacionNeta) || 0) - (Number(l.resultadoCompania) || 0))}`],
                [{ content: 'RESULTADO COMPAÑÍA', styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }, '-', { content: fmt(l.resultadoCompania), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }],
            ],
            theme: 'striped',
            headStyles: { fillColor: [80, 80, 80] },
            styles: { fontSize: 9 },
            columnStyles: { 2: { halign: 'right' } }
        });

        curY = (doc as any).lastAutoTable.finalY + 15;

        // Expenses for this function (Combined: Production + Cash)
        const prodExpenses = (l.items || []).filter((i: any) => i.tipo === 'Gasto' && i.concepto !== 'Gastos de Caja (Registro)');
        const cashExpenses = (l.gastosCajaList || []).map((g: any) => ({
            concepto: g.descripcion,
            monto: g.monto
        }));
        const combinedExpenses = [...prodExpenses, ...cashExpenses];

        if (combinedExpenses.length > 0) {
            doc.setTextColor(primary[0], primary[1], primary[2]);
            doc.text('GASTOS DE PRODUCCIÓN Y CAJA', 15, curY);
            curY += 5;

            autoTable(doc, {
                startY: curY,
                head: [['Gastos / Concepto', 'Importe']],
                body: [
                    ...combinedExpenses.map((i: any) => [i.concepto, `- ${fmt(i.monto)}`]),
                    [{ content: 'TOTAL GASTOS FUNCIÓN', styles: { fontStyle: 'bold' } }, { content: fmt(combinedExpenses.reduce((sum, i) => sum + (Number(i.monto) || 0), 0)), styles: { fontStyle: 'bold' } }],
                ],
                theme: 'striped',
                headStyles: { fillColor: [120, 120, 120] },
                styles: { fontSize: 8 },
                columnStyles: { 1: { halign: 'right' } }
            });
        }
    }

    // FOOTER
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Generado por HTH Gestión - ${new Date().toLocaleString('es-AR')}`, 15, 285);
        doc.text(`Página ${i} de ${pageCount}`, 180, 285);
    }

    doc.save(`Liquidacion_Grupal_${grupal.nombre.replace(/\s+/g, '_')}.pdf`);
};
