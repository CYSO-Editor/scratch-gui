import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {defineMessages, intlShape, injectIntl, FormattedMessage} from 'react-intl';
import {ContextMenuTrigger} from 'react-contextmenu';

import ActionMenu from '../action-menu/action-menu.jsx';
import styles from './stage-selector.css';
import {isRtl} from '@turbowarp/scratch-l10n';
import {ContextMenu, MenuItem} from '../context-menu/context-menu.jsx';
import {cysoMessage} from '../../lib/cyso-l10n';

import backdropIcon from '../action-menu/icon--backdrop.svg';
import fileUploadIcon from '../action-menu/icon--file-upload.svg';
import paintIcon from '../action-menu/icon--paint.svg';
import surpriseIcon from '../action-menu/icon--surprise.svg';
import searchIcon from '../action-menu/icon--search.svg';

const messages = defineMessages({
    addBackdropFromLibrary: {
        id: 'gui.spriteSelector.addBackdropFromLibrary',
        description: 'Button to add a stage in the target pane from library',
        defaultMessage: 'Choose a Backdrop'
    },
    addBackdropFromPaint: {
        id: 'gui.stageSelector.addBackdropFromPaint',
        description: 'Button to add a stage in the target pane from paint',
        defaultMessage: 'Paint'
    },
    addBackdropFromSurprise: {
        id: 'gui.stageSelector.addBackdropFromSurprise',
        description: 'Button to add a random stage in the target pane',
        defaultMessage: 'Surprise'
    },
    addBackdropFromFile: {
        id: 'gui.stageSelector.addBackdropFromFile',
        description: 'Button to add a stage in the target pane from file',
        defaultMessage: 'Upload Backdrop'
    }
});

const stageContextMenuId = 'stage-selector-context-menu';

const StageSelector = props => {
    const {
        backdropCount,
        containerRef,
        dragOver,
        fileInputRef,
        intl,
        selected,
        raised,
        receivedBlocks,
        url,
        onBackdropFileUploadClick,
        onBackdropFileUpload,
        onClick,
        onCreateWorkspace,
        onMouseEnter,
        onMouseLeave,
        onNewBackdropClick,
        onSurpriseBackdropClick,
        onEmptyBackdropClick,
        onCloseWorkspace,
        hasWorkspace,
        ...componentProps
    } = props;
    return (
        <ContextMenuTrigger
            id={stageContextMenuId}
            attributes={{
                className: classNames(styles.stageSelector, {
                    [styles.isSelected]: selected,
                    [styles.raised]: raised || dragOver,
                    [styles.receivedBlocks]: receivedBlocks
                }),
                'data-cyso-menu-id': stageContextMenuId,
                'data-cyso-has-workspace': hasWorkspace ? 'true' : undefined,
                title: hasWorkspace ? cysoMessage(intl, 'inWorkspace') : undefined,
                onClick: onClick,
                onMouseEnter: onMouseEnter,
                onMouseLeave: onMouseLeave,
                ...componentProps
            }}
            ref={el => containerRef(el && el.elem)}
        >
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <FormattedMessage
                        defaultMessage="Stage"
                        description="Label for the stage in the stage selector"
                        id="gui.stageSelector.stage"
                    />
                </div>
            </div>
            {url ? (
                <img
                    className={styles.costumeCanvas}
                    src={url}
                    draggable={false}
                />
            ) : null}
            <div className={styles.label}>
                <FormattedMessage
                    defaultMessage="Backdrops"
                    description="Label for the backdrops in the stage selector"
                    id="gui.stageSelector.backdrops"
                />
            </div>
            <div className={styles.count}>{backdropCount}</div>
            <ActionMenu
                className={styles.addButton}
                img={backdropIcon}
                moreButtons={[
                    {
                        title: intl.formatMessage(messages.addBackdropFromFile),
                        img: fileUploadIcon,
                        onClick: onBackdropFileUploadClick,
                        fileAccept: '.svg, .png, .bmp, .jpg, .jpeg, .jfif, .webp, .gif',
                        fileChange: onBackdropFileUpload,
                        fileInput: fileInputRef,
                        fileMultiple: true
                    }, {
                        title: intl.formatMessage(messages.addBackdropFromSurprise),
                        img: surpriseIcon,
                        onClick: onSurpriseBackdropClick

                    }, {
                        title: intl.formatMessage(messages.addBackdropFromPaint),
                        img: paintIcon,
                        onClick: onEmptyBackdropClick
                    }, {
                        title: intl.formatMessage(messages.addBackdropFromLibrary),
                        img: searchIcon,
                        onClick: onNewBackdropClick
                    }
                ]}
                title={intl.formatMessage(messages.addBackdropFromLibrary)}
                tooltipPlace={isRtl(intl.locale) ? 'right' : 'left'}
                onClick={onNewBackdropClick}
            />
            {ReactDOM.createPortal((
                <ContextMenu
                    id={stageContextMenuId}
                    style={{zIndex: 10000}}
                >
                    {onCloseWorkspace ? (
                        <MenuItem onClick={onCloseWorkspace}>
                            {cysoMessage(intl, 'closeWindow')}
                        </MenuItem>
                    ) : null}
                    {onCreateWorkspace ? (
                        <MenuItem onClick={onCreateWorkspace}>
                            {cysoMessage(intl, 'createWorkspace')}
                        </MenuItem>
                    ) : null}
                </ContextMenu>
            ), document.body)}
        </ContextMenuTrigger>
    );
};

StageSelector.propTypes = {
    backdropCount: PropTypes.number.isRequired,
    containerRef: PropTypes.func,
    dragOver: PropTypes.bool,
    fileInputRef: PropTypes.func,
    hasWorkspace: PropTypes.bool,
    intl: intlShape.isRequired,
    onBackdropFileUpload: PropTypes.func,
    onBackdropFileUploadClick: PropTypes.func,
    onClick: PropTypes.func,
    onCloseWorkspace: PropTypes.func,
    onCreateWorkspace: PropTypes.func,
    onEmptyBackdropClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onNewBackdropClick: PropTypes.func,
    onSurpriseBackdropClick: PropTypes.func,
    raised: PropTypes.bool.isRequired,
    receivedBlocks: PropTypes.bool.isRequired,
    selected: PropTypes.bool.isRequired,
    url: PropTypes.string
};

export default injectIntl(StageSelector);
