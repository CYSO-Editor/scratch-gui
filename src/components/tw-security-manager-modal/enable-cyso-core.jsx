import PropTypes from 'prop-types';
import React from 'react';
import styles from './enable-cyso-core.css';

const EnableCYSOCoreModal = props => {
    const darkClass = props.isDarkMode ? styles.textDark : '';

    return (
        <div className={styles.container}>
            <h2 className={`${styles.title} ${darkClass}`}>
                启用 CYSO Core
            </h2>
            <p className={`${styles.description} ${darkClass}`}>
                当前作品包含 CYSO Core 扩展。启用后，扩展将按各自授权访问本机文件、系统命令等资源，并以非沙箱方式运行。
            </p>
            <p className={`${styles.warning} ${darkClass}`}>
                请确认是否启用 CYSO Core。
            </p>
        </div>
    );
};

EnableCYSOCoreModal.propTypes = {
    isDarkMode: PropTypes.bool
};

export default EnableCYSOCoreModal;
