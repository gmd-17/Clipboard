// import React, { useEffect, useRef, useState, useCallback } from "react";
// import * as pdfjsLib from "pdfjs-dist";
// import { TextLayer } from "pdfjs-dist";
// import type {
//   PDFDocumentProxy,
//   PDFDocumentLoadingTask,
//   RenderTask,
// } from "pdfjs-dist";
// import "pdfjs-dist/web/pdf_viewer.css";

// // Vite-native local worker bundle
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

// // Initialize the local Vite worker bundle once
// if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
//   pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
// }

// interface PdfPreviewProps {
//   /** URL string, Blob, File, or ArrayBuffer of the PDF */
//   src: string | Blob | File | ArrayBuffer;
//   /** Custom wrapper class */
//   className?: string;

//   /** Whether to render only the first page (default: false) */
//   firstPageOnly?: boolean;

//   /** Whether to enable native text selection over the canvas (default: true) */
//   selectableText?: boolean;
//   /** Show or hide the top toolbar controls (default: true) */
//   showToolbar?: boolean;
//   /** Initial zoom multiplier (default: 1.0) */
//   initialScale?: number;
//   /** Callback fired when document finishes loading */
//   onLoadSuccess?: (numPages: number) => void;
//   /** Callback fired on loading error */
//   onLoadError?: (error: Error) => void;
// }

// const PdfPreview: React.FC<PdfPreviewProps> = ({
//   src,
//   className = "w-full h-full min-h-100",
//   firstPageOnly = false,
//   selectableText = true,
//   showToolbar = true,
//   initialScale = 1.0,
//   onLoadSuccess,
//   onLoadError,
// }) => {
//   const [numPages, setNumPages] = useState<number>(0);
//   const [currentPage, setCurrentPage] = useState<number>(1);
//   const [scale, setScale] = useState<number>(initialScale);
//   const [rotation, setRotation] = useState<number>(0);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const textLayerRef = useRef<HTMLDivElement>(null);
//   const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
//   const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
//   const renderTaskRef = useRef<RenderTask | null>(null);
//   const textLayerTaskRef = useRef<TextLayer | null>(null);

//   // 1. Load Document
//   useEffect(() => {
//     let isMounted = true;
//     setIsLoading(true);
//     setError(null);

//     // Cancel previous tasks
//     if (renderTaskRef.current) {
//       try {
//         renderTaskRef.current.cancel();
//       } catch {}
//       renderTaskRef.current = null;
//     }
//     if (textLayerTaskRef.current) {
//       try {
//         textLayerTaskRef.current.cancel();
//       } catch {}
//       textLayerTaskRef.current = null;
//     }
//     if (loadingTaskRef.current) {
//       try {
//         loadingTaskRef.current.destroy();
//       } catch {}
//       loadingTaskRef.current = null;
//     }

//     const loadDoc = async () => {
//       try {
//         let task: PDFDocumentLoadingTask;

//         if (typeof src === "string") {
//           if (src.startsWith("data:application/pdf;base64,")) {
//             const b64 = src.split(",")[1];
//             const byteCharacters = atob(b64);
//             const byteNumbers = new Uint8Array(byteCharacters.length);
//             for (let i = 0; i < byteCharacters.length; i++) {
//               byteNumbers[i] = byteCharacters.charCodeAt(i);
//             }
//             task = pdfjsLib.getDocument({ data: byteNumbers });
//           } else {
//             task = pdfjsLib.getDocument({ url: src });
//           }
//         } else if (src instanceof Blob || src instanceof File) {
//           const arrayBuffer = await src.arrayBuffer();
//           task = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
//         } else if (src instanceof ArrayBuffer) {
//           task = pdfjsLib.getDocument({ data: new Uint8Array(src) });
//         } else {
//           throw new Error("Unsupported src type provided to PdfPreview");
//         }

//         loadingTaskRef.current = task;
//         const pdfDoc = await task.promise;
//         if (!isMounted) return;

//         pdfDocRef.current = pdfDoc;
//         setNumPages(firstPageOnly ? 1 : pdfDoc.numPages);
//         setCurrentPage(1);
//         setIsLoading(false);
//         onLoadSuccess?.(firstPageOnly ? 1 : pdfDoc.numPages);
//       } catch (err: any) {
//         if (!isMounted) return;
//         if (err?.name === "RenderingCancelledException") return;
//         const msg = err?.message || "Failed to load PDF document";
//         setError(msg);
//         setIsLoading(false);
//         onLoadError?.(err);
//       }
//     };

//     loadDoc();

//     return () => {
//       isMounted = false;
//       if (renderTaskRef.current) {
//         try {
//           renderTaskRef.current.cancel();
//         } catch {}
//       }
//       if (textLayerTaskRef.current) {
//         try {
//           textLayerTaskRef.current.cancel();
//         } catch {}
//       }
//       if (loadingTaskRef.current) {
//         try {
//           loadingTaskRef.current.destroy();
//         } catch {}
//       }
//       if (pdfDocRef.current) {
//         try {
//           pdfDocRef.current.cleanup();
//         } catch {}
//       }
//     };
//   }, [src]);

//   // 2. Render Page Canvas & Text Layer
//   const renderPage = useCallback(async () => {
//     if (!pdfDocRef.current || !canvasRef.current) return;

//     if (renderTaskRef.current) {
//       try {
//         renderTaskRef.current.cancel();
//       } catch {}
//       renderTaskRef.current = null;
//     }
//     if (textLayerTaskRef.current) {
//       try {
//         textLayerTaskRef.current.cancel();
//       } catch {}
//       textLayerTaskRef.current = null;
//     }

//     try {
//       const page = await pdfDocRef.current.getPage(currentPage);
//       const canvas = canvasRef.current;
//       const textContainer = textLayerRef.current;
//       if (!canvas) return;

//       const context = canvas.getContext("2d", { alpha: false });
//       if (!context) return;

//       const viewport = page.getViewport({ scale, rotation });
//       const pixelRatio = window.devicePixelRatio || 1;

//       // High-DPI canvas sizing
//       canvas.width = Math.floor(viewport.width * pixelRatio);
//       canvas.height = Math.floor(viewport.height * pixelRatio);
//       canvas.style.width = `${viewport.width}px`;
//       canvas.style.height = `${viewport.height}px`;

//       context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

//       // ✅ Modern PDF.js render options with canvas property
//       const renderContext = {
//         canvas: canvas,
//         canvasContext: context,
//         viewport: viewport,
//       };

//       const renderTask = page.render(renderContext);
//       renderTaskRef.current = renderTask;
//       await renderTask.promise;
//       renderTaskRef.current = null;

//       // Text selection layer
//       if (selectableText && textContainer) {
//         textContainer.innerHTML = "";
//         textContainer.style.width = `${viewport.width}px`;
//         textContainer.style.height = `${viewport.height}px`;
//         textContainer.style.setProperty("--scale-factor", `${scale}`);
//         textContainer.style.setProperty("--total-scale-factor", `${scale}`);

//         const textContent = await page.getTextContent();

//         const textLayer = new TextLayer({
//           textContentSource: textContent,
//           container: textContainer,
//           viewport: viewport,
//         });

//         textLayerTaskRef.current = textLayer;
//         await textLayer.render();
//         textLayerTaskRef.current = null;
//       }
//     } catch (err: any) {
//       if (err?.name !== "RenderingCancelledException") {
//         console.error("Page render error:", err);
//       }
//     }
//   }, [currentPage, scale, rotation, selectableText]);

//   useEffect(() => {
//     if (!isLoading && pdfDocRef.current) {
//       renderPage();
//     }
//   }, [renderPage, isLoading]);

//   const handleZoom = (delta: number) => {
//     setScale((prev) =>
//       Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))),
//     );
//   };

//   const handleOpenInNewTab = () => {
//     if (typeof src === "string") {
//       window.open(src, "_blank");
//     } else if (src instanceof Blob) {
//       const url = URL.createObjectURL(src);
//       window.open(url, "_blank");
//       setTimeout(() => URL.revokeObjectURL(url), 60000);
//     }
//   };

//   return (
//     <div
//       className={`relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 ${className}`}
//     >
//       {/* Top Toolbar */}
//       {showToolbar && (
//         <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-xs select-none">
//           {/* Page Navigation */}
//           <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
//             <button
//               type="button"
//               disabled={currentPage <= 1 || isLoading}
//               onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
//               title="Previous Page"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </button>
//             <span className="px-2 font-mono text-[11px] text-neutral-300">
//               {numPages > 0 ? `${currentPage} / ${numPages}` : "- / -"}
//             </span>
//             <button
//               type="button"
//               disabled={currentPage >= numPages || isLoading}
//               onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
//               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
//               title="Next Page"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>

//           {/* Zoom & Rotation */}
//           <div className="flex items-center gap-1">
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
//               onClick={() => setScale(1.0)}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Reset Zoom"
//             >
//               <Maximize2 className="h-3.5 w-3.5" />
//             </button>
//             <button
//               type="button"
//               onClick={() => setRotation((r) => (r + 90) % 360)}
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

//       {/*
//         Scrollable Container:
//         - overflow-auto on parent
//         - min-w-fit w-fit min-h-fit m-auto on child ensures centering when small,
//           and full horizontal + vertical scrollbars when zoomed in!
//       */}
//       <div className="w-full flex-1 overflow-auto bg-neutral-950/80 p-4 sm:p-6">
//         {isLoading && (
//           <div className="flex h-full min-h-62.5 w-full flex-col items-center justify-center gap-2 text-xs text-neutral-400">
//             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
//             <span>Loading PDF document...</span>
//           </div>
//         )}

//         {error && (
//           <div className="flex h-full min-h-62.5 w-full items-center justify-center p-4">
//             <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-center text-xs text-rose-400">
//               <AlertCircle className="h-6 w-6 text-rose-400" />
//               <span className="font-semibold">Unable to display PDF</span>
//               <span className="text-neutral-400">{error}</span>
//             </div>
//           </div>
//         )}

//         {!isLoading && !error && (
//           <div className="m-auto flex min-h-fit w-fit min-w-fit items-center justify-center">
//             <div className="relative overflow-hidden rounded-sm border border-neutral-700 bg-white shadow-2xl">
//               {/* 1. Canvas Bitmap Layer */}
//               <canvas ref={canvasRef} className="pointer-events-none block" />

//               {/* 2. Interactive Selection Layer */}
//               {selectableText && (
//                 <div
//                   ref={textLayerRef}
//                   className="textLayer select-text"
//                   style={{
//                     position: "absolute",
//                     top: 0,
//                     left: 0,
//                     right: 0,
//                     bottom: 0,
//                     overflow: "hidden",
//                   }}
//                 />
//               )}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PdfPreview;

// v2

// import React, { useEffect, useRef, useState, useCallback } from "react";
// import * as pdfjsLib from "pdfjs-dist";
// import { TextLayer } from "pdfjs-dist";
// import type {
//   PDFDocumentProxy,
//   PDFDocumentLoadingTask,
//   PDFPageProxy,
//   RenderTask,
// } from "pdfjs-dist";
// import "pdfjs-dist/web/pdf_viewer.css";

// // 🚀 Vite-native local worker bundle
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

// // Initialize the local Vite worker bundle once
// if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
//   pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
// }

// export interface PdfPreviewProps {
//   /** URL string, Blob, File, or ArrayBuffer of the PDF */
//   src: string | Blob | File | ArrayBuffer;
//   /** Custom wrapper class */
//   className?: string;
//   /** Whether to enable native text selection over the canvas (default: true) */
//   selectableText?: boolean;
//   /** Show or hide the top toolbar controls (default: true) */
//   showToolbar?: boolean;
//   /** Initial zoom multiplier (default: 1.0) */
//   initialScale?: number;
//   /** Callback fired when document finishes loading */
//   onLoadSuccess?: (numPages: number) => void;
//   /** Callback fired on loading error */
//   onLoadError?: (error: Error) => void;
// }

// // Sub-component rendering an individual page (Canvas + TextLayer)
// const PdfPageView: React.FC<{
//   pdfDoc: PDFDocumentProxy;
//   pageNumber: number;
//   scale: number;
//   rotation: number;
//   selectableText: boolean;
//   onVisible: (pageNumber: number) => void;
// }> = ({ pdfDoc, pageNumber, scale, rotation, selectableText, onVisible }) => {
//   const pageContainerRef = useRef<HTMLDivElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const textLayerRef = useRef<HTMLDivElement>(null);

//   const renderTaskRef = useRef<RenderTask | null>(null);
//   const textLayerTaskRef = useRef<TextLayer | null>(null);

//   // IntersectionObserver to report current visible page to toolbar
//   useEffect(() => {
//     const el = pageContainerRef.current;
//     if (!el) return;

//     const observer = new IntersectionObserver(
//       (entries) => {
//         for (const entry of entries) {
//           if (entry.isIntersecting && entry.intersectionRatio >= 0.4) {
//             onVisible(pageNumber);
//           }
//         }
//       },
//       { threshold: [0.1, 0.4, 0.7] },
//     );

//     observer.observe(el);
//     return () => observer.disconnect();
//   }, [pageNumber, onVisible]);

//   // Render Page Canvas & TextLayer
//   useEffect(() => {
//     let isCancelled = false;

//     // Cancel existing render operations
//     if (renderTaskRef.current) {
//       try {
//         renderTaskRef.current.cancel();
//       } catch {}
//       renderTaskRef.current = null;
//     }
//     if (textLayerTaskRef.current) {
//       try {
//         textLayerTaskRef.current.cancel();
//       } catch {}
//       textLayerTaskRef.current = null;
//     }

//     const render = async () => {
//       try {
//         const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);
//         if (isCancelled) return;

//         const canvas = canvasRef.current;
//         const textContainer = textLayerRef.current;
//         if (!canvas) return;

//         const context = canvas.getContext("2d", { alpha: false });
//         if (!context) return;

//         const viewport = page.getViewport({ scale, rotation });
//         const pixelRatio = window.devicePixelRatio || 1;

//         // Set dimensions
//         canvas.width = Math.floor(viewport.width * pixelRatio);
//         canvas.height = Math.floor(viewport.height * pixelRatio);
//         canvas.style.width = `${viewport.width}px`;
//         canvas.style.height = `${viewport.height}px`;

//         context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

//         const renderContext = {
//           canvas: canvas,
//           canvasContext: context,
//           viewport: viewport,
//         };

//         const renderTask = page.render(renderContext);
//         renderTaskRef.current = renderTask;
//         await renderTask.promise;
//         renderTaskRef.current = null;

//         if (isCancelled) return;

//         // Render Perfectly-Aligned Text Layer
//         if (selectableText && textContainer) {
//           textContainer.innerHTML = "";
//           textContainer.style.width = `${viewport.width}px`;
//           textContainer.style.height = `${viewport.height}px`;
//           textContainer.style.setProperty("--scale-factor", `${scale}`);
//           textContainer.style.setProperty("--total-scale-factor", `${scale}`);

//           const textContent = await page.getTextContent();
//           if (isCancelled) return;

//           const textLayer = new TextLayer({
//             textContentSource: textContent,
//             container: textContainer,
//             viewport: viewport,
//           });

//           textLayerTaskRef.current = textLayer;
//           await textLayer.render();
//           textLayerTaskRef.current = null;
//         }
//       } catch (err: any) {
//         if (err?.name !== "RenderingCancelledException") {
//           console.error(`Page ${pageNumber} render error:`, err);
//         }
//       }
//     };

//     render();

//     return () => {
//       isCancelled = true;
//       if (renderTaskRef.current) {
//         try {
//           renderTaskRef.current.cancel();
//         } catch {}
//       }
//       if (textLayerTaskRef.current) {
//         try {
//           textLayerTaskRef.current.cancel();
//         } catch {}
//       }
//     };
//   }, [pdfDoc, pageNumber, scale, rotation, selectableText]);

//   return (
//     <div
//       ref={pageContainerRef}
//       id={`pdf-page-${pageNumber}`}
//       className="relative mb-6 overflow-hidden rounded-sm border border-neutral-700/80 bg-white shadow-2xl transition-shadow last:mb-0"
//     >
//       {/* 1. Bitmap Canvas */}
//       <canvas ref={canvasRef} className="pointer-events-none block" />

//       {/* 2. Perfectly Aligned Selection Text Layer */}
//       {selectableText && (
//         <div
//           ref={textLayerRef}
//           className="textLayer select-text"
//           style={{
//             position: "absolute",
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             overflow: "hidden",
//           }}
//         />
//       )}
//     </div>
//   );
// };

// export const PdfPreview: React.FC<PdfPreviewProps> = ({
//   src,
//   className = "w-full h-full min-h-[400px]",
//   selectableText = true,
//   showToolbar = true,
//   initialScale = 1.0,
//   onLoadSuccess,
//   onLoadError,
// }) => {
//   const [numPages, setNumPages] = useState<number>(0);
//   const [activePage, setActivePage] = useState<number>(1);
//   const [scale, setScale] = useState<number>(initialScale);
//   const [rotation, setRotation] = useState<number>(0);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);

//   const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
//   const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
//   const scrollContainerRef = useRef<HTMLDivElement>(null);

//   // 1. Load Document
//   useEffect(() => {
//     let isMounted = true;
//     setIsLoading(true);
//     setError(null);

//     if (loadingTaskRef.current) {
//       try {
//         loadingTaskRef.current.destroy();
//       } catch {}
//       loadingTaskRef.current = null;
//     }

//     const loadDoc = async () => {
//       try {
//         let task: PDFDocumentLoadingTask;

//         if (typeof src === "string") {
//           if (src.startsWith("data:application/pdf;base64,")) {
//             const b64 = src.split(",")[1];
//             const byteCharacters = atob(b64);
//             const byteNumbers = new Uint8Array(byteCharacters.length);
//             for (let i = 0; i < byteCharacters.length; i++) {
//               byteNumbers[i] = byteCharacters.charCodeAt(i);
//             }
//             task = pdfjsLib.getDocument({ data: byteNumbers });
//           } else {
//             task = pdfjsLib.getDocument({ url: src });
//           }
//         } else if (src instanceof Blob || src instanceof File) {
//           const arrayBuffer = await src.arrayBuffer();
//           task = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
//         } else if (src instanceof ArrayBuffer) {
//           task = pdfjsLib.getDocument({ data: new Uint8Array(src) });
//         } else {
//           throw new Error("Unsupported src type provided to PdfPreview");
//         }

//         loadingTaskRef.current = task;
//         const pdfDoc = await task.promise;
//         if (!isMounted) return;

//         pdfDocRef.current = pdfDoc;
//         setNumPages(pdfDoc.numPages);
//         setActivePage(1);
//         setIsLoading(false);
//         onLoadSuccess?.(pdfDoc.numPages);
//       } catch (err: any) {
//         if (!isMounted) return;
//         if (err?.name === "RenderingCancelledException") return;
//         const msg = err?.message || "Failed to load PDF document";
//         setError(msg);
//         setIsLoading(false);
//         onLoadError?.(err);
//       }
//     };

//     loadDoc();

//     return () => {
//       isMounted = false;
//       if (loadingTaskRef.current) {
//         try {
//           loadingTaskRef.current.destroy();
//         } catch {}
//       }
//       if (pdfDocRef.current) {
//         try {
//           pdfDocRef.current.cleanup();
//         } catch {}
//       }
//     };
//   }, [src]);

//   // Jump smoothly to a specific page
//   const scrollToPage = useCallback((pageNum: number) => {
//     const pageEl = document.getElementById(`pdf-page-${pageNum}`);
//     if (pageEl) {
//       pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
//       setActivePage(pageNum);
//     }
//   }, []);

//   const handleZoom = (delta: number) => {
//     setScale((prev) =>
//       Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))),
//     );
//   };

//   const handleOpenInNewTab = () => {
//     if (typeof src === "string") {
//       window.open(src, "_blank");
//     } else if (src instanceof Blob) {
//       const url = URL.createObjectURL(src);
//       window.open(url, "_blank");
//       setTimeout(() => URL.revokeObjectURL(url), 60000);
//     }
//   };

//   return (
//     <div
//       className={`relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 ${className}`}
//     >
//       {/* Top Toolbar */}
//       {showToolbar && (
//         <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-xs select-none">
//           {/* Synchronized Page Buttons + Counter */}
//           <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
//             <button
//               type="button"
//               disabled={activePage <= 1 || isLoading}
//               onClick={() => scrollToPage(Math.max(1, activePage - 1))}
//               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
//               title="Scroll to Previous Page"
//             >
//               <ChevronLeft className="h-4 w-4" />
//             </button>
//             <span className="px-2 font-mono text-[11px] text-neutral-300">
//               {numPages > 0 ? `${activePage} / ${numPages}` : "- / -"}
//             </span>
//             <button
//               type="button"
//               disabled={activePage >= numPages || isLoading}
//               onClick={() => scrollToPage(Math.min(numPages, activePage + 1))}
//               className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
//               title="Scroll to Next Page"
//             >
//               <ChevronRight className="h-4 w-4" />
//             </button>
//           </div>

//           {/* Zoom & Rotation Controls */}
//           <div className="flex items-center gap-1">
//             <button
//               type="button"
//               onClick={() => handleZoom(-0.2)}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Zoom Out"
//             >
//               <ZoomOut className="h-3.5 w-3.5" />
//             </button>
//             <span className="min-w-[3rem] px-1.5 text-center font-mono text-[11px] text-neutral-300">
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
//               onClick={() => setScale(1.0)}
//               className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
//               title="Reset Zoom"
//             >
//               <Maximize2 className="h-3.5 w-3.5" />
//             </button>
//             <button
//               type="button"
//               onClick={() => setRotation((r) => (r + 90) % 360)}
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

//       {/* Continuous Scroll Container (All Pages from 1st to Last) */}
//       <div
//         ref={scrollContainerRef}
//         className="w-full flex-1 overflow-auto bg-neutral-950/80 p-4 sm:p-8"
//       >
//         {isLoading && (
//           <div className="flex h-full min-h-[250px] w-full flex-col items-center justify-center gap-2 text-xs text-neutral-400">
//             <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
//             <span>Loading PDF pages...</span>
//           </div>
//         )}

//         {error && (
//           <div className="flex h-full min-h-[250px] w-full items-center justify-center p-4">
//             <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-center text-xs text-rose-400">
//               <AlertCircle className="h-6 w-6 text-rose-400" />
//               <span className="font-semibold">Unable to display PDF</span>
//               <span className="text-neutral-400">{error}</span>
//             </div>
//           </div>
//         )}

//         {!isLoading && !error && pdfDocRef.current && (
//           <div className="m-auto flex min-h-fit w-fit min-w-fit flex-col items-center">
//             {Array.from({ length: numPages }, (_, i) => i + 1).map(
//               (pageNum) => (
//                 <PdfPageView
//                   key={pageNum}
//                   pdfDoc={pdfDocRef.current!}
//                   pageNumber={pageNum}
//                   scale={scale}
//                   rotation={rotation}
//                   selectableText={selectableText}
//                   onVisible={setActivePage}
//                 />
//               ),
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PdfPreview;

// v3

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
  PDFPageProxy,
  RenderTask,
} from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";

// 🚀 Vite-native local worker bundle
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

// Initialize the local Vite worker bundle once
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfPreviewProps {
  /** URL string, Blob, File, or ArrayBuffer of the PDF */
  src: string | Blob | File | ArrayBuffer;
  /** Custom wrapper class */
  className?: string;
  /** Whether to enable native text selection over the canvas (default: true) */
  selectableText?: boolean;
  /** Show or hide the top toolbar controls (default: true) */
  showToolbar?: boolean;
  /** Initial zoom multiplier (default: 1.0) */
  initialScale?: number;
  /** Callback fired when document finishes loading */
  onLoadSuccess?: (numPages: number) => void;
  /** Callback fired on loading error */
  onLoadError?: (error: Error) => void;
}

// Sub-component rendering an individual page (Canvas + TextLayer)
const PdfPageView: React.FC<{
  pdfDoc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
  rotation: number;
  selectableText: boolean;
  onVisible: (pageNumber: number) => void;
}> = ({ pdfDoc, pageNumber, scale, rotation, selectableText, onVisible }) => {
  const pageContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);

  const renderTaskRef = useRef<RenderTask | null>(null);
  const textLayerTaskRef = useRef<TextLayer | null>(null);

  // IntersectionObserver to report current visible page to toolbar
  useEffect(() => {
    const el = pageContainerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            onVisible(pageNumber);
          }
        }
      },
      { threshold: [0.1, 0.3, 0.6] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onVisible]);

  // Render Page Canvas & TextLayer
  useEffect(() => {
    let isCancelled = false;

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

    const render = async () => {
      try {
        const page: PDFPageProxy = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        const textContainer = textLayerRef.current;
        if (!canvas) return;

        const context = canvas.getContext("2d", { alpha: false });
        if (!context) return;

        const viewport = page.getViewport({ scale, rotation });
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvas: canvas,
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        renderTaskRef.current = null;

        if (isCancelled) return;

        // Render Text Layer
        if (selectableText && textContainer) {
          textContainer.innerHTML = "";
          textContainer.style.width = `${viewport.width}px`;
          textContainer.style.height = `${viewport.height}px`;
          textContainer.style.setProperty("--scale-factor", `${scale}`);
          textContainer.style.setProperty("--total-scale-factor", `${scale}`);

          const textContent = await page.getTextContent();
          if (isCancelled) return;

          const textLayer = new TextLayer({
            textContentSource: textContent,
            container: textContainer,
            viewport: viewport,
          });

          textLayerTaskRef.current = textLayer;
          await textLayer.render();
          textLayerTaskRef.current = null;
        }
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNumber} render error:`, err);
        }
      }
    };

    render();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {}
      }
      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel();
        } catch {}
      }
    };
  }, [pdfDoc, pageNumber, scale, rotation, selectableText]);

  return (
    <div
      ref={pageContainerRef}
      id={`pdf-page-${pageNumber}`}
      data-page-number={pageNumber}
      className="relative mb-6 overflow-hidden rounded-sm border border-neutral-700/80 bg-white shadow-2xl last:mb-0"
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
            right: 0,
            bottom: 0,
            overflow: "hidden",
          }}
        />
      )}
    </div>
  );
};

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  src,
  className = "w-full h-full min-h-100",
  selectableText = true,
  showToolbar = true,
  initialScale = 1.0,
  onLoadSuccess,
  onLoadError,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [activePage, setActivePage] = useState<number>(1);
  const [scale, setScale] = useState<number>(initialScale);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Load Document
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    if (loadingTaskRef.current) {
      try {
        loadingTaskRef.current.destroy();
      } catch {}
      loadingTaskRef.current = null;
    }

    const loadDoc = async () => {
      try {
        let task: PDFDocumentLoadingTask;

        if (typeof src === "string") {
          if (src.startsWith("data:application/pdf;base64,")) {
            const b64 = src.split(",")[1];
            const byteCharacters = atob(b64);
            const byteNumbers = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            task = pdfjsLib.getDocument({ data: byteNumbers });
          } else {
            task = pdfjsLib.getDocument({ url: src });
          }
        } else if (src instanceof Blob || src instanceof File) {
          const arrayBuffer = await src.arrayBuffer();
          task = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        } else if (src instanceof ArrayBuffer) {
          task = pdfjsLib.getDocument({ data: new Uint8Array(src) });
        } else {
          throw new Error("Unsupported src type provided to PdfPreview");
        }

        loadingTaskRef.current = task;
        const pdfDoc = await task.promise;
        if (!isMounted) return;

        pdfDocRef.current = pdfDoc;
        setNumPages(pdfDoc.numPages);
        setActivePage(1);
        setIsLoading(false);
        onLoadSuccess?.(pdfDoc.numPages);
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.name === "RenderingCancelledException") return;
        const msg = err?.message || "Failed to load PDF document";
        setError(msg);
        setIsLoading(false);
        onLoadError?.(err);
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
      if (loadingTaskRef.current) {
        try {
          loadingTaskRef.current.destroy();
        } catch {}
      }
      if (pdfDocRef.current) {
        try {
          pdfDocRef.current.cleanup();
        } catch {}
      }
    };
  }, [src]);

  // ✅ Reliable Container Scroll Action
  const scrollToPage = useCallback((pageNum: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const pageEl = container.querySelector(
      `[data-page-number="${pageNum}"]`,
    ) as HTMLElement;
    if (pageEl) {
      const containerRect = container.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const targetScrollTop =
        container.scrollTop + (pageRect.top - containerRect.top) - 16;

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
      setActivePage(pageNum);
    }
  }, []);

  const handleZoom = (delta: number) => {
    setScale((prev) =>
      Math.min(3.5, Math.max(0.4, Number((prev + delta).toFixed(2)))),
    );
  };

  const handleOpenInNewTab = () => {
    if (typeof src === "string") {
      window.open(src, "_blank");
    } else if (src instanceof Blob) {
      const url = URL.createObjectURL(src);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
  };

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-100 ${className}`}
    >
      {/* Top Toolbar */}
      {showToolbar && (
        <div className="z-10 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-neutral-950 px-3 py-2 text-xs select-none">
          {/* Synchronized Page Buttons + Counter */}
          <div className="flex items-center rounded-lg border border-neutral-800 bg-neutral-900 p-0.5">
            <button
              type="button"
              disabled={activePage <= 1 || isLoading}
              onClick={() => scrollToPage(Math.max(1, activePage - 1))}
              className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-mono text-[11px] text-neutral-300">
              {numPages > 0 ? `${activePage} / ${numPages}` : "- / -"}
            </span>
            <button
              type="button"
              disabled={activePage >= numPages || isLoading}
              onClick={() => scrollToPage(Math.min(numPages, activePage + 1))}
              className="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom & Rotation Controls */}
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
              onClick={() => setScale(1.0)}
              className="cursor-pointer rounded-lg border border-neutral-800 bg-neutral-900 p-1.5 text-neutral-300 transition-colors hover:bg-neutral-800"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
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

      {/* Continuous Scroll Stage */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 overflow-auto bg-neutral-950/80 p-4 sm:p-8"
      >
        {isLoading && (
          <div className="flex h-full min-h-62.5 w-full flex-col items-center justify-center gap-2 text-xs text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <span>Loading PDF pages...</span>
          </div>
        )}

        {error && (
          <div className="flex h-full min-h-62.5 w-full items-center justify-center p-4">
            <div className="flex max-w-sm flex-col items-center gap-2 rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 text-center text-xs text-rose-400">
              <AlertCircle className="h-6 w-6 text-rose-400" />
              <span className="font-semibold">Unable to display PDF</span>
              <span className="text-neutral-400">{error}</span>
            </div>
          </div>
        )}

        {!isLoading && !error && pdfDocRef.current && (
          <div className="m-auto flex min-h-fit w-fit min-w-fit flex-col items-center">
            {Array.from({ length: numPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <PdfPageView
                  key={pageNum}
                  pdfDoc={pdfDocRef.current!}
                  pageNumber={pageNum}
                  scale={scale}
                  rotation={rotation}
                  selectableText={selectableText}
                  onVisible={setActivePage}
                />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfPreview;
