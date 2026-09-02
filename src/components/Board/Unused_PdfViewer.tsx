import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type RenderTask,
} from "pdfjs-dist";
import { useEffect, useRef, useState } from "react";

GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

interface PdfViewerProps {
  file: Blob;
}

const PdfViewer = ({ file }: PdfViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !file) {
      return;
    }

    let cancelled = false;
    let pdf: PDFDocumentProxy | null = null;
    let renderTask: RenderTask | null = null;

    const objectUrl = URL.createObjectURL(file);

    const loadPdf = async () => {
      setLoading(true);
      setError(false);

      try {
        const loadingTask = getDocument({
          url: objectUrl,
        });

        pdf = await loadingTask.promise;

        if (cancelled || !pdf) {
          return;
        }

        container.replaceChildren();

        /*
         * Render at a higher physical resolution than the CSS size.
         *
         * 2x minimum keeps PDF text sharp on normal and high-DPI displays.
         * 3x is enough for most screens without creating unnecessarily
         * enormous canvas bitmaps.
         */
        const outputScale = Math.min(
          Math.max(window.devicePixelRatio || 1, 2),
          3,
        );

        /*
         * The modal viewer is intentionally simple for now:
         *
         * - all pages are rendered
         * - pages scroll vertically
         * - no zoom/page navigation toolbar yet
         *
         * We can add progressive rendering later if large PDFs become
         * noticeably expensive.
         */
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled || !pdf) {
            break;
          }

          const page = await pdf.getPage(pageNumber);

          if (cancelled) {
            page.cleanup();
            break;
          }

          /*
           * Start with a scale of 1 so we know the page's natural width.
           */
          const baseViewport = page.getViewport({
            scale: 1,
          });

          /*
           * Fit the PDF page to the available viewer width.
           *
           * Leave a small amount of breathing room on each side.
           */
          const availableWidth = Math.max(container.clientWidth - 32, 1);

          const scale = availableWidth / baseViewport.width;

          const viewport = page.getViewport({
            scale,
          });

          const canvas = document.createElement("canvas");

          canvas.width = Math.ceil(viewport.width * outputScale);
          canvas.height = Math.ceil(viewport.height * outputScale);

          canvas.style.display = "block";
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          /*
           * Center pages that are narrower than the viewer.
           */
          const pageWrapper = document.createElement("div");

          pageWrapper.className = "flex w-full justify-center overflow-hidden";

          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);

          renderTask = page.render({
            canvas,
            viewport,
            transform: [outputScale, 0, 0, outputScale, 0, 0],
          });

          await renderTask.promise;

          renderTask = null;

          page.cleanup();
        }

        if (!cancelled) {
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to render PDF:", err);
        setError(true);
        setLoading(false);
      }
    };

    void loadPdf();

    return () => {
      cancelled = true;

      if (renderTask) {
        renderTask.cancel();
        renderTask = null;
      }

      if (pdf) {
        void pdf.destroy();
        pdf = null;
      }

      URL.revokeObjectURL(objectUrl);

      container.replaceChildren();
    };
  }, [file]);

  if (error) {
    return (
      <div className="text-text-muted flex h-full min-h-64 items-center justify-center text-xs">
        Failed to render PDF
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden bg-neutral-900">
      {loading && (
        <div className="text-text-muted absolute inset-0 z-10 flex items-center justify-center bg-neutral-900 text-xs">
          Loading PDF...
        </div>
      )}

      <div ref={containerRef} className="h-full overflow-y-auto px-4 py-4" />
    </div>
  );
};

export default PdfViewer;
