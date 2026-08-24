import PropTypes from 'prop-types';
import React from 'react';
import styles from './workspace-window.css';

const WorkspaceWindowComponent = props => {
    const {
        activeTargetId,
        blockMenuId,
        dimmed,
        dragOver,
        height,
        id,
        isRtl,
        targets,
        width,
        windowRect,
        x,
        y,
        zIndex,
        onAddTabClick,
        onCloseWindow,
        onCloseTab,
        onDropTab,
        onDragEnter,
        onDragLeave,
        onFocus,
        onMouseDownCapture,
        onResizeStart,
        onSetActiveTab,
        onTabDragStart,
        onTitleBarMouseDown,
        onToggleBlockMenu,
        setBlocksHost
    } = props;

    const targetById = {};
    for (const target of targets) {
        targetById[target.id] = target;
    }

    return (
        <div
            className={`${styles.window} ${dimmed ? styles.windowDimmed : ''}`}
            data-workspace-window={id}
            style={{left: x, top: y, width, height, zIndex}}
            onMouseDownCapture={onMouseDownCapture}
            onMouseDown={onFocus}
        >
            <div
                className={styles.titleBar}
                onMouseDown={onTitleBarMouseDown}
            >
                <div
                    className={`${styles.tabs} ${dragOver ? styles.tabsDragOver : ''}`}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onDropTab(e, id)}
                >
                    {windowRect.targets.map(targetId => {
                        const target = targetById[targetId] || {id: targetId, name: '?'};
                        const isActive = targetId === activeTargetId;
                        return (
                            <div
                                key={targetId}
                                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
                                data-no-drag
                                draggable
                                onClick={() => onSetActiveTab(targetId)}
                                onDragStart={e => onTabDragStart(e, targetId)}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => onDropTab(e, id)}
                            >
                                <span className={styles.tabName}>
                                    {target.isStage ? 'Stage' : target.name}
                                </span>
                                <button
                                    className={styles.tabClose}
                                    data-no-drag
                                    onClick={e => {
                                        e.stopPropagation();
                                        onCloseTab(targetId);
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    <button
                        className={styles.addTab}
                        data-no-drag
                        title="Add target"
                        onClick={onToggleBlockMenu}
                    >
                        +
                    </button>
                    {dragOver ? <span className={styles.tabsHint}>松开以添加标签</span> : null}
                </div>
                <button
                    className={styles.closeButton}
                    data-no-drag
                    title="Close window"
                    onClick={onCloseWindow}
                >
                    ×
                </button>
            </div>
            <div className={styles.content}>
                <div
                    className={styles.blocksHost}
                    ref={setBlocksHost}
                />
                {blockMenuId ? (
                    <div className={styles.targetPicker}>
                        {targets.map(target => {
                            const alreadyOpen = windowRect.targets.includes(target.id);
                            return (
                                <button
                                    key={target.id}
                                    className={`${styles.pickerItem} ${alreadyOpen ? styles.pickerItemDisabled : ''}`}
                                    disabled={alreadyOpen}
                                    onClick={() => onAddTabClick(target.id)}
                                >
                                    {target.isStage ? 'Stage' : target.name}
                                </button>
                            );
                        })}
                    </div>
                ) : null}
                <div
                    className={styles.resizeHandle}
                    onMouseDown={e => onResizeStart(e)}
                />
            </div>
        </div>
    );
};

WorkspaceWindowComponent.propTypes = {
    activeTargetId: PropTypes.string,
    blockMenuId: PropTypes.string,
    dimmed: PropTypes.bool,
    dragOver: PropTypes.bool,
    height: PropTypes.number,
    id: PropTypes.string,
    isRtl: PropTypes.bool,
    targets: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        isStage: PropTypes.bool,
        name: PropTypes.string
    })),
    width: PropTypes.number,
    windowRect: PropTypes.shape({
        targets: PropTypes.arrayOf(PropTypes.string)
    }),
    x: PropTypes.number,
    y: PropTypes.number,
    zIndex: PropTypes.number,
    onAddTabClick: PropTypes.func,
    onCloseWindow: PropTypes.func,
    onCloseTab: PropTypes.func,
    onDropTab: PropTypes.func,
    onDragEnter: PropTypes.func,
    onDragLeave: PropTypes.func,
    onFocus: PropTypes.func,
    onMouseDownCapture: PropTypes.func,
    onResizeStart: PropTypes.func,
    onSetActiveTab: PropTypes.func,
    onTabDragStart: PropTypes.func,
    onTitleBarMouseDown: PropTypes.func,
    onToggleBlockMenu: PropTypes.func,
    setBlocksHost: PropTypes.func
};

export default WorkspaceWindowComponent;
