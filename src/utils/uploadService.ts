
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

export const uploadToCloudinary = async (
    file: File,
    subFolder: string = 'uploads',
    onProgress?: (progress: number) => void
): Promise<string> => {

    const CLOUD_NAME = 'drd0k6wve'; // Hardcoded for client-side reliability
    const UPLOAD_PRESET = 'dropsiders_unsigned';

    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('folder', `dropsiders/${subFolder}`);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);

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
                    resolve(data.secure_url);
                } catch (err) {
                    reject(new Error("Erreur lors de l'analyse de la réponse Cloudinary"));
                }
            } else {
                try {
                    const error = JSON.parse(xhr.responseText);
                    reject(new Error(error.error?.message || "Erreur d'upload Cloudinary"));
                } catch {
                    reject(new Error(`Erreur d'upload (${xhr.status})`));
                }
            }
        };

        xhr.onerror = () => {
            reject(new Error("Erreur réseau lors de l'upload"));
        };

        xhr.send(formData);
    });
};
