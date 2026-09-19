import bindAll from 'lodash.bindall';
import defaultsDeep from 'lodash.defaultsdeep';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import VMScratchBlocks from '../lib/blocks';
import makeToolboxXML from '../lib/make-toolbox-xml';
import {injectExtensionCategoryTheme} from '../lib/themes/blockHelpers';
import {BLOCKS_DEFAULT_SCALE} from '../lib/layout-constants';
import {Theme} from '../lib/themes';
import workspaceRegistry from '../lib/workspace-registry';

import WorkspaceWindowComponent from '../components/workspace-window/workspace-window.jsx';

import {
    addTargetToWindow,
    closeWorkspaceWindow,
    createWorkspaceWindow,
    focusWorkspaceWindow,
    moveTabToWindow,
    moveWorkspaceWindow,
    removeTargetFromWindow,
    resizeWorkspaceWindow,
    setActiveTarget
} from '../reducers/workspace-windows';

const defaultWorkspaceOptions = {
    zoom: {
        controls: true,
        wheel: true,
        startScale: BLOCKS_DEFAULT_SCALE
    },
    grid: {
        spacing: 40,
        length: 2,
        colour: '#ddd'
    },
    comments: true,
    collapse: false,
    sounds: false
};

const MENU_BAR_HEIGHT = 48;
const SNAP_DISTANCE = 12;
const REFRESH_THROTTLE_MS = 200;
const TAB_DRAG_TYPE = 'application/x-cyso-workspace-tab';
const EMPTY_TARGET_IDS = [];
const EMPTY_NAMES = {};

class WorkspaceWindow extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'detachVM',
            'getToolboxXML',
            'loadBlocksForTarget',
            'setBlocksHost',
            'setWindowRef',
            'handleAddTabClick',
            'handleCloseWindow',
            'handleCloseTab',
            'handleDropTab',
            'handleDragEnter',
            'handleDragLeave',
            'handleFocus',
            'handleMouseDownCapture',
            'handleMouseMove',
            'handleMouseUp',
            'handleResizeStart',
            'handleSetActiveTab',
            'handleTabDragStart',
            'handleTitleBarMouseDown',
            'handleToggleBlockMenu',
            'handleToggleMaximize',
            'handleOpenInNewWindow',
            'handleVmTargetsUpdate',
            'handleDocumentMouseDown',
            'handleDocumentKeyDown',
            'refreshIfChanged',
            'resetDragOver',
            'snapToNeighbors'
        ]);
        this.ScratchBlocks = VMScratchBlocks(props.vm, false);
        this.dragState = null;
        this.resizeState = null;
        this.dragEnterCount = 0;
        this.lastLoadedXml = null;
        this.lastLoadedToolbox = null;
        this.restoreRect = null;
        this.state = {
            blockMenuId: null,
            dragOver: false,
            dimmed: false,
            maximized: false
        };
    }
    componentDidMount () {
        this.setupWorkspace();
        this.markScrollbarHost();
        this.props.vm.addListener('targetsUpdate', this.handleVmTargetsUpdate);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('mousedown', this.handleDocumentMouseDown);
        document.addEventListener('keydown', this.handleDocumentKeyDown);
        document.addEventListener('dragend', this.resetDragOver);
        document.addEventListener('drop', this.resetDragOver);
        this.registerInWorkspaceRegistry();
    }
    componentDidUpdate (prevProps) {
        if (this.props.activeTargetId !== prevProps.activeTargetId) {
            this.loadBlocksForTarget(this.props.activeTargetId);
            this.registerInWorkspaceRegistry();
        }
    }
    componentWillUnmount () {
        if (this.hostObserver) {
            this.hostObserver.disconnect();
            this.hostObserver = null;
        }
        if (this.updateFrame) {
            cancelAnimationFrame(this.updateFrame);
            this.updateFrame = null;
        }
        this.pendingWindowUpdate = null;
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = null;
        }
        this.props.vm.removeListener('targetsUpdate', this.handleVmTargetsUpdate);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        document.removeEventListener('dragend', this.resetDragOver);
        document.removeEventListener('drop', this.resetDragOver);
        workspaceRegistry.unregisterWorkspace(this.props.windowId);
        this.detachVM();
        if (this.workspace) {
            this.workspace.dispose();
            this.workspace = null;
        }
    }
    resizeWorkspace () {
        if (!this.workspace) return;
        try {
            this.ScratchBlocks.svgResize(this.workspace);
        } catch {
        }
    }
    registerInWorkspaceRegistry () {
        workspaceRegistry.registerWorkspace(
            this.props.windowId,
            this.workspace,
            this.blocksHost,
            this.props.activeTargetId,
            this.handleFocus
        );
    }
    markScrollbarHost () {
        if (this.blocksHost) this.blocksHost.setAttribute('data-ww-scrollbar-host', 'true');
    }
    setupWorkspace () {
        if (typeof ResizeObserver !== 'undefined' && this.blocksHost && !this.hostObserver) {
            this.hostSize = null;
            this.hostObserver = new ResizeObserver(entries => {
                const entry = entries && entries[0];
                if (!entry) return;
                const box = entry.contentRect || {};
                const width = Math.round(box.width || 0);
                const height = Math.round(box.height || 0);
                if (!width || !height) return;
                if (this.hostSize && this.hostSize.width === width && this.hostSize.height === height) return;
                this.hostSize = {width: width, height: height};
                this.resizeWorkspace();
            });
            this.hostObserver.observe(this.blocksHost);
        }
        const toolboxXML = this.getToolboxXML(this.props.activeTargetId);
        const workspaceConfig = defaultsDeep({},
            this.props.options,
            {
                rtl: this.props.isRtl,
                toolbox: toolboxXML,
                colours: this.props.theme.getBlockColors(),
                grid: {
                    colour: this.props.theme.getBlockColors().gridColor
                }
            },
            defaultWorkspaceOptions
        );
        this.workspace = this.ScratchBlocks.inject(this.blocksHost, workspaceConfig);

        if (toolboxXML) {
            const toolboxWorkspace = this.workspace.getFlyout().getWorkspace();
            const varListButtonCallback = type =>
                (() => this.ScratchBlocks.Variables.createVariable(this.workspace, null, type));
            const procButtonCallback = () => {
                this.ScratchBlocks.Procedures.createProcedureDefCallback_(this.workspace);
            };
            toolboxWorkspace.registerButtonCallback('MAKE_A_VARIABLE', varListButtonCallback(''));
            toolboxWorkspace.registerButtonCallback('MAKE_A_LIST', varListButtonCallback('list'));
            toolboxWorkspace.registerButtonCallback('MAKE_A_PROCEDURE', procButtonCallback);
            toolboxWorkspace.registerButtonCallback('EXTENSION_CALLBACK', block => {
                this.props.vm.handleExtensionButtonPress(block.callbackData_);
                setTimeout(() => {
                    this.refreshIfChanged();
                }, 500);
            });
            toolboxWorkspace.registerButtonCallback('OPEN_EXTENSION_DOCS', block => {
                const docsURI = block.callbackData_;
                const url = new URL(docsURI);
                if (url.protocol === 'http:' || url.protocol === 'https:') {
                    window.open(docsURI, '_blank');
                }
            });
        }

        this.loadBlocksForTarget(this.props.activeTargetId);
    }
    detachVM () {
        if (this.workspace && this.currentListener) {
            this.workspace.removeChangeListener(this.currentListener);
            this.currentListener = null;
        }
    }
    getToolboxXML (targetId) {
        try {
            const target = this.props.vm.runtime.getTargetById(targetId);
            if (!target) return null;
            const stage = this.props.vm.runtime.getTargetForStage();
            const stageCostumes = stage.getCostumes();
            const targetCostumes = target.getCostumes();
            const targetSounds = target.getSounds();
            const dynamicBlocksXML = injectExtensionCategoryTheme(
                this.props.vm.runtime.getBlocksXML(target),
                this.props.theme
            );
            const costumeName = targetCostumes.length > 0 ?
                targetCostumes[targetCostumes.length - 1].name : '';
            const backdropName = stageCostumes.length > 0 ?
                stageCostumes[stageCostumes.length - 1].name : '';
            const soundName = targetSounds.length > 0 ?
                targetSounds[targetSounds.length - 1].name : '';
            return makeToolboxXML(false, target.isStage, target.id, dynamicBlocksXML,
                costumeName,
                backdropName,
                soundName,
                this.props.theme.getBlockColors()
            );
        } catch (e) {
            return null;
        }
    }
    loadBlocksForTarget (targetId) {
        if (!this.workspace) return;
        const xmlString = this.props.vm.getBlocksXMLForTarget(targetId);
        if (!xmlString) return;
        const toolboxXML = this.getToolboxXML(targetId);
        if (toolboxXML && this.workspace.toolbox_) {
            this.workspace.updateToolbox(toolboxXML);
        }
        if (this.currentListener) {
            this.workspace.removeChangeListener(this.currentListener);
        }
        this.currentListener = this.props.vm.blockListenerForTarget(targetId);
        const dom = this.ScratchBlocks.Xml.textToDom(xmlString);
        try {
            this.ScratchBlocks.Xml.clearWorkspaceAndLoadFromXml(dom, this.workspace);
        } catch {
        }
        this.workspace.addChangeListener(this.currentListener);
        this.workspace.clearUndo();
        this.resizeWorkspace();
        this.lastLoadedXml = xmlString;
        this.lastLoadedToolbox = toolboxXML;
    }
    handleVmTargetsUpdate () {
        if (this.refreshTimer) return;
        this.refreshTimer = setTimeout(() => {
            this.refreshTimer = null;
            this.refreshIfChanged();
        }, REFRESH_THROTTLE_MS);
    }
    refreshIfChanged () {
        if (!this.workspace) return;
        const targetId = this.props.activeTargetId;
        if (!targetId) return;
        const xmlString = this.props.vm.getBlocksXMLForTarget(targetId);
        if (xmlString !== this.lastLoadedXml) {
            this.loadBlocksForTarget(targetId);
            return;
        }
        const toolboxXML = this.getToolboxXML(targetId);
        if (toolboxXML && this.workspace.toolbox_ && toolboxXML !== this.lastLoadedToolbox) {
            this.workspace.updateToolbox(toolboxXML);
            this.lastLoadedToolbox = toolboxXML;
        }
    }
    setBlocksHost (host) {
        this.blocksHost = host;
    }
    setWindowRef (element) {
        this.windowEl = element;
    }
    handleFocus () {
        this.props.onFocus(this.props.windowId);
    }
    handleMouseDownCapture () {
        this.props.onFocus(this.props.windowId);
    }
    handleTitleBarMouseDown (e) {
        if (e.button !== 0) return;
        if (e.target.closest('[data-no-drag]')) return;
        e.preventDefault();
        if (this.state.maximized) {
            return;
        }
        this.setState({dimmed: true});
        this.dragState = {
            startX: e.clientX,
            startY: e.clientY,
            originX: this.props.x,
            originY: this.props.y
        };
    }
    handleResizeStart (e) {
        if (e.button !== 0) return;
        e.stopPropagation();
        e.preventDefault();
        if (this.state.maximized) return;
        this.resizeState = {
            startX: e.clientX,
            startY: e.clientY,
            originWidth: this.props.width,
            originHeight: this.props.height
        };
    }
    handleMouseMove (e) {
        if (this.dragState) {
            const dx = e.clientX - this.dragState.startX;
            const dy = e.clientY - this.dragState.startY;
            const nx = Math.max(0, Math.min(this.dragState.originX + dx, window.innerWidth - 120));
            const ny = Math.max(0, Math.min(this.dragState.originY + dy, window.innerHeight - 40));
            this.scheduleWindowUpdate(() => this.props.onMove(this.props.windowId, nx, ny));
        } else if (this.resizeState) {
            const dx = e.clientX - this.resizeState.startX;
            const dy = e.clientY - this.resizeState.startY;
            const width = Math.max(280, this.resizeState.originWidth + dx);
            const height = Math.max(200, this.resizeState.originHeight + dy);
            this.scheduleWindowUpdate(() => this.props.onResize(this.props.windowId, width, height));
        }
    }
    scheduleWindowUpdate (update) {
        this.pendingWindowUpdate = update;
        if (this.updateFrame) return;
        this.updateFrame = requestAnimationFrame(() => {
            this.updateFrame = null;
            const pending = this.pendingWindowUpdate;
            this.pendingWindowUpdate = null;
            if (pending) pending();
        });
    }
    flushWindowUpdate () {
        if (this.updateFrame) {
            cancelAnimationFrame(this.updateFrame);
            this.updateFrame = null;
        }
        const pending = this.pendingWindowUpdate;
        this.pendingWindowUpdate = null;
        if (pending) pending();
    }
    handleMouseUp () {
        const wasDragging = !!this.dragState;
        if (wasDragging || this.resizeState) {
            this.flushWindowUpdate();
            this.setState({dimmed: false});
        }
        this.dragState = null;
        this.resizeState = null;
        if (wasDragging) this.snapToNeighbors();
    }
    snapToNeighbors () {
        const {x, y, width, height, windowId, siblings, onMove} = this.props;
        const xCandidates = [];
        const yCandidates = [];
        const parent = this.windowEl && this.windowEl.offsetParent;
        if (parent) {
            const rect = parent.getBoundingClientRect();
            xCandidates.push(0, rect.width - width);
            yCandidates.push(0, rect.height - height);
        }
        (siblings || []).forEach(sibling => {
            xCandidates.push(sibling.x, sibling.x + sibling.width);
            xCandidates.push(sibling.x - width, sibling.x + sibling.width - width);
            yCandidates.push(sibling.y, sibling.y + sibling.height);
            yCandidates.push(sibling.y - height, sibling.y + sibling.height - height);
        });
        const pickSnap = (value, candidates) => {
            let best = value;
            let bestDistance = SNAP_DISTANCE;
            candidates.forEach(candidate => {
                const distance = Math.abs(candidate - value);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    best = candidate;
                }
            });
            return Math.round(best);
        };
        const nextX = pickSnap(x, xCandidates);
        const nextY = pickSnap(y, yCandidates);
        if (nextX === Math.round(x) && nextY === Math.round(y)) return;
        onMove(windowId, Math.max(0, nextX), Math.max(0, nextY));
    }
    handleToggleMaximize () {
        const {windowId, onMove, onResize} = this.props;
        if (!this.state.maximized) {
            this.restoreRect = {
                x: this.props.x,
                y: this.props.y,
                width: this.props.width,
                height: this.props.height
            };
            this.setState({maximized: true});
        } else {
            const restore = this.restoreRect || {x: 40, y: MENU_BAR_HEIGHT, width: 560, height: 420};
            this.setState({maximized: false});
            onMove(windowId, restore.x, restore.y);
            onResize(windowId, restore.width, restore.height);
        }
    }
    handleCloseWindow () {
        this.props.onClose(this.props.windowId);
    }
    handleSetActiveTab (targetId) {
        this.props.onSetActiveTab(this.props.windowId, targetId);
    }
    handleCloseTab (targetId) {
        this.props.onCloseTab(this.props.windowId, targetId);
    }
    handleAddTabClick (targetId) {
        this.setState({blockMenuId: null});
        this.props.onAddTarget(this.props.windowId, targetId);
    }
    handleToggleBlockMenu () {
        this.setState({blockMenuId: this.state.blockMenuId ? null : 'open'});
    }
    handleOpenInNewWindow (targetId) {
        this.props.onOpenInNewWindow(targetId);
    }
    handleTabDragStart (e, targetId) {
        e.dataTransfer.setData(TAB_DRAG_TYPE, JSON.stringify({
            fromWindowId: this.props.windowId,
            targetId: targetId
        }));
        e.dataTransfer.effectAllowed = 'move';
        this.dragEnterCount = 0;
        this.setState({dimmed: true});
    }
    handleDropTab (e, toWindowId) {
        e.preventDefault();
        this.dragEnterCount = 0;
        this.setState({dragOver: false});
        let raw = '';
        try {
            raw = e.dataTransfer.getData(TAB_DRAG_TYPE) || e.dataTransfer.getData('text/plain');
        } catch (err) {
            raw = '';
        }
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data && data.targetId && data.fromWindowId !== toWindowId) {
                this.props.onMoveTab(data.fromWindowId, toWindowId, data.targetId);
            }
        } catch (err) {
            return;
        }
    }
    handleDragEnter (e) {
        e.preventDefault();
        if (!e.dataTransfer || !e.dataTransfer.types) return;
        if (!e.dataTransfer.types.includes(TAB_DRAG_TYPE)) return;
        this.dragEnterCount += 1;
        this.setState({dragOver: true});
    }
    handleDragLeave () {
        this.dragEnterCount = Math.max(0, this.dragEnterCount - 1);
        if (this.dragEnterCount === 0) {
            this.setState({dragOver: false});
        }
    }
    resetDragOver () {
        this.dragEnterCount = 0;
        this.setState({dragOver: false, dimmed: false});
    }
    handleDocumentMouseDown (e) {
        if (!this.state.blockMenuId) return;
        const element = e.target;
        if (element && element.closest &&
            (element.closest('[data-ww-picker]') || element.closest('[data-ww-add-tab]'))) return;
        this.setState({blockMenuId: null});
    }
    handleDocumentKeyDown (e) {
        if (!this.state.blockMenuId) return;
        if (e.key === 'Escape' || e.keyCode === 27) {
            this.setState({blockMenuId: null});
        }
    }
    render () {
        const {
            windowId,
            activeTargetId,
            x,
            y,
            width,
            height,
            zIndex,
            targets,
            targetIds,
            windowNames,
            isRtl,
            isFocused
        } = this.props;
        return (
            <WorkspaceWindowComponent
                activeTargetId={activeTargetId}
                blockMenuId={this.state.blockMenuId}
                componentRef={this.setWindowRef}
                dimmed={this.state.dimmed}
                dragOver={this.state.dragOver}
                height={height}
                id={windowId}
                isDropTarget={this.props.isDropTarget}
                isFocused={isFocused}
                isRtl={isRtl}
                maximized={this.state.maximized}
                targets={targets}
                targetIds={targetIds}
                width={width}
                windowNames={windowNames}
                x={x}
                y={y}
                zIndex={zIndex}
                onAddTabClick={this.handleAddTabClick}
                onCloseWindow={this.handleCloseWindow}
                onCloseTab={this.handleCloseTab}
                onDropTab={this.handleDropTab}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                onMouseDownCapture={this.handleMouseDownCapture}
                onOpenTargetInNewWindow={this.handleOpenInNewWindow}
                onResizeStart={this.handleResizeStart}
                onSetActiveTab={this.handleSetActiveTab}
                onTabDragStart={this.handleTabDragStart}
                onTitleBarMouseDown={this.handleTitleBarMouseDown}
                onToggleBlockMenu={this.handleToggleBlockMenu}
                onToggleMaximize={this.handleToggleMaximize}
                setBlocksHost={this.setBlocksHost}
            />
        );
    }
}

WorkspaceWindow.propTypes = {
    activeTargetId: PropTypes.string,
    isDropTarget: PropTypes.bool,
    isFocused: PropTypes.bool,
    isRtl: PropTypes.bool,
    options: PropTypes.shape({
        media: PropTypes.string,
        zoom: PropTypes.shape({
            controls: PropTypes.bool,
            wheel: PropTypes.bool,
            startScale: PropTypes.number
        }),
        comments: PropTypes.bool,
        collapse: PropTypes.bool
    }),
    siblings: PropTypes.arrayOf(PropTypes.shape({
        height: PropTypes.number,
        width: PropTypes.number,
        x: PropTypes.number,
        y: PropTypes.number
    })),
    targetIds: PropTypes.arrayOf(PropTypes.string),
    targets: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        isStage: PropTypes.bool,
        name: PropTypes.string
    })),
    theme: PropTypes.instanceOf(Theme),
    vm: PropTypes.instanceOf(VM).isRequired,
    width: PropTypes.number,
    windowId: PropTypes.string,
    windowNames: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    x: PropTypes.number,
    y: PropTypes.number,
    zIndex: PropTypes.number,
    height: PropTypes.number,
    onAddTarget: PropTypes.func,
    onClose: PropTypes.func,
    onCloseTab: PropTypes.func,
    onDragEnter: PropTypes.func,
    onDragLeave: PropTypes.func,
    onFocus: PropTypes.func,
    onMove: PropTypes.func,
    onMoveTab: PropTypes.func,
    onOpenInNewWindow: PropTypes.func,
    onResize: PropTypes.func,
    onSetActiveTab: PropTypes.func,
    onToggleBlockMenu: PropTypes.func
};

WorkspaceWindow.defaultProps = {
    options: defaultWorkspaceOptions
};

const buildTargetObjects = (vm, allTargets) => {
    const runtime = vm && vm.runtime;
    if (runtime && Array.isArray(runtime.targets)) {
        const fromRuntime = runtime.targets
            .filter(target => target && target.isOriginal)
            .map(target => ({
                id: target.id,
                isStage: !!target.isStage,
                name: target.isStage ? 'Stage' : target.getName()
            }));
        if (fromRuntime.length > 0) return fromRuntime;
    }
    const targetObjects = [];
    if (allTargets.stage && allTargets.stage.id) {
        targetObjects.push({
            id: allTargets.stage.id,
            isStage: true,
            name: 'Stage'
        });
    }
    Object.keys(allTargets.sprites || {}).forEach(id => {
        const sprite = allTargets.sprites[id];
        targetObjects.push({
            id: id,
            isStage: false,
            name: sprite.name
        });
    });
    return targetObjects;
};

const targetListKey = (vm, allTargets) => {
    const runtime = vm && vm.runtime;
    if (runtime && Array.isArray(runtime.targets)) {
        return runtime.targets
            .filter(target => target && target.isOriginal)
            .map(target => `${target.id}:${target.isStage ? 'stage' : target.getName()}`)
            .join('|');
    }
    const sprites = allTargets && allTargets.sprites;
    const stageId = allTargets && allTargets.stage && allTargets.stage.id;
    return `fallback|${stageId || ''}|${Object.keys(sprites || {})
        .map(id => `${id}:${sprites[id] && sprites[id].name}`)
        .join('|')}`;
};

let targetObjectsCache = {key: null, value: []};

const getTargetObjects = (vm, allTargets) => {
    const key = targetListKey(vm, allTargets);
    if (targetObjectsCache.key === key) return targetObjectsCache.value;
    targetObjectsCache = {key: key, value: buildTargetObjects(vm, allTargets)};
    return targetObjectsCache.value;
};

const siblingsCache = new Map();

const getSiblings = (windows, windowId) => {
    const cached = siblingsCache.get(windowId);
    if (cached && cached.windows === windows) return cached.value;
    const value = windows
        .filter(w => w.id !== windowId)
        .map(w => ({x: w.x, y: w.y, width: w.width, height: w.height}));
    siblingsCache.set(windowId, {windows: windows, value: value});
    return value;
};

const mapStateToProps = (state, {windowId}) => {
    const allWindows = state.scratchGui.workspaceWindows.windows;
    const windowRect = allWindows.find(w => w.id === windowId);
    const vm = state.scratchGui.vm;
    return {
        activeTargetId: windowRect ? windowRect.activeTargetId : null,
        isRtl: state.locales.isRtl,
        siblings: getSiblings(allWindows, windowId),
        targetIds: (windowRect && windowRect.targets) || EMPTY_TARGET_IDS,
        targets: getTargetObjects(vm, state.scratchGui.targets || {}),
        windowNames: (windowRect && windowRect.names) || EMPTY_NAMES,
        theme: state.scratchGui.theme.theme,
        vm: vm,
        x: windowRect ? windowRect.x : 0,
        y: windowRect ? windowRect.y : 0,
        width: windowRect ? windowRect.width : 560,
        height: windowRect ? windowRect.height : 420,
        zIndex: windowRect ? windowRect.zIndex : 0
    };
};

const mapDispatchToProps = dispatch => ({
    onMove: (windowId, x, y) => dispatch(moveWorkspaceWindow(windowId, x, y)),
    onResize: (windowId, width, height) => dispatch(resizeWorkspaceWindow(windowId, width, height)),
    onClose: windowId => dispatch(closeWorkspaceWindow(windowId)),
    onSetActiveTab: (windowId, targetId) => dispatch(setActiveTarget(windowId, targetId)),
    onCloseTab: (windowId, targetId) => dispatch(removeTargetFromWindow(windowId, targetId)),
    onAddTarget: (windowId, targetId) => dispatch(addTargetToWindow(windowId, targetId)),
    onFocus: windowId => dispatch(focusWorkspaceWindow(windowId)),
    onOpenInNewWindow: targetId => dispatch(createWorkspaceWindow(targetId)),
    onMoveTab: (fromWindowId, toWindowId, targetId) =>
        dispatch(moveTabToWindow(fromWindowId, toWindowId, targetId))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WorkspaceWindow);
