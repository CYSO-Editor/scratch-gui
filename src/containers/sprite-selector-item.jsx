import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import {setHoveredSprite} from '../reducers/hovered-target';
import {updateAssetDrag} from '../reducers/asset-drag';
import VM from 'scratch-vm';
import getCostumeUrl from '../lib/get-costume-url';
import DragConstants from '../lib/drag-constants';
import DragRecognizer from '../lib/drag-recognizer';
import {getEventXY} from '../lib/touch-utils';

import SpriteSelectorItemComponent from '../components/sprite-selector-item/sprite-selector-item.jsx';
import {closeWorkspaceWindow, createWorkspaceWindow} from '../reducers/workspace-windows';

class SpriteSelectorItem extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'getCostumeData',
            'setRef',
            'handleClick',
            'handleCreateWorkspace',
            'handleCloseWorkspace',
            'handleDelete',
            'handleDuplicate',
            'handleExport',
            'handleRename',
            'handleMouseEnter',
            'handleMouseLeave',
            'handleMouseDown',
            'handleDragEnd',
            'handleDrag',
            'handleTouchEnd'
        ]);
        this.clickCount = 0;
        this.clickTime = 0;

        this.dragRecognizer = new DragRecognizer({
            onDrag: this.handleDrag,
            onDragEnd: this.handleDragEnd
        });
    }
    componentDidMount () {
        document.addEventListener('touchend', this.handleTouchEnd);
    }
    componentWillUnmount () {
        document.removeEventListener('touchend', this.handleTouchEnd);
        this.dragRecognizer.reset();
    }
    getCostumeData () {
        if (this.props.costumeURL) return this.props.costumeURL;
        if (!this.props.asset) return null;

        return getCostumeUrl(this.props.asset);
    }
    handleDragEnd () {
        if (this.props.dragging) {
            this.props.onDrag({
                img: null,
                currentOffset: null,
                dragging: false,
                dragType: null,
                index: null
            });
        }
        setTimeout(() => {
            this.noClick = false;
        });
    }
    handleDrag (currentOffset) {
        this.props.onDrag({
            img: this.getCostumeData(),
            currentOffset: currentOffset,
            dragging: true,
            dragType: this.props.dragType,
            index: this.props.index,
            payload: this.props.dragPayload
        });
        this.noClick = true;
    }
    handleTouchEnd (e) {
        const {x, y} = getEventXY(e);
        const {top, left, bottom, right} = this.ref.getBoundingClientRect();
        if (x >= left && x <= right && y >= top && y <= bottom) {
            this.handleMouseEnter();
        }
    }
    handleMouseDown (e) {
        this.dragRecognizer.start(e);
    }
    handleClick (e) {
        e.preventDefault();
        if (!this.noClick) {
            const now = Date.now();
            this.clickCount = (now - this.clickTime < 500) ? this.clickCount + 1 : 1;
            this.clickTime = now;
            if (this.clickCount >= 3) {
                this.clickCount = 0;
                this.handleCreateWorkspace();
                return;
            }
            this.props.onClick(this.props.id);
        }
    }
    handleCreateWorkspace () {
        if (this.props.dragType !== DragConstants.SPRITE) return;
        this.props.onCreateWorkspace(this.resolveTargetId(), this.props.name);
    }
    handleCloseWorkspace () {
        if (!this.props.workspaceWindowId) return;
        this.props.onCloseWorkspace(this.props.workspaceWindowId);
    }
    resolveTargetId () {
        const runtime = this.props.vm && this.props.vm.runtime;
        const id = this.props.id;
        if (!runtime || typeof runtime.getTargetById !== 'function') return id;
        if (runtime.getTargetById(id)) return id;
        const targets = runtime.targets || [];
        for (const target of targets) {
            if (target && target.isOriginal && target.sprite && target.sprite.id === id) {
                return target.id;
            }
        }
        for (const target of targets) {
            if (target && target.isOriginal && target.getName && target.getName() === id) {
                return target.id;
            }
        }
        return id;
    }
    handleDelete (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDeleteButtonClick(this.props.id);
    }
    handleDuplicate (e) {
        e.stopPropagation(); // To prevent from bubbling back to handleClick
        this.props.onDuplicateButtonClick(this.props.id);
    }
    handleExport (e) {
        e.stopPropagation();
        this.props.onExportButtonClick(this.props.id);
    }
    handleRename (e) {
        e.stopPropagation();
        this.props.onRenameButtonClick(this.props.id);
    }
    handleMouseLeave () {
        this.props.dispatchSetHoveredSprite(null);
    }
    handleMouseEnter () {
        this.props.dispatchSetHoveredSprite(this.props.id);
    }
    setRef (component) {
        // Access the DOM node using .elem because it is going through ContextMenuTrigger
        this.ref = component && component.elem;
    }
    render () {
        const {
            /* eslint-disable no-unused-vars */
            asset,
            id,
            index,
            onClick,
            onDeleteButtonClick,
            onDuplicateButtonClick,
            onExportButtonClick,
            onRenameButtonClick,
            onCreateWorkspace: _onCreateWorkspace,
            onCloseWorkspace: _onCloseWorkspace,
            workspaceWindowId: _workspaceWindowId,
            onDrag,
            dragPayload,
            receivedBlocks,
            costumeURL,
            vm,
            /* eslint-enable no-unused-vars */
            ...props
        } = this.props;
        return (
            <SpriteSelectorItemComponent
                componentRef={this.setRef}
                costumeURL={this.getCostumeData()}
                preventContextMenu={this.dragRecognizer.gestureInProgress()}
                onClick={this.handleClick}
                onCreateWorkspace={this.props.dragType === DragConstants.SPRITE ? this.handleCreateWorkspace : null}
                onCloseWorkspace={this.props.workspaceWindowId ? this.handleCloseWorkspace : null}
                onDeleteButtonClick={onDeleteButtonClick ? this.handleDelete : null}
                onDuplicateButtonClick={onDuplicateButtonClick ? this.handleDuplicate : null}
                onExportButtonClick={onExportButtonClick ? this.handleExport : null}
                onRenameButtonClick={onRenameButtonClick ? this.handleRename : null}
                onMouseDown={this.handleMouseDown}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                {...props}
            />
        );
    }
}

SpriteSelectorItem.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    asset: PropTypes.any,
    costumeURL: PropTypes.string,
    dispatchSetHoveredSprite: PropTypes.func.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    dragPayload: PropTypes.any,
    dragType: PropTypes.string,
    dragging: PropTypes.bool,
    // eslint-disable-next-line react/forbid-prop-types
    id: PropTypes.any,
    index: PropTypes.number,
    // eslint-disable-next-line react/forbid-prop-types
    name: PropTypes.any,
    onClick: PropTypes.func,
    onCreateWorkspace: PropTypes.func.isRequired,
    onCloseWorkspace: PropTypes.func.isRequired,
    workspaceWindowId: PropTypes.string,
    onDeleteButtonClick: PropTypes.func,
    onRenameButtonClick: PropTypes.func,
    onDrag: PropTypes.func.isRequired,
    onDuplicateButtonClick: PropTypes.func,
    onExportButtonClick: PropTypes.func,
    receivedBlocks: PropTypes.bool.isRequired,
    selected: PropTypes.bool,
    vm: PropTypes.instanceOf(VM).isRequired
};

const mapStateToProps = (state, {id}) => {
    const windows = state.scratchGui.workspaceWindows.windows;
    let workspaceWindowId = null;
    for (const windowRect of windows) {
        if (windowRect.targets.indexOf(id) !== -1) {
            workspaceWindowId = windowRect.id;
            break;
        }
    }
    return {
        dragging: state.scratchGui.assetDrag.dragging,
        hasWorkspace: !!workspaceWindowId,
        receivedBlocks: state.scratchGui.hoveredTarget.receivedBlocks &&
                state.scratchGui.hoveredTarget.sprite === id,
        vm: state.scratchGui.vm,
        workspaceWindowId: workspaceWindowId
    };
};
const mapDispatchToProps = dispatch => ({
    dispatchSetHoveredSprite: spriteId => {
        dispatch(setHoveredSprite(spriteId));
    },
    onCreateWorkspace: (targetId, targetName) => {
        dispatch(createWorkspaceWindow(targetId, targetName));
    },
    onCloseWorkspace: windowId => {
        dispatch(closeWorkspaceWindow(windowId));
    },
    onDrag: data => dispatch(updateAssetDrag(data))
});

const ConnectedComponent = connect(
    mapStateToProps,
    mapDispatchToProps
)(SpriteSelectorItem);

export default ConnectedComponent;
