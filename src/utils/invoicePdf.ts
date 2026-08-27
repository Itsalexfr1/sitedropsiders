import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateInvoicePDFDoc(html: string): Promise<jsPDF> {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '0';
    iframe.style.top = '0';
    iframe.style.width = '794px';
    iframe.style.minHeight = '1123px';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-99999';
    iframe.style.opacity = '1';
    iframe.style.pointerEvents = 'none';
    iframe.style.backgroundColor = '#ffffff';
    document.body.appendChild(iframe);

    try {
        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) throw new Error('Impossible d\'accéder au document iframe');

        doc.open();
        doc.write(html);
        doc.close();

        await new Promise((r) => setTimeout(r, 300));

        const targetEl = (doc.querySelector('.page') || doc.body) as HTMLElement;

        const canvas = await html2canvas(targetEl, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgProps = pdf.getImageProperties(imgData);
        const contentHeight = (imgProps.height * pdfWidth) / imgProps.width;

        if (contentHeight <= pdfHeight) {
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, contentHeight);
        } else {
            let yOffset = 0;
            const pageCanvas = document.createElement('canvas');
            const pageCtx = pageCanvas.getContext('2d')!;
            const pageHeightPx = Math.floor((pdfHeight / pdfWidth) * canvas.width);
            pageCanvas.width = canvas.width;
            pageCanvas.height = pageHeightPx;

            while (yOffset < canvas.height) {
                pageCtx.fillStyle = '#ffffff';
                pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                pageCtx.drawImage(canvas, 0, -yOffset);
                const pageData = pageCanvas.toDataURL('image/jpeg', 0.98);
                if (yOffset > 0) pdf.addPage();
                pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                yOffset += pageHeightPx;
            }
        }

        return pdf;
    } finally {
        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    }
}

export async function downloadInvoicePDFHelper(invData: any, buildHtmlFn: (data: any) => string): Promise<void> {
    try {
        const html = buildHtmlFn(invData);
        const pdf = await generateInvoicePDFDoc(html);
        const prefix = invData.type === 'devis' ? 'Devis' : 'Facture';
        const num = invData.invoiceNumber || invData.formattedNumber || '00';
        pdf.save(`${prefix}_${num}.pdf`);
    } catch (err) {
        console.error('Erreur lors du téléchargement du PDF facture :', err);
        alert('Erreur lors de la création du PDF. Veuillez réessayer.');
    }
}

export async function getInvoicePDFDataUri(invData: any, buildHtmlFn: (data: any) => string): Promise<string> {
    const html = buildHtmlFn(invData);
    const pdf = await generateInvoicePDFDoc(html);
    return pdf.output('datauristring');
}
