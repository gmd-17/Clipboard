import React, { useCallback, useEffect, useRef, useState } from "react";

import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";

import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";

import "pdfjs-dist/web/pdf_viewer.css";

// Vite-native worker
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

// -----------------------------------------------------------------------------
// PDF.JS WORKER
// -----------------------------------------------------------------------------

if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export interface PdfPreviewProps {
  /**
   * PDF source.
   */
  src: string | Blob | File | ArrayBuffer;

  /**
   * When true:
   *
   * - PDF pages are automatically scaled down to fit the available width.
   * - Horizontal scrolling is disabled.
   * - Ideal for card/thumbnail previews.
   *
   * When false:
   *
   * - PDF uses initialScale.
   * - The modal can scroll horizontally/vertically when necessary.
   */
  fitToWidth?: boolean;

  /**
   * Custom wrapper class.
   *
   * Examples:
   *
   * Card:
   *   h-64 w-full
   *
   * Modal:
   *   h-full w-full
   */
  className?: string;

  /**
   * Render only page 1.
   */
  firstPageOnly?: boolean;

  /**
   * Enable PDF text layer.
   */
  selectableText?: boolean;

  /**
   * Show toolbar.
   */
  showToolbar?: boolean;

  /**
   * Initial PDF scale.
   *
   * 1 = 100%
   */
  initialScale?: number;

  onLoadSuccess?: (numPages: number) => void;

  onLoadError?: (error: Error) => void;
}

// -----------------------------------------------------------------------------
// PDF PAGE
// -----------------------------------------------------------------------------

interface PdfPageViewProps {
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  selectableText: boolean;

  /**
   * The scroll container used by IntersectionObserver.
   *
   * This is important for modal page navigation.
   */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;

  onVisible: (pageNumber: number) => void;
}

const PdfPageView: React.FC<PdfPageViewProps> = ({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  selectableText,
  scrollContainerRef,
  onVisible,
}) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const renderTaskRef = useRef<RenderTask | null>(null);
  const textLayerTaskRef = useRef<TextLayer | null>(null);

  // ---------------------------------------------------------------------------
  // Observe visibility of this page
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const element = pageContainerRef.current;

    if (!element) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Observe relative to the actual PDF scroll container.
     *
     * The old implementation used the browser viewport as the root.
     * That makes page tracking unreliable when PdfPreview itself is
     * inside a modal/scrolling panel.
     */
    const root = scrollContainerRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            onVisible(pageNumber);
          }
        }
      },
      {
        root,
        threshold: [0.1, 0.3, 0.6],
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [pageNumber, onVisible, scrollContainerRef]);

  // ---------------------------------------------------------------------------
  // Render page
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    /*
     * Cancel previous canvas rendering.
     */
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {}

      renderTaskRef.current = null;
    }

    /*
     * Cancel previous text layer rendering.
     */
    if (textLayerTaskRef.current) {
      try {
        textLayerTaskRef.current.cancel();
      } catch {}

      textLayerTaskRef.current = null;
    }

    const render = async () => {
      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);

        if (cancelled) {
          return;
        }

        const canvas = canvasRef.current;
        const textContainer = textLayerRef.current;

        if (!canvas) {
          return;
        }

        const context = canvas.getContext("2d", {
          alpha: false,
        });

        if (!context) {
          return;
        }

        // ---------------------------------------------------------------------
        // PDF viewport
        // ---------------------------------------------------------------------

        const viewport = page.getViewport({
          scale,
          rotation,
        });

        /*
         * Render at device-pixel resolution for sharp text.
         *
         * 2x minimum gives substantially better thumbnails while
         * still keeping the bitmap reasonable.
         */
        const pixelRatio = Math.min(
          Math.max(window.devicePixelRatio || 1, 2),
          3,
        );

        // Physical canvas dimensions
        canvas.width = Math.ceil(viewport.width * pixelRatio);

        canvas.height = Math.ceil(viewport.height * pixelRatio);

        // CSS/display dimensions
        canvas.style.display = "block";
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        /*
         * Scale the canvas context to match the high-resolution bitmap.
         */
        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        // ---------------------------------------------------------------------
        // Render canvas
        // ---------------------------------------------------------------------

        const renderTask = page.render({
          canvas,
          canvasContext: context,
          viewport,
        });

        renderTaskRef.current = renderTask;

        await renderTask.promise;

        renderTaskRef.current = null;

        if (cancelled) {
          return;
        }

        // ---------------------------------------------------------------------
        // Text layer
        // ---------------------------------------------------------------------

        if (selectableText && textContainer) {
          textContainer.innerHTML = "";

          textContainer.style.width = `${viewport.width}px`;
          textContainer.style.height = `${viewport.height}px`;

          textContainer.style.setProperty("--scale-factor", `${scale}`);

          textContainer.style.setProperty("--total-scale-factor", `${scale}`);

          const textContent = await page.getTextContent();

          if (cancelled) {
            return;
          }

          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textContainer,
            viewport,
          });

          textLayerTaskRef.current = textLayer;

          await textLayer.render();

          textLayerTaskRef.current = null;
        }
      } catch (error: any) {
        /*
         * Cancellation is expected when zooming/resizing/navigating.
         */
        if (error?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNumber} render error:`, error);
        }
      }
    };

    void render();

    return () => {
      cancelled = true;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}

        renderTaskRef.current = null;
      }

      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel();
        } catch {}

        textLayerTaskRef.current = null;
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation, selectableText]);

  return (
    <div
      ref={pageContainerRef}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      className="relative mb-6 w-fit shrink-0 overflow-hidden rounded-sm border border-neutral-700/80 bg-white shadow-2xl last:mb-0"
    >
      <canvas ref={canvasRef} className="pointer-events-none block" />

      {selectableText && (
        <div
          ref={textLayerRef}
          className="textLayer select-text"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            overflow: "hidden",
          }}
        />
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// PDF PREVIEW
// -----------------------------------------------------------------------------

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  src,
  className = "h-full min-h-100 w-full",
  fitToWidth = false,
  firstPageOnly = false,
  selectableText = true,
  showToolbar = true,
  initialScale = 1,
  onLoadSuccess,
  onLoadError,
}) => {
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);

  const [scale, setScale] = useState(initialScale);

  const [rotation, setRotation] = useState(0);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * Actual loaded PDF document.
   */
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

  /*
   * Loading task.
   */
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);

  /*
   * Actual scrolling element.
   */
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /*
   * Non-scrolling measurement wrapper.
   *
   * We deliberately measure this instead of the scroll container.
   *
   * This prevents scrollbar appearance/disappearance from changing
   * the measured width and causing a render loop.
   */
  const sizeRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Load PDF
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let mounted = true;

    setIsLoading(true);
    setError(null);
    setNumPages(0);
    setActivePage(1);

    /*
     * Destroy previous loading task.
     */
    if (loadingTaskRef.current) {
      try {
        void loadingTaskRef.current.destroy();
      } catch {}

      loadingTaskRef.current = null;
    }

    /*
     * Cleanup previous document.
     */
    if (pdfDocRef.current) {
      try {
        pdfDocRef.current.cleanup();
      } catch {}

      pdfDocRef.current = null;
    }

    const loadDocument = async () => {
      try {
        let loadingTask: PDFDocumentLoadingTask;

        // ---------------------------------------------------------------------
        // String
        // ---------------------------------------------------------------------

        if (typeof src === "string") {
          if (src.startsWith("data:application/pdf;base64,")) {
            const base64 = src.split(",")[1];

            const binary = atob(base64);

            const bytes = new Uint8Array(binary.length);

            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }

            loadingTask = pdfjsLib.getDocument({
              data: bytes,
            });
          } else {
            loadingTask = pdfjsLib.getDocument({
              url: src,
            });
          }

          // -------------------------------------------------------------------
          // Blob / File
          // -------------------------------------------------------------------
        } else if (src instanceof Blob || src instanceof File) {
          const arrayBuffer = await src.arrayBuffer();

          if (!mounted) {
            return;
          }

          loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(arrayBuffer),
          });

          // -------------------------------------------------------------------
          // ArrayBuffer
          // -------------------------------------------------------------------
        } else if (src instanceof ArrayBuffer) {
          loadingTask = pdfjsLib.getDocument({
            data: new Uint8Array(src),
          });
        } else {
          throw new Error("Unsupported src type provided to PdfPreview");
        }

        loadingTaskRef.current = loadingTask;

        const pdf = await loadingTask.promise;

        if (!mounted) {
          try {
            pdf.cleanup();
          } catch {}

          return;
        }

        pdfDocRef.current = pdf;

        const pagesToRender = firstPageOnly ? 1 : pdf.numPages;

        setNumPages(pagesToRender);

        setActivePage(1);
        setIsLoading(false);

        onLoadSuccess?.(pagesToRender);
      } catch (err: any) {
        if (!mounted) {
          return;
        }

        if (err?.name === "RenderingCancelledException") {
          return;
        }

        const message = err?.message || "Failed to load PDF document";

        console.error("Failed to load PDF:", err);

        setError(message);
        setIsLoading(false);

        onLoadError?.(err instanceof Error ? err : new Error(message));
      }
    };

    void loadDocument();

    return () => {
      mounted = false;

      if (loadingTaskRef.current) {
        try {
          void loadingTaskRef.current.destroy();
        } catch {}

        loadingTaskRef.current = null;
      }

      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.cleanup();
        } catch {}

        pdfDocRef.current = null;
      }
    };
  }, [src]);

  // ---------------------------------------------------------------------------
  // FIT TO WIDTH
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!fitToWidth || numPages === 0) {
      return;
    }

    const measurementElement = sizeRef.current;

    const pdfDoc = pdfDocRef.current;

    if (!measurementElement || !pdfDoc) {
      return;
    }

    let cancelled = false;

    const updateScale = async () => {
      try {
        /*
         * We use page 1 dimensions as the width reference.
         *
         * Every page normally has the same width, but this also
         * behaves sensibly for PDFs containing mixed page sizes.
         */
        const page = await pdfDoc.getPage(1);

        if (cancelled) {
          return;
        }

        const viewport = page.getViewport({
          scale: 1,
          rotation,
        });

        /*
         * The PDF scroll viewport has p-2:
         *
         * 8px left
         * 8px right
         *
         * Therefore the actual available page width is:
         *
         * container width - 16px
         */
        const availableWidth = Math.max(1, measurementElement.clientWidth - 16);

        /*
         * Calculate exact scale needed to fit.
         */
        const fittedScale = availableWidth / viewport.width;

        /*
         * Never enlarge PDFs in thumbnail mode.
         *
         * A small PDF stays at 100%.
         */
        const nextScale = Math.min(1, fittedScale);

        if (cancelled) {
          return;
        }

        setScale((current) => {
          if (Math.abs(current - nextScale) < 0.01) {
            return current;
          }

          return nextScale;
        });
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to calculate PDF fit scale:", err);
        }
      }
    };

    void updateScale();

    /*
     * Recalculate when card/modal width changes.
     */
    const resizeObserver = new ResizeObserver(() => {
      void updateScale();
    });

    resizeObserver.observe(measurementElement);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
    };
  }, [fitToWidth, numPages, rotation]);

  // ---------------------------------------------------------------------------
  // SCROLL TO PAGE
  // ---------------------------------------------------------------------------

  const scrollToPage = useCallback((pageNumber: number) => {
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    const page = container.querySelector(
      `[data-page-number="${pageNumber}"]`,
    ) as HTMLElement | null;

    if (!page) {
      /*
       * The page may not have rendered yet.
       *
       * Don't change activePage if we couldn't actually navigate.
       */
      return;
    }

    /*
     * Calculate the page's position relative to
     * the scroll container.
     */
    const containerRect = container.getBoundingClientRect();

    const pageRect = page.getBoundingClientRect();

    const targetTop =
      container.scrollTop + (pageRect.top - containerRect.top) - 16;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: "smooth",
    });

    setActivePage(pageNumber);
  }, []);

  // ---------------------------------------------------------------------------
  // ZOOM
  // ---------------------------------------------------------------------------

  const handleZoom = useCallback((delta: number) => {
    setScale((current) =>
      Math.min(3.5, Math.max(0.4, Number((current + delta).toFixed(2)))),
    );
  }, []);

  // ---------------------------------------------------------------------------
  // RESET ZOOM
  // ---------------------------------------------------------------------------

  const resetZoom = useCallback(() => {
    if (fitToWidth) {
      /*
       * In fit mode, reset means "fit to width" again.
       *
       * The ResizeObserver effect will calculate the exact
       * scale on the next render.
       */
      const measurementElement = sizeRef.current;

      const pdfDoc = pdfDocRef.current;

      if (measurementElement && pdfDoc) {
        void pdfDoc.getPage(1).then((page) => {
          const viewport = page.getViewport({
            scale: 1,
            rotation,
          });

          const availableWidth = Math.max(
            1,
            measurementElement.clientWidth - 16,
          );

          setScale(Math.min(1, availableWidth / viewport.width));
        });

        return;
      }
    }

    setScale(initialScale);
  }, [fitToWidth, initialScale, rotation]);

  // ---------------------------------------------------------------------------
  // OPEN NATIVE PDF VIEWER
  // ---------------------------------------------------------------------------

  const handleOpenInNewTab = useCallback(() => {
    if (typeof src === "string") {
      window.open(src, "_blank");

      return;
    }

    if (src instanceof Blob || src instanceof File) {
      const url = URL.createObjectURL(src);

      window.open(url, "_blank");

      /*
       * Give the new tab plenty of time to load the blob.
       */
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    }
  }, [src]);

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    /*
     * min-h-0 is VERY important when PdfPreview is inside a flex modal.
     *
     * Without it, the flex child can refuse to shrink and the internal
     * scroll container won't behave correctly.
     */
    <div
      data-testid="pdf-preview"
      ref={sizeRef}
      className={`relative flex min-h-0 w-full flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 ${className} `}
    >
      {/* =================================================================== */}
      {/* TOOLBAR                                                             */}
      {/* =================================================================== */}

      {showToolbar && (
        <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-xs select-none">
          {/* ---------------------------------------------------------------- */}
          {/* PAGE NAVIGATION                                                  */}
          {/* ---------------------------------------------------------------- */}

          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
            <button
              type="button"
              disabled={activePage <= 1 || isLoading}
              onClick={() => scrollToPage(Math.max(1, activePage - 1))}
              className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:text-neutral-400"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="min-w-14 px-2 text-center font-mono text-[11px] text-neutral-300">
              {numPages > 0 ? `${activePage} / ${numPages}` : "- / -"}
            </span>

            <button
              type="button"
              disabled={activePage >= numPages || isLoading}
              onClick={() => scrollToPage(Math.min(numPages, activePage + 1))}
              className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:cursor-default disabled:opacity-30 disabled:hover:text-neutral-400"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* ZOOM / ROTATION / OPEN                                           */}
          {/* ---------------------------------------------------------------- */}

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-12 px-1.5 text-center font-mono text-[11px] text-neutral-300">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={resetZoom}
              className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setRotation((current) => (current + 90) % 360)}
              className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
              title="Rotate 90°"
            >
              <RotateCw className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="ml-1 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
              title="Open in Native Viewer"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* PDF VIEWPORT                                                        */}
      {/* =================================================================== */}

      <div
        ref={scrollContainerRef}
        data-testid="pdf-viewport"
        className={`relative min-h-0 w-full flex-1 bg-neutral-950/80 ${
          fitToWidth ? "overflow-x-hidden overflow-y-auto" : "overflow-auto p-2"
        } `}
      >
        {/* ----------------------------------------------------------------- */}
        {/* LOADING                                                           */}
        {/* ----------------------------------------------------------------- */}

        {isLoading && (
          <div className="absolute inset-0 z-20 flex min-h-62.5 flex-col items-center justify-center gap-2 bg-neutral-950/95 text-xs text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />

            <span>Loading PDF pages...</span>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* ERROR                                                             */}
        {/* ----------------------------------------------------------------- */}

        {error && (
          <div className="flex h-full min-h-62.5 w-full items-center justify-center p-4">
            <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-center text-xs text-rose-400">
              <AlertCircle className="h-6 w-6 text-rose-400" />

              <span className="font-semibold">Unable to display PDF</span>

              <span className="text-neutral-400">{error}</span>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* PDF PAGES                                                         */}
        {/* ----------------------------------------------------------------- */}

        {!isLoading && !error && pdfDocRef.current && (
          <div
            data-testid="pdf-container"
            className={`flex min-h-fit flex-col gap-0 ${
              fitToWidth
                ? "w-full min-w-0 items-center"
                : "w-max min-w-full items-center"
            } `}
          >
            {Array.from(
              {
                length: numPages,
              },
              (_, index) => index + 1,
            ).map((pageNumber) => (
              <PdfPageView
                key={pageNumber}
                pdfDoc={pdfDocRef.current!}
                pageNumber={pageNumber}
                scale={scale}
                rotation={rotation}
                selectableText={selectableText}
                scrollContainerRef={scrollContainerRef}
                onVisible={setActivePage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
