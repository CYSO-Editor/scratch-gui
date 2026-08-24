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

import WorkspaceWindowComponent from '../components/workspace-window/workspace-window.jsx';

import {
    addTargetToWindow,
    closeWorkspaceWindow,
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

class WorkspaceWindow extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'detachVM',
            'getToolboxXML',
            'loadBlocksForTarget',
            'setBlocksHost',
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
            'handleVmTargetsUpdate',
            'refreshIfChanged',
            'resetDragOver'
        ]);
        this.ScratchBlocks = VMScratchBlocks(props.vm, false);
        this.dragState = null;
        this.resizeState = null;
        this.dragEnterCount = 0;
        this.lastLoadedXml = null;
        this.lastLoadedToolbox = null;
        this.state = {
            blockMenuId: null,
            dragOver: false,
            dimmed: false
        };
    }
    componentDidMount () {
        this.setupWorkspace();
        this.injectScrollbarStyle();
        this.props.vm.addListener('targetsUpdate', this.handleVmTargetsUpdate);
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
        document.addEventListener('dragend', this.resetDragOver);
        document.addEventListener('drop', this.resetDragOver);
    }
    componentDidUpdate (prevProps) {
        if (this.props.activeTargetId !== prevProps.activeTargetId) {
            this.loadBlocksForTarget(this.props.activeTargetId);
        }
    }
    componentWillUnmount () {
        this.props.vm.removeListener('targetsUpdate', this.handleVmTargetsUpdate);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('dragend', this.resetDragOver);
        document.removeEventListener('drop', this.resetDragOver);
        this.detachVM();
        if (this.workspace) {
            this.workspace.dispose();
            this.workspace = null;
        }
    }
    injectScrollbarStyle () {
        if (!this.blocksHost) return;
        this.blocksHost.setAttribute('data-ww-scrollbar-host', 'true');
        const existing = this.blocksHost.querySelector('style[data-ww-scrollbar]');
        if (existing) return;
        const style = document.createElement('style');
        style.setAttribute('data-ww-scrollbar', 'true');
        style.textContent = `
[data-ww-scrollbar-host] .blocklyScrollbarVertical {
    width: 8px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarHorizontal {
    height: 8px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarVertical .blocklyScrollbarBackground,
[data-ww-scrollbar-host] .blocklyScrollbarVertical.blocklyScrollbarBackground {
    width: 8px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarHorizontal .blocklyScrollbarBackground,
[data-ww-scrollbar-host] .blocklyScrollbarHorizontal.blocklyScrollbarBackground {
    height: 8px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarVertical .blocklyScrollbarHandle,
[data-ww-scrollbar-host] .blocklyScrollbarVertical.blocklyScrollbarHandle {
    width: 5px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarHorizontal .blocklyScrollbarHandle,
[data-ww-scrollbar-host] .blocklyScrollbarHorizontal.blocklyScrollbarHandle {
    height: 5px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarHandle {
    fill: rgba(120, 130, 150, 0.45) !important;
    rx: 3px !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarHandle:hover {
    fill: rgba(120, 130, 150, 0.7) !important;
}
[data-ww-scrollbar-host] .blocklyScrollbarBackground {
    fill: transparent !important;
}
[data-ww-scrollbar-host] .blocklyToolboxDiv {
    scrollbar-width: thin;
    scrollbar-color: rgba(120, 130, 150, 0.45) transparent;
}
[data-ww-scrollbar-host] .blocklyToolboxDiv::-webkit-scrollbar {
    width: 7px !important;
    height: 7px !important;
}
[data-ww-scrollbar-host] .blocklyToolboxDiv::-webkit-scrollbar-track {
    background: transparent !important;
}
[data-ww-scrollbar-host] .blocklyToolboxDiv::-webkit-scrollbar-thumb {
    background: rgba(120, 130, 150, 0.45) !important;
    border-radius: 4px !important;
}
[data-ww-scrollbar-host] .blocklyToolboxDiv::-webkit-scrollbar-thumb:hover {
    background: rgba(120, 130, 150, 0.7) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [data-ww-scrollbar-host] .blocklyScrollbarHandle {
    fill: rgba(255, 255, 255, 0.28) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [data-ww-scrollbar-host] .blocklyScrollbarHandle:hover {
    fill: rgba(255, 255, 255, 0.45) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [data-ww-scrollbar-host] .blocklyToolboxDiv {
    scrollbar-color: rgba(255, 255, 255, 0.28) transparent;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [data-ww-scrollbar-host] .blocklyToolboxDiv::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.28) !important;
}
html.tw-misty-sand-theme.tw-misty-sand-dark [data-ww-scrollbar-host] .blocklyToolboxDiv::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.45) !important;
}
`;
        this.blocksHost.appendChild(style);
    }
    setupWorkspace () {
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
        this.workspace.resize();
        this.lastLoadedXml = xmlString;
        this.lastLoadedToolbox = toolboxXML;
    }
    handleVmTargetsUpdate () {
        this.refreshIfChanged();
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
            const ny = Math.max(MENU_BAR_HEIGHT, Math.min(this.dragState.originY + dy, window.innerHeight - 40));
            this.props.onMove(this.props.windowId, nx, ny);
        } else if (this.resizeState) {
            const dx = e.clientX - this.resizeState.startX;
            const dy = e.clientY - this.resizeState.startY;
            const width = Math.max(280, this.resizeState.originWidth + dx);
            const height = Math.max(200, this.resizeState.originHeight + dy);
            this.props.onResize(this.props.windowId, width, height);
            if (this.workspace) {
                this.ScratchBlocks.svgResize(this.workspace);
            }
        }
    }
    handleMouseUp () {
        if (this.dragState || this.resizeState) {
            this.setState({dimmed: false});
        }
        this.dragState = null;
        this.resizeState = null;
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
    handleTabDragStart (e, targetId) {
        e.dataTransfer.setData('text/plain', JSON.stringify({
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
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data && data.targetId && data.fromWindowId !== toWindowId) {
                this.props.onMoveTab(data.fromWindowId, toWindowId, data.targetId);
            }
        } catch {
        }
    }
    handleDragEnter (e) {
        e.preventDefault();
        if (!e.dataTransfer || !e.dataTransfer.types || !e.dataTransfer.types.includes('text/plain')) return;
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
    render () {
        const {windowId, activeTargetId, x, y, width, height, zIndex, targets, isRtl} = this.props;
        return (
            <WorkspaceWindowComponent
                activeTargetId={activeTargetId}
                blockMenuId={this.state.blockMenuId}
                dimmed={this.state.dimmed}
                dragOver={this.state.dragOver}
                height={height}
                id={windowId}
                isRtl={isRtl}
                targets={targets}
                width={width}
                windowRect={{targets: this.props.targetIds}}
                x={x}
                y={y}
                zIndex={zIndex}
                onAddTabClick={this.handleAddTabClick}
                onCloseWindow={this.handleCloseWindow}
                onCloseTab={this.handleCloseTab}
                onDropTab={this.handleDropTab}
                onDragEnter={this.handleDragEnter}
                onDragLeave={this.handleDragLeave}
                onFocus={this.handleFocus}
                onMouseDownCapture={this.handleMouseDownCapture}
                onResizeStart={this.handleResizeStart}
                onSetActiveTab={this.handleSetActiveTab}
                onTabDragStart={this.handleTabDragStart}
                onTitleBarMouseDown={this.handleTitleBarMouseDown}
                onToggleBlockMenu={this.handleToggleBlockMenu}
                setBlocksHost={this.setBlocksHost}
            />
        );
    }
}

WorkspaceWindow.propTypes = {
    activeTargetId: PropTypes.string,
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
    onResize: PropTypes.func,
    onSetActiveTab: PropTypes.func,
    onToggleBlockMenu: PropTypes.func
};

WorkspaceWindow.defaultProps = {
    options: defaultWorkspaceOptions
};

const mapStateToProps = (state, {windowId}) => {
    const windowRect = state.scratchGui.workspaceWindows.windows.find(w => w.id === windowId);
    const targetObjects = [];
    const allTargets = state.scratchGui.targets;
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
    return {
        activeTargetId: windowRect ? windowRect.activeTargetId : null,
        isRtl: state.locales.isRtl,
        targetIds: windowRect ? windowRect.targets : [],
        targets: targetObjects,
        theme: state.scratchGui.theme.theme,
        vm: state.scratchGui.vm,
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
    onMoveTab: (fromWindowId, toWindowId, targetId) =>
        dispatch(moveTabToWindow(fromWindowId, toWindowId, targetId))
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WorkspaceWindow);
