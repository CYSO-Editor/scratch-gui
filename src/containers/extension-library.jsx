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
import extensionTags from '../lib/libraries/tw-extension-tags';
import {
    mapToLibraryFormat,
    checkForUpdates,
    getCachedExtensions,
    getAllCachedExtensions,
    getCachedExtensionFile,
    cacheExtensionFile,
    getAllCachedCovers,
    syncCache
} from '../lib/libraries/cysoeditor-hub';

import LibraryComponent from '../components/library/library.jsx';
import extensionIcon from '../components/action-menu/icon--sprite.svg';
import cysoeditorHubIcon from '../components/action-menu/icon--cysoeditor-hub.svg';

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
    cysoeditorHubError: {
        defaultMessage: 'CYSCREXTHUB Extension Gallery (Offline)',
        description: 'Name of CYSCREXTHUB extension gallery when offline',
        id: 'tw.cysoeditorHub.error'
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

const fetchLibrary = async () => {
    const res = await fetch('https://extensions.turbowarp.org/generated-metadata/extensions-v0.json');
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
        tags: ['tw'],
        
        
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
            defaultMessage="CYSCREXTHUB Extension Gallery"
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
            defaultMessage="CYSCREXTHUB Extension Gallery (Offline)"
            description="Name of CYSCREXTHUB extension gallery when offline"
            id="tw.cysoeditorHub.error"
        />
    ),
    iconURL: extensionIcon,
    tags: ['cysoeditor-hub'],
    disabled: true,
    inset: true
};

const cysoeditorHubMore = {
    name: (
        <FormattedMessage
            defaultMessage="CYSCREXTHUB Extension Gallery"
            description="Name of CYSCREXTHUB extension gallery in extension library"
            id="tw.cysoeditorHub.more"
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
            'handleItemSelect'
        ]);
        
        const cachedHubData = getCachedExtensions();

        this.coverBlobUrls = {};

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
            coversReady: false
        };
    }
    
    componentDidMount () {
        const hasGallery = !!this.state.gallery;
        if (!hasGallery) {
            this._galleryTimeout = setTimeout(() => {
                this.setState({
                    galleryTimedOut: true
                });
            }, 750);
        }

        fetchLibrary()
            .then(gallery => {
                cachedGallery = gallery;
                saveCachedGallery(gallery);
                this.setState({
                    gallery,
                    galleryTimedOut: false
                });
                if (this._galleryTimeout) clearTimeout(this._galleryTimeout);
            })
            .catch(error => {
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

        window.addEventListener('online', this.handleOnlineStatusChange);
        window.addEventListener('offline', this.handleOnlineStatusChange);
        window.addEventListener('storage', this.handleStorageChange);

        this._mounted = true;
    }

    refreshCoverBlobUrls = async () => {
        try {
            const entries = await getAllCachedCovers();
            const map = {};
            await Promise.all(entries.map(e => new Promise(resolve => {
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
            this.coverBlobUrls = map;
            if (this._mounted) {
                this.setState(prev => ({coversReady: !prev.coversReady}));
            }
        } catch (err) {
            log.error('Failed to refresh cover blob URLs:', err);
        }
    };

    componentWillUnmount () {
        this._mounted = false;
        this.coverBlobUrls = {};
        if (this._galleryTimeout) clearTimeout(this._galleryTimeout);
        window.removeEventListener('online', this.handleOnlineStatusChange);
        window.removeEventListener('offline', this.handleOnlineStatusChange);
        window.removeEventListener('storage', this.handleStorageChange);
        this.setState = () => {};
    }
    
    handleOnlineStatusChange = () => {
        this.setState({isOnline: navigator.onLine});
    };

    handleStorageChange = e => {
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
                        // eslint-disable-next-line no-alert
                        alert(errorMessage);
                    });
            }
        };

        if (isCysoeditorHubExtension) {
            const confirmMessage = `此扩展来自 CYSCREXTHUB，与原版 Scratch 不兼容，是否添加？\n\n扩展名称：${item.name || extensionId}\n\n点击"确定"继续添加，点击"取消"放弃。`;
            // eslint-disable-next-line no-alert
            const userConfirmed = window.confirm(confirmMessage);
            if (!userConfirmed) {
                return;
            }
            this.loadCysoExtension(item);
        } else {
            const url = item.extensionURL ? item.extensionURL : extensionId;
            if (!item.disabled) {
                loadExtension(url);
            }
        }
    }

    loadCysoExtension (item) {
        const extensionId = item.extensionId;
        const urls = (item.extensionURLs && item.extensionURLs.length) ?
            item.extensionURLs : [item.extensionURL];

        const sm = this.props.vm && this.props.vm.securityManager;
        if (sm && !sm.__cysoDataUrlPatched) {
            const originalGetSandboxMode = sm.getSandboxMode.bind(sm);
            sm.getSandboxMode = url => {
                if (typeof url === 'string' && url.startsWith('data:')) {
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

        const loadFromNetwork = () => {
            let lastError;
            const tryLoad = index => {
                if (index >= urls.length) {
                    const errorMessage = `扩展加载失败：${item.name || ''}\n\n无法从任何镜像获取扩展文件，请检查网络连接（或代理设置）后重试。\n\n最后错误：${lastError ? lastError.message : '未知错误'}`;
                    // eslint-disable-next-line no-alert
                    alert(errorMessage);
                    return;
                }
                fetch(urls[index])
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
                    .then(() => {})
                    .catch(err => {
                        lastError = err;
                        tryLoad(index + 1);
                    });
            };
            tryLoad(0);
        };

        getCachedExtensionFile(extensionId)
            .then(cached => {
                if (cached && cached.content) {
                    try {
                        const code = new TextDecoder('utf-8').decode(cached.content);
                        return loadCode(code).catch(err => {
                            log.error('Cached extension load failed, falling back to network:', err);
                            loadFromNetwork();
                        });
                    } catch (e) {
                        log.error('Failed to decode cached extension file, falling back to network:', e);
                    }
                }
                loadFromNetwork();
            })
            .catch(err => {
                log.error('getCachedExtensionFile failed, falling back to network:', err);
                loadFromNetwork();
            });
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
        
        return (
            <div
                style={{
                    padding: '8px 16px',
                    borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                    backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    fontSize: '12px',
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
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
            </div>
        );
    }
    
    render () {
        let library = null;
        if (this.state.gallery || this.state.galleryError || this.state.galleryTimedOut) {
            library = extensionLibraryContent.map(toLibraryItem);
            library.push('---');
            if (this.state.gallery) {
                library.push(toLibraryItem(galleryMore));
                const locale = this.props.intl.locale;
                library.push(
                    ...this.state.gallery
                        .filter(i => i.extensionId !== 'faceSensing')
                        .map(i => translateGalleryItem(i, locale))
                        .map(toLibraryItem)
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

                const welcomeDescription = (
                    <div style={{ lineHeight: '1.6' }}>
                        <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                            欢迎使用 CYSCREXTHUB 扩展库！这里汇集了丰富的扩展资源。
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            本地已缓存：{this.state.cysoeditorHubCachedCount || 0} 个扩展
                            <br />
                            当前已加载：{this.props.vm && this.props.vm.extensionManager
                                ? Object.keys(this.props.vm.extensionManager.getExtensionURLs()).length
                                : (this.state.loadedExtensionsCount || 0)} 个扩展
                            <br />
                            更新时间：{this.state.cysoeditorHubLastUpdated
                                ? new Date(this.state.cysoeditorHubLastUpdated).toLocaleString()
                                : '未更新'}
                            <br />
                            网络状态：{this.state.isOnline ? '在线' : '离线'}
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
                
                library.push(toLibraryItem(welcomeExtension));
                library.push(
                    ...withCovers.map(toLibraryItem)
                );
            } else if (this.state.cysoeditorHubError) {
                library.push(toLibraryItem(cysoeditorHubError));
            } else {
                library.push(toLibraryItem(cysoeditorHubLoading));
            }
        }

        return (
            <div>
                <LibraryComponent
                    data={library}
                    filterable
                    persistableKey="extensionId"
                    id="extensionLibrary"
                    tags={extensionTags}
                    title={this.props.intl.formatMessage(messages.extensionTitle)}
                    visible={this.props.visible}
                    onItemSelected={this.handleItemSelect}
                    onRequestClose={this.props.onRequestClose}
                />
                {this.props.visible !== false && this.renderStatusBar()}
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
