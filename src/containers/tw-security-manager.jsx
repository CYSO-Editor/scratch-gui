import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import SecurityManagerModal from '../components/tw-security-manager-modal/security-manager-modal.jsx';
import ExtensionPermissionModal from '../components/tw-security-manager-modal/extension-permission-modal.jsx';
import SecurityModals from '../lib/tw-security-manager-constants';
import {setPersistedUnsandboxed} from '../lib/tw-persisted-unsandboxed.js';
import {decodeExtensionSource, extractExtensionInfo, localizeExtensionName, isRemoteExtensionUrl, fetchExtensionSource} from '../lib/tw-decode-extension-source.js';
import {
    PERMISSION_TYPES,
    PERMISSION_SETTINGS,
    PERMISSION_GROUPS,
    getDefaultPermissionSetting,
    loadDefaults,
    saveDefaults,
    loadExtensionPermissions,
    saveExtensionPermissions
} from '../lib/extension-permissions';
import {
    addLoadedExtension,
    setDefaultPermission,
    setExtensionPermission,
    registerExtensionPermissions,
    setCYSOCoreEnabled
} from '../reducers/tw';




const getCurrentExtensionId = () => {
    if (typeof window !== 'undefined') {
        const stack = window.__cysoExtensionIdStack;
        if (Array.isArray(stack) && stack.length) {
            return stack[stack.length - 1];
        }
        if (window.__cysoCurrentExtensionId) {
            return window.__cysoCurrentExtensionId;
        }
    }
    return null;
};

const usedPermissions = new Set();

const recordPermissionUse = (permissionType) => {
    usedPermissions.add(permissionType);
};

const extensionsTrustedByUser = new Set();

const manuallyTrustExtension = url => {
    extensionsTrustedByUser.add(url);
};

const isTrustedExtension = url => {
    if (url.startsWith('https://extensions.turbowarp.org/')) {
        return true;
    }
    if (url.startsWith('http://localhost:8000/')) {
        return true;
    }
    if (url.startsWith('blob:')) {
        return true;
    }
    return false;
};

const isCYSOModeExtension = url => {
    return (url.includes('githubusercontent.com') || url.includes('github.com')) && url.includes('CY-ScrExt-Hub');
};

const fetchHostsTrustedByUser = new Set();
const embedHostsTrustedByUser = new Set();

const isAlwaysTrustedForFetching = parsed => (
    isTrustedExtension(parsed.href) ||
    parsed.origin === 'https://turbowarp.org' ||
    parsed.origin.endsWith('.turbowarp.org') ||
    parsed.origin.endsWith('.turbowarp.xyz') ||
    parsed.origin === 'https://raw.githubusercontent' ||
    parsed.origin === 'https://gist.githubusercontent.com' ||
    parsed.origin === 'https://api.github.com' ||
    parsed.origin === 'https://gitlab.com' ||
    parsed.origin.endsWith('.srht.site') ||
    parsed.origin.endsWith('.itch.io') ||
    parsed.origin === 'https://api.gamejolt.com' ||
    parsed.origin === 'https://httpbin.org' ||
    parsed.origin === 'https://scratchdb.lefty.one'
);

const FETCHABLE_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:', 'ws:', 'wss:'];
const VISITABLE_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:', 'mailto:', 'steam:', 'calculator:'];

const parseURL = (url, protocols) => {
    let parsed;
    try {
        parsed = new URL(url);
    } catch (e) {
        return null;
    }
    if (!protocols.includes(parsed.protocol)) {
        return null;
    }
    return parsed;
};

let allowedAudio = false;
let allowedVideo = false;
let allowedReadClipboard = false;
let allowedNotify = false;
let allowedGeolocation = false;

const SECURITY_MANAGER_METHODS = [
    'getSandboxMode',
    'canLoadExtensionFromProject',
    'batchLoadExtensions',
    'canFetch',
    'canOpenWindow',
    'canRedirect',
    'canRecordAudio',
    'canRecordVideo',
    'canReadClipboard',
    'canNotify',
    'canGeolocate',
    'canEmbed',
    'canDownload',
    'registerExtension',
    'checkPermissionAndShowModal'
];

const registeredExtensions = new Map();

let securityManagerInstance = null;

class TWSecurityManagerComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, ['handleAllowed', 'handleDenied', 'handleDefaultPermissionChange', 'closeExtensionPermissionModal']);
        bindAll(this, SECURITY_MANAGER_METHODS);
        this.nextModalCallbacks = [];
        this.modalLocked = false;
        this.extensionModalQueue = [];
        
        
        this.acknowledgedBatchExtensions = new Set();
        this.state = {
            type: null,
            data: null,
            callback: null,
            modalCount: 0,
            showExtensionPermissionModal: false,
            pendingExtension: null
        };
        securityManagerInstance = this;
    }

    async registerExtension (extensionId, extensionName, permissions) {
        const runtime = this.props.vm?.runtime;

        if (runtime) {
            runtime.extensionPermissions = runtime.extensionPermissions || {};
        }

        const requested = (permissions || []).filter(p => PERMISSION_TYPES && Object.values(PERMISSION_TYPES).includes(p));
        const hasAppLevelPermissions = requested.length > 0;

        let granted = {};
        let pruned = [];

        if (hasAppLevelPermissions) {
            
            const existing = loadExtensionPermissions(extensionId);
            const defaults = loadDefaults();
            requested.forEach(perm => {
                granted[perm] = (existing && existing[perm] !== undefined)
                    ? existing[perm]
                    : (defaults[perm] || getDefaultPermissionSetting(perm));
            });
            saveExtensionPermissions(extensionId, granted);
            this.props.registerExtensionPermissions(extensionId, granted);
            if (runtime) {
                runtime.extensionPermissions[extensionId] = granted;
            }

            
            try {
                if (typeof EditorPreload !== 'undefined' && EditorPreload.registerExtensionPermissions) {
                    const result = await EditorPreload.registerExtensionPermissions(extensionId, requested, extensionName || extensionId);
                    const serverGranted = (result && result.permissions) || granted;
                    const serverPruned = (result && result.pruned) || [];
                    
                    granted = serverGranted;
                    pruned = serverPruned;
                    saveExtensionPermissions(extensionId, granted);
                    this.props.registerExtensionPermissions(extensionId, granted);
                    if (runtime) {
                        runtime.extensionPermissions[extensionId] = granted;
                    }
                }
            } catch (e) {
                
            }

            const alreadyQueued = this.extensionModalQueue.some(e => e.id === extensionId);

            
            const baseId = extensionId.replace(/#\d+$/, '');
            const previewedInBatch = Boolean(this.acknowledgedBatchExtensions) &&
                this.acknowledgedBatchExtensions.has(baseId);
            if (previewedInBatch) {
                
                this.acknowledgedBatchExtensions.delete(baseId);
                
                const runtimeEnabled = this.props.vm?.runtime;
                if (runtimeEnabled) {
                    runtimeEnabled.cysoCoreEnabled = true;
                    this.props.setCYSOCoreEnabled(true);
                    if (typeof EditorPreload !== 'undefined') {
                        EditorPreload.setCYSOCoreEnabled(true);
                    }
                }
            }

            if (!alreadyQueued && !previewedInBatch) {
                this.extensionModalQueue.push({
                    id: extensionId,
                    name: extensionName || extensionId,
                    permissions: requested,
                    granted,
                    pruned
                });
            }
            this.flushExtensionPermissionQueue();
        } else if (runtime) {
            runtime.extensionPermissions[extensionId] = {};
        }

        let extensionIcon = null;
        let extensionColor = null;
        if (runtime && runtime._blockInfo) {
            const blockInfo = runtime._blockInfo.find(info => info.id === extensionId);
            if (blockInfo) {
                extensionIcon = blockInfo.menuIconURI || blockInfo.blockIconURI || null;
                extensionColor = blockInfo.color1 || null;
            }
        }

        registeredExtensions.set(extensionId, {
            id: extensionId,
            name: extensionName || extensionId,
            icon: extensionIcon,
            color: extensionColor,
            permissions: requested
        });

        this.props.addLoadedExtension(
            extensionId,
            extensionName || extensionId,
            requested,
            extensionIcon,
            extensionColor
        );
    }

    
    setCurrentExtensionId (extensionId) {
        if (typeof window !== 'undefined') {
            window.__cysoCurrentExtensionId = extensionId || null;
        }
    }

    
    
    
    
    
    checkPermission (permissionType, extensionId = getCurrentExtensionId()) {
        recordPermissionUse(permissionType);

        if (!extensionId) {
            
            
            return {result: null, handled: false};
        }

        const extPerms = loadExtensionPermissions(extensionId);

        if (extPerms && Object.prototype.hasOwnProperty.call(extPerms, permissionType)) {
            const setting = extPerms[permissionType];
            if (setting === PERMISSION_SETTINGS.ALWAYS) {
                return {result: true, handled: true};
            }
            if (setting === PERMISSION_SETTINGS.DENY) {
                return {result: false, handled: true};
            }
            if (setting === PERMISSION_SETTINGS.ASK) {
                return {result: null, handled: false, ask: true};
            }
        }

        
        return {result: false, handled: true, notRequested: true};
    }

    async checkPermissionAndShowModal (permissionType, modalData = {}) {
        const permCheck = this.checkPermission(permissionType);

        if (permCheck.handled) {
            return permCheck.result;
        }

        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.CustomPermission, {
                extensionId: getCurrentExtensionId(),
                permissionType,
                ...modalData
            });
        }

        return true;
    }

    async acquireModalLock () {
        if (this.modalLocked) {
            await new Promise(resolve => {
                this.nextModalCallbacks.push(resolve);
            });
        } else {
            this.modalLocked = true;
        }

        const releaseLock = () => {
            if (this.nextModalCallbacks.length) {
                const nextModalCallback = this.nextModalCallbacks.shift();
                nextModalCallback();
            } else {
                this.modalLocked = false;
                this.setState({type: null});
            }
        };

        const showModal = async (type, data) => {
            const result = await new Promise(resolve => {
                this.setState(oldState => ({
                    type,
                    data,
                    callback: resolve,
                    modalCount: oldState.modalCount + 1
                }));
            });
            releaseLock();
            return result;
        };

        return {showModal, releaseLock};
    }

    handleAllowed () {
        
        if (this.state.type === SecurityModals.BatchLoadExtensions && this.state.data.extensions) {
            this.state.callback(this.state.data.extensions);
        } else {
            this.state.callback(true);
        }
    }

    handleDenied () {
        if (this.state.type === SecurityModals.BatchLoadExtensions) {
            this.acknowledgedBatchExtensions = new Set();
        }
        this.state.callback(false);
    }

    handleDefaultPermissionChange (permissionType, setting) {
        
        this.props.setDefaultPermission(permissionType, setting);

        saveDefaults({ [permissionType]: setting });

        if (typeof EditorPreload !== 'undefined' && EditorPreload.setDefault) {
            EditorPreload.setDefault(permissionType, setting);
        }

        const runtime = this.props.vm?.runtime;
        if (runtime && runtime.cysoCoreEnabled && this.props.vm.storeCYSOConfig) {
            this.props.vm.storeCYSOConfig();
        }
    }

    flushExtensionPermissionQueue () {
        if (this.state.showExtensionPermissionModal) {
            return;
        }
        if (this.extensionModalQueue.length === 0) {
            return;
        }
        const next = this.extensionModalQueue.shift();
        this.setState({
            showExtensionPermissionModal: true,
            pendingExtension: next
        });
    }

    closeExtensionPermissionModal () {
        
        
        const runtime = this.props.vm?.runtime;
        if (runtime) {
            runtime.cysoCoreEnabled = true;
            this.props.setCYSOCoreEnabled(true);
            if (typeof EditorPreload !== 'undefined') {
                EditorPreload.setCYSOCoreEnabled(true);
            }
            this.props.vm.storeCYSOConfig();
        }

        this.setState({
            showExtensionPermissionModal: false,
            pendingExtension: null
        }, () => {
            this.flushExtensionPermissionQueue();
        });
    }

    componentDidMount () {
        this.updateSecurityManagerMethods();
        this.setupEditorPreloadWrapper();
        
        window.addEventListener('cysoCoreLoaded', this.handleCysoCoreLoaded);
        
        if (this.props.vm) {
            this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);
        }
        
        const defaults = loadDefaults();
        Object.entries(defaults).forEach(([permType, setting]) => {
            if (setting) this.props.setDefaultPermission(permType, setting);
        });
    }

    componentDidUpdate (prevProps) {
        if (prevProps.cysoCoreEnabled !== this.props.cysoCoreEnabled) {
            this.updateSecurityManagerMethods();
        }
        
        if (!prevProps.vm && this.props.vm) {
            this.props.vm.addListener('EXTENSION_ADDED', this.handleExtensionAdded);
        }
        
        if (!prevProps.cysoCoreEnabled && this.props.vm && this.props.vm.runtime) {
            const runtime = this.props.vm.runtime;
            if (runtime.cysoCoreEnabled) {
                this.props.setCYSOCoreEnabled(true);
                const extPerms = runtime.extensionPermissions || {};
                Object.entries(extPerms).forEach(([extId, perms]) => {
                    if (perms && typeof perms === 'object') {
                        this.props.registerExtensionPermissions(extId, perms);
                        saveExtensionPermissions(extId, perms);
                    }
                });
                if (typeof EditorPreload !== 'undefined') {
                    EditorPreload.setCYSOCoreEnabled(true);
                }
            }
        }
    }

    componentWillUnmount () {
        window.removeEventListener('cysoCoreLoaded', this.handleCysoCoreLoaded);
        
        if (this.props.vm) {
            this.props.vm.removeListener('EXTENSION_ADDED', this.handleExtensionAdded);
        }
    }

    handleExtensionAdded = (categoryInfo) => {
        if (categoryInfo && categoryInfo.id) {
            const extensionId = categoryInfo.id;
            const icon = categoryInfo.menuIconURI || categoryInfo.blockIconURI || null;
            const color = categoryInfo.color1 || null;
            const name = categoryInfo.name || extensionId;
            
            const existingExt = registeredExtensions.get(extensionId);
            
            const finalIcon = icon || existingExt?.icon || null;
            const finalColor = color || existingExt?.color || null;
            
            registeredExtensions.set(extensionId, {
                id: extensionId,
                name: name,
                icon: finalIcon,
                color: finalColor,
                permissions: existingExt?.permissions || []
            });
            
            this.props.addLoadedExtension(
                extensionId,
                name,
                existingExt?.permissions || [],
                finalIcon,
                finalColor
            );
        }
    };

    handleCysoCoreLoaded = (event) => {
        const {cysoCoreEnabled, extensionPermissions} = event.detail;
        if (cysoCoreEnabled) {
            this.props.setCYSOCoreEnabled(true);
            const extPerms = extensionPermissions || {};
            Object.entries(extPerms).forEach(([extId, perms]) => {
                if (perms && typeof perms === 'object') {
                    this.props.registerExtensionPermissions(extId, perms);
                    saveExtensionPermissions(extId, perms);
                }
            });
            if (typeof EditorPreload !== 'undefined') {
                EditorPreload.setCYSOCoreEnabled(true);
            }
        }
    };

    updateSecurityManagerMethods () {
        const vmSecurityManager = this.props.vm.extensionManager.securityManager;
        const propsSecurityManager = this.props.securityManager;
        for (const method of SECURITY_MANAGER_METHODS) {
            vmSecurityManager[method] = propsSecurityManager[method] || this[method];
        }
    }

    setupEditorPreloadWrapper () {
        if (typeof EditorPreload === 'undefined') return;
        
        const self = this;
        
        const wrapMethod = (originalMethod, permissionType, getDataFn) => {
            return async function (...args) {
                const modalData = getDataFn ? getDataFn(...args) : {};
                const allowed = await self.checkPermissionAndShowModal(permissionType, modalData);
                if (!allowed) {
                    return {success: false, error: 'Permission denied'};
                }
                return originalMethod.apply(this, args);
            };
        };

        try {
            const originalExecuteCommand = EditorPreload.executeCommand;
            Object.defineProperty(EditorPreload, 'executeCommand', {
                value: wrapMethod(originalExecuteCommand, PERMISSION_TYPES.SYSTEM_COMMAND, (cmd, opts) => ({command: cmd})),
                writable: true,
                configurable: true
            });

            const originalReadFile = EditorPreload.readFile;
            Object.defineProperty(EditorPreload, 'readFile', {
                value: wrapMethod(originalReadFile, PERMISSION_TYPES.FILE_READ, (path) => ({filePath: path})),
                writable: true,
                configurable: true
            });

            const originalWriteFile = EditorPreload.writeFile;
            Object.defineProperty(EditorPreload, 'writeFile', {
                value: wrapMethod(originalWriteFile, PERMISSION_TYPES.FILE_WRITE, (path) => ({filePath: path})),
                writable: true,
                configurable: true
            });

            const originalDeleteFile = EditorPreload.deleteFile;
            Object.defineProperty(EditorPreload, 'deleteFile', {
                value: wrapMethod(originalDeleteFile, PERMISSION_TYPES.FILE_DELETE, (path) => ({filePath: path})),
                writable: true,
                configurable: true
            });

            const originalCreateFolder = EditorPreload.createFolder;
            Object.defineProperty(EditorPreload, 'createFolder', {
                value: wrapMethod(originalCreateFolder, PERMISSION_TYPES.FILE_WRITE, (path) => ({folderPath: path})),
                writable: true,
                configurable: true
            });

            const originalFileExists = EditorPreload.fileExists;
            Object.defineProperty(EditorPreload, 'fileExists', {
                value: wrapMethod(originalFileExists, PERMISSION_TYPES.FILE_READ, (path) => ({filePath: path})),
                writable: true,
                configurable: true
            });

            const originalGetFileStats = EditorPreload.getFileStats;
            Object.defineProperty(EditorPreload, 'getFileStats', {
                value: wrapMethod(originalGetFileStats, PERMISSION_TYPES.FILE_READ, (path) => ({filePath: path})),
                writable: true,
                configurable: true
            });

            const originalReadLocalFolder = EditorPreload.readLocalFolder;
            Object.defineProperty(EditorPreload, 'readLocalFolder', {
                value: wrapMethod(originalReadLocalFolder, PERMISSION_TYPES.FILE_READ, (path) => ({folderPath: path})),
                writable: true,
                configurable: true
            });
        } catch (e) {
        }
    }

    getSandboxMode (url) {
        if (this.props.cysoCoreEnabled) {
            return 'unsandboxed';
        }
        if (isTrustedExtension(url)) {
            return 'unsandboxed';
        }
        
        if (extensionsTrustedByUser.has(url)) {
            return 'unsandboxed';
        }
        
        const runtime = this.props.vm?.runtime;
        if (runtime && runtime.extensionPermissions) {
            
            const queryMatch = url.match(/[?&]extensionId=([a-zA-Z0-9_-]+)/);
            const pathMatch = url.match(/\/([a-zA-Z0-9_-]+)(?:\.[a-z0-9]+)?(?:\?.*)?$/i);
            const extId = (queryMatch && queryMatch[1]) || (pathMatch && pathMatch[1]);
            if (extId) {
                const extPerms = runtime.extensionPermissions[extId];
                
                if (extPerms && Object.keys(extPerms).length > 0) {
                    return 'unsandboxed';
                }
            }
        }
        return 'iframe';
    }

    handleChangeUnsandboxed (e) {
        const checked = e.target.checked;
        this.setState(oldState => ({
            data: {...oldState.data, unsandboxed: checked}
        }));
    }

    async canLoadExtensionFromProject (url) {
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        if (isTrustedExtension(url)) {
            return true;
        }

        
        const {showModal} = await this.acquireModalLock();
        if (url.startsWith('data:')) {
            const allowed = await showModal(SecurityModals.LoadExtension, {
                url,
                unsandboxed: true,
                onChangeUnsandboxed: this.handleChangeUnsandboxed.bind(this)
            });
            if (allowed) {
                setPersistedUnsandboxed(this.state.data.unsandboxed);
                if (this.state.data.unsandboxed) {
                    extensionsTrustedByUser.add(url);
                } else {
                    extensionsTrustedByUser.delete(url);
                }
            }
            return allowed;
        }
        const allowed = await showModal(SecurityModals.LoadExtension, {
            url,
            unsandboxed: true,
            onChangeUnsandboxed: this.handleChangeUnsandboxed.bind(this)
        });
        if (allowed) {
            if (this.state.data.unsandboxed) {
                extensionsTrustedByUser.add(url);
            } else {
                extensionsTrustedByUser.delete(url);
            }
        }
        return allowed;
    }
    
    
    async batchLoadExtensions (extensionUrls) {
        if (this.props.cysoCoreEnabled) {
            return extensionUrls.map(() => true);
        }

        
        const candidates = extensionUrls
            .map((url, index) => ({url, index}))
            .filter(({url}) => !isTrustedExtension(url));

        // Decode CYSO sources up front so we get correct ids/names and the real
        // source code for the detail panel. Remote CYSO extensions are fetched in
        // parallel (non-blocking on the UI thread); everything else is decoded
        // synchronously. Heavy permission scanning is intentionally NOT done here
        // — it happens lazily in the modal for the selected extension only.
        const buildOne = async ({url, index}) => {
            const baseIsCyso = isCYSOModeExtension(url);
            let source = decodeExtensionSource(url);
            if (source == null && baseIsCyso && isRemoteExtensionUrl(url)) {
                source = await fetchExtensionSource(url);
            }
            const info = extractExtensionInfo(source);
            const isCysoCore = baseIsCyso || info.isCysoCore;

            const extensionId = this._extractExtensionId(url);
            let name;
            let realId;
            if (isCysoCore) {
                name = localizeExtensionName(info.name, source) || 'CYSO CORE';
                realId = info.id || 'CYSO CORE';
            } else if (url.startsWith('data:')) {
                name = localizeExtensionName(info.name, source) || '自定义扩展';
                realId = info.id || 'custom_extension';
            } else {
                name = localizeExtensionName(info.name, source) || extensionId || `Extension ${index + 1}`;
                realId = info.id || extensionId || `ext_${index}`;
            }

            return {
                id: `ext_${index}`,
                url,
                source: source || null,
                name,
                realId,
                isCysoCore,
                imported: true,
                unsandboxed: true
            };
        };

        const built = await Promise.all(candidates.map(buildOne));
        const normalExtensions = built.filter(e => !e.isCysoCore);
        const cysoCoreExtensions = built.filter(e => e.isCysoCore);

        if (normalExtensions.length === 0 && cysoCoreExtensions.length === 0) {
            return extensionUrls.map(() => true);
        }

        const allExtensions = [...normalExtensions, ...cysoCoreExtensions];

        
        const {showModal} = await this.acquireModalLock();
        
        this.acknowledgedBatchExtensions = new Set(
            cysoCoreExtensions.map(e => e.realId)
        );

        const result = await showModal(SecurityModals.BatchLoadExtensions, {
            extensions: allExtensions,
            onToggleImport: this._handleToggleImport.bind(this),
            onToggleUnsandboxed: this._handleToggleUnsandboxed.bind(this)
        });

        
        if (result && Array.isArray(result)) {
            const chosenExtensions = result;

            
            chosenExtensions.forEach(ext => {
                if (ext.imported && ext.unsandboxed) {
                    extensionsTrustedByUser.add(ext.url);
                } else {
                    extensionsTrustedByUser.delete(ext.url);
                }
            });

            
            return extensionUrls.map(url => {
                const ext = chosenExtensions.find(e => e.url === url);
                return ext ? ext.imported : true;
            });
        }

        
        return extensionUrls.map(url => isTrustedExtension(url));
    }
    
    _extractExtensionId (url) {
        if (url.startsWith('data:')) {
            return 'custom_extension';
        }
        const match = url.match(/\/([^\/]+)\.js$/);
        if (match) {
            return match[1];
        }
        return null;
    }
    
    _handleToggleImport (extensionId) {
        this.setState(oldState => ({
            data: {
                ...oldState.data,
                extensions: oldState.data.extensions.map(ext => 
                    ext.id === extensionId ? {...ext, imported: !ext.imported} : ext
                )
            }
        }));
    }
    
    _handleToggleUnsandboxed (extensionId) {
        this.setState(oldState => ({
            data: {
                ...oldState.data,
                extensions: oldState.data.extensions.map(ext => 
                    ext.id === extensionId ? {...ext, unsandboxed: !ext.unsandboxed} : ext
                )
            }
        }));
    }

    async canFetch (url) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) return false;

        const permCheck = this.checkPermission(PERMISSION_TYPES.NETWORK_FETCH);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.Fetch, {url});
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        if (isAlwaysTrustedForFetching(parsed)) {
            return true;
        }
        
        const {showModal, releaseLock} = await this.acquireModalLock();
        const host = (parsed.protocol === 'http:' || parsed.protocol === 'https:' || 
                      parsed.protocol === 'ws:' || parsed.protocol === 'wss:') ? parsed.host : null;
        if (host && fetchHostsTrustedByUser.has(host)) {
            releaseLock();
            return true;
        }
        const allowed = await showModal(SecurityModals.Fetch, {url});
        if (host && allowed) fetchHostsTrustedByUser.add(host);
        return allowed;
    }

    async canOpenWindow (url) {
        const parsed = parseURL(url, VISITABLE_PROTOCOLS);
        if (!parsed) return false;

        const permCheck = this.checkPermission(PERMISSION_TYPES.NETWORK_OPEN_URL);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.OpenWindow, {url});
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.OpenWindow, {url});
    }

    async canRedirect (url) {
        const parsed = parseURL(url, VISITABLE_PROTOCOLS);
        if (!parsed) return false;

        const permCheck = this.checkPermission(PERMISSION_TYPES.NETWORK_OPEN_URL);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.Redirect, {url});
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.Redirect, {url});
    }

    async canRecordAudio () {
        const permCheck = this.checkPermission(PERMISSION_TYPES.DEVICE_MICROPHONE);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.RecordAudio);
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        if (!allowedAudio) {
            const {showModal} = await this.acquireModalLock();
            allowedAudio = await showModal(SecurityModals.RecordAudio);
        }
        return allowedAudio;
    }

    async canRecordVideo () {
        const permCheck = this.checkPermission(PERMISSION_TYPES.DEVICE_CAMERA);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.RecordVideo);
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        if (!allowedVideo) {
            const {showModal} = await this.acquireModalLock();
            allowedVideo = await showModal(SecurityModals.RecordVideo);
        }
        return allowedVideo;
    }

    async canReadClipboard () {
        const permCheck = this.checkPermission(PERMISSION_TYPES.CLIPBOARD_READ);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.ReadClipboard);
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        if (!allowedReadClipboard) {
            const {showModal} = await this.acquireModalLock();
            allowedReadClipboard = await showModal(SecurityModals.ReadClipboard);
        }
        return allowedReadClipboard;
    }

    async canNotify () {
        const permCheck = this.checkPermission(PERMISSION_TYPES.SYSTEM_NOTIFICATION);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.Notify);
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        if (!allowedNotify) {
            const {showModal} = await this.acquireModalLock();
            allowedNotify = await showModal(SecurityModals.Notify);
        }
        return allowedNotify;
    }

    async canGeolocate () {
        const permCheck = this.checkPermission(PERMISSION_TYPES.DEVICE_GEOLOCATION);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.Geolocate);
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        if (!allowedGeolocation) {
            const {showModal} = await this.acquireModalLock();
            allowedGeolocation = await showModal(SecurityModals.Geolocate);
        }
        return allowedGeolocation;
    }

    async canEmbed (url) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) return false;

        const permCheck = this.checkPermission(PERMISSION_TYPES.NETWORK_FETCH);

        if (permCheck.handled && !permCheck.notRequested) {
            return permCheck.result;
        }

        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.Embed, {url});
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        const host = (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.host : null;
        const {showModal, releaseLock} = await this.acquireModalLock();
        if (host && embedHostsTrustedByUser.has(host)) {
            releaseLock();
            return true;
        }
        const allowed = await showModal(SecurityModals.Embed, {url});
        if (host && allowed) embedHostsTrustedByUser.add(host);
        return allowed;
    }

    async canDownload (url, name) {
        const parsed = parseURL(url, FETCHABLE_PROTOCOLS);
        if (!parsed) return false;

        const permCheck = this.checkPermission(PERMISSION_TYPES.FILE_WRITE);
        
        if (permCheck.handled) {
            return permCheck.result;
        }
        
        if (permCheck.ask) {
            const {showModal} = await this.acquireModalLock();
            return showModal(SecurityModals.Download, {url, name});
        }
        
        if (this.props.cysoCoreEnabled) {
            return true;
        }
        
        const {showModal} = await this.acquireModalLock();
        return showModal(SecurityModals.Download, {url, name});
    }

    render () {
        if (this.state.type) {
            return (
                <React.Fragment>
                    <SecurityManagerModal
                        type={this.state.type}
                        data={this.state.data}
                        onAllowed={this.handleAllowed}
                        onDenied={this.handleDenied}
                        isDarkMode={this.props.theme ? this.props.theme.isDark() : false}
                        key={this.state.modalCount}
                    />
                    {this.state.showExtensionPermissionModal && (
                        <ExtensionPermissionModal
                            extension={this.state.pendingExtension}
                            permissions={this.state.pendingExtension ? this.state.pendingExtension.permissions : []}
                            onClose={this.closeExtensionPermissionModal.bind(this)}
                            isDarkMode={this.props.theme ? this.props.theme.isDark() : false}
                        />
                    )}
                </React.Fragment>
            );
        }
        if (this.state.showExtensionPermissionModal) {
            return (
            <ExtensionPermissionModal
                extension={this.state.pendingExtension}
                permissions={this.state.pendingExtension ? this.state.pendingExtension.permissions : []}
                onClose={this.closeExtensionPermissionModal.bind(this)}
                isDarkMode={this.props.theme ? this.props.theme.isDark() : false}
            />
            );
        }
        return null;
    }
}

TWSecurityManagerComponent.propTypes = {
    vm: PropTypes.shape({
        extensionManager: PropTypes.shape({
            securityManager: PropTypes.shape(
                SECURITY_MANAGER_METHODS.reduce((obj, method) => {
                    obj[method] = PropTypes.func;
                    return obj;
                }, {})
            )
        }),
        runtime: PropTypes.shape({
            cysoCoreEnabled: PropTypes.bool,
            extensionPermissions: PropTypes.object
        })
    }),
    securityManager: PropTypes.shape(Object.fromEntries(SECURITY_MANAGER_METHODS.map(i => [i, PropTypes.func]))),
    cysoCoreEnabled: PropTypes.bool,
    defaults: PropTypes.object,
    extensionPermissions: PropTypes.object,
    addLoadedExtension: PropTypes.func
};

TWSecurityManagerComponent.defaultProps = {
    securityManager: {}
};

const mapStateToProps = state => ({
    vm: state.scratchGui.vm,
    cysoCoreEnabled: state.scratchGui.tw.cysoCoreEnabled,
    defaults: state.scratchGui.tw.defaults,
    extensionPermissions: state.scratchGui.tw.extensionPermissions,
    loadedExtensions: state.scratchGui.tw.loadedExtensions,
    theme: state.scratchGui.theme && state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    addLoadedExtension: (extensionId, extensionName, permissions, extensionIcon, extensionColor) =>
        dispatch(addLoadedExtension(extensionId, extensionName, permissions, extensionIcon, extensionColor)),
    setDefaultPermission: (permissionType, setting) =>
        dispatch(setDefaultPermission(permissionType, setting)),
    setExtensionPermission: (extensionId, permissionType, setting) =>
        dispatch(setExtensionPermission(extensionId, permissionType, setting)),
    registerExtensionPermissions: (extensionId, permissions) =>
        dispatch(registerExtensionPermissions(extensionId, permissions)),
    setCYSOCoreEnabled: (enabled) => dispatch(setCYSOCoreEnabled(enabled))
});

const ConnectedSecurityManagerComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(TWSecurityManagerComponent);

export {
    ConnectedSecurityManagerComponent as default,
    manuallyTrustExtension,
    isTrustedExtension
};
