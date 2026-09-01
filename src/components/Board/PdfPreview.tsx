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

interface PdfPreviewProps {
  src: string;
  className?: string;
  firstPageOnly?: boolean;
}

const PdfPreview = ({
  src,
  className = "",
  firstPageOnly = false,
}: PdfPreviewProps) => {
  /*
   * This element is NOT scrollable.
   *
   * We observe this element instead of the PDF scroll container so that
   * the appearance/disappearance of a scrollbar doesn't change the
   * measured width and cause a render loop.
   */
  const sizeRef = useRef<HTMLDivElement>(null);

  /*
   * The element containing the rendered PDF pages.
   */
  const containerRef = useRef<HTMLDivElement>(null);

  const [containerWidth, setContainerWidth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /*
   * Track the width of the non-scrolling wrapper.
   */
  useEffect(() => {
    const element = sizeRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      const width = Math.round(element.getBoundingClientRect().width);

      if (width > 0) {
        setContainerWidth((previousWidth) =>
          previousWidth === width ? previousWidth : width,
        );
      }
    };

    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /*
   * Load and render the PDF.
   */
  useEffect(() => {
    if (!src || containerWidth <= 0) {
      return;
    }

    const container = containerRef.current;

    if (!container) {
      return;
    }

    let cancelled = false;
    let pdf: PDFDocumentProxy | null = null;
    let renderTask: RenderTask | null = null;

    const loadingTask = getDocument({
      url: src,
    });

    const renderPdf = async () => {
      /*
       * Only show the loading state if we don't already have
       * a rendered PDF on screen.
       *
       * This prevents flashing during responsive resizing.
       */
      if (container.childElementCount === 0) {
        setLoading(true);
      }

      setError(false);

      try {
        pdf = await loadingTask.promise;

        if (cancelled || !pdf) {
          return;
        }

        /*
         * Render into a temporary container first.
         *
         * This is important:
         *
         * We don't clear the currently visible PDF while the new
         * rendering is happening.
         */
        const nextContainer = document.createElement("div");

        nextContainer.className = "flex w-full flex-col gap-2";

        const pageCount = firstPageOnly ? 1 : pdf.numPages;

        /*
         * Render at 2x minimum for sharp text.
         *
         * Cap at 3x to avoid unnecessarily large canvas bitmaps.
         */
        const outputScale = Math.min(
          Math.max(window.devicePixelRatio || 1, 2),
          3,
        );

        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
          if (cancelled || !pdf) {
            break;
          }

          const page = await pdf.getPage(pageNumber);

          if (cancelled) {
            page.cleanup();
            break;
          }

          const baseViewport = page.getViewport({
            scale: 1,
          });

          /*
           * Fit the PDF page to the card width.
           */
          const scale = containerWidth / baseViewport.width;

          const viewport = page.getViewport({
            scale,
          });

          const canvas = document.createElement("canvas");

          /*
           * PDF.js 6.x uses the canvas directly.
           */
          canvas.width = Math.ceil(viewport.width * outputScale);
          canvas.height = Math.ceil(viewport.height * outputScale);

          /*
           * Display dimensions remain at CSS size.
           *
           * Example:
           *
           * viewport.width = 350px
           * outputScale = 2
           *
           * Actual canvas = 700px
           * Displayed canvas = 350px
           */
          canvas.style.display = "block";
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          const pageWrapper = document.createElement("div");

          pageWrapper.className = "overflow-hidden bg-white shadow-sm";

          pageWrapper.style.width = `${viewport.width}px`;
          pageWrapper.style.height = `${viewport.height}px`;

          pageWrapper.appendChild(canvas);
          nextContainer.appendChild(pageWrapper);

          /*
           * PDF.js 6.x render API.
           *
           * `canvas` is required.
           */
          renderTask = page.render({
            canvas,
            viewport,
            transform: [outputScale, 0, 0, outputScale, 0, 0],
          });

          await renderTask.promise;

          renderTask = null;

          page.cleanup();
        }

        if (cancelled) {
          return;
        }

        /*
         * Swap the fully rendered PDF into the visible container.
         *
         * This prevents a blank/loading flash while rendering.
         */
        container.replaceChildren(...Array.from(nextContainer.children));

        setLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error("Failed to render PDF:", err);

        /*
         * Only show the error if we don't already have a valid
         * PDF preview on screen.
         */
        if (container.childElementCount === 0) {
          setError(true);
        }

        setLoading(false);
      }
    };

    void renderPdf();

    return () => {
      cancelled = true;

      /*
       * Cancel the currently rendering page.
       */
      if (renderTask) {
        renderTask.cancel();
        renderTask = null;
      }

      /*
       * pdfjs-dist 6.x:
       *
       * destroy() belongs to PDFDocumentLoadingTask.
       */
      void loadingTask.destroy();
    };
  }, [src, containerWidth, firstPageOnly]);

  if (error) {
    return (
      <div
        className={`flex h-64 items-center justify-center bg-neutral-900 text-xs text-neutral-500 ${className}`}
      >
        Failed to load PDF
      </div>
    );
  }

  return (
    /*
     * This wrapper has NO overflow.
     *
     * ResizeObserver watches this element.
     */
    <div ref={sizeRef} className={`relative w-full ${className}`}>
      {/*
       * This is the actual scrolling viewport.
       */}
      <div
        data-testid="pdf-viewport"
        className="relative h-64 overflow-x-hidden overflow-y-auto overscroll-contain bg-neutral-900"
      >
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900 text-xs text-neutral-500">
            Loading PDF...
          </div>
        )}

        <div
          ref={containerRef}
          data-testid="pdf-container"
          className="flex w-full flex-col gap-2"
        />
      </div>
    </div>
  );
};

export default PdfPreview;
