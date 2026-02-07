/**
 * PDF Image Extraction using pdfjs-dist
 * Extracts embedded images from PDF pages and converts them to PNG/JPEG
 */

import sharp from 'sharp'
import { OPS } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { getPDFDocument, type PDFDocumentProxy, type PDFPageProxy } from './pdfjs-setup'

export interface ExtractedImage {
  data: Buffer
  width: number
  height: number
  pageNumber: number
  imageIndex: number
  format: 'png' | 'jpeg'
}

export interface ImageExtractionResult {
  images: ExtractedImage[]
  totalPages: number
  pagesWithImages: number[]
}

export interface ImageExtractionOptions {
  /** Minimum image width to extract (default: 50) */
  minWidth?: number
  /** Minimum image height to extract (default: 50) */
  minHeight?: number
  /** Maximum images per document (default: 100) */
  maxImages?: number
  /** Output format (default: 'png') */
  outputFormat?: 'png' | 'jpeg'
  /** JPEG quality 1-100 (default: 85) */
  quality?: number
}

const DEFAULT_OPTIONS: Required<ImageExtractionOptions> = {
  minWidth: 50,
  minHeight: 50,
  maxImages: 100,
  outputFormat: 'png',
  quality: 85,
}

/**
 * Extract all images from a PDF buffer
 */
export async function extractImagesFromPDF(
  buffer: Buffer,
  options?: ImageExtractionOptions
): Promise<ImageExtractionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const data = new Uint8Array(buffer)

  let pdf: PDFDocumentProxy | null = null

  try {
    pdf = await getPDFDocument(data)
    const totalPages = pdf.numPages
    const allImages: ExtractedImage[] = []
    const pagesWithImages: number[] = []

    // Process pages in batches to manage memory
    const BATCH_SIZE = 5

    for (let batchStart = 1; batchStart <= totalPages; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, totalPages)

      // Process batch pages in parallel
      const batchPromises: Promise<ExtractedImage[]>[] = []

      for (let pageNum = batchStart; pageNum <= batchEnd; pageNum++) {
        batchPromises.push(
          pdf.getPage(pageNum).then((page) =>
            extractImagesFromPage(page, pageNum, opts)
          )
        )
      }

      const batchResults = await Promise.all(batchPromises)

      for (const pageImages of batchResults) {
        if (pageImages.length > 0) {
          allImages.push(...pageImages)
          pagesWithImages.push(pageImages[0].pageNumber)
        }
      }

      // Stop if we've reached max images
      if (allImages.length >= opts.maxImages) {
        break
      }
    }

    return {
      images: allImages.slice(0, opts.maxImages),
      totalPages,
      pagesWithImages: [...new Set(pagesWithImages)].sort((a, b) => a - b),
    }
  } finally {
    if (pdf) {
      await pdf.destroy()
    }
  }
}

/**
 * Extract images from a single PDF page
 */
async function extractImagesFromPage(
  page: PDFPageProxy,
  pageNumber: number,
  options: Required<ImageExtractionOptions>
): Promise<ExtractedImage[]> {
  const images: ExtractedImage[] = []

  try {
    const operatorList = await page.getOperatorList()
    let imageIndex = 0

    for (let i = 0; i < operatorList.fnArray.length; i++) {
      // Look for paintImageXObject operations (embedded images)
      if (operatorList.fnArray[i] === OPS.paintImageXObject) {
        const imageName = operatorList.argsArray[i][0] as string

        try {
          const imgData = await getImageFromPage(page, imageName)

          if (!imgData) continue

          const { width, height, data, kind } = imgData

          // Skip small images (likely icons or artifacts)
          if (width < options.minWidth || height < options.minHeight) {
            continue
          }

          // Convert raw pixel data to PNG/JPEG
          const imageBuffer = await convertImageData(
            data,
            width,
            height,
            kind,
            options
          )

          if (imageBuffer) {
            images.push({
              data: imageBuffer,
              width,
              height,
              pageNumber,
              imageIndex: imageIndex++,
              format: options.outputFormat,
            })
          }
        } catch (err) {
          console.warn(
            `Failed to extract image "${imageName}" on page ${pageNumber}:`,
            err
          )
        }
      }
    }
  } catch (err) {
    console.warn(`Failed to process page ${pageNumber}:`, err)
  }

  return images
}

/**
 * Get image data from page objects
 */
async function getImageFromPage(
  page: PDFPageProxy,
  imageName: string
): Promise<{
  width: number
  height: number
  data: Uint8Array | Uint8ClampedArray
  kind: number
} | null> {
  return new Promise((resolve) => {
    // pdfjs stores image objects that can be retrieved
    page.objs.get(imageName, (img: unknown) => {
      if (!img || typeof img !== 'object') {
        resolve(null)
        return
      }

      const imgObj = img as {
        width?: number
        height?: number
        data?: Uint8Array | Uint8ClampedArray
        kind?: number
      }

      if (!imgObj.data || !imgObj.width || !imgObj.height) {
        resolve(null)
        return
      }

      resolve({
        width: imgObj.width,
        height: imgObj.height,
        data: imgObj.data,
        kind: imgObj.kind ?? 3, // Default to RGBA
      })
    })
  })
}

/**
 * Convert raw pixel data to PNG or JPEG using sharp
 */
async function convertImageData(
  data: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  kind: number,
  options: Required<ImageExtractionOptions>
): Promise<Buffer | null> {
  try {
    // Determine number of channels based on image kind
    // kind: 1 = Grayscale, 2 = RGB, 3 = RGBA
    let channels: 1 | 3 | 4

    switch (kind) {
      case 1:
        channels = 1
        break
      case 2:
        channels = 3
        break
      case 3:
      default:
        channels = 4
    }

    // Create buffer from typed array
    const rawBuffer = Buffer.from(data)

    // Expected size check
    const expectedSize = width * height * channels
    if (rawBuffer.length < expectedSize) {
      console.warn(
        `Image data size mismatch: expected ${expectedSize}, got ${rawBuffer.length}`
      )
      return null
    }

    // Create sharp instance with raw pixel data
    let sharpInstance = sharp(rawBuffer.slice(0, expectedSize), {
      raw: {
        width,
        height,
        channels,
      },
    })

    // Convert to output format
    if (options.outputFormat === 'jpeg') {
      return await sharpInstance.jpeg({ quality: options.quality }).toBuffer()
    } else {
      return await sharpInstance.png({ compressionLevel: 6 }).toBuffer()
    }
  } catch (err) {
    console.error('Image conversion failed:', err)
    return null
  }
}
