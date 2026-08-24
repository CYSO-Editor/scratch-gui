import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import VM from 'scratch-vm';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import log from '../lib/log';
import LazyScratchBlocks from '../lib/tw-lazy-scratch-blocks';

import extensionLibraryContent, {
    galleryError,
    galleryLoading,
    galleryMore
} from '../lib/libraries/extensions/index.jsx';
import {
    mapToLibraryFormat,
    checkForUpdates,
    getCachedExtensions,
    getAllCachedExtensions,
    getCachedExtensionFile,
    cacheExtensionFile,
    getAllCachedCovers,
    syncCache,
    checkCachedFileForUpdate,
    downloadAndCacheExtension,
    getProxiedUrl,
    CYSCREXTHUB_CONFIG,
    getCustomLibraries,
    fetchAndParseLibrary
} from '../lib/libraries/cysoeditor-hub';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';
import cysoeditorHubIcon from '../components/action-menu/icon--cysoeditor-hub.svg';
import CustomLibraryModal from './custom-library-modal.jsx';
import CysoDialog from '../components/cyso-dialog/cyso-dialog.jsx';

const messages = defineMessages({
    extensionTitle: {
        defaultMessage: 'Choose an Extension',
        description: 'Heading for the extension library',
        id: 'gui.extensionLibrary.chooseAnExtension'
    },
    cysoeditorHubLoading: {
        defaultMessage: 'CYSCREXTHUB Extension Gallery',
        description: 'Name of CYSCREXTHUB extension gallery in extension library',
        id: 'tw.cysoeditorHub.name'
    },
    cacheStatusCached: {
        defaultMessage: 'Cached',
        description: 'Cache status: cached',
        id: 'tw.cysoeditorHub.cacheStatus.cached'
    },
    cacheStatusNotCached: {
        defaultMessage: 'Not cached',
        description: 'Cache status: not cached',
        id: 'tw.cysoeditorHub.cacheStatus.notCached'
    },
    cacheStatusUpdating: {
        defaultMessage: 'Updating...',
        description: 'Cache status: updating',
        id: 'tw.cysoeditorHub.cacheStatus.updating'
    },
    onlineStatus: {
        defaultMessage: 'Online',
        description: 'Network status: online',
        id: 'tw.cysoeditorHub.status.online'
    },
    offlineStatus: {
        defaultMessage: 'Offline',
        description: 'Network status: offline',
        id: 'tw.cysoeditorHub.status.offline'
    },
    lastUpdated: {
        defaultMessage: 'Last updated: {date}',
        description: 'Last updated time',
        id: 'tw.cysoeditorHub.lastUpdated'
    },
    extensionCount: {
        defaultMessage: '{count} extensions',
        description: 'Extension count',
        id: 'tw.cysoeditorHub.extensionCount'
    },
    loadedCount: {
        defaultMessage: '{count} loaded',
        description: 'Currently loaded extensions count',
        id: 'tw.cysoeditorHub.loadedCount'
    },
    hubWelcomeTitle: {
        defaultMessage: '欢迎使用 CYSCREXTHUB 扩展库！这里汇集了丰富的扩展资源。',
        description: 'Welcome title for CYSCREXTHUB extension library',
        id: 'tw.cysoeditorHub.welcomeTitle'
    },
    hubWelcomeCached: {
        defaultMessage: '本地已缓存：{count} 个扩展',
        description: 'Cached extension count in welcome card',
        id: 'tw.cysoeditorHub.welcomeCached'
    },
    hubWelcomeLoaded: {
        defaultMessage: '当前已加载：{count} 个扩展',
        description: 'Loaded extension count in welcome card',
        id: 'tw.cysoeditorHub.welcomeLoaded'
    },
    hubWelcomeUpdated: {
        defaultMessage: '更新时间：{date}',
        description: 'Last updated time in welcome card',
        id: 'tw.cysoeditorHub.welcomeUpdated'
    },
    hubWelcomeNotUpdated: {
        defaultMessage: '未更新',
        description: 'Not updated placeholder in welcome card',
        id: 'tw.cysoeditorHub.welcomeNotUpdated'
    },
    hubWelcomeNetwork: {
        defaultMessage: '网络状态：{status}',
        description: 'Network status in welcome card',
        id: 'tw.cysoeditorHub.welcomeNetwork'
    },
    hubWelcomeOnline: {
        defaultMessage: '在线',
        description: 'Online status in welcome card',
        id: 'tw.cysoeditorHub.welcomeOnline'
    },
    hubWelcomeOffline: {
        defaultMessage: '离线',
        description: 'Offline status in welcome card',
        id: 'tw.cysoeditorHub.welcomeOffline'
    },
    customLibraryManage: {
        defaultMessage: '添加 / 管理自定义扩展库',
        description: 'Button to add or manage custom extension libraries',
        id: 'tw.extensionLibrary.customLibraryManage'
    },
    customLibraryCount: {
        defaultMessage: '{count} 个自定义库源',
        description: 'Count of custom extension library sources',
        id: 'tw.extensionLibrary.customLibraryCount'
    },
    customLibraryLoading: {
        defaultMessage: '加载中…',
        description: 'Custom library is loading',
        id: 'tw.extensionLibrary.customLibraryLoading'
    },
    customLibraryLoadError: {
        defaultMessage: '加载失败：{error}',
        description: 'Custom library failed to load',
        id: 'tw.extensionLibrary.customLibraryLoadError'
    }
});

const toLibraryItem = extension => {
    if (typeof extension === 'object') {
        return ({
            rawURL: extension.iconURL || extensionIcon,
            ...extension
        });
    }
    return extension;
};

const translateGalleryItem = (extension, locale) => ({
    ...extension,
    name: extension.nameTranslations[locale] || extension.name,
    description: extension.descriptionTranslations[locale] || extension.description
});

const GALLERY_CACHE_KEY = 'tw-gallery-cache-v1';

const loadCachedGallery = () => {
    try {
        const raw = localStorage.getItem(GALLERY_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed.data) ? parsed.data : null;
    } catch (e) {
        return null;
    }
};

const saveCachedGallery = gallery => {
    try {
        localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify({
            data: gallery,
            timestamp: Date.now()
        }));
    } catch (e) {
        // ignore
    }
};

let cachedGallery = loadCachedGallery();

const GALLERY_FETCH_TIMEOUT = 15000;

const fetchLibrary = async signal => {
    const res = await fetch('https://extensions.turbowarp.org/generated-metadata/extensions-v0.json', {signal});
    if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
    }
    const data = await res.json();
    return data.extensions.map(extension => ({
        name: extension.name,
        nameTranslations: extension.nameTranslations || {},
        description: extension.description,
        descriptionTranslations: extension.descriptionTranslations || {},
        extensionId: extension.id,
        extensionURL: `https://extensions.turbowarp.org/${extension.slug}.js`,
        iconURL: `https://extensions.turbowarp.org/${extension.image || 'images/unknown.svg'}`,
        tags: ['tw', 'turbowarp'],
        
        
        credits: [
            ...(extension.original || []),
            ...(extension.by || [])
        ].map(credit => ({
            name: typeof credit === 'string' ? credit : credit.name,
            link: typeof credit === 'string' ? null : credit.link
        })),
        docsURI: extension.docs ? `https://extensions.turbowarp.org/${extension.slug}` : null,
        samples: extension.samples ? extension.samples.map(sample => ({
            href: `${process.env.ROOT}editor?project_url=https://extensions.turbowarp.org/samples/${encodeURIComponent(sample)}.sb3`,
            text: sample
        })) : null,
        incompatibleWithScratch: !extension.scratchCompatible,
        featured: true
    }));
};

const cysoeditorHubLoading = {
    name: (
        <FormattedMessage
            defaultMessage="CYSCREXTHUB 扩展库（加载中）"
            description="Name of CYSCREXTHUB extension gallery in extension library"
            id="tw.cysoeditorHub.loading"
        />
    ),
    iconURL: extensionIcon,
    tags: ['cysoeditor-hub'],
    disabled: true,
    inset: true
};

const cysoeditorHubError = {
    name: (
        <FormattedMessage
            defaultMessage="CYSCREXTHUB 扩展库（离线）"
            description="Name of CYSCREXTHUB extension gallery when offline"
            id="tw.cysoeditorHub.error"
        />
    ),
    iconURL: extensionIcon,
    tags: ['cysoeditor-hub'],
    disabled: true,
    inset: true
};

class ExtensionLibrary extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'loadCustomLibraries',
            'openCustomLibraryModal',
            'closeCustomLibraryModal',
            'handleCustomLibraryChanged',
            'showAlert',
            'closeAlert',
            'confirmAddExtension',
            'cancelAddExtension',
            'cancelImport',
            'setConfirmSandbox',
            'sourceItem'
        ]);
        
        const cachedHubData = getCachedExtensions();

        this.coverBlobUrls = {};
        this._loadedCysoExtensions = new Map();
        this._pendingCysoLoads = new Set();

        this.state = {
            gallery: cachedGallery,
            galleryError: null,
            galleryTimedOut: false,
            cysoeditorHubGallery: cachedHubData.extensions.length > 0 ? cachedHubData.extensions : null,
            cysoeditorHubError: null,
            cysoeditorHubCacheStatus: cachedHubData.extensions.length > 0 ? 'cached' : 'notCached',
            cysoeditorHubLastUpdated: cachedHubData.lastUpdated,
            cysoeditorHubCachedCount: cachedHubData.extensions.length,
            isOnline: navigator.onLine,
            loadedExtensionsCount: 0,
            coversReady: false,
            customLibrarySections: [],
            showCustomLibraryModal: false,
            confirmDialog: null,
            alertMessage: null,
            importing: null
        };
    }
    
    componentDidMount () {
        window.addEventListener('online', this.handleOnlineStatusChange);
        window.addEventListener('offline', this.handleOnlineStatusChange);
        window.addEventListener('storage', this.handleStorageChange);

        this._mounted = true;
        this.ensureInit();
    }

    componentDidUpdate () {
        if (!this._initDone) this.ensureInit();
    }

    ensureInit () {
        if (this._initDone || !this._mounted || !this.props.visible) return;
        this._initDone = true;

        const hasGallery = !!this.state.gallery;
        if (!hasGallery) {
            this._galleryTimeout = setTimeout(() => {
                this.setState({
                    galleryTimedOut: true
                });
            }, 750);
        }

        const controller = new AbortController();
        this._galleryFetchController = controller;
        this._galleryFetchTimeout = setTimeout(() => controller.abort(), GALLERY_FETCH_TIMEOUT);
        fetchLibrary(controller.signal)
            .then(gallery => {
                if (this._galleryFetchTimeout) clearTimeout(this._galleryFetchTimeout);
                cachedGallery = gallery;
                saveCachedGallery(gallery);
                this.setState({
                    gallery,
                    galleryTimedOut: false
                });
                if (this._galleryTimeout) clearTimeout(this._galleryTimeout);
            })
            .catch(error => {
                if (this._galleryFetchTimeout) clearTimeout(this._galleryFetchTimeout);
                log.error(error);
                if (!this.state.gallery) {
                    this.setState({
                        galleryError: error
                    });
                }
                if (this._galleryTimeout) clearTimeout(this._galleryTimeout);
            });

        this.startBackgroundUpdate();

        getAllCachedExtensions().then(cachedFiles => {
            this.setState({cysoeditorHubCachedCount: cachedFiles.length});
        }).catch(err => {
            log.error('Failed to get cached extensions count:', err);
        });

        this.refreshCoverBlobUrls();

        this.loadCustomLibraries();
    }

    refreshCoverBlobUrls = async () => {
        try {
            const entries = await getAllCachedCovers();
            const map = {};
            const concurrency = 4;
            for (let i = 0; i < entries.length; i += concurrency) {
                const chunk = entries.slice(i, i + concurrency);
                await Promise.all(chunk.map(e => new Promise(resolve => {
                    try {
                        if (e && e.blob) {
                            const reader = new FileReader();
                            reader.onload = () => {
                                map[e.id] = reader.result;
                                resolve();
                            };
                            reader.onerror = () => resolve();
                            reader.readAsDataURL(e.blob);
                        } else {
                            resolve();
                        }
                    } catch (err) {
                        log.error('Failed to convert cover to data URL:', err);
                        resolve();
                    }
                })));
                if (this._mounted) {
                    this.coverBlobUrls = {...this.coverBlobUrls, ...map};
                    this.setState(prev => ({coversReady: !prev.coversReady}));
                }
            }
        } catch (err) {
            log.error('Failed to refresh cover blob URLs:', err);
        }
    };

    componentWillUnmount () {
        this._mounted = false;
        this.coverBlobUrls = {};
        if (this._galleryTimeout) clearTimeout(this._galleryTimeout);
        if (this._galleryFetchTimeout) clearTimeout(this._galleryFetchTimeout);
        if (this._galleryFetchController) this._galleryFetchController.abort();
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
        window.removeEventListener('storage', this.handleStorageChange);
        this.setState = () => {};
    }
    
    handleOnlineStatusChange = () => {
        this.setState({isOnline: navigator.onLine});
    };

    handleStorageChange = e => {
        if (e && e.key === CYSCREXTHUB_CONFIG.STORAGE_KEY) {
            const cached = getCachedExtensions();
            if (cached.extensions.length > 0) {
                this.setState({
                    cysoeditorHubGallery: cached.extensions,
                    cysoeditorHubLastUpdated: cached.lastUpdated,
                    cysoeditorHubCachedCount: cached.extensions.length
                });
            }
            this.refreshCoverBlobUrls();
        }
    };
    
    startBackgroundUpdate = () => {
        this.setState({cysoeditorHubCacheStatus: 'updating'});
        
        checkForUpdates((newData) => {
            this.setState({
                cysoeditorHubGallery: newData,
                cysoeditorHubCacheStatus: 'cached',
                cysoeditorHubLastUpdated: new Date().toISOString(),
                cysoeditorHubCachedCount: newData.length
            });
        }).then(result => {
            if (result.extensions && result.extensions.length > 0) {
                this.setState({
                    cysoeditorHubGallery: result.extensions,
                    cysoeditorHubCacheStatus: 'cached',
                    cysoeditorHubLastUpdated: result.lastUpdated,
                    cysoeditorHubCachedCount: result.extensions.length,
                    cysoeditorHubError: result.error || null
                });
                this.syncExtensionCache(result.extensions);
            } else if (result.error && !getCachedExtensions().extensions.length) {
                this.setState({
                    cysoeditorHubError: result.error,
                    cysoeditorHubCacheStatus: 'notCached'
                });
            }
        }).catch(error => {
            log.error('CYSCREXTHUB background update error:', error);
            this.setState({cysoeditorHubCacheStatus: 'notCached'});
        });
    };

    syncExtensionCache = extensions => {
        this.setState({cysoeditorHubCacheStatus: 'updating'});
        syncCache(extensions)
            .then(stats => {
                log.info('CYSCREXTHUB 缓存同步完成:', stats);
                getAllCachedExtensions().then(files => {
                    if (this._mounted) {
                        this.setState({cysoeditorHubCachedCount: files.length});
                    }
                }).catch(() => {});
                this.refreshCoverBlobUrls();
            })
            .catch(err => {
                log.error('CYSCREXTHUB 缓存同步失败:', err);
            })
            .finally(() => {
                if (this._mounted) {
                    this.setState({cysoeditorHubCacheStatus: 'cached'});
                }
            });
    };

    loadCustomLibraries = async () => {
        const libs = getCustomLibraries();
        this.setState({customLibrarySections: []});
        for (const lib of libs) {
            const section = {
                sourceId: lib.id,
                name: lib.name,
                items: [],
                loading: true,
                error: null
            };
            this.setState(prev => ({
                customLibrarySections: [...prev.customLibrarySections, section]
            }));
            try {
                const items = await fetchAndParseLibrary(lib, cysoeditorHubIcon, this.props.intl.locale);
                this.setState(prev => ({
                    customLibrarySections: prev.customLibrarySections.map(s =>
                        s.sourceId === lib.id ? {...s, items, loading: false} : s)
                }));
            } catch (err) {
                log.error('Custom library load failed:', err);
                this.setState(prev => ({
                    customLibrarySections: prev.customLibrarySections.map(s =>
                        s.sourceId === lib.id ? {...s, error: err.message || '加载失败', loading: false} : s)
                }));
            }
        }
    };

    openCustomLibraryModal = () => {
        this.setState({showCustomLibraryModal: true});
    };

    closeCustomLibraryModal = () => {
        this.setState({showCustomLibraryModal: false});
    };

    handleCustomLibraryChanged = () => {
        this.loadCustomLibraries();
    };
    
    ensureFromExtensionRegistered () {
        const Blockly = LazyScratchBlocks.get();
        if (!Blockly || !Blockly.Extensions || typeof Blockly.Extensions.register !== 'function') {
            return;
        }
        const needed = {
            'from_extension': function () {
                this.isFromExtension = true;
            },
            'default_extension_colors': function () {
                this.usesDefaultExtensionColors = true;
            },
            'scratch_extension': function () {
                this.isScratchExtension = true;
            }
        };
        for (const name in needed) {
            try {
                Blockly.Extensions.register(name, needed[name]);
            } catch (e) {
            }
        }
    }

    handleItemSelect (item) {
        if (item.extensionId === 'cysoeditor-hub-welcome') {
            if (item.webUrl) {
                window.open(item.webUrl, '_blank', 'noopener,noreferrer');
            }
            return;
        }

        const extensionId = item.extensionId;

        this.ensureFromExtensionRegistered();

        if (extensionId === 'custom_extension') {
            this.props.onOpenCustomExtensionModal();
            return;
        }

        if (extensionId === 'procedures_enable_return') {
            this.props.onEnableProcedureReturns();
            this.props.onCategorySelected('myBlocks');
            return;
        }

        const isCysoeditorHubExtension = item.tags &&
            item.tags.includes('cysoeditor-hub') &&
            extensionId !== 'cysoeditor-hub-welcome';

        const isCustomLibraryExtension = item.tags &&
            item.tags.includes('custom-library');

        const normalizeUrl = u => {
            if (!u || typeof u !== 'string') return '';
            try {
                u = decodeURIComponent(u);
            } catch (e) {
            }
            u = u.replace(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//, '');
            u = u.split('#')[0].split('?')[0];
            return u.replace(/\/+$/, '').toLowerCase();
        };
        const getActualExtensionId = url => {
            if (!url) {
                return null;
            }
            const urls = this.props.vm.extensionManager.getExtensionURLs();
            const target = normalizeUrl(url);
            let fallbackId = null;
            for (const [id, extensionUrl] of Object.entries(urls)) {
                if (extensionUrl === url) {
                    return id;
                }
                if (target && normalizeUrl(extensionUrl) === target) {
                    fallbackId = id;
                }
            }
            if (!fallbackId && urls && Object.prototype.hasOwnProperty.call(urls, extensionId)) {
                fallbackId = extensionId;
            }
            return fallbackId;
        };

        const loadExtension = url => {
            if (this.props.vm.extensionManager.isExtensionURLLoaded(url)) {
                const actualId = getActualExtensionId(url);
                if (actualId) {
                    this.props.onCategorySelected(actualId);
                } else {
                    log.error('[Extension Library] Failed to get actual extension ID for URL:', url);
                    this.props.onCategorySelected(extensionId);
                }
            } else {
                this.props.vm.extensionManager.loadExtensionURL(url)
                    .then(() => {
                        const actualId = getActualExtensionId(url);
                        if (actualId) {
                            this.props.onCategorySelected(actualId);
                            if (this._mounted) {
                                this.setState(prevState => ({
                                    loadedExtensionsCount: prevState.loadedExtensionsCount + 1
                                }));
                            }
                        } else {
                            log.error('[Extension Library] Failed to get actual extension ID after loading');
                            this.props.onCategorySelected(extensionId);
                        }
                    })
                    .catch(err => {
                        log.error('[Extension Library] Failed to load extension:', err);
                        let errorMessage;
                        if (err.message) {
                            errorMessage = `扩展加载失败：${item.name || extensionId}\n\n错误信息：${err.message}\n\nURL：${url}`;
                        } else {
                            errorMessage = `扩展加载失败：${item.name || extensionId}\n\n请检查网络连接并重试。`;
                        }
                        this.showAlert(errorMessage);
                    });
            }
        };

        if (isCysoeditorHubExtension || isCustomLibraryExtension) {
            if (this._loadedCysoExtensions && this._loadedCysoExtensions.has(extensionId)) {
                this.props.onCategorySelected(this._loadedCysoExtensions.get(extensionId) || extensionId);
                return;
            }
            if (this._pendingCysoLoads.has(extensionId)) {
                return;
            }
            const sourceLabel = isCysoeditorHubExtension ? 'CYSCREXTHUB 扩展库' : (item.sourceName || '扩展库');
            const confirmMessage = `此扩展来自 ${sourceLabel}，是否添加到项目中？\n\n扩展名称：${item.name || extensionId}\n\n点击"确定"继续添加，点击"取消"放弃。`;
            this._pendingCysoLoads.add(extensionId);
            this.setState({confirmDialog: {message: confirmMessage, item, sandbox: false}});
        } else {
            const url = item.extensionURL ? item.extensionURL : extensionId;
            if (!item.disabled) {
                loadExtension(url);
            }
        }
    }

    loadCysoExtension (item, signal, sandbox) {
        const extensionId = item.extensionId;
        const urls = (item.extensionURLs && item.extensionURLs.length) ?
            item.extensionURLs : [item.extensionURL];

        this._forceUnsandboxedForDataUrl = sandbox !== true;

        const sm = this.props.vm && this.props.vm.securityManager;
        if (sm && !sm.__cysoDataUrlPatched) {
            const originalGetSandboxMode = sm.getSandboxMode.bind(sm);
            sm.getSandboxMode = url => {
                if (typeof url === 'string' && url.startsWith('data:') && this._forceUnsandboxedForDataUrl) {
                    return Promise.resolve('unsandboxed');
                }
                return originalGetSandboxMode(url);
            };
            sm.__cysoDataUrlPatched = true;
        }

        const vmInstance = this.props.vm;
        if (vmInstance) {
            window.vm = vmInstance;
            window.runtime = vmInstance.runtime;
            const blocksInstance = LazyScratchBlocks.get();
            window.ScratchBlocks = blocksInstance;
            window.Blockly = blocksInstance;
            if (vmInstance.runtime) {
                vmInstance.runtime.scratchBlocks = blocksInstance;
            }
        }

        const loadCode = code => {
            const transformed = code.replace(
                /\}\)\s*\(\s*Scratch\s*\)\s*;?\s*$/i,
                '})(Scratch, window.vm, window.runtime, window.Blockly);'
            );
            const dataUrl = `data:text/javascript;base64,${btoa(unescape(encodeURIComponent(transformed)))}`;
            return this.props.vm.extensionManager.loadExtensionURL(dataUrl)
                .then(() => {
                    const urlsMap = this.props.vm.extensionManager.getExtensionURLs();
                    let actualId = null;
                    for (const [id, u] of Object.entries(urlsMap)) {
                        if (u === dataUrl) {
                            actualId = id;
                            break;
                        }
                    }
                    if (actualId) {
                        this.props.onCategorySelected(actualId);
                        if (this._loadedCysoExtensions) {
                            this._loadedCysoExtensions.set(extensionId, actualId);
                        }
                    } else {
                        this.props.onCategorySelected(extensionId);
                    }
                    if (this._mounted) {
                        this.setState(prevState => ({
                            loadedExtensionsCount: prevState.loadedExtensionsCount + 1
                        }));
                    }
                    return actualId;
                });
        };

        const loadFromNetwork = () => new Promise(resolve => {
            let lastError;
            const tryLoad = index => {
                if (signal && signal.aborted) {
                    resolve(false);
                    return;
                }
                if (index >= urls.length) {
                    if (!(signal && signal.aborted)) {
                        this.showAlert(`扩展加载失败：${item.name || ''}\n\n无法从任何镜像获取扩展文件，请检查网络连接（或代理设置）后重试。\n\n最后错误：${lastError ? lastError.message : '未知错误'}`);
                    }
                    resolve(false);
                    return;
                }
                fetch(urls[index], signal ? {signal} : undefined)
                    .then(res => {
                        if (!res.ok) {
                            throw new Error(`HTTP ${res.status}`);
                        }
                        return res.arrayBuffer();
                    })
                    .then(buf => {
                        cacheExtensionFile(extensionId, buf, {
                            url: urls[index],
                            size: buf.byteLength
                        }).catch(e => log.error('Failed to cache extension file:', e));
                        const code = new TextDecoder('utf-8').decode(buf);
                        return loadCode(code);
                    })
                    .then(() => resolve(true))
                    .catch(err => {
                        if (signal && signal.aborted) {
                            resolve(false);
                            return;
                        }
                        lastError = err;
                        tryLoad(index + 1);
                    });
            };
            tryLoad(0);
        });

        const triggerBackgroundRefresh = () => {
            if (!navigator.onLine || !item.downloadUrl) {
                return;
            }
            checkCachedFileForUpdate(extensionId, item.downloadUrl)
                .then(fresh => {
                    if (fresh.needsUpdate) {
                        return downloadAndCacheExtension(extensionId, getProxiedUrl(item.downloadUrl));
                    }
                })
                .catch(() => {});
        };

        return getCachedExtensionFile(extensionId)
            .then(cached => {
                if (cached && cached.content) {
                    try {
                        const code = new TextDecoder('utf-8').decode(cached.content);
                        triggerBackgroundRefresh();
                        return loadCode(code).catch(() => {
                            log.error('Cached extension load failed, falling back to network');
                            return loadFromNetwork();
                        });
                    } catch (e) {
                        log.error('Failed to decode cached extension file, falling back to network:', e);
                    }
                }
                return loadFromNetwork();
            })
            .catch(err => {
                log.error('getCachedExtensionFile failed, falling back to network:', err);
                return loadFromNetwork();
            });
    }

    sourceItem (item, sourceTag) {
        return {
            ...item,
            tags: [sourceTag, ...(item.tags || [])],
            key: `${sourceTag}-${item.key || item.name || item.rawURL || item.extensionId || ''}`
        };
    }

    showAlert (message) {
        this.setState({alertMessage: message});
    }

    closeAlert () {
        this.setState({alertMessage: null});
    }

    confirmAddExtension () {
        const dialog = this.state.confirmDialog;
        if (!dialog) return;
        const item = dialog.item;
        const controller = new AbortController();
        this._importController = controller;
        this._importingId = item.extensionId;
        this._pendingCysoLoads.add(item.extensionId);
        this.setState({confirmDialog: null, importing: item.name || '扩展'});
        const minDelay = new Promise(resolve => setTimeout(resolve, 450));
        this.loadCysoExtension(item, controller.signal, dialog.sandbox === true)
            .catch(err => {
                if (controller.signal.aborted || (err && err.name === 'AbortError')) {
                    return;
                }
                log.error('[Extension Library] Failed to load extension:', err);
                this.showAlert(`扩展加载失败：${(err && err.message) || '未知错误'}`);
            })
            .then(() => minDelay)
            .finally(() => {
                this._pendingCysoLoads.delete(item.extensionId);
                this._importController = null;
                this._importingId = null;
                this.setState({importing: null});
            });
    }

    cancelImport () {
        const controller = this._importController;
        if (controller) controller.abort();
        if (this._importingId) {
            this._pendingCysoLoads.delete(this._importingId);
        }
        this._importController = null;
        this._importingId = null;
        this.setState({importing: null});
    }

    setConfirmSandbox (e) {
        const sandbox = e.target.value === 'sandbox';
        this.setState(prev => (prev.confirmDialog ? {confirmDialog: {...prev.confirmDialog, sandbox}} : {}));
    }

    cancelAddExtension () {
        const dialog = this.state.confirmDialog;
        if (dialog) {
            this._pendingCysoLoads.delete(dialog.item.extensionId);
        }
        this.setState({confirmDialog: null});
    }

    renderStatusBar () {
        const {
            cysoeditorHubCacheStatus,
            cysoeditorHubLastUpdated,
            cysoeditorHubCachedCount,
            isOnline
        } = this.state;
        
        const {intl} = this.props;

        const loadedCount = (this.props.vm && this.props.vm.extensionManager)
            ? Object.keys(this.props.vm.extensionManager.getExtensionURLs()).length
            : (this.state.loadedExtensionsCount || 0);

        const cacheStatusText = {
            cached: intl.formatMessage(messages.cacheStatusCached),
            notCached: intl.formatMessage(messages.cacheStatusNotCached),
            updating: intl.formatMessage(messages.cacheStatusUpdating)
        };

        const themeEl = typeof document !== 'undefined' ? document.documentElement : null;
        const mistySandLight = !!themeEl &&
            themeEl.classList.contains('tw-misty-sand-theme') &&
            !themeEl.classList.contains('tw-misty-sand-dark');
        const footerBg = mistySandLight ? '#ffffff' : 'var(--ui-secondary, #f2f2f2)';
        const footerColor = mistySandLight ? '#575e75' : 'var(--text-primary, #575e75)';
        
        return (
            <div
                style={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 10,
                    flexShrink: 0,
                    padding: '8px 16px',
                    borderTop: '1px solid var(--ui-white-dim, rgba(0, 0, 0, 0.1))',
                    backgroundColor: footerBg,
                    fontSize: '12px',
                    color: footerColor,
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '8px'
                }}
            >
                <span>
                    {intl.formatMessage(messages.extensionCount, {count: cysoeditorHubCachedCount || 0})}
                </span>
                <span>
                    {intl.formatMessage(messages.loadedCount, {count: loadedCount})}
                </span>
                <span>
                    {intl.formatMessage(messages.lastUpdated, {
                        date: cysoeditorHubLastUpdated 
                            ? new Date(cysoeditorHubLastUpdated).toLocaleString()
                            : '-'
                    })}
                </span>
                <span>
                    {isOnline 
                        ? intl.formatMessage(messages.onlineStatus)
                        : intl.formatMessage(messages.offlineStatus)
                    }
                    {' | '}
                    {cacheStatusText[cysoeditorHubCacheStatus]}
                </span>
                <span>
                    {intl.formatMessage(messages.customLibraryCount, {count: this.state.customLibrarySections.length})}
                </span>
                <button
                    type="button"
                    onClick={this.openCustomLibraryModal}
                    style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: '1px solid var(--ui-white-dim, rgba(0, 0, 0, 0.2))',
                        borderRadius: '4px',
                        backgroundColor: mistySandLight ? '#fff' : 'var(--ui-primary, #fff)',
                        color: footerColor
                    }}
                >
                    {intl.formatMessage(messages.customLibraryManage)}
                </button>
            </div>
        );
    }
    
    render () {
        const SRC_BUILTIN = 'scratch';
        const SRC_TW = 'TurboWarp';
        const SRC_HUB = 'CYSCREXTHUB';
        let library = null;
        if (this.state.gallery || this.state.galleryError || this.state.galleryTimedOut) {
            library = extensionLibraryContent.map(ext => this.sourceItem(toLibraryItem(ext), SRC_BUILTIN));
            library.push('---');
            if (this.state.gallery) {
                library.push(this.sourceItem(toLibraryItem(galleryMore), SRC_TW));
                const locale = this.props.intl.locale;
                library.push(
                    ...this.state.gallery
                        .filter(i => i.extensionId !== 'faceSensing')
                        .map(i => translateGalleryItem(i, locale))
                        .map(toLibraryItem)
                        .map(i => this.sourceItem(i, SRC_TW))
                );
            } else if (this.state.galleryError) {
                library.push(toLibraryItem(galleryError));
            } else {
                library.push(toLibraryItem(galleryLoading));
            }
            
            library.push('---');

            if (this.state.cysoeditorHubGallery && this.state.cysoeditorHubGallery.length > 0) {
                const filteredExtensions = this.props.cysoCoreEnabled
                    ? this.state.cysoeditorHubGallery
                    : this.state.cysoeditorHubGallery.filter(ext => !ext.is_cyso);

                const mappedExtensions = mapToLibraryFormat(
                    filteredExtensions,
                    cysoeditorHubIcon
                );

                const withCovers = mappedExtensions.map(ext =>
                    (this.coverBlobUrls && this.coverBlobUrls[ext.extensionId])
                        ? {...ext, iconURL: this.coverBlobUrls[ext.extensionId]}
                        : ext
                );

                const {intl} = this.props;
                const welcomeLoadedCount = (this.props.vm && this.props.vm.extensionManager)
                    ? Object.keys(this.props.vm.extensionManager.getExtensionURLs()).length
                    : (this.state.loadedExtensionsCount || 0);
                const welcomeDescription = (
                    <div style={{ lineHeight: '1.6' }}>
                        <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                            {intl.formatMessage(messages.hubWelcomeTitle)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {intl.formatMessage(messages.hubWelcomeCached, {count: this.state.cysoeditorHubCachedCount || 0})}
                            <br />
                            {intl.formatMessage(messages.hubWelcomeLoaded, {count: welcomeLoadedCount})}
                            <br />
                            {intl.formatMessage(messages.hubWelcomeUpdated, {
                                date: this.state.cysoeditorHubLastUpdated
                                    ? new Date(this.state.cysoeditorHubLastUpdated).toLocaleString()
                                    : intl.formatMessage(messages.hubWelcomeNotUpdated)
                            })}
                            <br />
                            {intl.formatMessage(messages.hubWelcomeNetwork, {
                                status: this.state.isOnline
                                    ? intl.formatMessage(messages.hubWelcomeOnline)
                                    : intl.formatMessage(messages.hubWelcomeOffline)
                            })}
                        </div>
                    </div>
                );

                const welcomeExtension = {
                    name: '欢迎使用 CYSCREXTHUB',
                    description: welcomeDescription,
                    extensionId: 'cysoeditor-hub-welcome',
                    iconURL: cysoeditorHubIcon,
                    webUrl: 'https://cyscrexthub.cc.cd',
                    tags: ['cysoeditor-hub'],
                    credits: ['CY-Studio'],
                    featured: true,
                    disabled: false,
                    key: 'cysoeditor-hub-welcome'
                };
                
                library.push(this.sourceItem(toLibraryItem(welcomeExtension), SRC_HUB));
                library.push(
                    ...withCovers.map(i => this.sourceItem(toLibraryItem(i), SRC_HUB))
                );
            } else if (this.state.cysoeditorHubError) {
                library.push(toLibraryItem(cysoeditorHubError));
            } else {
                library.push(toLibraryItem(cysoeditorHubLoading));
            }

            this.state.customLibrarySections.forEach(section => {
                library.push('---');
                if (section.error) {
                    library.push(toLibraryItem({
                        name: this.props.intl.formatMessage(messages.customLibraryLoadError, {error: section.error}),
                        iconURL: extensionIcon,
                        tags: ['custom-library'],
                        disabled: true,
                        inset: true
                    }));
                } else if (section.loading) {
                    library.push(toLibraryItem({
                        name: this.props.intl.formatMessage(messages.customLibraryLoading),
                        iconURL: extensionIcon,
                        tags: ['custom-library'],
                        disabled: true,
                        inset: true
                    }));
                } else if (section.items && section.items.length) {
                    library.push(...section.items.map(item => this.sourceItem(toLibraryItem(item), `lib-${section.sourceId}`)));
                }
            });
        }

        const sourceChips = [{tag: SRC_BUILTIN, intlLabel: SRC_BUILTIN}];
        if (this.state.gallery) {
            sourceChips.push({tag: SRC_TW, intlLabel: SRC_TW});
        }
        if (this.state.cysoeditorHubGallery && this.state.cysoeditorHubGallery.length > 0) {
            sourceChips.push({tag: SRC_HUB, intlLabel: SRC_HUB});
        }
        this.state.customLibrarySections.forEach(section => {
            if (!section.error && !section.loading && section.items && section.items.length) {
                sourceChips.push({tag: `lib-${section.sourceId}`, intlLabel: section.name});
            }
        });

        return (
            <div>
                <LibraryComponent
                    data={library}
                    filterable
                    tags={sourceChips}
                    persistableKey="extensionId"
                    id="extensionLibrary"
                    title={this.props.intl.formatMessage(messages.extensionTitle)}
                    visible={this.props.visible}
                    onItemSelected={this.handleItemSelect}
                    onRequestClose={this.props.onRequestClose}
                    footer={this.renderStatusBar()}
                />
                {this.state.showCustomLibraryModal && (
                    <CustomLibraryModal
                        visible={this.state.showCustomLibraryModal}
                        onClose={this.closeCustomLibraryModal}
                        onChanged={this.handleCustomLibraryChanged}
                    />
                )}
                <CysoDialog
                    open={!!this.state.confirmDialog}
                    type="confirm"
                    title="添加到项目"
                    message={this.state.confirmDialog ? (
                        <React.Fragment>
                            <div>{this.state.confirmDialog.message}</div>
                            <div style={{display: 'flex', alignItems: 'center', gap: 8, marginTop: 14}}>
                                <span style={{fontSize: 13, flexShrink: 0}}>加载方式：</span>
                                <select
                                    value={this.state.confirmDialog.sandbox ? 'sandbox' : 'unsandboxed'}
                                    onChange={this.setConfirmSandbox}
                                    style={{padding: '5px 8px', fontSize: 13, borderRadius: 4, border: '1px solid var(--ui-white, #ccc)', background: 'var(--ui-secondary, #fff)', color: 'var(--text-primary, #575e75)'}}
                                >
                                    <option value="unsandboxed">非沙盒（默认，支持完整功能）</option>
                                    <option value="sandbox">沙盒（受限，更安全）</option>
                                </select>
                            </div>
                        </React.Fragment>
                    ) : null}
                    confirmText="确定添加"
                    cancelText="取消"
                    onConfirm={this.confirmAddExtension}
                    onCancel={this.cancelAddExtension}
                />
                <CysoDialog
                    open={!!this.state.alertMessage}
                    type="alert"
                    title="提示"
                    message={this.state.alertMessage}
                    onConfirm={this.closeAlert}
                    onCancel={this.closeAlert}
                />
                <CysoDialog
                    open={!!this.state.importing}
                    loading
                    title="正在导入扩展"
                    message={this.state.importing ? `正在导入"${this.state.importing}"，请稍候…` : ''}
                    cancelText="取消导入"
                    onCancel={this.cancelImport}
                />
            </div>
        );
    }
}

ExtensionLibrary.propTypes = {
    cysoCoreEnabled: PropTypes.bool,
    intl: intlShape.isRequired,
    onCategorySelected: PropTypes.func,
    onEnableProcedureReturns: PropTypes.func,
    onOpenCustomExtensionModal: PropTypes.func,
    onRequestClose: PropTypes.func,
    visible: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired // eslint-disable-line react/no-unused-prop-types
};

ExtensionLibrary.defaultProps = {
    cysoCoreEnabled: false
};

const mapStateToProps = state => ({
    cysoCoreEnabled: state.scratchGui.tw.cysoCoreEnabled
});

const mapDispatchToProps = () => ({

});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ExtensionLibrary));
