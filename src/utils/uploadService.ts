
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

    const formData = new FormData();
    formData.append('image', file);
    formData.append('path', subFolder);

    return new Promise((resolve, reject) => {
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
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    if (data.success && data.url) {
                        resolve(data.url);
                    } else {
                        reject(new Error(data.error || 'Upload failed'));
                    }
                } catch (err) {
                    console.error('Upload parse error:', err, xhr.responseText);
                    reject(new Error("Erreur lors de l'analyse de la réponse serveur"));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    console.error('Upload error:', error);
                    reject(new Error(error.error || "Erreur d'upload"));
                } catch {
                    console.error('Upload raw error:', xhr.responseText);
                    reject(new Error(`Erreur d'upload (${xhr.status}): ${xhr.statusText}`));
                }
            }
        };

        xhr.onerror = () => {
            console.error('Network error during upload');
            reject(new Error("Erreur réseau lors de l'upload"));
        };

        xhr.send(formData);
    });
};
