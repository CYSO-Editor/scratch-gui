import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape} from 'react-intl';

import CysoContextMenu from '../cyso-context-menu/cyso-context-menu.jsx';
import {cysoMessage} from '../../lib/cyso-l10n';
import styles from './workspace-window.css';

const WorkspaceWindowComponent = props => {
    const {
        activeTargetId,
        blockMenuId,
        componentRef,
        dimmed,
        dragOver,
        height,
        id,
        intl,
        isDropTarget,
        isFocused,
        isRtl,
        maximized,
        targetIds,
        targets,
        width,
        windowNames,
        x,
        y,
        zIndex,
        onAddTabClick,
        onCloseWindow,
        onCloseTab,
        onDropTab,
        onDragEnter,
        onDragLeave,
        onMouseDownCapture,
        onOpenTargetInNewWindow,
        onResizeStart,
        onSetActiveTab,
        onTabDragStart,
        onTitleBarMouseDown,
        onToggleBlockMenu,
        onToggleMaximize,
        setBlocksHost
    } = props;

    const targetById = {};
    for (const target of targets) {
        targetById[target.id] = target;
    }

    const targetLabel = target => {
        if (!target) return '?';
        if (target.isStage) return cysoMessage(intl, 'stage');
        const name = target.name;
        if (typeof name === 'string' && name) return name;
        if (typeof name === 'number') return String(name);
        return '?';
    };

    return (
        <div
            className={classNames(styles.window, {
                [styles.windowDimmed]: dimmed,
                [styles.windowFocused]: isFocused && !dimmed,
                [styles.windowDropTarget]: isDropTarget,
                [styles.windowMaximized]: maximized
            })}
            data-workspace-window={id}
            ref={componentRef}
            style={{left: x, top: y, width, height, zIndex}}
            onMouseDownCapture={onMouseDownCapture}
        >
            <CysoContextMenu
                attributes={{
                    className: styles.titleBar,
                    title: `${cysoMessage(intl, 'focusHint')} · ${cysoMessage(intl, 'dragBlocksHint')}`,
                    onMouseDown: onTitleBarMouseDown,
                    onDoubleClick: e => {
                        if (e.target.closest && e.target.closest('[data-no-drag]')) return;
                        onToggleMaximize();
                    }
                }}
                items={[
                    {
                        key: 'shortcuts',
                        type: 'hint',
                        label: cysoMessage(intl, 'shortcutHint')
                    },
                    {
                        key: 'toggle-maximize',
                        label: maximized ? cysoMessage(intl, 'restore') : cysoMessage(intl, 'maximize'),
                        onSelect: onToggleMaximize
                    },
                    {
                        key: 'close-window',
                        label: cysoMessage(intl, 'closeWindow'),
                        onSelect: onCloseWindow,
                        border: true,
                        danger: true
                    }
                ]}
            >
                <div
                    className={`${styles.tabs} ${dragOver ? styles.tabsDragOver : ''}`}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => onDropTab(e, id)}
                >
                    {targetIds.map(targetId => {
                        const target = targetById[targetId] || {
                            id: targetId,
                            isStage: false,
                            name: (windowNames && windowNames[targetId]) || '?'
                        };
                        const isActive = targetId === activeTargetId;
                        const tabMenuItems = [
                            {
                                key: 'close-tab',
                                label: cysoMessage(intl, 'closeTab'),
                                onSelect: () => onCloseTab(targetId)
                            },
                            {
                                key: 'open-in-new-window',
                                label: cysoMessage(intl, 'openInNewWindow'),
                                onSelect: () => onOpenTargetInNewWindow(targetId),
                                border: true
                            }
                        ];
                        return (
                            <CysoContextMenu
                                attributes={{
                                    className: classNames(styles.tab, {
                                        [styles.tabActive]: isActive
                                    }),
                                    'data-no-drag': 'true',
                                    draggable: true,
                                    title: targetLabel(target),
                                    onClick: () => onSetActiveTab(targetId),
                                    onDragStart: e => onTabDragStart(e, targetId),
                                    onDragOver: e => e.preventDefault(),
                                    onDrop: e => onDropTab(e, id)
                                }}
                                items={tabMenuItems}
                                key={targetId}
                            >
                                <span className={styles.tabName}>
                                    {targetLabel(target)}
                                </span>
                                <button
                                    className={styles.tabClose}
                                    data-no-drag
                                    onClick={e => {
                                        e.stopPropagation();
                                        onCloseTab(targetId);
                                    }}
                                >
                                    <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true">
                                        <path
                                            d="M2.5 2.5l7 7m0-7l-7 7"
                                            stroke="currentColor"
                                            strokeWidth="1.6"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </CysoContextMenu>
                        );
                    })}
                    <button
                        className={styles.addTab}
                        data-no-drag
                        data-ww-add-tab="true"
                        title={cysoMessage(intl, 'addTargetToWorkspace')}
                        onClick={onToggleBlockMenu}
                    >
                        +
                    </button>
                    {dragOver ? <span className={styles.tabsHint}>{cysoMessage(intl, 'releaseToAddTab')}</span> : null}
                </div>
                <button
                    className={styles.titleButton}
                    data-no-drag
                    title={maximized ? cysoMessage(intl, 'restore') : cysoMessage(intl, 'maximize')}
                    onClick={onToggleMaximize}
                >
                    {maximized ? (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                            <path
                                d="M4 1.5h6.5V8M1.5 4h6.5v6.5H1.5z"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.3"
                            />
                        </svg>
                    ) : (
                        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                            <rect
                                x="1.5"
                                y="1.5"
                                width="9"
                                height="9"
                                rx="1"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.3"
                            />
                        </svg>
                    )}
                </button>
                <button
                    className={styles.closeButton}
                    data-no-drag
                    title={cysoMessage(intl, 'closeWindow')}
                    onClick={onCloseWindow}
                >
                    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                        <path
                            d="M2.5 2.5l7 7m0-7l-7 7"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>
            </CysoContextMenu>
            <div className={styles.content}>
                <div
                    className={styles.blocksHost}
                    ref={setBlocksHost}
                />
                {blockMenuId ? (
                    <div
                        className={styles.targetPicker}
                        data-ww-picker="true"
                    >
                        {targets.map(target => {
                            const alreadyOpen = targetIds.includes(target.id);
                            return (
                                <button
                                    key={target.id}
                                    className={`${styles.pickerItem} ${alreadyOpen ? styles.pickerItemDisabled : ''}`}
                                    disabled={alreadyOpen}
                                    onClick={() => onAddTabClick(target.id)}
                                >
                                    {targetLabel(target)}
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
    componentRef: PropTypes.func,
    dimmed: PropTypes.bool,
    dragOver: PropTypes.bool,
    height: PropTypes.number,
    id: PropTypes.string,
    intl: intlShape.isRequired,
    isDropTarget: PropTypes.bool,
    isFocused: PropTypes.bool,
    isRtl: PropTypes.bool,
    maximized: PropTypes.bool,
    targetIds: PropTypes.arrayOf(PropTypes.string),
    targets: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        isStage: PropTypes.bool,
        name: PropTypes.string
    })),
    width: PropTypes.number,
    windowNames: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    x: PropTypes.number,
    y: PropTypes.number,
    zIndex: PropTypes.number,
    onAddTabClick: PropTypes.func,
    onCloseWindow: PropTypes.func,
    onCloseTab: PropTypes.func,
    onDropTab: PropTypes.func,
    onDragEnter: PropTypes.func,
    onDragLeave: PropTypes.func,
    onMouseDownCapture: PropTypes.func,
    onOpenTargetInNewWindow: PropTypes.func,
    onResizeStart: PropTypes.func,
    onSetActiveTab: PropTypes.func,
    onTabDragStart: PropTypes.func,
    onTitleBarMouseDown: PropTypes.func,
    onToggleBlockMenu: PropTypes.func,
    onToggleMaximize: PropTypes.func,
    setBlocksHost: PropTypes.func
};

export default injectIntl(WorkspaceWindowComponent);
