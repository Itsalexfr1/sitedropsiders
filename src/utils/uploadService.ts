
/**
 * Uploads a file to the internal API (R2) or fallbacks to ImgBB
 */
export const uploadValidation = (file: File): { valid: boolean; error?: string } => {
    if (!file) return { valid: false, error: "Aucun fichier sélectionné." };
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/") && !file.type.startsWith("audio/")) return { valid: false, error: "Le fichier doit être une image, une vidéo ou un fichier audio." };
    if (file.size > 100 * 1024 * 1024) return { valid: false, error: "Le fichier est trop lourd (max 100Mo)." };
    return { valid: true };
};

import { getAuthHeaders } from './auth';

export const uploadFile = async (
    file: File,
    subFolder: string = 'uploads',
    onProgress?: (progress: number) => void
): Promise<string> => {

    // 1. Attempt Server-Side Upload (Preferred - R2, ImgBB, then GitHub)
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const serverUpload = await new Promise<string>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/upload', true);
            xhr.setRequestHeader('Content-Type', 'application/json');

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
                    } catch (err: any) {
                        reject(err);
                    }
                } else {
                    reject(new Error(`Server Error: ${xhr.status}`));
                }
            };

            xhr.onerror = () => reject(new Error("Network Error"));

            xhr.send(JSON.stringify({
                filename: file.name,
                content: base64,
                type: file.type,
                path: subFolder
            }));
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
