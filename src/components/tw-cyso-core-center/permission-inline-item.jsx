import PropTypes from 'prop-types';
import React from 'react';
import Tooltip from './tooltip.jsx';
import styles from './styles.css';

const PermissionInlineItem = props => {
    const {permissionType, permissionInfo, value, onChange, riskLevel, isDarkMode} = props;
    
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    return (
        <div className={`${styles.permInline} ${riskLevel === 3 ? styles.riskHigh : riskLevel === 2 ? styles.riskMedium : styles.riskLow}`}>
            <Tooltip content={permissionInfo.description}>
                <span className={styles.permLabel}>{permissionInfo.label}</span>
            </Tooltip>
            
            <select
                className={`${styles.permSelect} ${isDarkMode ? styles.darkSelect : ''}`}
                value={value}
                onChange={handleChange}
            >
                <option value="always">允许</option>
                <option value="ask">询问</option>
                <option value="deny">禁止</option>
            </select>
        </div>
    );
};

PermissionInlineItem.propTypes = {
    permissionType: PropTypes.string.isRequired,
    permissionInfo: PropTypes.shape({
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        defaultSetting: PropTypes.string.isRequired,
        riskLevel: PropTypes.number.isRequired
    }).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    riskLevel: PropTypes.number,
    isDarkMode: PropTypes.bool
};

PermissionInlineItem.defaultProps = {
    value: 'ask'
};

export default PermissionInlineItem;
