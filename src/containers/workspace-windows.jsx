import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';

import VM from 'scratch-vm';
import WorkspaceWindow from './workspace-window.jsx';
import {
    createWorkspaceWindow,
    closeWorkspaceWindow
} from '../reducers/workspace-windows';

import styles from '../components/gui/gui.css';

class WorkspaceWindows extends React.Component {
    constructor (props) {
        super(props);
        this.focusedWindow = null;
        bindAll(this, [
            'handleKeyDown',
            'handleDocumentMouseDown',
            'handleTargetsUpdate',
            'cleanupMissingTargets'
        ]);
    }
    componentDidMount () {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('mousedown', this.handleDocumentMouseDown);
        this.props.vm.addListener('targetsUpdate', this.handleTargetsUpdate);
    }
    componentDidUpdate (prevProps) {
        const claimedNow = new Set();
        for (const w of this.props.windows || []) {
            for (const t of w.targets) claimedNow.add(t);
        }
        const claimedPrev = new Set();
        for (const w of prevProps.windows || []) {
            for (const t of w.targets) claimedPrev.add(t);
        }
        const editing = this.props.editingTarget;
        if (!editing) return;
        if (claimedNow.has(editing) && !claimedPrev.has(editing)) {
            const runtime = this.props.vm && this.props.vm.runtime;
            const alt = runtime && runtime.targets.find(t =>
                t.isOriginal && !claimedNow.has(t.id));
            const stage = runtime && runtime.getTargetForStage();
            const targetId = (alt && alt.id) || (stage && stage.id);
            if (targetId && targetId !== editing) {
                this.props.vm.setEditingTarget(targetId);
            }
        }
    }
    componentWillUnmount () {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('mousedown', this.handleDocumentMouseDown);
        this.props.vm.removeListener('targetsUpdate', this.handleTargetsUpdate);
    }
    handleDocumentMouseDown (e) {
        const el = e.target;
        const winEl = el && el.closest ? el.closest('[data-workspace-window]') : null;
        this.focusedWindow = winEl ? winEl.dataset.workspaceWindow : null;
    }
    handleKeyDown (e) {
        if (!e.ctrlKey || e.key.toLowerCase() !== 'w') return;
        const tagName = (e.target && e.target.tagName) || '';
        if (tagName === 'INPUT' || tagName === 'TEXTAREA') return;
        e.preventDefault();
        const focusId = this.focusedWindow;
        const focusStillOpen = focusId &&
            this.props.windows.some(w => w.id === focusId);
        if (focusStillOpen) {
            this.props.onCloseWindow(focusId);
        } else if (this.props.editingTarget) {
            this.props.onCreateWindow(this.props.editingTarget);
        }
    }
    handleTargetsUpdate () {
        this.cleanupMissingTargets();
    }
    cleanupMissingTargets () {
        const windows = this.props.windows;
        if (!windows || windows.length === 0) return;
        const knownIds = new Set();
        if (this.props.vm && this.props.vm.runtime) {
            for (const target of this.props.vm.runtime.targets) {
                if (target.isOriginal) knownIds.add(target.id);
            }
        }
        let changed = false;
        const newWindows = windows.map(w => {
            const targets = w.targets.filter(id => knownIds.has(id));
            if (targets.length === w.targets.length) return w;
            changed = true;
            return {
                ...w,
                targets: targets,
                activeTargetId: targets.includes(w.activeTargetId) ?
                    w.activeTargetId : targets[0]
            };
        }).filter(w => w.targets.length > 0);
        if (changed) {
            this.props.onCleanupWindows(newWindows);
        }
    }
    render () {
        if (!this.props.windows || this.props.windows.length === 0) return null;
        const themeId = this.props.themeId || 'default';
        return (
            <div className={styles.workspaceWindowsLayer}>
                {this.props.windows.map(windowRect => (
                    <WorkspaceWindow
                        key={`${windowRect.id}/${themeId}`}
                        windowId={windowRect.id}
                        options={{media: this.props.optionsMedia}}
                    />
                ))}
            </div>
        );
    }
}

WorkspaceWindows.propTypes = {
    editingTarget: PropTypes.string,
    optionsMedia: PropTypes.string,
    onCreateWindow: PropTypes.func,
    onCloseWindow: PropTypes.func,
    onCleanupWindows: PropTypes.func,
    themeId: PropTypes.string,
    vm: PropTypes.instanceOf(VM).isRequired,
    windows: PropTypes.arrayOf(PropTypes.shape({
        activeTargetId: PropTypes.string,
        id: PropTypes.string,
        targets: PropTypes.arrayOf(PropTypes.string)
    }))
};

const mapStateToProps = state => {
    const theme = state.scratchGui.theme.theme;
    return {
        editingTarget: state.scratchGui.targets.editingTarget,
        optionsMedia: `./static/${theme ? theme.getBlocksMediaFolder() : 'default'}/`,
        themeId: theme ? theme.id : 'default',
        vm: state.scratchGui.vm,
        windows: state.scratchGui.workspaceWindows.windows
    };
};

const mapDispatchToProps = dispatch => ({
    onCreateWindow: targetId => dispatch(createWorkspaceWindow(targetId)),
    onCloseWindow: windowId => dispatch(closeWorkspaceWindow(windowId)),
    onCleanupWindows: windows => {
        dispatch({type: 'scratch-gui/workspace-windows/PRUNE', windows: windows});
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WorkspaceWindows);
