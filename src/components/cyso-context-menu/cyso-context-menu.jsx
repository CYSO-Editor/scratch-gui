import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import styles from './cyso-context-menu.css';

const VIEWPORT_MARGIN = 6;

class CysoContextMenu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'bindDocumentListeners',
            'closeMenu',
            'handleContextMenu',
            'handleDocumentContextMenu',
            'handleDocumentKeyDown',
            'handleDocumentMouseDown',
            'handleDocumentScroll',
            'handleItemClick',
            'setMenuRef'
        ]);
        this.menu = null;
        this.needsPositionAdjust = false;
        this.state = {
            open: false,
            x: 0,
            y: 0
        };
    }
    componentDidUpdate (prevProps, prevState) {
        if (this.state.open && !prevState.open) {
            this.bindDocumentListeners();
        } else if (!this.state.open && prevState.open) {
            this.unbindDocumentListeners();
        }
        if (this.state.open && this.needsPositionAdjust) {
            this.adjustPosition();
        }
    }
    componentWillUnmount () {
        this.unbindDocumentListeners();
    }
    getItems () {
        return (this.props.items || []).filter(item => item && !item.hidden);
    }
    bindDocumentListeners () {
        document.addEventListener('mousedown', this.handleDocumentMouseDown, true);
        document.addEventListener('contextmenu', this.handleDocumentContextMenu, true);
        document.addEventListener('keydown', this.handleDocumentKeyDown);
        document.addEventListener('scroll', this.handleDocumentScroll, true);
        window.addEventListener('resize', this.closeMenu);
    }
    unbindDocumentListeners () {
        document.removeEventListener('mousedown', this.handleDocumentMouseDown, true);
        document.removeEventListener('contextmenu', this.handleDocumentContextMenu, true);
        document.removeEventListener('keydown', this.handleDocumentKeyDown);
        document.removeEventListener('scroll', this.handleDocumentScroll, true);
        window.removeEventListener('resize', this.closeMenu);
    }
    setMenuRef (menu) {
        this.menu = menu;
    }
    adjustPosition () {
        if (!this.menu) return;
        this.needsPositionAdjust = false;
        const rect = this.menu.getBoundingClientRect();
        const {x, y} = this.state;
        const nextX = Math.max(VIEWPORT_MARGIN, Math.min(x, window.innerWidth - rect.width - VIEWPORT_MARGIN));
        const nextY = Math.max(VIEWPORT_MARGIN, Math.min(y, window.innerHeight - rect.height - VIEWPORT_MARGIN));
        if (nextX !== x || nextY !== y) {
            this.setState({x: nextX, y: nextY});
        }
    }
    closeMenu () {
        if (!this.state.open) return;
        this.setState({open: false});
    }
    handleContextMenu (e) {
        if (this.props.disabled) return;
        if (this.getItems().length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        this.needsPositionAdjust = true;
        this.setState({
            open: true,
            x: e.clientX,
            y: e.clientY
        });
        if (this.props.onOpen) this.props.onOpen();
    }
    handleDocumentMouseDown (e) {
        if (this.menu && this.menu.contains(e.target)) return;
        this.closeMenu();
    }
    handleDocumentContextMenu (e) {
        if (this.menu && this.menu.contains(e.target)) return;
        this.closeMenu();
    }
    handleDocumentKeyDown (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            this.closeMenu();
        }
    }
    handleDocumentScroll () {
        this.closeMenu();
    }
    handleItemClick (item, e) {
        e.stopPropagation();
        this.closeMenu();
        if (item.onSelect) item.onSelect(e);
    }
    renderMenu () {
        const items = this.getItems();
        return ReactDOM.createPortal((
            <div
                className={styles.menu}
                ref={this.setMenuRef}
                role="menu"
                style={{left: this.state.x, top: this.state.y}}
                onContextMenu={e => e.preventDefault()}
            >
                {items.map((item, index) => {
                    const key = item.key || `${index}-${item.type || 'item'}`;
                    if (item.type === 'separator') {
                        return <div className={styles.separator} key={key} />;
                    }
                    if (item.type === 'hint') {
                        return <div className={styles.hint} key={key}>{item.label}</div>;
                    }
                    return (
                        <div
                            className={classNames(styles.item, {
                                [styles.itemDanger]: item.danger,
                                [styles.itemBorder]: item.border,
                                [styles.itemDisabled]: item.disabled
                            })}
                            key={key}
                            role="menuitem"
                            onClick={item.disabled ? undefined : e => this.handleItemClick(item, e)}
                        >
                            {item.label}
                        </div>
                    );
                })}
            </div>
        ), document.body);
    }
    render () {
        const {attributes, children, className} = this.props;
        return (
            <div
                {...attributes}
                className={classNames(className, attributes && attributes.className)}
                onContextMenu={this.handleContextMenu}
            >
                {children}
                {this.state.open ? this.renderMenu() : null}
            </div>
        );
    }
}

CysoContextMenu.propTypes = {
    attributes: PropTypes.object, // eslint-disable-line react/forbid-prop-types
    children: PropTypes.node,
    className: PropTypes.string,
    disabled: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.shape({
        border: PropTypes.bool,
        danger: PropTypes.bool,
        disabled: PropTypes.bool,
        hidden: PropTypes.bool,
        key: PropTypes.string,
        label: PropTypes.node,
        onSelect: PropTypes.func,
        type: PropTypes.string
    })),
    onOpen: PropTypes.func
};

CysoContextMenu.defaultProps = {
    attributes: null,
    children: null,
    className: null,
    disabled: false,
    items: [],
    onOpen: null
};

export default CysoContextMenu;
