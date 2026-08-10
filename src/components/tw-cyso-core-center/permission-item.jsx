import PropTypes from 'prop-types';
import React from 'react';
import Tooltip from './tooltip.jsx';
import styles from './styles.css';

const PERMISSION_OPTIONS = [
    {value: 'always', label: '✓ 允许', className: styles.optionAllow},
    {value: 'ask', label: '? 询问', className: styles.optionAsk},
    {value: 'deny', label: '✕ 禁止', className: styles.optionDeny}
];

const PermissionItem = props => {
    const {permissionType, permissionInfo, value, onChange, riskLevelStyle} = props;
    
    const handleChange = (e) => {
        onChange(e.target.value);
    };

    const currentOptionClass = PERMISSION_OPTIONS.find(opt => opt.value === value)?.className || '';

    return (
        <div className={`${styles.permissionItem} ${riskLevelStyle || ''}`}>
            <div className={styles.permissionInfo}>
                <div className={styles.permissionLabelRow}>
                    <span className={styles.permissionLabel}>{permissionInfo.label}</span>
                    <Tooltip content={permissionInfo.description}>
                        <span className={styles.helpIcon} title={permissionInfo.description}>
                            ⓘ
                        </span>
                    </Tooltip>
                </div>
            </div>
            
            <select
                className={`${styles.permissionSelect} ${currentOptionClass}`}
                value={value}
                onChange={handleChange}
            >
                {PERMISSION_OPTIONS.map(option => (
                    <option
                        key={option.value}
                        value={option.value}
                        className={option.className}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

PermissionItem.propTypes = {
    permissionType: PropTypes.string.isRequired,
    permissionInfo: PropTypes.shape({
        label: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        defaultSetting: PropTypes.string.isRequired,
        riskLevel: PropTypes.number.isRequired
    }).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    riskLevelStyle: PropTypes.string
};

PermissionItem.defaultProps = {
    value: 'ask',
    riskLevelStyle: ''
};

export default PermissionItem;
