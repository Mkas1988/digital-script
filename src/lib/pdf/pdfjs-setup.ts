/**
 * pdfjs-dist configuration for Node.js environment
 * Uses the legacy build which works without DOM APIs
 */

// Use legacy build for Node.js compatibility
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

// Disable worker for server-side usage
// In Node.js, we run pdfjs in the main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

/**
 * Initialize and get a PDF document from buffer data
 */
export async function getPDFDocument(data: Uint8Array): Promise<PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data,
    // Disable features that require browser APIs
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: true,
  })

  return loadingTask.promise
}

/**
 * Get the total number of pages in a PDF
 */
export async function getPDFPageCount(data: Uint8Array): Promise<number> {
  const pdf = await getPDFDocument(data)
  const count = pdf.numPages
  await pdf.destroy()
  return count
}

// Re-export pdfjs-dist for convenience
export { pdfjsLib }
export type { PDFDocumentProxy, PDFPageProxy }
