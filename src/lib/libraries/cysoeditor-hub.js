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
        type: response.headers.get('content-type') || 'application/javascript',
        remoteLastModified: response.headers.get('last-modified') || null,
        origin: 'hub'
    };

    await cacheExtensionFile(extensionId, content, metadata);

    return {
        content,
        metadata
    };
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
                const cachedDate = cachedFile.metadata.remoteLastModified ?
                    new Date(cachedFile.metadata.remoteLastModified) : null;
                if (!cachedDate) {
                    return { needsUpdate: false, reason: 'up_to_date' };
                }
                if (remoteDate.getTime() !== cachedDate.getTime()) {
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
                stats.files++;
            } else {
                const freshness = await checkCachedFileForUpdate(id, ext.download_url);
                if (freshness.needsUpdate) {
                    await downloadAndCacheExtension(id, getProxiedUrl(ext.download_url));
                }
                stats.files++;
            }
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
            if (!validIds.has(f.id) && f.metadata && f.metadata.origin === 'hub') {
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
    return (extensions || [])
        .filter(ext => ext && ext.download_url)
        .map((ext, index) => ({
            name: ext.name,
            description: ext.description,
            extensionId: ext.id || `cysoeditor-hub-${index}-${encodeURIComponent(ext.name)}`,
            extensionURL: getProxiedUrl(ext.download_url),
            extensionURLs: getProxiedUrls(ext.download_url),
            downloadUrl: ext.download_url,
            iconURL: getProxiedUrl(ext.cover_url) || defaultIcon,
            tags: ['cysoeditor-hub', ...(ext.category || [])],
            credits: ext.author_name ? [
                {
                    name: ext.author_name,
                    homepage: ext.author_id ? `https://cyscrexthub.cc.cd/user?id=${ext.author_id}` : undefined
                },
                ...(ext.is_repost ? [{ name: '(转载)' }] : [])
            ] : [],
            featured: ext.featured || false,
            showDetails: true,
            version: ext.version,
            updateDate: ext.approved_at || ext.submitted_at,
            key: ext.id || `cysoeditor-hub-${index}-${encodeURIComponent(ext.name)}`,
            href: `https://cyscrexthub.cc.cd/extension?id=${ext.id}`,
            isCyso: ext.is_cyso || false,
            category: ext.category || [],
            authorHomepage: ext.author_id ? `https://cyscrexthub.cc.cd/user?id=${ext.author_id}` : null,
            authorName: ext.author_name,
            fullDescription: ext.description
        }));
};

const fetchExtensions = async () => {
    const candidates = getProxiedUrls(CYSCREXTHUB_CONFIG.EXTENSIONS_JSON_URL);
    let lastError;
    for (const url of candidates) {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                throw new Error(`HTTP status ${res.status}`);
            }
            const data = await res.json();
            if (!Array.isArray(data) && (!data || !Array.isArray(data.extensions))) {
                throw new Error('Invalid extensions metadata format');
            }
            return Array.isArray(data) ? data : data.extensions;
        } catch (e) {
            lastError = e;
            log.warn(`Failed to fetch extensions from ${url}:`, e);
        }
    }
    throw lastError || new Error('All extension metadata sources failed');
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
        
        const cachedExtensions = cachedData ? cachedData.extensions : [];
        const sameIds = cachedExtensions.length === data.length &&
            JSON.stringify(cachedExtensions.map(e => e.id).sort()) ===
            JSON.stringify(data.map(e => e.id).sort());
        const sameNames = JSON.stringify(cachedExtensions.map(e => e.name)) ===
            JSON.stringify(data.map(e => e.name));
        const needsUpdate = !cachedData || !sameIds || !sameNames;
        
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

const CUSTOM_LIBRARY_STORAGE_KEY = 'tw:custom-extension-libraries';

const getCustomLibraries = () => {
    try {
        const raw = localStorage.getItem(CUSTOM_LIBRARY_STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        log.error('Failed to read custom libraries:', e);
        return [];
    }
};

const saveCustomLibraries = libs => {
    try {
        localStorage.setItem(CUSTOM_LIBRARY_STORAGE_KEY, JSON.stringify(libs));
    } catch (e) {
        log.error('Failed to save custom libraries:', e);
    }
};

const addCustomLibrary = lib => {
    const libs = getCustomLibraries();
    const newLib = { ...lib, id: lib.id || `custom-lib-${Date.now()}` };
    libs.push(newLib);
    saveCustomLibraries(libs);
    return newLib;
};

const updateCustomLibrary = (id, patch) => {
    const libs = getCustomLibraries();
    const idx = libs.findIndex(l => l.id === id);
    if (idx >= 0) {
        libs[idx] = { ...libs[idx], ...patch, id };
        saveCustomLibraries(libs);
        return libs[idx];
    }
    return null;
};

const removeCustomLibrary = id => {
    saveCustomLibraries(getCustomLibraries().filter(l => l.id !== id));
};

const runUserJs = async (code, fetchFn, libraryUrl) => {
    const trimmed = String(code || '').trim();
    if (!trimmed) {
        throw new Error('自定义 JS 代码为空');
    }
    let result;
    try {
        const bodyFn = new Function('fetch', 'libraryUrl', `return (async () => {\n${trimmed}\n})();`);
        result = await bodyFn(fetchFn, libraryUrl);
        if (result === undefined) {
            const exprFn = new Function('fetch', 'libraryUrl', `return (${trimmed});`);
            result = await exprFn(fetchFn, libraryUrl);
        }
    } catch (e) {
        throw new Error(`自定义 JS 执行失败：${e && e.message ? e.message : e}`);
    }
    if (result === undefined || result === null) {
        throw new Error('自定义 JS 未返回数据，需 return 官方结构的 extensions 数组');
    }
    return result;
};

const extractStandardArray = raw => {
    if (Array.isArray(raw)) return raw;
    if (!raw) return [];
    for (const key of ['extensions', 'data', 'items', 'list', 'result', 'results']) {
        if (Array.isArray(raw[key])) return raw[key];
    }
    return [];
};

const getByPath = (obj, path) => {
    if (obj == null) return undefined;
    const parts = String(path).replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
    let cur = obj;
    for (const p of parts) {
        if (cur == null) return undefined;
        cur = cur[p];
    }
    return cur;
};

const pickTranslation = (item, keyPrefix, locale) => {
    if (!locale) return undefined;
    const candidates = [String(locale), String(locale).toLowerCase(), String(locale).split('-')[0]];
    for (const c of candidates) {
        const v = getByPath(item, `${keyPrefix}.${c}`);
        if (v !== undefined && v !== null) return v;
    }
    return undefined;
};

const normalizeRawExtensions = (raw, fieldMapping, locale, localize) => {
    const list = extractStandardArray(raw);
    const fm = fieldMapping || {};
    const useTranslations = localize !== false;
    const nameTransKey = (fm.name_translations && typeof fm.name_translations === 'string' && fm.name_translations.trim()) ? fm.name_translations.trim() : 'nameTranslations';
    const descTransKey = (fm.description_translations && typeof fm.description_translations === 'string' && fm.description_translations.trim()) ? fm.description_translations.trim() : 'descriptionTranslations';
    const value = (obj, key, ...fallbacks) => {
        if (typeof key === 'string' && key.trim() !== '') {
            return getByPath(obj, key);
        }
        for (const f of fallbacks) {
            const v = getByPath(obj, f);
            if (v !== undefined && v !== null) return v;
        }
        return undefined;
    };
    return list.map(item => {
        const baseName = value(item, fm.name, 'name');
        const baseDesc = value(item, fm.description, 'description');
        const by = value(item, fm.by, 'by');
        const original = value(item, fm.original, 'original');
        return {
            id: value(item, fm.id, 'id'),
            slug: value(item, fm.slug, 'slug'),
            name: useTranslations ? (pickTranslation(item, nameTransKey, locale) ?? baseName) : baseName,
            description: useTranslations ? (pickTranslation(item, descTransKey, locale) ?? baseDesc) : baseDesc,
            image: value(item, fm.image, 'image'),
            by: Array.isArray(by) ? by : undefined,
            original: Array.isArray(original) ? original : undefined,
            docs: value(item, fm.docs, 'docs'),
            samples: value(item, fm.samples, 'samples'),
            scratchCompatible: value(item, fm.scratchCompatible, 'scratchCompatible')
        };
    });
};

const getLibraryBaseUrl = libraryUrl => {
    if (!libraryUrl || typeof libraryUrl !== 'string') return '';
    const marker = '/generated-metadata/';
    const idx = libraryUrl.indexOf(marker);
    if (idx > 0) return libraryUrl.slice(0, idx);
    return libraryUrl.slice(0, libraryUrl.lastIndexOf('/'));
};

const resolveLibraryUrl = (baseUrl, path) => {
    if (!path) return null;
    if (/^(https?:|data:)/i.test(path)) return path;
    return `${baseUrl ? `${baseUrl}/` : ''}${String(path).replace(/^\//, '')}`;
};

const normalizeCredits = list => (list || [])
    .map(c => {
        if (typeof c === 'string') return {name: c};
        if (c && c.name) return {name: c.name, homepage: c.link || c.homepage};
        return null;
    })
    .filter(Boolean);

const mapStandardToLibraryItems = (standardArray, sourceConfig) => {
    const sourceId = sourceConfig.sourceId;
    const baseUrl = getLibraryBaseUrl(sourceConfig.libraryUrl);
    const iconFallback = sourceConfig.iconFallback || null;
    return extractStandardArray(standardArray)
        .filter(item => item && item.id != null && item.name)
        .map(item => {
            const slug = item.slug || item.id;
            const downloadUrl = resolveLibraryUrl(baseUrl, `${slug}.js`);
            const cover = item.image ? resolveLibraryUrl(baseUrl, item.image) : null;
            const docsUrl = item.docs ? resolveLibraryUrl(baseUrl, `${slug}`) : null;
            const samples = Array.isArray(item.samples) ? item.samples.map(sample =>
                typeof sample === 'string' ? {
                    href: resolveLibraryUrl(baseUrl, `samples/${sample}.sb3`),
                    text: sample
                } : sample
            ) : null;
            const credits = normalizeCredits([
                ...(Array.isArray(item.original) ? item.original : []),
                ...(Array.isArray(item.by) ? item.by : [])
            ]);
            return {
                name: String(item.name),
                description: item.description ? String(item.description) : '',
                extensionId: `${sourceId}-${item.id}`,
                extensionURL: getProxiedUrl(downloadUrl),
                extensionURLs: getProxiedUrls(downloadUrl),
                downloadUrl: downloadUrl,
                iconURL: cover ? getProxiedUrl(cover) : iconFallback,
                tags: ['custom-library', sourceId],
                credits: credits,
                featured: false,
                showDetails: true,
                incompatibleWithScratch: item.scratchCompatible === false,
                key: `${sourceId}-${item.id}`,
                href: docsUrl,
                isCyso: false,
                samples: samples,
                sourceName: sourceConfig.sourceName
            };
        });
};

const fetchAndParseLibrary = async (libConfig, iconFallback, locale) => {
    const sourceConfig = {
        sourceId: libConfig.id,
        sourceName: libConfig.name,
        libraryUrl: libConfig.url,
        iconFallback: iconFallback || null
    };
    let standardArray;
    if (libConfig.type === 'js') {
        const raw = await runUserJs(libConfig.code, fetch, libConfig.url);
        if (!extractStandardArray(raw).length) {
            throw new Error('自定义 JS 返回的数据中未找到扩展数组，需 return 数组或 { "extensions": [...] }');
        }
        standardArray = raw;
    } else {
        const res = await fetch(libConfig.url);
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
        }
        const raw = await res.json();
        standardArray = normalizeRawExtensions(raw, libConfig.fieldMapping, locale, libConfig.localize);
    }
    return mapStandardToLibraryItems(standardArray, sourceConfig);
};

export {
    CYSCREXTHUB_CONFIG,
    getProxiedUrl,
    getProxiedUrls,
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
    checkCachedFileForUpdate,
    clearAllCachedFiles,
    cacheCover,
    getCachedCover,
    getAllCachedCovers,
    deleteCachedCover,
    syncCache,
    getCustomLibraries,
    addCustomLibrary,
    updateCustomLibrary,
    removeCustomLibrary,
    fetchAndParseLibrary,
    mapStandardToLibraryItems
};
