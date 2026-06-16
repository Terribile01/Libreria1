import * as pdfjs from 'pdfjs-dist';

// Imposta il worker per pdfjs usando un CDN affidabile e l'estensione .mjs richiesta dalle nuove versioni
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export const PdfService = {
  /**
   * Estrae il testo grezzo da un file (PDF o TXT).
   */
  extractRawText: async (source: string | Blob): Promise<string> => {
    try {
      // 1. Check if it's a TXT file via URL extension
      if (typeof source === 'string' && source.toLowerCase().endsWith('.txt')) {
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Errore caricamento TXT: ${response.status}`);
        return await response.text();
      }

      let data: Uint8Array;

      if (typeof source === 'string') {
        if (!source) throw new Error("URL sorgente mancante");
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Errore caricamento file: ${response.status}`);

        // Handle TXT even if extension is missing but content-type is text
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('text/plain')) {
          return await response.text();
        }

        const arrayBuffer = await response.arrayBuffer();
        data = new Uint8Array(arrayBuffer);
      } else {
        const arrayBuffer = await source.arrayBuffer();
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
