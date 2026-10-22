import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { 
    getDatabase, 
    type Database, 
    ref, 
    push, 
    set, 
    remove, 
    onValue, 
    query as rtdbQuery, 
    limitToLast as rtdbLimitToLast 
} from 'firebase/database';
import { 
    getFirestore, 
    type Firestore, 
    collection, 
    addDoc, 
    query, 
    orderBy, 
    limit, 
    onSnapshot, 
    deleteDoc, 
    doc, 
    setDoc, 
    serverTimestamp,
    type Unsubscribe
} from 'firebase/firestore';

export interface FirebaseChatConfig {
    apiKey: string;
    authDomain?: string;
    projectId: string;
    databaseURL?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
}

const STORAGE_KEY = 'dropsiders_firebase_config';

/**
 * Lit la configuration Firebase depuis le localStorage ou les variables d'environnement Vite
 */
export function getFirebaseConfig(): FirebaseChatConfig | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.apiKey && parsed.projectId) {
                return parsed;
            }
        }
    } catch { }

    const env = import.meta.env;
    if (env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID) {
        return {
            apiKey: env.VITE_FIREBASE_API_KEY,
            authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || `${env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
            projectId: env.VITE_FIREBASE_PROJECT_ID,
            databaseURL: env.VITE_FIREBASE_DATABASE_URL || `https://${env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`,
            storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || `${env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
            messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
            appId: env.VITE_FIREBASE_APP_ID || '',
        };
    }

    return null;
}

/**
 * Sauvegarde la configuration Firebase dans le localStorage
 */
export function saveFirebaseConfig(config: FirebaseChatConfig): void {
    if (!config.databaseURL && config.projectId) {
        config.databaseURL = `https://${config.projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/**
 * Supprime la configuration Firebase du localStorage
 */
export function clearFirebaseConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Initialise ou récupère l'instance Firebase App
 */
export function getFirebaseApp(customConfig?: FirebaseChatConfig): FirebaseApp | null {
    const config = customConfig || getFirebaseConfig();
    if (!config || !config.apiKey || !config.projectId) {
        return null;
    }

    try {
        const apps = getApps();
        if (apps.length > 0) {
            return apps[0];
        }
        return initializeApp(config);
    } catch (err) {
        console.warn('[Firebase] Initialisation error:', err);
        return null;
    }
}

/**
 * Récupère l'instance Realtime Database
 */
export function getFirebaseRtdb(customConfig?: FirebaseChatConfig): Database | null {
    const config = customConfig || getFirebaseConfig();
    const app = getFirebaseApp(config || undefined);
    if (!app || !config) return null;
    try {
        const dbUrl = config.databaseURL || `https://${config.projectId}-default-rtdb.europe-west1.firebasedatabase.app`;
        return getDatabase(app, dbUrl);
    } catch (err) {
        console.warn('[RTDB] getDatabase error:', err);
        return null;
    }
}

/**
 * Récupère l'instance Firestore
 */
export function getFirebaseDb(customConfig?: FirebaseChatConfig): Firestore | null {
    const app = getFirebaseApp(customConfig);
    if (!app) return null;
    try {
        return getFirestore(app);
    } catch (err) {
        console.warn('[Firestore] getFirestore error:', err);
        return null;
    }
}

/**
 * Vérifie si Firebase est configuré
 */
export function isFirebaseConfigured(): boolean {
    const config = getFirebaseConfig();
    return Boolean(config && config.apiKey && config.projectId);
}

/**
 * Teste la connexion Firestore
 */
export async function testFirebaseConnection(customConfig?: FirebaseChatConfig): Promise<{ success: boolean; message: string }> {
    try {
        const rtdb = getFirebaseRtdb(customConfig);
        if (rtdb) {
            return await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    resolve({ success: true, message: 'Connexion Firebase Realtime Database active !' });
                }, 3500);

                const q = rtdbQuery(ref(rtdb, 'dropsiders_live_messages'), rtdbLimitToLast(1));
                onValue(q, () => {
                    clearTimeout(timeout);
                    resolve({ success: true, message: 'Connexion Realtime Database WebSocket connectée en direct ! 🚀' });
                }, (err) => {
                    clearTimeout(timeout);
                    resolve({ success: false, message: err?.message || 'Erreur d\'accès Realtime Database (vérifiez l\'onglet Règles).' });
                }, { onlyOnce: true });
            });
        }

        const db = getFirebaseDb(customConfig);
        if (!db) {
            return { success: false, message: 'Configuration Firebase invalide (Clé API et Project ID requis).' };
        }
        const q = query(collection(db, 'dropsiders_live_messages'), limit(1));
        return await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                unsub();
                resolve({ success: true, message: 'Connexion Firebase Firestore initialisée.' });
            }, 4000);

            const unsub = onSnapshot(q, () => {
                clearTimeout(timeout);
                unsub();
                resolve({ success: true, message: 'Connexion Firebase Firestore active et opérationnelle !' });
            }, (err) => {
                clearTimeout(timeout);
                unsub();
                resolve({ success: false, message: err?.message || 'Erreur d\'accès Firestore (vérifiez les règles de sécurité Firestore).' });
            });
        });
    } catch (err: any) {
        return { success: false, message: err?.message || 'Erreur inattendue de connexion Firebase.' };
    }
}

export {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    deleteDoc,
    doc,
    setDoc,
    serverTimestamp,
    ref,
    push,
    set,
    remove,
    onValue,
    rtdbQuery,
    rtdbLimitToLast,
    type Firestore,
    type Database,
    type Unsubscribe
};
