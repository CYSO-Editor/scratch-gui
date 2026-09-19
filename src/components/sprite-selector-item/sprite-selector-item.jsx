import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {FormattedMessage, injectIntl, intlShape} from 'react-intl';
import {ContextMenuTrigger} from 'react-contextmenu';

import DeleteButton from '../delete-button/delete-button.jsx';
import {cysoMessage} from '../../lib/cyso-l10n';
import styles from './sprite-selector-item.css';
import {ContextMenu, DangerousMenuItem, MenuItem} from '../context-menu/context-menu.jsx';

let contextMenuId = 0;

const SpriteSelectorItem = props => {
    const menuId = `${props.name}-${contextMenuId++}`;
    return (
        <ContextMenuTrigger
            attributes={{
                className: classNames(props.className, styles.spriteSelectorItem, {
                    [styles.isSelected]: props.selected
                }),
                'data-cyso-menu-id': menuId,
                'data-cyso-has-workspace': props.hasWorkspace ? 'true' : undefined,
                title: props.hasWorkspace ? cysoMessage(props.intl, 'inWorkspace') : undefined,
                onClick: props.onClick,
                onMouseEnter: props.onMouseEnter,
                onMouseLeave: props.onMouseLeave,
                onMouseDown: props.onMouseDown,
                onTouchStart: props.onMouseDown
            }}
            disable={props.preventContextMenu}
            id={menuId}
            ref={props.componentRef}
        >
            {typeof props.number === 'undefined' ? null : (
                <div className={styles.number}>{props.number}</div>
            )}
            {props.costumeURL ? (
                <div className={styles.spriteImageOuter}>
                    <div className={styles.spriteImageInner}>
                        <img
                            className={styles.spriteImage}
                            draggable={false}
                            loading="lazy"
                            src={props.costumeURL}
                        />
                    </div>
                </div>
            ) : null}
            <div className={styles.spriteInfo}>
                <div className={styles.spriteName}>{props.name}</div>
                {props.details ? (
                    <div className={styles.spriteDetails}>{props.details}</div>
                ) : null}
            </div>
            {(props.selected && props.onDeleteButtonClick) ? (
                <DeleteButton
                    className={styles.deleteButton}
                    onClick={props.onDeleteButtonClick}
                />
            ) : null }
            {ReactDOM.createPortal((
                <ContextMenu
                    id={menuId}
                    style={{zIndex: 10000}}
                >
                    {props.onCloseWorkspace ? (
                        <MenuItem onClick={props.onCloseWorkspace}>
                            {cysoMessage(props.intl, 'closeWindow')}
                        </MenuItem>
                    ) : null}
                    {props.onCreateWorkspace ? (
                        <MenuItem onClick={props.onCreateWorkspace}>
                            {cysoMessage(props.intl, 'createWorkspace')}
                        </MenuItem>
                    ) : null}
                    {props.onDuplicateButtonClick ? (
                        <MenuItem onClick={props.onDuplicateButtonClick}>
                            <FormattedMessage
                                defaultMessage="duplicate"
                                description="Menu item to duplicate in the right click menu"
                                id="gui.spriteSelectorItem.contextMenuDuplicate"
                            />
                        </MenuItem>
                    ) : null}
                    {props.onExportButtonClick ? (
                        <MenuItem onClick={props.onExportButtonClick}>
                            <FormattedMessage
                                defaultMessage="export"
                                description="Menu item to export the selected item"
                                id="gui.spriteSelectorItem.contextMenuExport"
                            />
                        </MenuItem>
                    ) : null }
                    {props.onRenameButtonClick ? (
                        <MenuItem onClick={props.onRenameButtonClick}>
                            <FormattedMessage
                                defaultMessage="rename"
                                description="Menu item to rename an item"
                                id="tw.spriteSelectorItem.rename"
                            />
                        </MenuItem>
                    ) : null}
                    {props.onDeleteButtonClick ? (
                        <DangerousMenuItem onClick={props.onDeleteButtonClick}>
                            <FormattedMessage
                                defaultMessage="delete"
                                description="Menu item to delete in the right click menu"
                                id="gui.spriteSelectorItem.contextMenuDelete"
                            />
                        </DangerousMenuItem>
                    ) : null }
                </ContextMenu>
            ), document.body)}
        </ContextMenuTrigger>
    );
};

SpriteSelectorItem.propTypes = {
    className: PropTypes.string,
    componentRef: PropTypes.func,
    costumeURL: PropTypes.string,
    details: PropTypes.string,
    hasWorkspace: PropTypes.bool,
    intl: intlShape.isRequired,
    // eslint-disable-next-line react/forbid-prop-types
    name: PropTypes.any,
    number: PropTypes.number,
    onClick: PropTypes.func,
    onCreateWorkspace: PropTypes.func,
    onCloseWorkspace: PropTypes.func,
    onDeleteButtonClick: PropTypes.func,
    onDuplicateButtonClick: PropTypes.func,
    onExportButtonClick: PropTypes.func,
    onRenameButtonClick: PropTypes.func,
    onMouseDown: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    preventContextMenu: PropTypes.bool,
    selected: PropTypes.bool.isRequired
};

export default injectIntl(SpriteSelectorItem);
