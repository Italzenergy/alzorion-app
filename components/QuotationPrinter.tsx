"use client";

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useReactToPrint } from 'react-to-print';
import api from '@/lib/api';
import { QuotationTemplate, TemplateConfig } from '../app/dashboard/quotes/QuotationTemplate';
// Seguimos necesitando esto estrictamente para generar el Base64 del correo
import html2pdf from 'html2pdf.js';

export interface QuotationPrinterRef {
  print: (quoteId: string) => void;
  sendEmail: (quoteId: string) => Promise<void>; 
}

export const QuotationPrinter = forwardRef<QuotationPrinterRef, {}>((props, ref) => {
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | undefined>();
  const [quoteToPrint, setQuoteToPrint] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Cargar configuración
  useEffect(() => {
    const saved = localStorage.getItem('alz_quote_template');
    if (saved) {
      setTemplateConfig(JSON.parse(saved));
    }
  }, []);

  // Motor de impresión manual (Botón Descargar - Usa el navegador)
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    // ELIMINAMOS el documentTitle de aquí para que lea el título de la pestaña actual
    onAfterPrint: () => {
      setQuoteToPrint(null);
      // Restauramos el título de tu pestaña al terminar
      document.title = 'ALZ ORION | Dashboard'; 
    }
  });

  useImperativeHandle(ref, () => ({
    
    // Función 1: DESCARGAR PDF (Abre la ventana del navegador)
    print: async (quoteId: string) => {
      try {
        const response = await api.get<any>(`/quotations/${quoteId}`); 
        setQuoteToPrint(response);
        
        // --- TRUCO NINJA ---
        // Le cambiamos el nombre a la pestaña del navegador dinámicamente
        // Esto fuerza a la impresora a usar este nombre para el PDF
        document.title = `${response.document_number} - ${response.clients?.name || 'Cliente'}`;
        
        setTimeout(() => {
          handlePrint();
        }, 300);
      } catch (error) {
        console.error("Error al cargar datos para imprimir", error);
        alert("No se pudo generar el PDF");
      }
    },

    // Función 2: ENVIAR POR CORREO (Genera el Base64 en un entorno aislado)
    sendEmail: async (quoteId: string) => {
      try {
        // 1. Cargamos los datos
        const response = await api.get<any>(`/quotations/${quoteId}`);
        setQuoteToPrint(response);
        
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!printRef.current) throw new Error("No se encontró el molde del PDF");

        // --- INICIO DEL TRUCO NINJA ---
        // Guardamos el estilo original del HTML (donde viven las variables de Next.js/Tailwind)
        const htmlElement = document.documentElement;
        const originalStyle = htmlElement.getAttribute('style') || '';
        
        // Forzamos la sobreescritura de las variables a colores seguros (HEX/RGB)
        // Esto evita que html2canvas lea los oklch()
        htmlElement.setAttribute('style', `
          --background: #ffffff;
          --foreground: #000000;
          --card: #ffffff;
          --card-foreground: #000000;
          --popover: #ffffff;
          --popover-foreground: #000000;
          --primary: #000000;
          --primary-foreground: #ffffff;
          --secondary: #f3f4f6;
          --secondary-foreground: #000000;
          --muted: #f3f4f6;
          --muted-foreground: #6b7280;
          --accent: #f3f4f6;
          --accent-foreground: #000000;
          --destructive: #ef4444;
          --border: #e5e7eb;
          --input: #e5e7eb;
          --ring: #d1d5db;
        `);

        // Extra: Removemos la clase dark por si acaso
        const wasDark = htmlElement.classList.contains('dark');
        if (wasDark) htmlElement.classList.remove('dark');
        // --- FIN DEL TRUCO NINJA ---

        // Configuramos la cámara
        const opt = {
          margin: 0,
          filename: 'generated.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Tomamos la foto
        const pdfBase64 = await html2pdf().set(opt as any).from(printRef.current).outputPdf('datauristring');

        // --- RESTAURAMOS TODO A LA NORMALIDAD ---
        htmlElement.setAttribute('style', originalStyle);
        if (wasDark) htmlElement.classList.add('dark');
        // --- FIN RESTAURACIÓN ---

        // Enviamos al backend
        await api.post<any>(`/quotations/${quoteId}/send`, { pdfBase64 });
      
        setQuoteToPrint(null);
        
      } catch (error) {
        // IMPORTANTÍSIMO: Si falla, igual restauramos los estilos
        document.documentElement.setAttribute('style', '');
        console.error("Error al generar o enviar el correo:", error);
        throw error;
      }
    }

  }));

  return (
    <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
      {/* Ya no necesitamos el escudo mágico gigante, el cuarto aislado hace el trabajo */}
      <div ref={printRef}>
        <QuotationTemplate quote={quoteToPrint} config={templateConfig} />
      </div>
    </div>
  );
});

QuotationPrinter.displayName = 'QuotationPrinter';