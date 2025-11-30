import * as FileSystem from 'expo-file-system';
import { documentAPI } from '../services/api';

/**
 * Document type mapping from form keys to API document types
 */
export const DOCUMENT_TYPE_MAP = {
  commonInvoices: 'commercial_invoice',
  packingLists: 'packing_list',
  billOfLading: 'bill_of_lading',
  insurance: 'insurance',
  pol: 'pol',
  pod: 'pod',
  product: 'product',
  ex_works: 'ex_works',
  others: 'others',
};

/**
 * Upload a document following the sequence:
 * 1. Get upload signature from backend
 * 2. Upload file to Cloudinary
 * 3. Save document metadata to backend
 * 
 * @param {Object} file - File object with { uri, name, size }
 * @param {string} documentType - Document type (e.g., 'commercial_invoice')
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<Object>} Document object with id and metadata
 */
export async function uploadDocument(file, documentType, onProgress = null) {
  if (!file || !file.uri) {
    throw new Error('Invalid file object');
  }

  if (!documentType) {
    throw new Error('Document type is required');
  }

  try {
    // Step 1: Get upload signature from backend
    const fileName = file.name || file.uri.split('/').pop() || 'document';
    const signatureResponse = await documentAPI.getUploadSignature(documentType, fileName);
    console.log('signatureResponse', signatureResponse);
    const signatureData = signatureResponse.data?.data || signatureResponse.data;

    if (!signatureData || !signatureData.signature) {
      throw new Error('Failed to get upload signature');
    }

    // Step 2: Upload to Cloudinary
    const formData = new FormData();
    
    // Read file as blob/uri for upload
    const fileUri = file.uri;
    const fileType = file.mimeType || 'application/octet-stream';
    const fileNameForUpload = fileName;

    // Create form data for Cloudinary (React Native format)
    formData.append('file', {
      uri: fileUri,
      type: fileType,
      name: fileNameForUpload,
    });
    
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', String(signatureData.timestamp));
    formData.append('api_key', signatureData.params.api_key);
    formData.append('folder', signatureData.folder);
    formData.append('public_id', signatureData.publicId);
    
    // Add other required Cloudinary params
    Object.keys(signatureData.params).forEach(key => {
      if (key !== 'api_key' && key !== 'folder' && key !== 'public_id' && key !== 'timestamp') {
        const value = signatureData.params[key];
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
    });

    // Upload to Cloudinary
    // Note: Don't set Content-Type header - React Native will set it automatically with boundary
    const cloudinaryResponse = await fetch(signatureData.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text();
      console.error('Cloudinary upload error:', errorText);
      throw new Error('Failed to upload file to Cloudinary');
    }

    const cloudinaryResult = await cloudinaryResponse.json();
    const fileUrl = cloudinaryResult.secure_url || cloudinaryResult.url;
    const publicId = cloudinaryResult.public_id || signatureData.publicId;

    if (!fileUrl) {
      throw new Error('Failed to get file URL from Cloudinary');
    }

    // Step 3: Save document metadata to backend
    const documentResponse = await documentAPI.save({
      documentType,
      fileUrl,
      fileName: fileNameForUpload,
      fileSize: file.size || cloudinaryResult.bytes || 0,
      mimeType: file.mimeType || cloudinaryResult.format || fileType,
      publicId: publicId,
    });

    const document = documentResponse.data?.data?.document || documentResponse.data?.document || documentResponse.data;
    
    if (!document || !document.id) {
      throw new Error('Failed to save document metadata');
    }

    return document;
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
}

/**
 * Upload multiple documents in parallel
 * @param {Array} files - Array of { file, documentType } objects
 * @returns {Promise<Array>} Array of document objects
 */
export async function uploadMultipleDocuments(files) {
  const uploadPromises = files.map(({ file, documentType }) =>
    uploadDocument(file, documentType)
  );
  
  return Promise.all(uploadPromises);
}

