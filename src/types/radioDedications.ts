export interface RadioDedication {
    id: string;
    author: string;
    location?: string;
    message: string;
    timestamp: number;
    status: 'new' | 'on_air' | 'archived';
    isPinned?: boolean;
}

export interface RecordedRadioShow {
    id: string;
    title: string;
    date: string;
    durationSeconds: number;
    fileBlobUrl?: string;
    fileSizeFormatted?: string;
    mimeType: string;
    timestamp: number;
}
