import {FormattedMessage, intlShape, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import PlayButton from '../../containers/play-button.jsx';
import styles from './library-item.css';
import classNames from 'classnames';

import bluetoothIconURL from './bluetooth.svg';
import internetConnectionIconURL from './internet-connection.svg';
import favoriteInactiveIcon from './favorite-inactive.svg';
import favoriteActiveIcon from './favorite-active.svg';

const messages = defineMessages({
    favorite: {
        defaultMessage: 'Favorite',
        description: 'Alt text of icon in costume, sound, and extension libraries to mark an item as favorite.',
        id: 'tw.favorite'
    },
    unfavorite: {
        defaultMessage: 'Unfavorite',
        description: 'Alt text of icon in costume, sound, and extension libraries to unmark an item as favorite.',
        id: 'tw.unfavorite'
    }
});

/* eslint-disable react/prefer-stateless-function */
class LibraryItemComponent extends React.PureComponent {
    render () {
        const favoriteMessage = this.props.intl.formatMessage(
            this.props.favorite ? messages.unfavorite : messages.favorite
        );
        const favorite = (
            <button
                className={classNames(styles.favoriteContainer, {[styles.active]: this.props.favorite})}
                onClick={this.props.onFavorite}
            >
                <img
                    src={this.props.favorite ? favoriteActiveIcon : favoriteInactiveIcon}
                    className={styles.favoriteIcon}
                    draggable={false}
                    alt={favoriteMessage}
                    title={favoriteMessage}
                />
            </button>
        );

        return this.props.featured ? (
            <div
                className={classNames(
                    styles.libraryItem,
                    styles.featuredItem,
                    {
                        [styles.disabled]: this.props.disabled
                    },
                    typeof this.props.extensionId === 'string' ? styles.libraryItemExtension : null,
                    this.props.hidden ? styles.hidden : null
                )}
                onClick={this.props.onClick}
            >
                <div className={styles.featuredImageContainer}>
                    {this.props.disabled ? (
                        <div className={styles.comingSoonText}>
                            <FormattedMessage
                                defaultMessage="Coming Soon"
                                description="Label for extensions that are not yet implemented"
                                id="gui.extensionLibrary.comingSoon"
                            />
                        </div>
                    ) : null}
                    <img
                        className={styles.featuredImage}
                        loading="lazy"
                        draggable={false}
                        src={this.props.iconURL}
                        onError={this.props.onImageError}
                    />
                </div>
                {this.props.insetIconURL ? (
                    <div className={styles.libraryItemInsetImageContainer}>
                        <img
                            className={styles.libraryItemInsetImage}
                            src={this.props.insetIconURL}
                            draggable={false}
                        />
                    </div>
                ) : null}
                <div
                    className={typeof this.props.extensionId === 'string' ?
                        classNames(styles.featuredExtensionText, styles.featuredText) : styles.featuredText
                    }
                >
                    {this.props.href ? (
                        <a
                            href={this.props.href}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.libraryItemNameLink}
                            title={`点击查看扩展详情：${this.props.name}\n链接：${this.props.href}`}
                            onClick={e => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.open(this.props.href, '_blank', 'noopener,noreferrer');
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className={styles.libraryItemName}>{this.props.name}</span>
                        </a>
                    ) : (
                        <span className={styles.libraryItemName}>{this.props.name}</span>
                    )}
                    <br />
                    <span 
                        className={styles.featuredDescription}
                        title={this.props.fullDescription || this.props.description}
                    >
                        {this.props.description && this.props.description.length > 80
                            ? `${this.props.description.substring(0, 80)}...`
                            : this.props.description}
                    </span>
                    {this.props.tags && this.props.tags.filter(t => t !== 'cysoeditor-hub').length > 0 && (
                        <div className={styles.categoryTags}>
                            {this.props.tags.filter(t => t !== 'cysoeditor-hub').map((tag, index) => (
                                <span key={index} className={styles.categoryTag}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    {this.props.isCyso && (
                        <div className={styles.cysoTag}>
                            CYSO
                        </div>
                    )}
                </div>

                {(this.props.docsURI || this.props.samples) && (
                    <div className={styles.extensionLinks}>
                        {this.props.docsURI && (
                            <a
                                href={this.props.docsURI}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FormattedMessage
                                    defaultMessage="Documentation"
                                    // eslint-disable-next-line max-len
                                    description="Appears in the extension list. Links to additional extension documentation."
                                    id="tw.documentation"
                                />
                            </a>
                        )}

                        {this.props.samples && (
                            <a
                                href={this.props.samples[0].href}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <FormattedMessage
                                    defaultMessage="Sample project"
                                    // eslint-disable-next-line max-len
                                    description="Appears in the extension list. Links to a sample project for an extension."
                                    id="tw.sample"
                                />
                            </a>
                        )}
                    </div>
                )}

                {this.props.credits && this.props.credits.length > 0 && (
                    <div className={styles.extensionLinks}>
                        <div>
                            <FormattedMessage
                                defaultMessage="Created by:"
                                description="Appears in the extension list. Followed by a list of names."
                                id="tw.createdBy"
                            />
                            {' '}
                            {this.props.credits.map((credit, index) => (
                                <React.Fragment key={index}>
                                    {typeof credit === 'object' && credit.id ? (
                                        <a
                                            href={`https://cyscrexthub.cc.cd/user?id=${credit.id}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            title={`查看作者主页：${credit.name}`}
                                            onClick={e => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                window.open(`https://cyscrexthub.cc.cd/user?id=${credit.id}`, '_blank', 'noopener,noreferrer');
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {credit.name}
                                        </a>
                                    ) : (
                                        typeof credit === 'object' ? credit.name : credit
                                    )}
                                    {index !== this.props.credits.length - 1 && (
                                        ', '
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {this.props.bluetoothRequired || this.props.internetConnectionRequired || this.props.collaborator ? (
                    <div className={styles.featuredExtensionMetadata}>
                        <div className={styles.featuredExtensionRequirement}>
                            {this.props.bluetoothRequired || this.props.internetConnectionRequired ? (
                                <div>
                                    <div>
                                        <FormattedMessage
                                            defaultMessage="Requires"
                                            description="Label for extension hardware requirements"
                                            id="gui.extensionLibrary.requires"
                                        />
                                    </div>
                                    <div
                                        className={styles.featuredExtensionMetadataDetail}
                                    >
                                        {this.props.bluetoothRequired ? (
                                            <img
                                                src={bluetoothIconURL}
                                                draggable={false}
                                            />
                                        ) : null}
                                        {this.props.internetConnectionRequired ? (
                                            <img
                                                src={internetConnectionIconURL}
                                                draggable={false}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                        <div className={styles.featuredExtensionCollaboration}>
                            {this.props.collaborator ? (
                                <div>
                                    <div>
                                        <FormattedMessage
                                            defaultMessage="Collaboration with"
                                            description="Label for extension collaboration"
                                            id="gui.extensionLibrary.collaboration"
                                        />
                                    </div>
                                    <div
                                        className={styles.featuredExtensionMetadataDetail}
                                    >
                                        {this.props.collaborator}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : null}

                {favorite}
            </div>
        ) : (
            <Box
                className={classNames(
                    styles.libraryItem, {
                        [styles.hidden]: this.props.hidden
                    }
                )}
                role="button"
                tabIndex="0"
                onBlur={this.props.onBlur}
                onClick={this.props.onClick}
                onFocus={this.props.onFocus}
                onKeyPress={this.props.onKeyPress}
                onMouseEnter={this.props.showPlayButton ? null : this.props.onMouseEnter}
                onMouseLeave={this.props.showPlayButton ? null : this.props.onMouseLeave}
            >
                {/* Layers of wrapping is to prevent layout thrashing on animation */}
                <Box className={styles.libraryItemImageContainerWrapper}>
                    <Box
                        className={styles.libraryItemImageContainer}
                        onMouseEnter={this.props.showPlayButton ? this.props.onMouseEnter : null}
                        onMouseLeave={this.props.showPlayButton ? this.props.onMouseLeave : null}
                    >
                        <img
                            className={styles.libraryItemImage}
                            loading="lazy"
                            src={this.props.iconURL}
                            draggable={false}
                            onError={this.props.onImageError}
                        />
                    </Box>
                </Box>
                {this.props.href ? (
                    <a
                        href={this.props.href}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.libraryItemName}
                        title={`点击查看扩展详情：${this.props.name}\n链接：${this.props.href}`}
                        onClick={e => {
                            e.stopPropagation();
                            e.preventDefault();
                            window.open(this.props.href, '_blank', 'noopener,noreferrer');
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        {this.props.name}
                    </a>
                ) : (
                    <span className={styles.libraryItemName}>{this.props.name}</span>
                )}
                {this.props.showPlayButton ? (
                    <PlayButton
                        isPlaying={this.props.isPlaying}
                        onPlay={this.props.onPlay}
                        onStop={this.props.onStop}
                    />
                ) : null}

                {favorite}
            </Box>
        );
    }
}
/* eslint-enable react/prefer-stateless-function */


LibraryItemComponent.propTypes = {
    intl: intlShape,
    bluetoothRequired: PropTypes.bool,
    collaborator: PropTypes.string,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    disabled: PropTypes.bool,
    extensionId: PropTypes.string,
    featured: PropTypes.bool,
    hidden: PropTypes.bool,
    iconURL: PropTypes.string,
    insetIconURL: PropTypes.string,
    internetConnectionRequired: PropTypes.bool,
    isPlaying: PropTypes.bool,
    name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    credits: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node,
        PropTypes.shape({
            name: PropTypes.string,
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        })
    ])),
    docsURI: PropTypes.string,
    samples: PropTypes.arrayOf(PropTypes.shape({
        href: PropTypes.string,
        text: PropTypes.string
    })),
    favorite: PropTypes.bool,
    onFavorite: PropTypes.func,
    onBlur: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onMouseEnter: PropTypes.func.isRequired,
    onMouseLeave: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onImageError: PropTypes.func,
    showPlayButton: PropTypes.bool,
    isCyso: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
    href: PropTypes.string,
    fullDescription: PropTypes.string
};

LibraryItemComponent.defaultProps = {
    disabled: false,
    showPlayButton: false
};

export default LibraryItemComponent;
