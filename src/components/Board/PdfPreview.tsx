// new
// // import React, { useEffect, useRef, useState, useCallback } from "react";
// // import * as pdfjsLib from "pdfjs-dist";
// // import { TextLayer } from "pdfjs-dist";

// // import type {
// //   PDFDocumentProxy,
// //   PDFDocumentLoadingTask,
// //   PDFPageProxy,
// //   RenderTask,
// // } from "pdfjs-dist";

// // import "pdfjs-dist/web/pdf_viewer.css";

// // // Vite-native local worker bundle
// // import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// // import {
// //   ChevronLeft,
// //   ChevronRight,
// //   ZoomIn,
// //   ZoomOut,
// //   RotateCw,
// //   Maximize2,
// //   Loader2,
// //   AlertCircle,
// //   ExternalLink,
// // } from "lucide-react";

// // // Initialize the local Vite worker bundle once
// // if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
// //   pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
// // }

// // export interface PdfPreviewProps {
// //   /** URL string, Blob, File, or ArrayBuffer of the PDF */
// //   src: string | Blob | File | ArrayBuffer;

// //   /**
// //    * When true, the PDF page automatically scales to fit the
// //    * available container width.
// //    *
// //    * Useful for card thumbnails where horizontal scrolling
// //    * should never be necessary.
// //    */
// //   fitToWidth?: boolean;

// //   /** Custom wrapper class */
// //   className?: string;

// //   /** Whether to only render the first page (default: false) */
// //   firstPageOnly?: boolean;

// //   /** Whether to enable native text selection over the canvas (default: true) */
// //   selectableText?: boolean;

// //   /** Show or hide the top toolbar controls (default: true) */
// //   showToolbar?: boolean;

// //   /** Initial zoom multiplier (default: 1.0) */
// //   initialScale?: number;

// //   /** Callback fired when document finishes loading */
// //   onLoadSuccess?: (numPages: number) => void;

// //   /** Callback fired on loading error */
// //   onLoadError?: (error: Error) => void;
// // }

// // // -----------------------------------------------------------------------------
// // // PDF PAGE
// // // -----------------------------------------------------------------------------

// // const PdfPageView: React.FC<{
// //   pdfDoc: PDFDocumentProxy;
// //   pageNumber: number;
// //   scale: number;
// //   rotation: number;
// //   selectableText: boolean;
// //   fitToWidth: boolean;
// //   onVisible: (pageNumber: number) => void;
// // }> = ({
// //   pdfDoc,
// //   pageNumber,
// //   scale,
// //   rotation,
// //   selectableText,
// //   fitToWidth,
// //   onVisible,
// // }) => {
// //   const pageContainerRef = useRef<HTMLDivElement>(null);
// //   const canvasRef = useRef<HTMLCanvasElement>(null);
// //   const textLayerRef = useRef<HTMLDivElement>(null);

// //   const renderTaskRef = useRef<RenderTask | null>(null);
// //   const textLayerTaskRef = useRef<TextLayer | null>(null);

// //   // ---------------------------------------------------------------------------
// //   // IntersectionObserver
// //   // ---------------------------------------------------------------------------

// //   useEffect(() => {
// //     const el = pageContainerRef.current;

// //     if (!el) {
// //       return;
// //     }

// //     const observer = new IntersectionObserver(
// //       (entries) => {
// //         for (const entry of entries) {
// //           if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
// //             onVisible(pageNumber);
// //           }
// //         }
// //       },
// //       {
// //         threshold: [0.1, 0.3, 0.6],
// //       },
// //     );

// //     observer.observe(el);

// //     return () => observer.disconnect();
// //   }, [pageNumber, onVisible]);

// //   // ---------------------------------------------------------------------------
// //   // Render PDF page
// //   // ---------------------------------------------------------------------------

// //   useEffect(() => {
// //     let isCancelled = false;

// //     // Cancel previous canvas render
// //     if (renderTaskRef.current) {
// //       try {
// //         renderTaskRef.current.cancel();
// //       } catch {}

// //       renderTaskRef.current = null;
// //     }

// //     // Cancel previous text layer render
// //     if (textLayerTaskRef.current) {
// //       try {
// //         textLayerTaskRef.current.cancel();
// //       } catch {}

// //       textLayerTaskRef.current = null;
// //     }

// //     const render = async () => {
// //       try {
// //         const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);

// //         if (isCancelled) {
// //           return;
// //         }

// //         const canvas = canvasRef.current;
// //         const textContainer = textLayerRef.current;

// //         if (!canvas) {
// //           return;
// //         }

// //         const context = canvas.getContext("2d", {
// //           alpha: false,
// //         });

// //         if (!context) {
// //           return;
// //         }

// //         const viewport = page.getViewport({
// //           scale,
// //           rotation,
// //         });

// //         const pixelRatio = window.devicePixelRatio || 1;

// //         // Physical canvas resolution
// //         canvas.width = Math.floor(viewport.width * pixelRatio);

// //         canvas.height = Math.floor(viewport.height * pixelRatio);

// //         // CSS/display size
// //         canvas.style.width = `${viewport.width}px`;
// //         canvas.style.height = `${viewport.height}px`;

// //         context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

// //         const renderContext = {
// //           canvas,
// //           canvasContext: context,
// //           viewport,
// //         };

// //         const renderTask = page.render(renderContext);

// //         renderTaskRef.current = renderTask;

// //         await renderTask.promise;

// //         renderTaskRef.current = null;

// //         if (isCancelled) {
// //           return;
// //         }

// //         // ---------------------------------------------------------------------
// //         // Text layer
// //         // ---------------------------------------------------------------------

// //         if (selectableText && textContainer) {
// //           textContainer.innerHTML = "";

// //           textContainer.style.width = `${viewport.width}px`;
// //           textContainer.style.height = `${viewport.height}px`;

// //           textContainer.style.setProperty("--scale-factor", `${scale}`);

// //           textContainer.style.setProperty("--total-scale-factor", `${scale}`);

// //           const textContent = await page.getTextContent();

// //           if (isCancelled) {
// //             return;
// //           }

// //           const textLayer = new TextLayer({
// //             textContentSource: textContent,
// //             container: textContainer,
// //             viewport,
// //           });

// //           textLayerTaskRef.current = textLayer;

// //           await textLayer.render();

// //           textLayerTaskRef.current = null;
// //         }
// //       } catch (err: any) {
// //         if (err?.name !== "RenderingCancelledException") {
// //           console.error(`Page ${pageNumber} render error:`, err);
// //         }
// //       }
// //     };

// //     void render();

// //     return () => {
// //       isCancelled = true;

// //       if (renderTaskRef.current) {
// //         try {
// //           renderTaskRef.current.cancel();
// //         } catch {}
// //       }

// //       if (textLayerTaskRef.current) {
// //         try {
// //           textLayerTaskRef.current.cancel();
// //         } catch {}
// //       }
// //     };
// //   }, [pdfDoc, pageNumber, scale, rotation, selectableText]);

// //   return (
// //     <div
// //       ref={pageContainerRef}
// //       id={`pdf-page-${pageNumber}`}
// //       data-page-number={pageNumber}
// //       className={`relative mb-6 overflow-hidden rounded-sm border border-neutral-700/80 bg-white shadow-2xl last:mb-0 ${fitToWidth ? "w-full" : "w-fit"} `}
// //     >
// //       <canvas
// //         ref={canvasRef}
// //         className={`pointer-events-none block ${fitToWidth ? "mx-auto" : ""} `}
// //       />

// //       {selectableText && (
// //         <div
// //           ref={textLayerRef}
// //           className="textLayer select-text"
// //           style={{
// //             position: "absolute",
// //             top: 0,
// //             left: 0,
// //             right: 0,
// //             bottom: 0,
// //             overflow: "hidden",
// //           }}
// //         />
// //       )}
// //     </div>
// //   );
// // };

// // // -----------------------------------------------------------------------------
// // // PDF PREVIEW
// // // -----------------------------------------------------------------------------

// // export const PdfPreview: React.FC<PdfPreviewProps> = ({
// //   src,
// //   className = "w-full h-full min-h-100",
// //   firstPageOnly = false,
// //   selectableText = true,
// //   showToolbar = true,
// //   initialScale = 1.0,
// //   fitToWidth = false,
// //   onLoadSuccess,
// //   onLoadError,
// // }) => {
// //   const [numPages, setNumPages] = useState<number>(0);
// //   const [activePage, setActivePage] = useState<number>(1);
// //   const [scale, setScale] = useState<number>(initialScale);
// //   const [rotation, setRotation] = useState<number>(0);
// //   const [isLoading, setIsLoading] = useState<boolean>(true);
// //   const [error, setError] = useState<string | null>(null);

// //   const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

// //   const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);

// //   const scrollContainerRef = useRef<HTMLDivElement>(null);

// //   // ---------------------------------------------------------------------------
// //   // Load document
// //   // ---------------------------------------------------------------------------

// //   useEffect(() => {
// //     let isMounted = true;

// //     setIsLoading(true);
// //     setError(null);
// //     setNumPages(0);
// //     setActivePage(1);

// //     // Destroy previous loading task
// //     if (loadingTaskRef.current) {
// //       try {
// //         loadingTaskRef.current.destroy();
// //       } catch {}

// //       loadingTaskRef.current = null;
// //     }

// //     // Clean up previous PDF document
// //     if (pdfDocRef.current) {
// //       try {
// //         pdfDocRef.current.cleanup();
// //       } catch {}

// //       pdfDocRef.current = null;
// //     }

// //     const loadDoc = async () => {
// //       try {
// //         let task: PDFDocumentLoadingTask;

// //         // ---------------------------------------------------------------------
// //         // String source
// //         // ---------------------------------------------------------------------

// //         if (typeof src === "string") {
// //           if (src.startsWith("data:application/pdf;base64,")) {
// //             const b64 = src.split(",")[1];

// //             const byteCharacters = atob(b64);

// //             const byteNumbers = new Uint8Array(byteCharacters.length);

// //             for (let i = 0; i < byteCharacters.length; i++) {
// //               byteNumbers[i] = byteCharacters.charCodeAt(i);
// //             }

// //             task = pdfjsLib.getDocument({
// //               data: byteNumbers,
// //             });
// //           } else {
// //             task = pdfjsLib.getDocument({
// //               url: src,
// //             });
// //           }

// //           // -------------------------------------------------------------------
// //           // Blob / File
// //           // -------------------------------------------------------------------
// //         } else if (src instanceof Blob || src instanceof File) {
// //           const arrayBuffer = await src.arrayBuffer();

// //           task = pdfjsLib.getDocument({
// //             data: new Uint8Array(arrayBuffer),
// //           });

// //           // -------------------------------------------------------------------
// //           // ArrayBuffer
// //           // -------------------------------------------------------------------
// //         } else if (src instanceof ArrayBuffer) {
// //           task = pdfjsLib.getDocument({
// //             data: new Uint8Array(src),
// //           });
// //         } else {
// //           throw new Error("Unsupported src type provided to PdfPreview");
// //         }

// //         loadingTaskRef.current = task;

// //         const pdfDoc = await task.promise;

// //         if (!isMounted) {
// //           try {
// //             pdfDoc.cleanup();
// //           } catch {}

// //           return;
// //         }

// //         pdfDocRef.current = pdfDoc;

// //         const pagesToRender = firstPageOnly ? 1 : pdfDoc.numPages;

// //         setNumPages(pagesToRender);
// //         setActivePage(1);
// //         setIsLoading(false);

// //         onLoadSuccess?.(pagesToRender);
// //       } catch (err: any) {
// //         if (!isMounted) {
// //           return;
// //         }

// //         if (err?.name === "RenderingCancelledException") {
// //           return;
// //         }

// //         const msg = err?.message || "Failed to load PDF document";

// //         setError(msg);
// //         setIsLoading(false);

// //         onLoadError?.(err instanceof Error ? err : new Error(msg));
// //       }
// //     };

// //     void loadDoc();

// //     return () => {
// //       isMounted = false;

// //       if (loadingTaskRef.current) {
// //         try {
// //           loadingTaskRef.current.destroy();
// //         } catch {}

// //         loadingTaskRef.current = null;
// //       }

// //       if (pdfDocRef.current) {
// //         try {
// //           pdfDocRef.current.cleanup();
// //         } catch {}

// //         pdfDocRef.current = null;
// //       }
// //     };
// //   }, [src]);

// //   // ---------------------------------------------------------------------------
// //   // FIT PDF TO WIDTH
// //   //
// //   // This is the important part for card thumbnails.
// //   //
// //   // We measure the available width and calculate the PDF scale needed to
// //   // make page 1 fit exactly inside that width.
// //   //
// //   // ResizeObserver means this also responds to:
// //   // - responsive layout changes
// //   // - masonry/grid changes
// //   // - browser resizing
// //   // - sidebar opening/closing
// //   // ---------------------------------------------------------------------------

// //   useEffect(() => {
// //     if (!fitToWidth || numPages === 0) {
// //       return;
// //     }

// //     const container = scrollContainerRef.current;
// //     const pdfDoc = pdfDocRef.current;

// //     if (!container || !pdfDoc) {
// //       return;
// //     }

// //     let cancelled = false;

// //     const updateFitScale = async () => {
// //       try {
// //         const page = await pdfDoc.getPage(1);

// //         if (cancelled) {
// //           return;
// //         }

// //         // Get the natural page dimensions at scale 1.
// //         const viewport = page.getViewport({
// //           scale: 1,
// //           rotation,
// //         });

// //         /*
// //          * The scroll container has p-2 = 8px on each side.
// //          *
// //          * clientWidth includes the padding, so subtract 16px to get
// //          * the actual width available for the PDF page.
// //          */
// //         const availableWidth = Math.max(1, container.clientWidth - 16);

// //         const nextScale = availableWidth / viewport.width;

// //         if (cancelled) {
// //           return;
// //         }

// //         /*
// //          * We intentionally allow the scale to go below 1 when the card
// //          * is narrower than the PDF.
// //          *
// //          * We don't enlarge small PDFs beyond 100%, because a thumbnail
// //          * doesn't need unnecessary upscaling.
// //          */
// //         const fittedScale = Math.min(1, nextScale);

// //         setScale((currentScale) => {
// //           /*
// //            * Avoid unnecessary PDF re-renders when ResizeObserver fires
// //            * without a meaningful size change.
// //            */
// //           if (Math.abs(currentScale - fittedScale) < 0.01) {
// //             return currentScale;
// //           }

// //           return fittedScale;
// //         });
// //       } catch (error) {
// //         console.error("Failed to calculate PDF fit scale:", error);
// //       }
// //     };

// //     void updateFitScale();

// //     const resizeObserver = new ResizeObserver(() => {
// //       void updateFitScale();
// //     });

// //     resizeObserver.observe(container);

// //     return () => {
// //       cancelled = true;
// //       resizeObserver.disconnect();
// //     };
// //   }, [fitToWidth, numPages, rotation]);

// //   // ---------------------------------------------------------------------------
// //   // Scroll to page
// //   // ---------------------------------------------------------------------------

// //   const scrollToPage = useCallback((pageNum: number) => {
// //     const container = scrollContainerRef.current;

// //     if (!container) {
// //       return;
// //     }

// //     const pageEl = container.querySelector(
// //       `[data-page-number="${pageNum}"]`,
// //     ) as HTMLElement | null;

// //     if (!pageEl) {
// //       return;
// //     }

// //     const containerRect = container.getBoundingClientRect();

// //     const pageRect = pageEl.getBoundingClientRect();

// //     const targetScrollTop =
// //       container.scrollTop + (pageRect.top - containerRect.top) - 16;

// //     container.scrollTo({
// //       top: Math.max(0, targetScrollTop),
// //       behavior: "smooth",
// //     });

// //     setActivePage(pageNum);
// //   }, []);

// //   // ---------------------------------------------------------------------------
// //   // Zoom
// //   // ---------------------------------------------------------------------------

// //   const handleZoom = (delta: number) => {
// //     /*
// //      * fitToWidth is primarily intended for thumbnail mode.
// //      *
// //      * If toolbar controls are somehow enabled together with fitToWidth,
// //      * manual zoom still works.
// //      */
// //     setScale((prev) =>
// //       Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))),
// //     );
// //   };

// //   // ---------------------------------------------------------------------------
// //   // Open native viewer
// //   // ---------------------------------------------------------------------------

// //   const handleOpenInNewTab = () => {
// //     if (typeof src === "string") {
// //       window.open(src, "_blank");
// //       return;
// //     }

// //     if (src instanceof Blob) {
// //       const url = URL.createObjectURL(src);

// //       window.open(url, "_blank");

// //       setTimeout(() => {
// //         URL.revokeObjectURL(url);
// //       }, 60000);
// //     }
// //   };

// //   // ---------------------------------------------------------------------------
// //   // Render
// //   // ---------------------------------------------------------------------------

// //   return (
// //     <div
// //       className={`relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 ${className} `}
// //     >
// //       {/* ------------------------------------------------------------------- */}
// //       {/* TOOLBAR                                                             */}
// //       {/* ------------------------------------------------------------------- */}

// //       {showToolbar && (
// //         <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-xs select-none">
// //           {/* Page navigation */}
// //           <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
// //             <button
// //               type="button"
// //               disabled={activePage <= 1 || isLoading}
// //               onClick={() => scrollToPage(Math.max(1, activePage - 1))}
// //               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
// //               title="Previous Page"
// //             >
// //               <ChevronLeft className="h-4 w-4" />
// //             </button>

// //             <span className="px-2 font-mono text-[11px] text-neutral-300">
// //               {numPages > 0 ? `${activePage} / ${numPages}` : "- / -"}
// //             </span>

// //             <button
// //               type="button"
// //               disabled={activePage >= numPages || isLoading}
// //               onClick={() => scrollToPage(Math.min(numPages, activePage + 1))}
// //               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
// //               title="Next Page"
// //             >
// //               <ChevronRight className="h-4 w-4" />
// //             </button>
// //           </div>

// //           {/* Zoom / rotation controls */}
// //           <div className="flex items-center gap-1">
// //             <button
// //               type="button"
// //               onClick={() => handleZoom(-0.2)}
// //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// //               title="Zoom Out"
// //             >
// //               <ZoomOut className="h-3.5 w-3.5" />
// //             </button>

// //             <span className="min-w-12 px-1.5 text-center font-mono text-[11px] text-neutral-300">
// //               {Math.round(scale * 100)}%
// //             </span>

// //             <button
// //               type="button"
// //               onClick={() => handleZoom(0.2)}
// //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// //               title="Zoom In"
// //             >
// //               <ZoomIn className="h-3.5 w-3.5" />
// //             </button>

// //             <button
// //               type="button"
// //               onClick={() => setScale(1.0)}
// //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// //               title="Reset Zoom"
// //             >
// //               <Maximize2 className="h-3.5 w-3.5" />
// //             </button>

// //             <button
// //               type="button"
// //               onClick={() => setRotation((r) => (r + 90) % 360)}
// //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// //               title="Rotate 90°"
// //             >
// //               <RotateCw className="h-3.5 w-3.5" />
// //             </button>

// //             <button
// //               type="button"
// //               onClick={handleOpenInNewTab}
// //               className="ml-1 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// //               title="Open in Native Viewer"
// //             >
// //               <ExternalLink className="h-3.5 w-3.5" />
// //             </button>
// //           </div>
// //         </div>
// //       )}

// //       {/* ------------------------------------------------------------------- */}
// //       {/* PDF SCROLL CONTAINER                                                */}
// //       {/* ------------------------------------------------------------------- */}

// //       <div
// //         ref={scrollContainerRef}
// //         className={`w-full flex-1 bg-neutral-950/80 p-2 ${
// //           fitToWidth ? "overflow-x-hidden overflow-y-auto" : "overflow-auto"
// //         } `}
// //       >
// //         {/* Loading */}
// //         {isLoading && (
// //           <div className="flex h-full min-h-62.5 w-full flex-col items-center justify-center gap-2 text-xs text-neutral-400">
// //             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />

// //             <span>Loading PDF pages...</span>
// //           </div>
// //         )}

// //         {/* Error */}
// //         {error && (
// //           <div className="flex h-full min-h-62.5 w-full items-center justify-center p-4">
// //             <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-center text-xs text-rose-400">
// //               <AlertCircle className="h-6 w-6 text-rose-400" />

// //               <span className="font-semibold">Unable to display PDF</span>

// //               <span className="text-neutral-400">{error}</span>
// //             </div>
// //           </div>
// //         )}

// //         {/* PDF pages */}
// //         {!isLoading && !error && pdfDocRef.current && (
// //           <div
// //             className={`m-auto flex min-h-fit flex-col items-center ${
// //               fitToWidth ? "w-full min-w-0" : "w-fit min-w-fit"
// //             } `}
// //           >
// //             {Array.from(
// //               {
// //                 length: numPages,
// //               },
// //               (_, i) => i + 1,
// //             ).map((pageNum) => (
// //               <PdfPageView
// //                 key={pageNum}
// //                 pdfDoc={pdfDocRef.current!}
// //                 pageNumber={pageNum}
// //                 scale={scale}
// //                 rotation={rotation}
// //                 selectableText={selectableText}
// //                 fitToWidth={fitToWidth}
// //                 onVisible={setActivePage}
// //               />
// //             ))}
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default PdfPreview;

// // // // -----------------------------------------------------------------------------
// // // //tag
// old
// // // import {
// // //   getDocument,
// // //   GlobalWorkerOptions,
// // //   type PDFDocumentProxy,
// // //   type RenderTask,
// // // } from "pdfjs-dist";
// // // import { useEffect, useRef, useState } from "react";

// // // GlobalWorkerOptions.workerSrc = new URL(
// // //   "pdfjs-dist/build/pdf.worker.min.mjs",
// // //   import.meta.url,
// // // ).toString();

// // // interface PdfPreviewProps {
// // //   src: string;
// // //   className?: string;
// // //   firstPageOnly?: boolean;
// // // }

// // // const PdfPreview = ({
// // //   src,
// // //   className = "",
// // //   firstPageOnly = false,
// // // }: PdfPreviewProps) => {
// // //   /*
// // //    * This element is NOT scrollable.
// // //    *
// // //    * We observe this element instead of the PDF scroll container so that
// // //    * the appearance/disappearance of a scrollbar doesn't change the
// // //    * measured width and cause a render loop.
// // //    */
// // //   const sizeRef = useRef<HTMLDivElement>(null);

// // //   /*
// // //    * The element containing the rendered PDF pages.
// // //    */
// // //   const containerRef = useRef<HTMLDivElement>(null);

// // //   const [containerWidth, setContainerWidth] = useState(0);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(false);

// // //   /*
// // //    * Track the width of the non-scrolling wrapper.
// // //    */
// // //   useEffect(() => {
// // //     const element = sizeRef.current;

// // //     if (!element) {
// // //       return;
// // //     }

// // //     const updateWidth = () => {
// // //       const width = Math.round(element.getBoundingClientRect().width);

// // //       if (width > 0) {
// // //         setContainerWidth((previousWidth) =>
// // //           previousWidth === width ? previousWidth : width,
// // //         );
// // //       }
// // //     };

// // //     updateWidth();

// // //     const resizeObserver = new ResizeObserver(updateWidth);

// // //     resizeObserver.observe(element);

// // //     return () => {
// // //       resizeObserver.disconnect();
// // //     };
// // //   }, []);

// // //   /*
// // //    * Load and render the PDF.
// // //    */
// // //   useEffect(() => {
// // //     if (!src || containerWidth <= 0) {
// // //       return;
// // //     }

// // //     const container = containerRef.current;

// // //     if (!container) {
// // //       return;
// // //     }

// // //     let cancelled = false;
// // //     let pdf: PDFDocumentProxy | null = null;
// // //     let renderTask: RenderTask | null = null;

// // //     const loadingTask = getDocument({
// // //       url: src,
// // //     });

// // //     const renderPdf = async () => {
// // //       /*
// // //        * Only show the loading state if we don't already have
// // //        * a rendered PDF on screen.
// // //        *
// // //        * This prevents flashing during responsive resizing.
// // //        */
// // //       if (container.childElementCount === 0) {
// // //         setLoading(true);
// // //       }

// // //       setError(false);

// // //       try {
// // //         pdf = await loadingTask.promise;

// // //         if (cancelled || !pdf) {
// // //           return;
// // //         }

// // //         /*
// // //          * Render into a temporary container first.
// // //          *
// // //          * This is important:
// // //          *
// // //          * We don't clear the currently visible PDF while the new
// // //          * rendering is happening.
// // //          */
// // //         const nextContainer = document.createElement("div");

// // //         nextContainer.className = "flex w-full flex-col gap-2";

// // //         const pageCount = firstPageOnly ? 1 : pdf.numPages;

// // //         /*
// // //          * Render at 2x minimum for sharp text.
// // //          *
// // //          * Cap at 3x to avoid unnecessarily large canvas bitmaps.
// // //          */
// // //         const outputScale = Math.min(
// // //           Math.max(window.devicePixelRatio || 1, 2),
// // //           3,
// // //         );

// // //         for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
// // //           if (cancelled || !pdf) {
// // //             break;
// // //           }

// // //           const page = await pdf.getPage(pageNumber);

// // //           if (cancelled) {
// // //             page.cleanup();
// // //             break;
// // //           }

// // //           const baseViewport = page.getViewport({
// // //             scale: 1,
// // //           });

// // //           /*
// // //            * Fit the PDF page to the card width.
// // //            */
// // //           const scale = containerWidth / baseViewport.width;

// // //           const viewport = page.getViewport({
// // //             scale,
// // //           });

// // //           const canvas = document.createElement("canvas");

// // //           /*
// // //            * PDF.js 6.x uses the canvas directly.
// // //            */
// // //           canvas.width = Math.ceil(viewport.width * outputScale);
// // //           canvas.height = Math.ceil(viewport.height * outputScale);

// // //           /*
// // //            * Display dimensions remain at CSS size.
// // //            *
// // //            * Example:
// // //            *
// // //            * viewport.width = 350px
// // //            * outputScale = 2
// // //            *
// // //            * Actual canvas = 700px
// // //            * Displayed canvas = 350px
// // //            */
// // //           canvas.style.display = "block";
// // //           canvas.style.width = `${viewport.width}px`;
// // //           canvas.style.height = `${viewport.height}px`;

// // //           const pageWrapper = document.createElement("div");

// // //           pageWrapper.className = "overflow-hidden bg-white shadow-sm";

// // //           pageWrapper.style.width = `${viewport.width}px`;
// // //           pageWrapper.style.height = `${viewport.height}px`;

// // //           pageWrapper.appendChild(canvas);
// // //           nextContainer.appendChild(pageWrapper);

// // //           /*
// // //            * PDF.js 6.x render API.
// // //            *
// // //            * `canvas` is required.
// // //            */
// // //           renderTask = page.render({
// // //             canvas,
// // //             viewport,
// // //             transform: [outputScale, 0, 0, outputScale, 0, 0],
// // //           });

// // //           await renderTask.promise;

// // //           renderTask = null;

// // //           page.cleanup();
// // //         }

// // //         if (cancelled) {
// // //           return;
// // //         }

// // //         /*
// // //          * Swap the fully rendered PDF into the visible container.
// // //          *
// // //          * This prevents a blank/loading flash while rendering.
// // //          */
// // //         container.replaceChildren(...Array.from(nextContainer.children));

// // //         setLoading(false);
// // //       } catch (err) {
// // //         if (cancelled) {
// // //           return;
// // //         }

// // //         console.error("Failed to render PDF:", err);

// // //         /*
// // //          * Only show the error if we don't already have a valid
// // //          * PDF preview on screen.
// // //          */
// // //         if (container.childElementCount === 0) {
// // //           setError(true);
// // //         }

// // //         setLoading(false);
// // //       }
// // //     };

// // //     void renderPdf();

// // //     return () => {
// // //       cancelled = true;

// // //       /*
// // //        * Cancel the currently rendering page.
// // //        */
// // //       if (renderTask) {
// // //         renderTask.cancel();
// // //         renderTask = null;
// // //       }

// // //       /*
// // //        * pdfjs-dist 6.x:
// // //        *
// // //        * destroy() belongs to PDFDocumentLoadingTask.
// // //        */
// // //       void loadingTask.destroy();
// // //     };
// // //   }, [src, containerWidth, firstPageOnly]);

// // //   if (error) {
// // //     return (
// // //       <div
// // //         className={`flex h-64 items-center justify-center bg-neutral-900 text-xs text-neutral-500 ${className}`}
// // //       >
// // //         Failed to load PDF
// // //       </div>
// // //     );
// // //   }

// // //   return (
// // //     /*
// // //      * This wrapper has NO overflow.
// // //      *
// // //      * ResizeObserver watches this element.
// // //      */
// // //     <div ref={sizeRef} className={`relative w-full ${className}`}>
// // //       {/*
// // //        * This is the actual scrolling viewport.
// // //        */}
// // //       <div
// // //         data-testid="pdf-viewport"
// // //         className="relative h-64 overflow-x-hidden overflow-y-auto overscroll-contain bg-neutral-900"
// // //       >
// // //         {loading && (
// // //           <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900 text-xs text-neutral-500">
// // //             Loading PDF...
// // //           </div>
// // //         )}

// // //         <div
// // //           ref={containerRef}
// // //           data-testid="pdf-container"
// // //           className="flex w-full flex-col gap-2"
// // //         />
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default PdfPreview;

// // //tag2
// // // import React, { useEffect, useRef, useState, useCallback } from "react";

// // // import * as pdfjsLib from "pdfjs-dist";
// // // import { TextLayer } from "pdfjs-dist";

// // // import type {
// // //   PDFDocumentProxy,
// // //   PDFDocumentLoadingTask,
// // //   PDFPageProxy,
// // //   RenderTask,
// // // } from "pdfjs-dist";

// // // import "pdfjs-dist/web/pdf_viewer.css";

// // // // Vite-native local worker bundle
// // // import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// // // import {
// // //   ChevronLeft,
// // //   ChevronRight,
// // //   ZoomIn,
// // //   ZoomOut,
// // //   RotateCw,
// // //   Maximize2,
// // //   Loader2,
// // //   AlertCircle,
// // //   ExternalLink,
// // // } from "lucide-react";

// // // // -----------------------------------------------------------------------------
// // // // PDF.js worker
// // // // -----------------------------------------------------------------------------

// // // if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
// // //   pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
// // // }

// // // // -----------------------------------------------------------------------------
// // // // Types
// // // // -----------------------------------------------------------------------------

// // // export interface PdfPreviewProps {
// // //   /** URL string, Blob, File, or ArrayBuffer of the PDF */
// // //   src: string | Blob | File | ArrayBuffer;

// // //   /**
// // //    * Automatically fit the PDF page to the available container width.
// // //    *
// // //    * Recommended for card/thumbnail previews.
// // //    *
// // //    * Default: false
// // //    */
// // //   fitToWidth?: boolean;

// // //   /** Custom wrapper class */
// // //   className?: string;

// // //   /** Whether to only render the first page */
// // //   firstPageOnly?: boolean;

// // //   /** Whether to enable native text selection */
// // //   selectableText?: boolean;

// // //   /** Show or hide the toolbar */
// // //   showToolbar?: boolean;

// // //   /** Initial zoom multiplier */
// // //   initialScale?: number;

// // //   /** Callback fired when document finishes loading */
// // //   onLoadSuccess?: (numPages: number) => void;

// // //   /** Callback fired on loading error */
// // //   onLoadError?: (error: Error) => void;
// // // }

// // // // -----------------------------------------------------------------------------
// // // // PDF PAGE VIEW
// // // // -----------------------------------------------------------------------------

// // // const PdfPageView: React.FC<{
// // //   pdfDoc: PDFDocumentProxy;
// // //   pageNumber: number;
// // //   scale: number;
// // //   rotation: number;
// // //   selectableText: boolean;
// // //   fitToWidth: boolean;
// // //   onVisible: (pageNumber: number) => void;
// // // }> = ({
// // //   pdfDoc,
// // //   pageNumber,
// // //   scale,
// // //   rotation,
// // //   selectableText,
// // //   fitToWidth,
// // //   onVisible,
// // // }) => {
// // //   const pageContainerRef = useRef<HTMLDivElement>(null);

// // //   const canvasRef = useRef<HTMLCanvasElement>(null);

// // //   const textLayerRef = useRef<HTMLDivElement>(null);

// // //   const renderTaskRef = useRef<RenderTask | null>(null);

// // //   const textLayerTaskRef = useRef<TextLayer | null>(null);

// // //   // ---------------------------------------------------------------------------
// // //   // Track visible page
// // //   // ---------------------------------------------------------------------------

// // //   useEffect(() => {
// // //     const element = pageContainerRef.current;

// // //     if (!element) {
// // //       return;
// // //     }

// // //     const observer = new IntersectionObserver(
// // //       (entries) => {
// // //         for (const entry of entries) {
// // //           if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
// // //             onVisible(pageNumber);
// // //           }
// // //         }
// // //       },
// // //       {
// // //         threshold: [0.1, 0.3, 0.6],
// // //       },
// // //     );

// // //     observer.observe(element);

// // //     return () => {
// // //       observer.disconnect();
// // //     };
// // //   }, [pageNumber, onVisible]);

// // //   // ---------------------------------------------------------------------------
// // //   // Render page
// // //   // ---------------------------------------------------------------------------

// // //   useEffect(() => {
// // //     let cancelled = false;

// // //     // Cancel previous canvas rendering
// // //     if (renderTaskRef.current) {
// // //       try {
// // //         renderTaskRef.current.cancel();
// // //       } catch {}

// // //       renderTaskRef.current = null;
// // //     }

// // //     // Cancel previous text rendering
// // //     if (textLayerTaskRef.current) {
// // //       try {
// // //         textLayerTaskRef.current.cancel();
// // //       } catch {}

// // //       textLayerTaskRef.current = null;
// // //     }

// // //     const renderPage = async () => {
// // //       try {
// // //         const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);

// // //         if (cancelled) {
// // //           return;
// // //         }

// // //         const canvas = canvasRef.current;

// // //         const textContainer = textLayerRef.current;

// // //         if (!canvas) {
// // //           return;
// // //         }

// // //         const context = canvas.getContext("2d", {
// // //           alpha: false,
// // //         });

// // //         if (!context) {
// // //           return;
// // //         }

// // //         // ---------------------------------------------------------------------
// // //         // Viewport
// // //         // ---------------------------------------------------------------------

// // //         const viewport = page.getViewport({
// // //           scale,
// // //           rotation,
// // //         });

// // //         // ---------------------------------------------------------------------
// // //         // IMPORTANT:
// // //         //
// // //         // Render at a higher internal resolution than the CSS display size.
// // //         //
// // //         // This is what your old card implementation was doing and is the
// // //         // main reason its text looked sharper.
// // //         //
// // //         // Example:
// // //         //
// // //         // CSS width:       350px
// // //         // outputScale:       2
// // //         // canvas width:     700px
// // //         //
// // //         // Browser displays it at 350px but has 700px of actual pixel data.
// // //         // ---------------------------------------------------------------------

// // //         const outputScale = Math.min(
// // //           Math.max(window.devicePixelRatio || 1, 2),
// // //           3,
// // //         );

// // //         // Physical canvas resolution
// // //         canvas.width = Math.ceil(viewport.width * outputScale);

// // //         canvas.height = Math.ceil(viewport.height * outputScale);

// // //         // CSS/display resolution
// // //         canvas.style.display = "block";
// // //         canvas.style.width = `${viewport.width}px`;
// // //         canvas.style.height = `${viewport.height}px`;

// // //         // ---------------------------------------------------------------------
// // //         // Render
// // //         // ---------------------------------------------------------------------

// // //         const renderTask = page.render({
// // //           canvas,
// // //           viewport,

// // //           // PDF.js 6.x
// // //           transform: [outputScale, 0, 0, outputScale, 0, 0],
// // //         });

// // //         renderTaskRef.current = renderTask;

// // //         await renderTask.promise;

// // //         renderTaskRef.current = null;

// // //         if (cancelled) {
// // //           return;
// // //         }

// // //         // ---------------------------------------------------------------------
// // //         // Text layer
// // //         // ---------------------------------------------------------------------

// // //         if (selectableText && textContainer) {
// // //           textContainer.innerHTML = "";

// // //           textContainer.style.width = `${viewport.width}px`;

// // //           textContainer.style.height = `${viewport.height}px`;

// // //           textContainer.style.setProperty("--scale-factor", `${scale}`);

// // //           textContainer.style.setProperty("--total-scale-factor", `${scale}`);

// // //           const textContent = await page.getTextContent();

// // //           if (cancelled) {
// // //             return;
// // //           }

// // //           const textLayer = new TextLayer({
// // //             textContentSource: textContent,
// // //             container: textContainer,
// // //             viewport,
// // //           });

// // //           textLayerTaskRef.current = textLayer;

// // //           await textLayer.render();

// // //           textLayerTaskRef.current = null;
// // //         }
// // //       } catch (err: any) {
// // //         if (err?.name !== "RenderingCancelledException") {
// // //           console.error(`Page ${pageNumber} render error:`, err);
// // //         }
// // //       }
// // //     };

// // //     void renderPage();

// // //     return () => {
// // //       cancelled = true;

// // //       if (renderTaskRef.current) {
// // //         try {
// // //           renderTaskRef.current.cancel();
// // //         } catch {}

// // //         renderTaskRef.current = null;
// // //       }

// // //       if (textLayerTaskRef.current) {
// // //         try {
// // //           textLayerTaskRef.current.cancel();
// // //         } catch {}

// // //         textLayerTaskRef.current = null;
// // //       }
// // //     };
// // //   }, [pdfDoc, pageNumber, scale, rotation, selectableText]);

// // //   return (
// // //     <div
// // //       ref={pageContainerRef}
// // //       id={`pdf-page-${pageNumber}`}
// // //       data-page-number={pageNumber}
// // //       className={`relative mb-6 overflow-hidden rounded-sm border border-neutral-700/80 bg-white shadow-2xl last:mb-0 ${fitToWidth ? "w-full" : "w-fit"} `}
// // //     >
// // //       <canvas
// // //         ref={canvasRef}
// // //         className={`pointer-events-none block ${fitToWidth ? "mx-auto" : ""} `}
// // //       />

// // //       {selectableText && (
// // //         <div
// // //           ref={textLayerRef}
// // //           className="textLayer select-text"
// // //           style={{
// // //             position: "absolute",
// // //             top: 0,
// // //             left: 0,
// // //             right: 0,
// // //             bottom: 0,
// // //             overflow: "hidden",
// // //           }}
// // //         />
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // // -----------------------------------------------------------------------------
// // // // PDF PREVIEW
// // // // -----------------------------------------------------------------------------

// // // export const PdfPreview: React.FC<PdfPreviewProps> = ({
// // //   src,

// // //   className = "w-full h-full min-h-100",

// // //   fitToWidth = false,

// // //   firstPageOnly = false,

// // //   selectableText = true,

// // //   showToolbar = true,

// // //   initialScale = 1.0,

// // //   onLoadSuccess,

// // //   onLoadError,
// // // }) => {
// // //   const [numPages, setNumPages] = useState<number>(0);

// // //   const [activePage, setActivePage] = useState<number>(1);

// // //   const [scale, setScale] = useState<number>(initialScale);

// // //   const [rotation, setRotation] = useState<number>(0);

// // //   const [isLoading, setIsLoading] = useState<boolean>(true);

// // //   const [error, setError] = useState<string | null>(null);

// // //   // ---------------------------------------------------------------------------
// // //   // Refs
// // //   // ---------------------------------------------------------------------------

// // //   /*
// // //    * This wrapper is deliberately separate from the scroll container.
// // //    *
// // //    * This is important for fit-to-width mode because a scrollbar appearing
// // //    * should not change the measured width and cause a resize/render loop.
// // //    */
// // //   const sizeRef = useRef<HTMLDivElement>(null);

// // //   /*
// // //    * Actual PDF scrolling viewport.
// // //    */
// // //   const scrollContainerRef = useRef<HTMLDivElement>(null);

// // //   const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

// // //   const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);

// // //   // Width used by fit-to-width mode
// // //   const [containerWidth, setContainerWidth] = useState<number>(0);

// // //   // ---------------------------------------------------------------------------
// // //   // Measure available width
// // //   // ---------------------------------------------------------------------------

// // //   useEffect(() => {
// // //     if (!fitToWidth) {
// // //       return;
// // //     }

// // //     const element = sizeRef.current;

// // //     if (!element) {
// // //       return;
// // //     }

// // //     const updateWidth = () => {
// // //       const width = Math.round(element.getBoundingClientRect().width);

// // //       if (width <= 0) {
// // //         return;
// // //       }

// // //       setContainerWidth((previousWidth) =>
// // //         previousWidth === width ? previousWidth : width,
// // //       );
// // //     };

// // //     updateWidth();

// // //     const resizeObserver = new ResizeObserver(updateWidth);

// // //     resizeObserver.observe(element);

// // //     return () => {
// // //       resizeObserver.disconnect();
// // //     };
// // //   }, [fitToWidth]);

// // //   // ---------------------------------------------------------------------------
// // //   // Load PDF document
// // //   // ---------------------------------------------------------------------------

// // //   useEffect(() => {
// // //     let isMounted = true;

// // //     setIsLoading(true);
// // //     setError(null);
// // //     setNumPages(0);
// // //     setActivePage(1);

// // //     // Destroy previous loading task
// // //     if (loadingTaskRef.current) {
// // //       try {
// // //         loadingTaskRef.current.destroy();
// // //       } catch {}

// // //       loadingTaskRef.current = null;
// // //     }

// // //     // Clean up previous PDF document
// // //     if (pdfDocRef.current) {
// // //       try {
// // //         pdfDocRef.current.cleanup();
// // //       } catch {}

// // //       pdfDocRef.current = null;
// // //     }

// // //     const loadDocument = async () => {
// // //       try {
// // //         let task: PDFDocumentLoadingTask;

// // //         // ---------------------------------------------------------------------
// // //         // String
// // //         // ---------------------------------------------------------------------

// // //         if (typeof src === "string") {
// // //           if (src.startsWith("data:application/pdf;base64,")) {
// // //             const b64 = src.split(",")[1];

// // //             const byteCharacters = atob(b64);

// // //             const byteNumbers = new Uint8Array(byteCharacters.length);

// // //             for (let i = 0; i < byteCharacters.length; i++) {
// // //               byteNumbers[i] = byteCharacters.charCodeAt(i);
// // //             }

// // //             task = pdfjsLib.getDocument({
// // //               data: byteNumbers,
// // //             });
// // //           } else {
// // //             task = pdfjsLib.getDocument({
// // //               url: src,
// // //             });
// // //           }

// // //           // -------------------------------------------------------------------
// // //           // Blob / File
// // //           // -------------------------------------------------------------------
// // //         } else if (src instanceof Blob || src instanceof File) {
// // //           const arrayBuffer = await src.arrayBuffer();

// // //           task = pdfjsLib.getDocument({
// // //             data: new Uint8Array(arrayBuffer),
// // //           });

// // //           // -------------------------------------------------------------------
// // //           // ArrayBuffer
// // //           // -------------------------------------------------------------------
// // //         } else if (src instanceof ArrayBuffer) {
// // //           task = pdfjsLib.getDocument({
// // //             data: new Uint8Array(src),
// // //           });
// // //         } else {
// // //           throw new Error("Unsupported src type provided to PdfPreview");
// // //         }

// // //         loadingTaskRef.current = task;

// // //         const pdfDoc = await task.promise;

// // //         if (!isMounted) {
// // //           try {
// // //             pdfDoc.cleanup();
// // //           } catch {}

// // //           return;
// // //         }

// // //         pdfDocRef.current = pdfDoc;

// // //         const pagesToRender = firstPageOnly ? 1 : pdfDoc.numPages;

// // //         setNumPages(pagesToRender);

// // //         setActivePage(1);
// // //         setIsLoading(false);

// // //         onLoadSuccess?.(pagesToRender);
// // //       } catch (err: any) {
// // //         if (!isMounted) {
// // //           return;
// // //         }

// // //         if (err?.name === "RenderingCancelledException") {
// // //           return;
// // //         }

// // //         const message = err?.message || "Failed to load PDF document";

// // //         setError(message);
// // //         setIsLoading(false);

// // //         onLoadError?.(err instanceof Error ? err : new Error(message));
// // //       }
// // //     };

// // //     void loadDocument();

// // //     return () => {
// // //       isMounted = false;

// // //       if (loadingTaskRef.current) {
// // //         try {
// // //           loadingTaskRef.current.destroy();
// // //         } catch {}

// // //         loadingTaskRef.current = null;
// // //       }

// // //       if (pdfDocRef.current) {
// // //         try {
// // //           pdfDocRef.current.cleanup();
// // //         } catch {}

// // //         pdfDocRef.current = null;
// // //       }
// // //     };
// // //   }, [src]);

// // //   // ---------------------------------------------------------------------------
// // //   // Fit PDF to width
// // //   // ---------------------------------------------------------------------------

// // //   useEffect(() => {
// // //     /*
// // //      * Normal/modal mode:
// // //      *
// // //      * Do not touch the user's zoom level.
// // //      */
// // //     if (!fitToWidth) {
// // //       return;
// // //     }

// // //     if (containerWidth <= 0 || numPages <= 0) {
// // //       return;
// // //     }

// // //     const pdfDoc = pdfDocRef.current;

// // //     if (!pdfDoc) {
// // //       return;
// // //     }

// // //     let cancelled = false;

// // //     const calculateFitScale = async () => {
// // //       try {
// // //         /*
// // //          * We only need page 1 to calculate the width.
// // //          *
// // //          * All normal PDF pages use the same page width in most documents,
// // //          * and if pages have different sizes the first page is still the
// // //          * appropriate thumbnail sizing reference.
// // //          */
// // //         const page = await pdfDoc.getPage(1);

// // //         if (cancelled) {
// // //           return;
// // //         }

// // //         const baseViewport = page.getViewport({
// // //           scale: 1,
// // //           rotation,
// // //         });

// // //         /*
// // //          * `containerWidth` is the width of the outer non-scrolling wrapper.
// // //          *
// // //          * This avoids scrollbar width affecting our calculation.
// // //          *
// // //          * sizeRef includes the card's available content width.
// // //          */
// // //         const availableWidth = Math.max(1, containerWidth);

// // //         const calculatedScale = availableWidth / baseViewport.width;

// // //         /*
// // //          * Don't enlarge a PDF beyond 100%.
// // //          *
// // //          * If the PDF is already smaller than the card, rendering at 100%
// // //          * is preferable to making it blurry through unnecessary scaling.
// // //          */
// // //         const fittedScale = Math.min(1, calculatedScale);

// // //         if (cancelled) {
// // //           return;
// // //         }

// // //         setScale((previousScale) => {
// // //           if (Math.abs(previousScale - fittedScale) < 0.01) {
// // //             return previousScale;
// // //           }

// // //           return fittedScale;
// // //         });
// // //       } catch (err) {
// // //         if (!cancelled) {
// // //           console.error("Failed to calculate PDF fit scale:", err);
// // //         }
// // //       }
// // //     };

// // //     void calculateFitScale();

// // //     return () => {
// // //       cancelled = true;
// // //     };
// // //   }, [fitToWidth, containerWidth, numPages, rotation]);

// // //   // ---------------------------------------------------------------------------
// // //   // Scroll to page
// // //   // ---------------------------------------------------------------------------

// // //   const scrollToPage = useCallback((pageNum: number) => {
// // //     const container = scrollContainerRef.current;

// // //     if (!container) {
// // //       return;
// // //     }

// // //     const pageElement = container.querySelector(
// // //       `[data-page-number="${pageNum}"]`,
// // //     ) as HTMLElement | null;

// // //     if (!pageElement) {
// // //       return;
// // //     }

// // //     const containerRect = container.getBoundingClientRect();

// // //     const pageRect = pageElement.getBoundingClientRect();

// // //     const targetScrollTop =
// // //       container.scrollTop + (pageRect.top - containerRect.top) - 16;

// // //     container.scrollTo({
// // //       top: Math.max(0, targetScrollTop),
// // //       behavior: "smooth",
// // //     });

// // //     setActivePage(pageNum);
// // //   }, []);

// // //   // ---------------------------------------------------------------------------
// // //   // Zoom
// // //   // ---------------------------------------------------------------------------

// // //   const handleZoom = (delta: number) => {
// // //     setScale((previous) =>
// // //       Math.min(3.5, Math.max(0.4, Number((previous + delta).toFixed(2)))),
// // //     );
// // //   };

// // //   // ---------------------------------------------------------------------------
// // //   // Open native PDF viewer
// // //   // ---------------------------------------------------------------------------

// // //   const handleOpenInNewTab = () => {
// // //     if (typeof src === "string") {
// // //       window.open(src, "_blank");

// // //       return;
// // //     }

// // //     if (src instanceof Blob) {
// // //       const url = URL.createObjectURL(src);

// // //       window.open(url, "_blank");

// // //       setTimeout(() => {
// // //         URL.revokeObjectURL(url);
// // //       }, 60000);
// // //     }
// // //   };

// // //   // ---------------------------------------------------------------------------
// // //   // Render
// // //   // ---------------------------------------------------------------------------

// // //   return (
// // //     /*
// // //      * IMPORTANT:
// // //      *
// // //      * `sizeRef` is the non-scrolling measurement wrapper.
// // //      *
// // //      * This is intentionally outside the overflow container.
// // //      */
// // //     <div ref={sizeRef} className={`relative w-full ${className} `}>
// // //       {/* ------------------------------------------------------------------- */}
// // //       {/* TOOLBAR                                                             */}
// // //       {/* ------------------------------------------------------------------- */}

// // //       {showToolbar && (
// // //         <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-100 select-none">
// // //           {/* Page navigation */}
// // //           <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
// // //             <button
// // //               type="button"
// // //               disabled={activePage <= 1 || isLoading}
// // //               onClick={() => scrollToPage(Math.max(1, activePage - 1))}
// // //               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
// // //               title="Previous Page"
// // //             >
// // //               <ChevronLeft className="h-4 w-4" />
// // //             </button>

// // //             <span className="px-2 font-mono text-[11px] text-neutral-300">
// // //               {numPages > 0 ? `${activePage} / ${numPages}` : "- / -"}
// // //             </span>

// // //             <button
// // //               type="button"
// // //               disabled={activePage >= numPages || isLoading}
// // //               onClick={() => scrollToPage(Math.min(numPages, activePage + 1))}
// // //               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
// // //               title="Next Page"
// // //             >
// // //               <ChevronRight className="h-4 w-4" />
// // //             </button>
// // //           </div>

// // //           {/* Zoom / rotation */}
// // //           <div className="flex items-center gap-1">
// // //             <button
// // //               type="button"
// // //               onClick={() => handleZoom(-0.2)}
// // //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// // //               title="Zoom Out"
// // //             >
// // //               <ZoomOut className="h-3.5 w-3.5" />
// // //             </button>

// // //             <span className="min-w-12 px-1.5 text-center font-mono text-[11px] text-neutral-300">
// // //               {Math.round(scale * 100)}%
// // //             </span>

// // //             <button
// // //               type="button"
// // //               onClick={() => handleZoom(0.2)}
// // //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// // //               title="Zoom In"
// // //             >
// // //               <ZoomIn className="h-3.5 w-3.5" />
// // //             </button>

// // //             <button
// // //               type="button"
// // //               onClick={() => setScale(1)}
// // //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// // //               title="Reset Zoom"
// // //             >
// // //               <Maximize2 className="h-3.5 w-3.5" />
// // //             </button>

// // //             <button
// // //               type="button"
// // //               onClick={() => setRotation((current) => (current + 90) % 360)}
// // //               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// // //               title="Rotate 90°"
// // //             >
// // //               <RotateCw className="h-3.5 w-3.5" />
// // //             </button>

// // //             <button
// // //               type="button"
// // //               onClick={handleOpenInNewTab}
// // //               className="ml-1 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
// // //               title="Open in Native Viewer"
// // //             >
// // //               <ExternalLink className="h-3.5 w-3.5" />
// // //             </button>
// // //           </div>
// // //         </div>
// // //       )}

// // //       {/* ------------------------------------------------------------------- */}
// // //       {/* PDF VIEWPORT                                                        */}
// // //       {/* ------------------------------------------------------------------- */}

// // //       <div
// // //         ref={scrollContainerRef}
// // //         className={`relative w-full bg-neutral-950/80 p-2 ${
// // //           fitToWidth
// // //             ? "overflow-x-hidden overflow-y-auto overscroll-contain"
// // //             : "flex-1 overflow-auto"
// // //         } `}
// // //       >
// // //         {/* Loading */}
// // //         {isLoading && (
// // //           <div className="absolute inset-0 z-10 flex min-h-62.5 items-center justify-center bg-neutral-950/80 text-xs text-neutral-400">
// // //             <div className="flex items-center gap-2">
// // //               <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
// // //               <span>Loading PDF pages...</span>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* Error */}
// // //         {error && (
// // //           <div className="flex min-h-62.5 w-full items-center justify-center p-4">
// // //             <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-center text-xs text-rose-400">
// // //               <AlertCircle className="h-6 w-6" />

// // //               <span className="font-semibold">Unable to display PDF</span>

// // //               <span className="text-neutral-400">{error}</span>
// // //             </div>
// // //           </div>
// // //         )}

// // //         {/* ----------------------------------------------------------------- */}
// // //         {/* PDF PAGES                                                         */}
// // //         {/* ----------------------------------------------------------------- */}

// // //         {!isLoading && !error && pdfDocRef.current && (
// // //           <div
// // //             className={`m-auto flex min-h-fit flex-col items-center ${
// // //               fitToWidth ? "w-full min-w-0" : "w-fit min-w-fit"
// // //             } `}
// // //           >
// // //             {Array.from(
// // //               {
// // //                 length: numPages,
// // //               },
// // //               (_, index) => index + 1,
// // //             ).map((pageNumber) => (
// // //               <PdfPageView
// // //                 key={pageNumber}
// // //                 pdfDoc={pdfDocRef.current!}
// // //                 pageNumber={pageNumber}
// // //                 scale={scale}
// // //                 rotation={rotation}
// // //                 selectableText={selectableText}
// // //                 fitToWidth={fitToWidth}
// // //                 onVisible={setActivePage}
// // //               />
// // //             ))}
// // //           </div>
// // //         )}
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // export default PdfPreview;

// merge pre-version1
// import React, { useCallback, useEffect, useRef, useState } from "react";

// import * as pdfjsLib from "pdfjs-dist";
// import { TextLayer } from "pdfjs-dist";

// import type {
//   PDFDocumentLoadingTask,
//   PDFDocumentProxy,
//   PDFPageProxy,
//   RenderTask,
// } from "pdfjs-dist";

// import "pdfjs-dist/web/pdf_viewer.css";

// import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// import {
//   ChevronLeft,
//   ChevronRight,
//   ZoomIn,
//   ZoomOut,
//   RotateCw,
//   Maximize2,
//   Loader2,
//   AlertCircle,
//   ExternalLink,
// } from "lucide-react";

// // -----------------------------------------------------------------------------
// // PDF.js worker
// // -----------------------------------------------------------------------------

// if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
//   pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
// }

// // -----------------------------------------------------------------------------
// // Props
// // -----------------------------------------------------------------------------

// export interface PdfPreviewProps {
//   /**
//    * URL string, Blob, File, or ArrayBuffer.
//    */
//   src: string | Blob | File | ArrayBuffer;

//   /**
//    * Custom wrapper class.
//    *
//    * IMPORTANT:
//    * For modal usage, give this a real height such as:
//    *
//    *   h-[80vh]
//    *
//    * or:
//    *
//    *   h-full
//    *
//    * if the parent itself has a defined height.
//    */
//   className?: string;

//   /**
//    * Only render the first page.
//    */
//   firstPageOnly?: boolean;

//   /**
//    * Fit the PDF page to the available width.
//    *
//    * This is what the card thumbnail should use.
//    *
//    * When true:
//    * - PDF is scaled down to fit the card
//    * - horizontal overflow is disabled
//    * - vertical scrolling remains available
//    */
//   fitToWidth?: boolean;

//   /**
//    * Enable selectable PDF text layer.
//    */
//   selectableText?: boolean;

//   /**
//    * Show PDF toolbar.
//    */
//   showToolbar?: boolean;

//   /**
//    * Initial scale when fitToWidth is false.
//    */
//   initialScale?: number;

//   /**
//    * Called after document loads.
//    */
//   onLoadSuccess?: (numPages: number) => void;

//   /**
//    * Called when document loading fails.
//    */
//   onLoadError?: (error: Error) => void;
// }

// // -----------------------------------------------------------------------------
// // PDF PAGE
// // -----------------------------------------------------------------------------

// interface PdfPageViewProps {
//   pdfDoc: PDFDocumentProxy;
//   pageNumber: number;
//   scale: number;
//   rotation: number;
//   selectableText: boolean;
//   fitToWidth: boolean;
//   onVisible: (pageNumber: number) => void;
// }

// const PdfPageView: React.FC<PdfPageViewProps> = ({
//   pdfDoc,
//   pageNumber,
//   scale,
//   rotation,
//   selectableText,
//   fitToWidth,
//   onVisible,
// }) => {
//   const pageContainerRef = useRef<HTMLDivElement>(null);

//   const canvasRef = useRef<HTMLCanvasElement>(null);

//   const textLayerRef = useRef<HTMLDivElement>(null);

//   const renderTaskRef = useRef<RenderTask | null>(null);

//   const textLayerTaskRef = useRef<TextLayer | null>(null);

//   // ---------------------------------------------------------------------------
//   // Observe page visibility
//   // ---------------------------------------------------------------------------

//   useEffect(() => {
//     const element = pageContainerRef.current;

//     if (!element) {
//       return;
//     }

//     const observer = new IntersectionObserver(
//       (entries) => {
//         for (const entry of entries) {
//           if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
//             onVisible(pageNumber);
//           }
//         }
//       },
//       {
//         threshold: [0.1, 0.3, 0.6],
//       },
//     );

//     observer.observe(element);

//     return () => {
//       observer.disconnect();
//     };
//   }, [pageNumber, onVisible]);

//   // ---------------------------------------------------------------------------
//   // Render page
//   // ---------------------------------------------------------------------------

//   useEffect(() => {
//     let cancelled = false;

//     // Cancel previous render
//     if (renderTaskRef.current) {
//       try {
//         renderTaskRef.current.cancel();
//       } catch {}

//       renderTaskRef.current = null;
//     }

//     // Cancel previous text layer
//     if (textLayerTaskRef.current) {
//       try {
//         textLayerTaskRef.current.cancel();
//       } catch {}

//       textLayerTaskRef.current = null;
//     }

//     const renderPage = async () => {
//       try {
//         const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);

//         if (cancelled) {
//           return;
//         }

//         const canvas = canvasRef.current;

//         if (!canvas) {
//           return;
//         }

//         const context = canvas.getContext("2d", {
//           alpha: false,
//         });

//         if (!context) {
//           return;
//         }

//         const viewport = page.getViewport({
//           scale,
//           rotation,
//         });

//         const devicePixelRatio = window.devicePixelRatio || 1;

//         // ---------------------------------------------------------------------
//         // Canvas dimensions
//         // ---------------------------------------------------------------------

//         canvas.width = Math.floor(viewport.width * devicePixelRatio);

//         canvas.height = Math.floor(viewport.height * devicePixelRatio);

//         /*
//          * CSS dimensions.
//          *
//          * The actual bitmap is rendered at devicePixelRatio resolution,
//          * while the browser displays it at the PDF viewport dimensions.
//          */
//         canvas.style.width = `${viewport.width}px`;

//         canvas.style.height = `${viewport.height}px`;

//         canvas.style.display = "block";

//         context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

//         // ---------------------------------------------------------------------
//         // Render canvas
//         // ---------------------------------------------------------------------

//         const renderTask = page.render({
//           canvas,
//           viewport,
//         });

//         renderTaskRef.current = renderTask;

//         await renderTask.promise;

//         renderTaskRef.current = null;

//         if (cancelled) {
//           return;
//         }

//         // ---------------------------------------------------------------------
//         // Text layer
//         // ---------------------------------------------------------------------

//         if (selectableText && textLayerRef.current) {
//           const textContainer = textLayerRef.current;

//           textContainer.innerHTML = "";

//           textContainer.style.width = `${viewport.width}px`;

//           textContainer.style.height = `${viewport.height}px`;

//           textContainer.style.setProperty("--scale-factor", `${scale}`);

//           textContainer.style.setProperty("--total-scale-factor", `${scale}`);

//           const textContent = await page.getTextContent();

//           if (cancelled) {
//             return;
//           }

//           const textLayer = new TextLayer({
//             textContentSource: textContent,
//             container: textContainer,
//             viewport,
//           });

//           textLayerTaskRef.current = textLayer;

//           await textLayer.render();

//           textLayerTaskRef.current = null;
//         }
//       } catch (error: any) {
//         if (error?.name !== "RenderingCancelledException") {
//           console.error(`PDF page ${pageNumber} render error:`, error);
//         }
//       }
//     };

//     void renderPage();

//     return () => {
//       cancelled = true;

//       if (renderTaskRef.current) {
//         try {
//           renderTaskRef.current.cancel();
//         } catch {}

//         renderTaskRef.current = null;
//       }

//       if (textLayerTaskRef.current) {
//         try {
//           textLayerTaskRef.current.cancel();
//         } catch {}

//         textLayerTaskRef.current = null;
//       }
//     };
//   }, [pdfDoc, pageNumber, scale, rotation, selectableText]);

//   return (
//     <div
//       ref={pageContainerRef}
//       data-page-number={pageNumber}
//       id={`pdf-page-${pageNumber}`}
//       className={`relative mb-2 overflow-hidden bg-white shadow-sm last:mb-0 ${
//         fitToWidth ? "w-full" : "w-fit"
//       } `}
//     >
//       <canvas
//         ref={canvasRef}
//         className={`pointer-events-none block ${fitToWidth ? "mx-auto" : ""} `}
//       />

//       {selectableText && (
//         <div
//           ref={textLayerRef}
//           className="textLayer select-text"
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             overflow: "hidden",
//           }}
//         />
//       )}
//     </div>
//   );
// };

// // -----------------------------------------------------------------------------
// // PDF PREVIEW
// // -----------------------------------------------------------------------------

// export const PdfPreview: React.FC<PdfPreviewProps> = ({
//   src,
//   className = "w-full h-64",
//   firstPageOnly = false,
//   fitToWidth = false,
//   selectableText = true,
//   showToolbar = true,
//   initialScale = 1,
//   onLoadSuccess,
//   onLoadError,
// }) => {
//   // ---------------------------------------------------------------------------
//   // Refs
//   // ---------------------------------------------------------------------------

//   /*
//    * IMPORTANT:
//    *
//    * This is the NON-SCROLLING measurement wrapper.
//    *
//    * This comes directly from the architecture of your old working
//    * implementation.
//    */
//   const sizeRef = useRef<HTMLDivElement>(null);

//   /*
//    * Actual scrolling viewport.
//    */
//   const scrollContainerRef = useRef<HTMLDivElement>(null);

//   /*
//    * Rendered PDF page container.
//    */
//   const containerRef = useRef<HTMLDivElement>(null);

//   /*
//    * PDF.js document.
//    */
//   const pdfDocRef = useRef<PDFDocumentProxy | null>(null);

//   const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);

//   // ---------------------------------------------------------------------------
//   // State
//   // ---------------------------------------------------------------------------

//   const [containerWidth, setContainerWidth] = useState(0);

//   const [numPages, setNumPages] = useState(0);

//   const [activePage, setActivePage] = useState(1);

//   const [scale, setScale] = useState(initialScale);

//   const [rotation, setRotation] = useState(0);

//   const [loading, setLoading] = useState(true);

//   const [error, setError] = useState<string | null>(null);

//   // ---------------------------------------------------------------------------
//   // Measure available width
//   // ---------------------------------------------------------------------------

//   useEffect(() => {
//     const element = sizeRef.current;

//     if (!element) {
//       return;
//     }

//     const updateWidth = () => {
//       const width = Math.round(element.getBoundingClientRect().width);

//       if (width > 0) {
//         setContainerWidth((previousWidth) =>
//           previousWidth === width ? previousWidth : width,
//         );
//       }
//     };

//     // Initial measurement
//     updateWidth();

//     const observer = new ResizeObserver(updateWidth);

//     observer.observe(element);

//     return () => {
//       observer.disconnect();
//     };
//   }, []);

//   // ---------------------------------------------------------------------------
//   // Load PDF
//   // ---------------------------------------------------------------------------

//   useEffect(() => {
//     if (!src) {
//       return;
//     }

//     let cancelled = false;

//     setLoading(true);
//     setError(null);
//     setActivePage(1);
//     setNumPages(0);

//     // -------------------------------------------------------------------------
//     // Destroy previous loading task
//     // -------------------------------------------------------------------------

//     if (loadingTaskRef.current) {
//       try {
//         void loadingTaskRef.current.destroy();
//       } catch {}

//       loadingTaskRef.current = null;
//     }

//     // -------------------------------------------------------------------------
//     // Clean previous document
//     // -------------------------------------------------------------------------

//     if (pdfDocRef.current) {
//       try {
//         pdfDocRef.current.cleanup();
//       } catch {}

//       pdfDocRef.current = null;
//     }

//     // -------------------------------------------------------------------------
//     // Load
//     // -------------------------------------------------------------------------

//     const loadPdf = async () => {
//       try {
//         let loadingTask: PDFDocumentLoadingTask;

//         // ---------------------------------------------------------------------
//         // URL / data URL
//         // ---------------------------------------------------------------------

//         if (typeof src === "string") {
//           if (src.startsWith("data:application/pdf;base64,")) {
//             const base64 = src.split(",")[1];

//             const binary = atob(base64);

//             const bytes = new Uint8Array(binary.length);

//             for (let i = 0; i < binary.length; i++) {
//               bytes[i] = binary.charCodeAt(i);
//             }

//             loadingTask = pdfjsLib.getDocument({
//               data: bytes,
//             });
//           } else {
//             loadingTask = pdfjsLib.getDocument({
//               url: src,
//             });
//           }

//           // -------------------------------------------------------------------
//           // Blob / File
//           // -------------------------------------------------------------------
//         } else if (src instanceof Blob || src instanceof File) {
//           const arrayBuffer = await src.arrayBuffer();

//           if (cancelled) {
//             return;
//           }

//           loadingTask = pdfjsLib.getDocument({
//             data: new Uint8Array(arrayBuffer),
//           });

//           // -------------------------------------------------------------------
//           // ArrayBuffer
//           // -------------------------------------------------------------------
//         } else if (src instanceof ArrayBuffer) {
//           loadingTask = pdfjsLib.getDocument({
//             data: new Uint8Array(src),
//           });
//         } else {
//           throw new Error("Unsupported src type provided to PdfPreview");
//         }

//         loadingTaskRef.current = loadingTask;

//         const pdf = await loadingTask.promise;

//         if (cancelled) {
//           try {
//             pdf.cleanup();
//           } catch {}

//           return;
//         }

//         pdfDocRef.current = pdf;

//         const pageCount = firstPageOnly ? 1 : pdf.numPages;

//         setNumPages(pageCount);
//         setActivePage(1);
//         setLoading(false);

//         onLoadSuccess?.(pageCount);
//       } catch (err: any) {
//         if (cancelled) {
//           return;
//         }

//         if (err?.name === "RenderingCancelledException") {
//           return;
//         }

//         console.error("Failed to load PDF:", err);

//         const message = err?.message || "Failed to load PDF";

//         setError(message);
//         setLoading(false);

//         onLoadError?.(err instanceof Error ? err : new Error(message));
//       }
//     };

//     void loadPdf();

//     return () => {
//       cancelled = true;

//       if (loadingTaskRef.current) {
//         try {
//           void loadingTaskRef.current.destroy();
//         } catch {}

//         loadingTaskRef.current = null;
//       }

//       if (pdfDocRef.current) {
//         try {
//           pdfDocRef.current.cleanup();
//         } catch {}

//         pdfDocRef.current = null;
//       }
//     };
//   }, [src]);

//   // ---------------------------------------------------------------------------
//   // Calculate scale
//   // ---------------------------------------------------------------------------

//   useEffect(() => {
//     /*
//      * Don't calculate anything until the PDF and container dimensions exist.
//      */
//     if (!fitToWidth || containerWidth <= 0 || numPages <= 0) {
//       return;
//     }

//     const pdf = pdfDocRef.current;

//     if (!pdf) {
//       return;
//     }

//     let cancelled = false;

//     const calculateScale = async () => {
//       try {
//         /*
//          * Get page 1 at natural scale.
//          */
//         const page = await pdf.getPage(1);

//         if (cancelled) {
//           return;
//         }

//         const baseViewport = page.getViewport({
//           scale: 1,
//           rotation,
//         });

//         /*
//          * Match the old implementation:
//          *
//          *     scale = containerWidth / pageWidth
//          *
//          * This is the key to making card previews behave correctly.
//          */
//         const calculatedScale = containerWidth / baseViewport.width;

//         /*
//          * Don't enlarge tiny PDFs.
//          *
//          * If you DO want a small PDF to fill the entire card,
//          * remove Math.min(1, ...).
//          */
//         const fittedScale = Math.min(1, calculatedScale);

//         setScale((previousScale) => {
//           if (Math.abs(previousScale - fittedScale) < 0.005) {
//             return previousScale;
//           }

//           return fittedScale;
//         });

//         page.cleanup();
//       } catch (err) {
//         if (!cancelled) {
//           console.error("Failed to calculate PDF scale:", err);
//         }
//       }
//     };

//     void calculateScale();

//     return () => {
//       cancelled = true;
//     };
//   }, [fitToWidth, containerWidth, numPages, rotation]);

//   // ---------------------------------------------------------------------------
//   // Scroll to page
//   // ---------------------------------------------------------------------------

//   const scrollToPage = useCallback((pageNumber: number) => {
//     const container = scrollContainerRef.current;

//     if (!container) {
//       return;
//     }

//     const page = container.querySelector(
//       `[data-page-number="${pageNumber}"]`,
//     ) as HTMLElement | null;

//     if (!page) {
//       console.warn(`PDF page ${pageNumber} was not found.`);

//       return;
//     }

//     /*
//      * Calculate the page's position relative to the scrolling container.
//      *
//      * This works regardless of the page's width or the current scroll
//      * position.
//      */
//     const containerRect = container.getBoundingClientRect();

//     const pageRect = page.getBoundingClientRect();

//     const targetTop =
//       container.scrollTop + (pageRect.top - containerRect.top) - 16;

//     container.scrollTo({
//       top: Math.max(0, targetTop),
//       behavior: "smooth",
//     });

//     setActivePage(pageNumber);
//   }, []);

//   // ---------------------------------------------------------------------------
//   // Zoom
//   // ---------------------------------------------------------------------------

//   const handleZoom = useCallback((delta: number) => {
//     setScale((previous) =>
//       Math.min(3.5, Math.max(0.4, Number((previous + delta).toFixed(2)))),
//     );
//   }, []);

//   // ---------------------------------------------------------------------------
//   // Reset zoom
//   // ---------------------------------------------------------------------------

//   const handleResetZoom = useCallback(() => {
//     if (fitToWidth) {
//       /*
//        * In fit mode, resetting means recalculating the width.
//        */
//       if (!pdfDocRef.current || containerWidth <= 0) {
//         return;
//       }

//       void (async () => {
//         try {
//           const page = await pdfDocRef.current!.getPage(1);

//           const viewport = page.getViewport({
//             scale: 1,
//             rotation,
//           });

//           setScale(Math.min(1, containerWidth / viewport.width));

//           page.cleanup();
//         } catch {}
//       })();

//       return;
//     }

//     setScale(initialScale);
//   }, [fitToWidth, containerWidth, rotation, initialScale]);

//   // ---------------------------------------------------------------------------
//   // Open in native viewer
//   // ---------------------------------------------------------------------------

//   const handleOpenInNewTab = useCallback(() => {
//     if (typeof src === "string") {
//       window.open(src, "_blank");

//       return;
//     }

//     if (src instanceof Blob || src instanceof File) {
//       const url = URL.createObjectURL(src);

//       window.open(url, "_blank");

//       window.setTimeout(() => {
//         URL.revokeObjectURL(url);
//       }, 60000);
//     }
//   }, [src]);

//   // ---------------------------------------------------------------------------
//   // Error
//   // ---------------------------------------------------------------------------

//   if (error) {
//     return (
//       <div ref={sizeRef} className={`relative w-full ${className} `}>
//         <div className="flex h-full min-h-64 items-center justify-center bg-neutral-900 px-4 text-center text-xs text-neutral-500">
//           <div className="flex flex-col items-center gap-2">
//             <AlertCircle className="h-5 w-5 text-rose-400" />

//             <span>Failed to load PDF</span>

//             <span className="max-w-sm text-[10px] text-neutral-600">
//               {error}
//             </span>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   // ---------------------------------------------------------------------------
//   // Render
//   // ---------------------------------------------------------------------------

//   return (
//     /*
//      * IMPORTANT:
//      *
//      * This wrapper is NOT scrollable.
//      *
//      * ResizeObserver measures this element.
//      *
//      * This is the same architecture as your old working implementation.
//      */
//     <div
//       ref={sizeRef}
//       className={`relative flex w-full min-w-0 flex-col overflow-hidden ${className} `}
//     >
//       {/* ------------------------------------------------------------------- */}
//       {/* TOOLBAR                                                             */}
//       {/* ------------------------------------------------------------------- */}

//       {showToolbar && (
//         <div className="z-20 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-xs select-none">
//           {/* --------------------------------------------------------------- */}
//           {/* Page navigation                                                */}
//           {/* --------------------------------------------------------------- */}

//           <div className="flex shrink-0 items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
//             <button
//               type="button"
//               disabled={activePage <= 1 || loading || numPages <= 1}
//               onClick={() => scrollToPage(Math.max(1, activePage - 1))}
//               className="cursor-pointer rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-default disabled:opacity-30"
//               title="Previous Page"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </button>

//             <span className="min-w-16 px-2 text-center font-mono text-[11px] text-neutral-300">
//               {numPages > 0 ? `${activePage} / ${numPages}` : "- / -"}
//             </span>

//             <button
//               type="button"
//               disabled={activePage >= numPages || loading || numPages <= 1}
//               onClick={() => scrollToPage(Math.min(numPages, activePage + 1))}
//               className="cursor-pointer rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:cursor-default disabled:opacity-30"
//               title="Next Page"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>

//           {/* --------------------------------------------------------------- */}
//           {/* Zoom / rotation                                                */}
//           {/* --------------------------------------------------------------- */}

//           <div className="flex shrink-0 items-center gap-1">
//             <button
//               type="button"
//               onClick={() => handleZoom(-0.2)}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Zoom Out"
//             >
//               <ZoomOut className="h-3.5 w-3.5" />
//             </button>

//             <span className="min-w-12 px-1.5 text-center font-mono text-[11px] text-neutral-300">
//               {Math.round(scale * 100)}%
//             </span>

//             <button
//               type="button"
//               onClick={() => handleZoom(0.2)}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Zoom In"
//             >
//               <ZoomIn className="h-3.5 w-3.5" />
//             </button>

//             <button
//               type="button"
//               onClick={handleResetZoom}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Reset Zoom"
//             >
//               <Maximize2 className="h-3.5 w-3.5" />
//             </button>

//             <button
//               type="button"
//               onClick={() => setRotation((previous) => (previous + 90) % 360)}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Rotate 90°"
//             >
//               <RotateCw className="h-3.5 w-3.5" />
//             </button>

//             <button
//               type="button"
//               onClick={handleOpenInNewTab}
//               className="ml-1 cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Open in Native Viewer"
//             >
//               <ExternalLink className="h-3.5 w-3.5" />
//             </button>
//           </div>
//         </div>
//       )}

//       {/* ------------------------------------------------------------------- */}
//       {/* PDF VIEWPORT                                                        */}
//       {/* ------------------------------------------------------------------- */}

//       <div
//         ref={scrollContainerRef}
//         data-testid="pdf-viewport"
//         className={`relative min-h-0 w-full flex-1 overscroll-contain bg-neutral-900 ${
//           fitToWidth ? "overflow-x-hidden overflow-y-auto" : "overflow-auto"
//         } `}
//       >
//         {/* ----------------------------------------------------------------- */}
//         {/* Loading                                                           */}
//         {/* ----------------------------------------------------------------- */}

//         {loading && (
//           <div className="absolute inset-0 z-10 flex items-center justify-center bg-neutral-900 text-xs text-neutral-500">
//             <div className="flex items-center gap-2">
//               <Loader2 className="h-4 w-4 animate-spin text-blue-500" />

//               <span>Loading PDF...</span>
//             </div>
//           </div>
//         )}

//         {/* ----------------------------------------------------------------- */}
//         {/* PDF pages                                                         */}
//         {/* ----------------------------------------------------------------- */}

//         <div
//           ref={containerRef}
//           data-testid="pdf-container"
//           className={`flex min-h-fit flex-col gap-2 ${
//             fitToWidth ? "w-full min-w-0" : "w-fit min-w-fit"
//           } `}
//         >
//           {!loading &&
//             pdfDocRef.current &&
//             Array.from(
//               {
//                 length: numPages,
//               },
//               (_, index) => index + 1,
//             ).map((pageNumber) => (
//               <PdfPageView
//                 key={pageNumber}
//                 pdfDoc={pdfDocRef.current!}
//                 pageNumber={pageNumber}
//                 scale={scale}
//                 rotation={rotation}
//                 selectableText={selectableText}
//                 fitToWidth={fitToWidth}
//                 onVisible={setActivePage}
//               />
//             ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PdfPreview;

// final version 1.0.0
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
        className={`relative min-h-0 w-full flex-1 bg-neutral-950/80 p-2 ${
          fitToWidth ? "overflow-x-hidden overflow-y-auto" : "overflow-auto"
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
