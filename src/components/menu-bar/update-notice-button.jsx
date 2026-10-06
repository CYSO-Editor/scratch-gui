import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import MenuBarMenu from './menu-bar-menu.jsx';
import MenuLabel from './tw-menu-label.jsx';
import {MenuItem} from '../menu/menu.jsx';

import styles from './update-notice-button.css';

const UpdateIcon = ({className}) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
    >
        <path d="M12 3.5v10.4" />
        <path d="M8.3 10.2 12 13.9l3.7-3.7" />
        <path d="M4.9 16.1v2.3a2.6 2.6 0 0 0 2.6 2.6h9a2.6 2.6 0 0 0 2.6-2.6v-2.3" />
    </svg>
);

UpdateIcon.propTypes = {
    className: PropTypes.string
};

/**
 * 菜单栏右侧的更新入口。检测到新版本时显示主题色图标和提示点，展开后从菜单里进入更新窗口。
 */
class UpdateNoticeButton extends React.Component {
    constructor (props) {
        super(props);
        this.state = {open: false};
        this.handleOpen = this.handleOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
    }
    handleOpen () {
        this.setState({open: true});
    }
    handleClose () {
        this.setState({open: false});
    }
    handleSelect () {
        this.setState({open: false});
        if (this.props.onClick) {
            this.props.onClick();
        }
    }
    render () {
        const {className, isDarkMode, isRtl, message} = this.props;
        if (!message) return null;
        const {open} = this.state;
        return (
            <MenuLabel
                open={open}
                onOpen={this.handleOpen}
                onClose={this.handleClose}
            >
                <span
                    className={classNames(
                        className,
                        styles.button,
                        isDarkMode && styles.dark
                    )}
                    title={message}
                >
                    <UpdateIcon className={styles.icon} />
                    <span className={styles.dot} />
                </span>
                <MenuBarMenu
                    className={styles.menu}
                    open={open}
                    place={isRtl ? 'right' : 'left'}
                >
                    <MenuItem onClick={this.handleSelect}>
                        <span className={styles.entry}>
                            <UpdateIcon className={styles.entryIcon} />
                            <span>{message}</span>
                        </span>
                    </MenuItem>
                </MenuBarMenu>
            </MenuLabel>
        );
    }
}

UpdateNoticeButton.propTypes = {
    className: PropTypes.string,
    isDarkMode: PropTypes.bool,
    isRtl: PropTypes.bool,
    message: PropTypes.string,
    onClick: PropTypes.func
};

UpdateNoticeButton.defaultProps = {
    className: '',
    isDarkMode: false,
    isRtl: false,
    message: '',
    onClick: null
};

export default UpdateNoticeButton;
