import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import * as pdfjsViewer from 'pdfjs-dist/legacy/web/pdf_viewer';
import 'pdfjs-dist/web/pdf_viewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.0.375/pdf.worker.min.js`;

const PdfViewer = ({
  file,
  currentPage,
  setNumPages,
}: {
  file: string;
  currentPage: number;
  setNumPages: (n: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const loadingTaskRef = useRef<any>(null);
  const pdfDocRef = useRef<any>(null);
  const [scale, setScale] = useState(1);

  const renderPage = async (pageNum: number, newScale: number = scale) => {
    if (!containerRef.current || !pdfDocRef.current) return;

    containerRef.current.innerHTML = '';

    const page = await pdfDocRef.current.getPage(pageNum);
    const viewport = page.getViewport({ scale: newScale });

    const pageContainer = document.createElement('div');
    pageContainer.className = 'page';
    containerRef.current.appendChild(pageContainer);

    const eventBus = new pdfjsViewer.EventBus();

    const pdfPageView = new pdfjsViewer.PDFPageView({
      container: pageContainer,
      id: pageNum,
      scale: newScale,
      defaultViewport: viewport,
      eventBus,
      annotationMode: 1,
      textLayerMode: 0,  
    });

    pdfPageView.setPdfPage(page);
    await pdfPageView.draw();
  }
  // Caricamento iniziale
  useEffect(() => {
    const loadPdf = async () => {
      if (!file || !containerRef.current) return;

      containerRef.current.innerHTML = '';

      if (loadingTaskRef.current) {
        try {
          await loadingTaskRef.current.destroy();
        } catch (err: any) {
          if (err?.message !== 'Loading aborted') {
            console.warn('Errore durante distruzione del PDF precedente:', err);
          }
        }
      }

      try {
        const loadingTask = pdfjsLib.getDocument(file);
        loadingTaskRef.current = loadingTask;

        const pdfDoc = await loadingTask.promise;
        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);

        renderPage(currentPage, scale);
      } catch (err: any) {
        console.error('Errore durante il caricamento del PDF:', err);
      }
    };

    loadPdf();

    return () => {
      if (loadingTaskRef.current) {
        loadingTaskRef.current.destroy().catch(() => {});
      }
    };
  }, [file]);

  // Rende la pagina al cambio pagina o scala
  useEffect(() => {
    renderPage(currentPage, scale);
  }, [currentPage, scale]);

  // Drag scroll (pan)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      startX = e.pageX;
      startY = e.pageY;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
      //container.classList.add('dragging');
      container.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const walkX = e.pageX - startX;
      const walkY = e.pageY - startY;
      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
    };

    const endDrag = () => {
      isDragging = false;
      //container.classList.remove('dragging');
      container.style.cursor = 'grab';
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', endDrag);
    container.addEventListener('mouseleave', endDrag);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', endDrag);
      container.removeEventListener('mouseleave', endDrag);
    };
  }, []);

  // Zoom con rotellina 
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomStep = 0.1;

      setScale((prev) => {
        const newScale = e.deltaY < 0 ? prev + zoomStep : prev - zoomStep;
        return Math.min(Math.max(newScale, 0.5), 3);
      });
    };

    container.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', onWheel);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pdf-container"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    />
  );
};

export default PdfViewer;
