import log from '../log';

const CYSCREXTHUB_CONFIG = {
    STORAGE_KEY: 'tw:cysoeditor-hub-extensions',
    PROXY_URL: 'https://gh-proxy.org/',
    EXTENSIONS_JSON_URL: 'https://raw.githubusercontent.com/cy-studio-001/CYScrExtHub/main/extensions.json',
    DB_NAME: 'cysoeditor-hub-extensions',
    DB_VERSION: 2,
    DB_STORE_NAME: 'extension-files',
    DB_STORE_COVERS: 'extension-covers'
};

let dbInstance = null;

const initDB = () => {
    return new Promise((resolve, reject) => {
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(CYSCREXTHUB_CONFIG.DB_NAME, CYSCREXTHUB_CONFIG.DB_VERSION);

        request.onerror = () => {
            log.error('Failed to open IndexedDB:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(CYSCREXTHUB_CONFIG.DB_STORE_NAME)) {
                const store = db.createObjectStore(CYSCREXTHUB_CONFIG.DB_STORE_NAME, { keyPath: 'id' });
                store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (!db.objectStoreNames.contains(CYSCREXTHUB_CONFIG.DB_STORE_COVERS)) {
                const coverStore = db.createObjectStore(CYSCREXTHUB_CONFIG.DB_STORE_COVERS, { keyPath: 'id' });
                coverStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
};

const cacheExtensionFile = async (extensionId, content, metadata = {}) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_NAME);

            const data = {
                id: extensionId,
                content: content,
                metadata: {
                    ...metadata,
                    cachedAt: new Date().toISOString()
                },
                timestamp: Date.now()
            };

            const request = store.put(data);

            request.onsuccess = () => {
                updateCachedFilesIndex(extensionId, metadata);
                resolve(true);
            };

            request.onerror = () => {
                log.error('Failed to cache extension file:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to cache extension file:', error);
        throw error;
    }
};

const getCachedExtensionFile = async extensionId => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_NAME);
            const request = store.get(extensionId);

            request.onsuccess = () => {
                resolve(request.result || null);
            };

            request.onerror = () => {
                log.error('Failed to get cached extension file:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to get cached extension file:', error);
        return null;
    }
};

const deleteCachedExtensionFile = async extensionId => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_NAME);
            const request = store.delete(extensionId);

            request.onsuccess = () => {
                removeCachedFilesIndex(extensionId);
                resolve(true);
            };

            request.onerror = () => {
                log.error('Failed to delete cached extension file:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to delete cached extension file:', error);
        throw error;
    }
};

const getAllCachedExtensions = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_NAME], 'readonly');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result || []);
            };

            request.onerror = () => {
                log.error('Failed to get all cached extensions:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to get all cached extensions:', error);
        return [];
    }
};

const downloadAndCacheExtension = async (extensionId, url) => {
    const proxiedUrl = getProxiedUrl(url);
    
    const response = await fetch(proxiedUrl);
    if (!response.ok) {
        throw new Error(`HTTP status ${response.status}`);
    }

    const content = await response.arrayBuffer();
    const metadata = {
        url: url,
        size: content.byteLength,
        type: response.headers.get('content-type') || 'application/javascript'
    };

    await cacheExtensionFile(extensionId, content, metadata);

    return {
        content,
        metadata
    };
};

const updateCachedFilesIndex = (extensionId, metadata) => {
    try {
        const cachedData = getCache();
        const cachedFiles = cachedData?.cachedFiles || {};
        cachedFiles[extensionId] = {
            ...metadata,
            cachedAt: new Date().toISOString()
        };
        
        localStorage.setItem(CYSCREXTHUB_CONFIG.STORAGE_KEY, JSON.stringify({
            ...cachedData,
            cachedFiles,
            lastUpdated: cachedData?.lastUpdated || new Date().toISOString(),
            count: cachedData?.count || 0
        }));
    } catch (e) {
        log.error('Failed to update cached files index:', e);
    }
};

const removeCachedFilesIndex = extensionId => {
    try {
        const cachedData = getCache();
        if (cachedData?.cachedFiles) {
            delete cachedData.cachedFiles[extensionId];
            localStorage.setItem(CYSCREXTHUB_CONFIG.STORAGE_KEY, JSON.stringify(cachedData));
        }
    } catch (e) {
        log.error('Failed to remove cached files index:', e);
    }
};

const getCachedFilesIndex = () => {
    const cachedData = getCache();
    return cachedData?.cachedFiles || {};
};

const checkCachedFileForUpdate = async (extensionId, remoteUrl) => {
    const cachedFile = await getCachedExtensionFile(extensionId);
    if (!cachedFile) {
        return { needsUpdate: true, reason: 'not_cached' };
    }

    try {
        const proxiedUrl = getProxiedUrl(remoteUrl);
        const headResponse = await fetch(proxiedUrl, { method: 'HEAD' });
        
        if (headResponse.ok) {
            const lastModified = headResponse.headers.get('last-modified');
            const contentLength = headResponse.headers.get('content-length');
            
            if (lastModified) {
                const remoteDate = new Date(lastModified);
                const cachedDate = new Date(cachedFile.metadata.cachedAt);
                if (remoteDate > cachedDate) {
                    return { needsUpdate: true, reason: 'remote_newer' };
                }
            }
            
            if (contentLength && cachedFile.metadata.size) {
                if (parseInt(contentLength, 10) !== cachedFile.metadata.size) {
                    return { needsUpdate: true, reason: 'size_changed' };
                }
            }
        }
        
        return { needsUpdate: false, reason: 'up_to_date' };
    } catch (error) {
        log.error('Failed to check for updates:', error);
        return { needsUpdate: false, reason: 'check_failed', error };
    }
};

const clearAllCachedFiles = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_NAME], 'readwrite');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_NAME);
            const request = store.clear();

            request.onsuccess = () => {
                try {
                    const cachedData = getCache();
                    if (cachedData) {
                        cachedData.cachedFiles = {};
                        localStorage.setItem(CYSCREXTHUB_CONFIG.STORAGE_KEY, JSON.stringify(cachedData));
                    }
                } catch (e) {
                    log.error('Failed to clear cached files index:', e);
                }
                resolve(true);
            };

            request.onerror = () => {
                log.error('Failed to clear cached files:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to clear cached files:', error);
        throw error;
    }
};

const cacheCover = async (extensionId, blob, type) => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_COVERS], 'readwrite');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_COVERS);
            const data = {
                id: extensionId,
                blob: blob,
                type: type || 'image/*',
                timestamp: Date.now()
            };
            const request = store.put(data);
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                log.error('Failed to cache cover:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to cache cover:', error);
        throw error;
    }
};

const getCachedCover = async extensionId => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_COVERS], 'readonly');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_COVERS);
            const request = store.get(extensionId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
                log.error('Failed to get cached cover:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to get cached cover:', error);
        return null;
    }
};

const getAllCachedCovers = async () => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_COVERS], 'readonly');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_COVERS);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => {
                log.error('Failed to get all cached covers:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to get all cached covers:', error);
        return [];
    }
};

const deleteCachedCover = async extensionId => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([CYSCREXTHUB_CONFIG.DB_STORE_COVERS], 'readwrite');
            const store = transaction.objectStore(CYSCREXTHUB_CONFIG.DB_STORE_COVERS);
            const request = store.delete(extensionId);
            request.onsuccess = () => resolve(true);
            request.onerror = () => {
                log.error('Failed to delete cached cover:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        log.error('Failed to delete cached cover:', error);
        throw error;
    }
};

const downloadCover = async (extensionId, coverUrl) => {
    const candidates = getProxiedUrls(coverUrl);
    for (const url of candidates) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                continue;
            }
            const blob = await res.blob();
            const type = res.headers.get('content-type') || 'image/*';
            await cacheCover(extensionId, blob, type);
            return true;
        } catch (e) {
        }
    }
    return false;
};

const syncCache = async extensions => {
    const stats = { files: 0, covers: 0, errors: 0, removed: 0 };
    const validIds = new Set();

    for (const ext of (extensions || [])) {
        const id = ext.id;
        if (!id) {
            continue;
        }
        validIds.add(id);

        try {
            const existing = await getCachedExtensionFile(id);
            if (!existing) {
                await downloadAndCacheExtension(id, getProxiedUrl(ext.download_url));
            }
            stats.files++;
        } catch (e) {
            stats.errors++;
            log.error(`Failed to cache extension file for ${id}:`, e);
        }

        try {
            if (ext.cover_url) {
                const existingCover = await getCachedCover(id);
                if (!existingCover) {
                    const ok = await downloadCover(id, ext.cover_url);
                    if (ok) {
                        stats.covers++;
                    }
                } else {
                    stats.covers++;
                }
            }
        } catch (e) {
            stats.errors++;
            log.error(`Failed to cache cover for ${id}:`, e);
        }
    }

    try {
        const allFiles = await getAllCachedExtensions();
        for (const f of allFiles) {
            if (!validIds.has(f.id)) {
                await deleteCachedExtensionFile(f.id);
                stats.removed++;
            }
        }
        const allCovers = await getAllCachedCovers();
        for (const c of allCovers) {
            if (!validIds.has(c.id)) {
                await deleteCachedCover(c.id);
            }
        }
    } catch (e) {
        log.error('Failed to clean removed extension caches:', e);
    }

    return stats;
};

const PROXY_URLS = [
    'https://gh-proxy.org/',
    'https://ghproxy.net/',
    'https://mirror.ghproxy.com/',
    ''
];

const buildProxiedCandidates = url => {
    if (!url) return [url];
    if (url.includes(CYSCREXTHUB_CONFIG.PROXY_URL)) {
        return [url];
    }
    const encodedUrl = encodeURI(url);
    if (!encodedUrl.startsWith('http://') && !encodedUrl.startsWith('https://')) {
        return [encodedUrl];
    }
    if (encodedUrl.includes('githubusercontent.com') ||
        encodedUrl.includes('github.com')) {
        return PROXY_URLS.map(prefix => `${prefix}${encodedUrl}`);
    }
    return [encodedUrl];
};

const getProxiedUrl = url => buildProxiedCandidates(url)[0];

const getProxiedUrls = url => buildProxiedCandidates(url);

const getExtensionsJsonUrl = () => {
    if (CYSCREXTHUB_CONFIG.EXTENSIONS_JSON_URL.includes(CYSCREXTHUB_CONFIG.PROXY_URL)) {
        return CYSCREXTHUB_CONFIG.EXTENSIONS_JSON_URL;
    }
    return `${CYSCREXTHUB_CONFIG.PROXY_URL}${CYSCREXTHUB_CONFIG.EXTENSIONS_JSON_URL}`;
};

const getCache = () => {
    try {
        const cached = localStorage.getItem(CYSCREXTHUB_CONFIG.STORAGE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (e) {
        log.error('Failed to read CYSCREXTHUB cache:', e);
    }
    return null;
};

const setCache = data => {
    try {
        localStorage.setItem(CYSCREXTHUB_CONFIG.STORAGE_KEY, JSON.stringify({
            extensions: data,
            lastUpdated: new Date().toISOString(),
            count: data.length
        }));
    } catch (e) {
        log.error('Failed to write CYSCREXTHUB cache:', e);
    }
};

const mapToLibraryFormat = (extensions, defaultIcon) => {
    return extensions.map((ext, index) => ({
        name: ext.name,
        description: ext.description,
        extensionId: ext.id || `cysoeditor-hub-${index}-${encodeURIComponent(ext.name)}`,
        extensionURL: getProxiedUrl(ext.download_url),
        extensionURLs: getProxiedUrls(ext.download_url),
        iconURL: getProxiedUrl(ext.cover_url) || defaultIcon,
        tags: ['cysoeditor-hub', ...(ext.category || [])],
        credits: ext.author_name ? [
            {
                name: ext.author_name,
                id: ext.author_id
            },
            ...(ext.is_repost ? [{ name: '(转载)' }] : [])
        ] : [],
        featured: true,
        version: ext.version,
        updateDate: ext.approved_at || ext.submitted_at,
        key: ext.id || `cysoeditor-hub-${index}-${encodeURIComponent(ext.name)}`,
        href: `https://cyscrexthub.cc.cd/extension?id=${ext.id}`,
        isCyso: ext.is_cyso || false,
        category: ext.category || [],
        authorId: ext.author_id,
        authorName: ext.author_name,
        fullDescription: ext.description
    }));
};

const fetchExtensions = async () => {
    const url = getExtensionsJsonUrl();
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
    }
    const data = await res.json();
    return data;
};

const checkForUpdates = async (onUpdate) => {
    const cachedData = getCache();
    
    if (!navigator.onLine) {
        return {
            extensions: cachedData ? cachedData.extensions : [],
            isOffline: true,
            lastUpdated: cachedData ? cachedData.lastUpdated : null,
            count: cachedData ? cachedData.count : 0
        };
    }
    
    try {
        const data = await fetchExtensions();
        
        const needsUpdate = !cachedData || 
            cachedData.count !== data.length ||
            JSON.stringify(cachedData.extensions.map(e => e.name)) !== 
            JSON.stringify(data.map(e => e.name));
        
        if (needsUpdate) {
            setCache(data);
            if (onUpdate) {
                onUpdate(data);
            }
        }
        
        return {
            extensions: data,
            isOffline: false,
            lastUpdated: cachedData && !needsUpdate ? cachedData.lastUpdated : new Date().toISOString(),
            count: data.length,
            updated: needsUpdate
        };
    } catch (error) {
        log.error('CYSCREXTHUB fetch error:', error);
        return {
            extensions: cachedData ? cachedData.extensions : [],
            isOffline: false,
            error: error,
            lastUpdated: cachedData ? cachedData.lastUpdated : null,
            count: cachedData ? cachedData.count : 0
        };
    }
};

const getCachedExtensions = () => {
    const cachedData = getCache();
    if (cachedData) {
        return {
            extensions: cachedData.extensions,
            lastUpdated: cachedData.lastUpdated,
            count: cachedData.count
        };
    }
    return {
        extensions: [],
        lastUpdated: null,
        count: 0
    };
};

export {
    CYSCREXTHUB_CONFIG,
    getProxiedUrl,
    getProxiedUrls,
    getExtensionsJsonUrl,
    getCache,
    setCache,
    mapToLibraryFormat,
    fetchExtensions,
    checkForUpdates,
    getCachedExtensions,
    initDB,
    cacheExtensionFile,
    getCachedExtensionFile,
    deleteCachedExtensionFile,
    getAllCachedExtensions,
    downloadAndCacheExtension,
    getCachedFilesIndex,
    checkCachedFileForUpdate,
    clearAllCachedFiles,
    cacheCover,
    getCachedCover,
    getAllCachedCovers,
    deleteCachedCover,
    syncCache
};
