import * as pdfjs from 'pdfjs-dist';

// Imposta il worker per pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export const PdfService = {
  /**
   * Estrae il testo grezzo da un file PDF (Blob o URL).
   */
  extractRawText: async (pdfSource: string | Blob): Promise<string> => {
    try {
      let data: Uint8Array;

      if (typeof pdfSource === 'string') {
        if (!pdfSource) throw new Error("URL sorgente PDF mancante");
        const response = await fetch(pdfSource);
        if (!response.ok) throw new Error(`Errore caricamento PDF: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        data = new Uint8Array(arrayBuffer);
      } else {
        const arrayBuffer = await pdfSource.arrayBuffer();
        data = new Uint8Array(arrayBuffer);
      }

      const loadingTask = pdfjs.getDocument({ data });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error: any) {
      console.error('Errore durante l\'estrazione del testo dal PDF:', error);
      throw new Error(`Impossibile leggere il PDF: ${error.message}`);
    }
  }
};
