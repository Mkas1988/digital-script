/**
 * Image Storage Service
 * Handles uploading extracted images to Supabase Storage
 * and saving metadata to the database
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExtractedImage } from './image-extractor'

export interface StoredImage {
  id?: string
  storagePath: string
  publicUrl: string
  width: number
  height: number
  pageNumber: number
  imageIndex: number
}

export interface ImageStorageOptions {
  documentId: string
  userId: string
  generateAltText?: boolean
}

const STORAGE_BUCKET = 'document-images'

/**
 * Generate storage path for an image
 */
export function generateStoragePath(
  userId: string,
  documentId: string,
  pageNumber: number,
  imageIndex: number,
  format: string
): string {
  return `${userId}/${documentId}/page-${pageNumber}-img-${imageIndex}.${format}`
}

/**
 * Upload extracted images to Supabase Storage
 */
export async function uploadExtractedImages(
  images: ExtractedImage[],
  options: ImageStorageOptions,
  supabase: SupabaseClient
): Promise<StoredImage[]> {
  const { documentId, userId } = options
  const storedImages: StoredImage[] = []

  for (const image of images) {
    const storagePath = generateStoragePath(
      userId,
      documentId,
      image.pageNumber,
      image.imageIndex,
      image.format
    )

    try {
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, image.data, {
          contentType: image.format === 'jpeg' ? 'image/jpeg' : 'image/png',
          upsert: true,
        })

      if (uploadError) {
        console.error(`Failed to upload image ${storagePath}:`, uploadError)
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(storagePath)

      storedImages.push({
        storagePath,
        publicUrl: urlData.publicUrl,
        width: image.width,
        height: image.height,
        pageNumber: image.pageNumber,
        imageIndex: image.imageIndex,
      })
    } catch (err) {
      console.error(`Error uploading image ${storagePath}:`, err)
    }
  }

  return storedImages
}

/**
 * Save image metadata to the database
 */
export async function saveImageMetadata(
  storedImages: StoredImage[],
  documentId: string,
  supabase: SupabaseClient,
  altTextGenerator?: (imageUrl: string, pageNumber: number) => Promise<string>
): Promise<void> {
  if (storedImages.length === 0) return

  const imageRecords = await Promise.all(
    storedImages.map(async (img) => {
      let altText = 'Abbildung im Dokument'

      // Generate alt text if function provided
      if (altTextGenerator) {
        try {
          altText = await altTextGenerator(img.publicUrl, img.pageNumber)
        } catch (err) {
          console.warn('Alt text generation failed:', err)
        }
      }

      return {
        document_id: documentId,
        storage_path: img.publicUrl,
        alt_text: altText,
        page_number: img.pageNumber,
        width: img.width,
        height: img.height,
      }
    })
  )

  // Batch insert all image records
  const { error } = await supabase.from('document_images').insert(imageRecords)

  if (error) {
    console.error('Failed to save image metadata:', error)
    throw error
  }
}

/**
 * Delete all images for a document
 */
export async function deleteDocumentImages(
  documentId: string,
  userId: string,
  supabase: SupabaseClient
): Promise<void> {
  // Delete from storage
  const folderPath = `${userId}/${documentId}/`

  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folderPath)

  if (files && files.length > 0) {
    const filePaths = files.map((f) => `${folderPath}${f.name}`)
    await supabase.storage.from(STORAGE_BUCKET).remove(filePaths)
  }

  // Delete from database
  await supabase.from('document_images').delete().eq('document_id', documentId)
}

/**
 * Get all images for a document
 */
export async function getDocumentImages(
  documentId: string,
  supabase: SupabaseClient
): Promise<StoredImage[]> {
  const { data, error } = await supabase
    .from('document_images')
    .select('*')
    .eq('document_id', documentId)
    .order('page_number', { ascending: true })

  if (error) {
    console.error('Failed to fetch document images:', error)
    return []
  }

  return data.map((img) => ({
    id: img.id,
    storagePath: img.storage_path,
    publicUrl: img.storage_path,
    width: img.width || 0,
    height: img.height || 0,
    pageNumber: img.page_number || 0,
    imageIndex: 0,
  }))
}
