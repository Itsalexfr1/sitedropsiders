
/**
 * Uploads a file to the internal API (R2) or fallbacks to ImgBB
 */
export const uploadValidation = (file: File): { valid: boolean; error?: string } => {
    if (!file) return { valid: false, error: "Aucun fichier sélectionné." };
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/")) return { valid: false, error: "Le fichier doit être une image, une vidéo ou un fichier audio." };
    
    // Increased size limit to 600MB to allow large video files
    const limit = file.type.startsWith("video/") ? 600 * 1024 * 1024 : 500 * 1024 * 1024;
    const limitLabel = file.type.startsWith("video/") ? "600Mo" : "500Mo";
    if (file.size > limit) return { valid: false, error: `Le fichier est trop lourd (max ${limitLabel}).` };
    
    return { valid: true };
};

import { getAuthHeaders } from './auth';

/**
 * Uploads a file using chunked R2 multipart upload (best for large files > 50MB)
 */
export const uploadMultipartFile = async (
    file: File,
    subFolder: string = 'uploads',
    onProgress?: (progress: number) => void
): Promise<string> => {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    
    // 1. Start multipart upload
    const startRes = await fetch('/api/upload/multipart/start', {
        method: 'POST',
        headers: {
            ...getAuthHeaders(null),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            filename: file.name,
            type: file.type,
            path: subFolder
        })
    });
    
    if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur d'initialisation multipart: ${startRes.status}`);
    }
    
    const { uploadId, key } = await startRes.json();
    const uploadedParts: { partNumber: number; etag: string }[] = [];
    
    // 2. Upload chunks sequentially
    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
        const startByte = (partNumber - 1) * CHUNK_SIZE;
        const endByte = Math.min(partNumber * CHUNK_SIZE, file.size);
        const chunkBlob = file.slice(startByte, endByte);
        
        // Retry mechanism for each part upload
        let attempts = 0;
        const maxAttempts = 3;
        let partEtag = '';
        
        while (attempts < maxAttempts) {
            try {
                const partUrl = `/api/upload/multipart/part?uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(key)}&partNumber=${partNumber}`;
                const partRes = await fetch(partUrl, {
                    method: 'POST',
                    headers: {
                        ...getAuthHeaders(null),
                        'Content-Type': 'application/octet-stream'
                    },
                    body: chunkBlob
                });
                
                if (!partRes.ok) {
                    throw new Error(`Morceau ${partNumber} rejeté: ${partRes.status}`);
                }
                
                const data = await partRes.json();
                partEtag = data.etag;
                break; // success
            } catch (err) {
                attempts++;
                if (attempts >= maxAttempts) {
                    throw err; // fail after max attempts
                }
                // Backoff delay before retry
                await new Promise(r => setTimeout(r, 1000 * attempts));
            }
        }
        
        uploadedParts.push({ partNumber, etag: partEtag });
        
        // Report progress
        if (onProgress) {
            const percent = Math.round((partNumber / totalChunks) * 100);
            onProgress(percent);
        }
    }
    
    // 3. Complete multipart upload
    const completeRes = await fetch('/api/upload/multipart/complete', {
        method: 'POST',
        headers: {
            ...getAuthHeaders(null),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            uploadId,
            key,
            parts: uploadedParts
        })
    });
    
    if (!completeRes.ok) {
        const errData = await completeRes.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur de finalisation multipart: ${completeRes.status}`);
    }
    
    const completeData = await completeRes.json();
    if (completeData.success && completeData.url) {
        return completeData.url.startsWith('/uploads')
            ? `https://dropsiders.fr${completeData.url}`
            : completeData.url;
    } else {
        throw new Error("L'assemblage final du fichier a échoué.");
    }
};

export const uploadFile = async (
    file: File,
    subFolder: string = 'uploads',
    onProgress?: (progress: number) => void
): Promise<string> => {

    // 1. Attempt Server-Side Upload (Preferred - R2, ImgBB, then GitHub)
    try {
        const serverUpload = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            const url = `/api/upload?filename=${encodeURIComponent(file.name)}&type=${encodeURIComponent(file.type)}&path=${encodeURIComponent(subFolder)}`;
            xhr.open('POST', url, true);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

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
                            const finalUrl = data.url.startsWith('/uploads') 
                                ? `https://dropsiders.fr${data.url}` 
                                : data.url;
                            resolve(finalUrl);
                        } else {
                            reject(new Error(data.error || 'Upload failed'));
                        }
                    } catch (err: any) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`Server Error: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error("Network Error"));

            xhr.send(file);
        });

        return serverUpload;

    } catch (serverError: any) {
        console.warn('Server upload failed (R2/Internal), switching to client-side fallback (ImgBB)...', serverError);

        // 2. Client-Side Fallback (ImgBB) - only for images, ImgBB cannot host audio/video
        const IMGBB_KEY = (window as any).VITE_IMGBB_API_KEY;

        if (IMGBB_KEY && file.type.startsWith('image/')) {
            return new Promise((resolve, reject) => {
                const url = `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`;
                const formData = new FormData();
                formData.append('image', file);

                const xhr = new XMLHttpRequest();
                xhr.open('POST', url, true);

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const data = JSON.parse(xhr.responseText);
                            if (data.success) {
                                resolve(data.data.url);
                            } else {
                                reject(new Error("Réponse ImgBB invalide"));
                            }
                        } catch (err) {
                            reject(new Error("Erreur analyse ImgBB"));
                        }
                    } else {
                        reject(new Error(`Erreur ImgBB: ${xhr.status}`));
                    }
                };
                xhr.onerror = () => reject(new Error("Erreur réseau ImgBB"));
                xhr.send(formData);
            });
        }

        if (file.type.startsWith('audio/')) {
            throw new Error("L'upload audio nécessite le stockage R2. Vérifiez la configuration du serveur.");
        }

        throw new Error("Toutes les méthodes d'upload ont échoué (R2 et ImgBB). Vérifiez vos configurations.");
    }
};
