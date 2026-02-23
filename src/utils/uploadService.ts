
/**
 * Uploads a file directly to Cloudinary (Client-side)
 * Uses the Unsigned Preset to avoid needing server-side signature.
 */
export const uploadValidation = (file: File): { valid: boolean; error?: string } => {
    if (!file) return { valid: false, error: "Aucun fichier sélectionné." };
    if (!file.type.startsWith("image/")) return { valid: false, error: "Le fichier doit être une image." };
    if (file.size > 10 * 1024 * 1024) return { valid: false, error: "L'image est trop lourde (max 10Mo)." };
    return { valid: true };
};

import { getAuthHeaders } from './auth';

export const uploadToCloudinary = async (
    file: File,
    subFolder: string = 'uploads',
    onProgress?: (progress: number) => void
): Promise<string> => {

    // 1. Attempt Server-Side Upload (Preferred - Secure & github fallback)
    try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('path', subFolder);

        const serverUpload = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);

            // Add auth headers
            const headers = getAuthHeaders(null);
            Object.entries(headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    // Scale to 0-50% for the first attempt
                    onProgress(Math.round(percent * 0.5));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.success && data.url) {
                            resolve(data.url);
                        } else {
                            // If server returns explicit error, throw to catch block
                            reject(new Error(data.error || 'Upload failed'));
                        }
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`Server Error: ${xhr.status}`));
                }
            };

            xhr.onerror = () => {
                reject(new Error("Network Error"));
            };

            xhr.send(formData);
        });

        return serverUpload;

    } catch (serverError) {
        console.warn('Server upload failed, switching to client-side Cloudinary fallback...', serverError);

        // 2. Client-Side Fallback (Direct Cloudinary)
        // Hardcoded credentials for fallback only
        const CLOUD_NAME = 'djnvjsmvr';
        const UPLOAD_PRESET = 'dropsiders_unsigned';

        return new Promise((resolve, reject) => {
            const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('folder', `dropsiders/${subFolder}`);

            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable && onProgress) {
                    const percent = Math.round((e.loaded / e.total) * 100);
                    // Scale from 50-100% for the second attempt
                    onProgress(50 + Math.round(percent * 0.5));
                }
            };

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText);
                        if (data.secure_url) {
                            console.log('Client-side Cloudinary success:', data);
                            resolve(data.secure_url);
                        } else {
                            reject(new Error("Réponse Cloudinary invalide"));
                        }
                    } catch (err) {
                        reject(new Error("Erreur lors de l'analyse de la réponse Cloudinary"));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error?.message || "Erreur d'upload Cloudinary"));
                    } catch {
                        reject(new Error(`Erreur d'upload (${xhr.status}): ${xhr.statusText}`));
                    }
                }
            };

            xhr.onerror = () => {
                console.error('Network error during fallback upload');
                reject(new Error("Erreur réseau totale (Les deux méthodes ont échoué)"));
            };

            xhr.send(formData);
        });
    }
};
