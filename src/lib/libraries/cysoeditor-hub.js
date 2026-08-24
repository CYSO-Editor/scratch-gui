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
        remoteLastModified: response.headers.get('last-modified') || null
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
                if (!cachedDate || remoteDate.getTime() !== cachedDate.getTime()) {
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

const CUSTOM_LIBRARY_STANDARD_SCHEMA = [
    '标准扩展库 JSON 结构（自定义 JS 需返回此结构）：',
    '',
    '{',
    '  "extensions": [',
    '    {',
    '      "id": "ext_001",              // 必需：扩展唯一ID，用于拼接文件/封面地址',
    '      "name": "扩展名称",           // 必需',
    '      "description": "扩展简介",    // 可选',
    '      "author": "作者名",           // 可选',
    '      "author_homepage": "作者主页URL（可选，提供后作者名可点击跳转）", // 可选',
    '      "cover": "封面完整URL",       // 可选：省略则使用封面模板 {id}.png',
    '      "download_url": "扩展JS完整URL", // 可选：省略则使用文件模板 {id}.js',
    '      "category": ["分类1", "分类2"],   // 可选',
    '      "version": "1.0.0",          // 可选',
    '      "href": "详情页URL"           // 可选',
    '    }',
    '  ]',
    '}',
    '',
    '说明：',
    '1. 顶层也可以是直接数组 [ {...}, {...} ]。',
    '2. 手动绑定：在“字段映射”中填写源JSON里对应的字段名（如源里ID字段叫 ext_id，则填写 ext_id）。',
    '3. 下载地址与封面图片，在“字段名”与“地址模板”中二选一填写：',
    '   · 使用字段名：读取源JSON里该字段的值作为完整URL；',
    '   · 使用地址模板：模板支持 {字段名} 占位符，用源JSON中各字段的值替换，例如 https://extensions.bilup.org/{id}.js 或 https://cdn.example.com/{image}',
    '4. 自定义JS：编写一段代码（函数体或返回函数），通过 fetch 拉取数据并返回上面的标准结构。'
].join('\n');

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
    try {
        const bodyFn = new Function('fetch', 'libraryUrl', `return (async () => { ${code} })();`);
        const result = await bodyFn(fetchFn, libraryUrl);
        if (result !== undefined) return result;
    } catch (e) {
        log.warn('Custom library JS (body mode) failed, trying function mode:', e);
    }
    const exprFn = new Function('fetch', 'libraryUrl', `return (${code})(fetch, libraryUrl);`);
    return await exprFn(fetchFn, libraryUrl);
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
        return {
            id: value(item, fm.id, 'id'),
            name: useTranslations ? (pickTranslation(item, nameTransKey, locale) ?? baseName) : baseName,
            description: useTranslations ? (pickTranslation(item, descTransKey, locale) ?? baseDesc) : baseDesc,
            author: value(item, fm.author, 'author', 'by.0.name'),
            author_homepage: value(item, fm.author_homepage, 'author_homepage', 'by.0.link'),
            cover: value(item, fm.cover, 'cover'),
            download_url: value(item, fm.download_url, 'download_url'),
            category: value(item, fm.category, 'category'),
            version: value(item, fm.version, 'version'),
            href: value(item, fm.href, 'href'),
            _raw: item
        };
    });
};

const applyUrlTemplates = (item, fileTemplate, coverTemplate, downloadMode, coverMode) => {
    const id = item.id;
    const vars = { ...(item && item._raw), ...item };
    delete vars._raw;
    const fill = template => {
        if (!template) return template;
        return template.replace(/\{([^}]+)\}/g, (match, key) => {
            const val = key === 'id' ? id : vars[key];
            if (val === undefined || val === null) return match;
            return String(val);
        });
    };
    let download_url = item.download_url;
    if (!download_url && fileTemplate && id != null && downloadMode !== 'field') {
        download_url = fill(fileTemplate);
    }
    let cover = item.cover;
    if (!cover && coverTemplate && id != null && coverMode !== 'field') {
        cover = fill(coverTemplate);
    }
    return { ...item, download_url, cover };
};

const mapStandardToLibraryItems = (standardArray, sourceConfig) => {
    const sourceId = sourceConfig.sourceId;
    const sourceName = sourceConfig.sourceName;
    const fileTemplate = sourceConfig.fileTemplate;
    const coverTemplate = sourceConfig.coverTemplate;
    const downloadMode = sourceConfig.downloadMode;
    const coverMode = sourceConfig.coverMode;
    const iconFallback = sourceConfig.iconFallback || null;
    return extractStandardArray(standardArray)
        .filter(item => item && item.id != null && item.name)
        .map(item => {
            const t = applyUrlTemplates(item, fileTemplate, coverTemplate, downloadMode, coverMode);
            const id = String(t.id);
            const name = String(t.name);
            const description = t.description ? String(t.description) : '';
            const author = t.author ? String(t.author) : '';
            const authorHomepage = t.author_homepage != null ? String(t.author_homepage) : null;
            const downloadUrl = t.download_url || null;
            const cover = t.cover || null;
            const categories = Array.isArray(t.category) ? t.category.map(String) : [];
            return {
                name: name,
                description: description,
                extensionId: `${sourceId}-${id}`,
                extensionURL: downloadUrl ? getProxiedUrl(downloadUrl) : null,
                extensionURLs: downloadUrl ? getProxiedUrls(downloadUrl) : [],
                downloadUrl: downloadUrl,
                iconURL: cover ? getProxiedUrl(cover) : iconFallback,
                tags: ['custom-library', sourceId, ...categories],
                credits: author ? [{ name: author, homepage: authorHomepage }] : [],
                featured: false,
                showDetails: true,
                version: t.version ? String(t.version) : null,
                updateDate: t.updateDate || t.updated_at || null,
                key: `${sourceId}-${id}`,
                href: t.href || null,
                isCyso: false,
                category: categories,
                authorHomepage: authorHomepage,
                authorName: author,
                fullDescription: description,
                sourceName: sourceName
            };
        });
};

const fetchAndParseLibrary = async (libConfig, iconFallback, locale) => {
    const sourceConfig = {
        sourceId: libConfig.id,
        sourceName: libConfig.name,
        fileTemplate: libConfig.fileTemplate,
        coverTemplate: libConfig.coverTemplate,
        downloadMode: libConfig.downloadMode,
        coverMode: libConfig.coverMode,
        iconFallback: iconFallback || null
    };
    let standardArray;
    if (libConfig.type === 'js') {
        standardArray = await runUserJs(libConfig.code, fetch, libConfig.url);
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
    mapStandardToLibraryItems,
    CUSTOM_LIBRARY_STANDARD_SCHEMA
};
