import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './cyso-core-button.css';

let cysoGradientSeq = 0;

const CysoCoreIcon = ({isDarkMode}) => {
    const gradientId = React.useRef(`cysoGradient${cysoGradientSeq++}`).current;
    return (
        <svg
            className={styles.icon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <defs>
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={isDarkMode ? '#60a5fa' : '#4F8EC2'} />
                    <stop offset="50%" stopColor={isDarkMode ? '#93c5fd' : '#7ec8e3'} />
                    <stop offset="100%" stopColor={isDarkMode ? '#34d399' : '#46DCA0'} />
                </linearGradient>
            </defs>
            <path
                d="M12 2L4 6V12C4 16.42 7.42 20.74 12 22C16.58 20.74 20 16.42 20 12V6L12 2Z"
                stroke={`url(#${gradientId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
            />
            <circle
                cx="12"
                cy="12"
                r="3"
                stroke={`url(#${gradientId})`}
                strokeWidth="1.5"
                fill="none"
            />
            <path
                d="M12 6V8M12 16V18M6 12H8M16 12H18"
                stroke={`url(#${gradientId})`}
                strokeWidth="1.5"
                strokeLinecap="round"
            />
        </svg>
    );
};

const CysoCoreButton = ({
    className,
    visible,
    onClick,
    isDarkMode
}) => {
    if (!visible) return null;

    return (
        <div
            className={classNames(className, styles.cysoCoreButton, isDarkMode && styles.dark)}
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    onClick();
                }
            }}
        >
            <CysoCoreIcon isDarkMode={isDarkMode} />
            <span className={styles.label}>CYSO Core</span>
        </div>
    );
};

CysoCoreButton.propTypes = {
    className: PropTypes.string,
    visible: PropTypes.bool,
    onClick: PropTypes.func,
    isDarkMode: PropTypes.bool
};

CysoCoreButton.defaultProps = {
    visible: true,
    onClick: () => {},
    isDarkMode: false
};

export default CysoCoreButton;
