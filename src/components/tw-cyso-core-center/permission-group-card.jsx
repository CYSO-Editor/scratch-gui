import PropTypes from 'prop-types';
import React from 'react';
import PermissionItem from './permission-item.jsx';
import styles from './styles.css';

const RISK_LEVEL_STYLES = {
    1: styles.riskLow,
    2: styles.riskMedium,
    3: styles.riskHigh
};

const PermissionGroupCard = props => {
    const {group, permissions, onPermissionChange} = props;
    
    return (
        <div className={styles.groupCard}>
            <div className={styles.groupHeader}>
                <span className={styles.groupIcon}>{group.icon}</span>
                <div className={styles.groupInfo}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupDescription}>{group.description}</div>
                </div>
            </div>
            
            <div className={styles.permissionsList}>
                {Object.entries(group.permissions).map(([permType, permInfo]) => (
                    <PermissionItem
                        key={permType}
                        permissionType={permType}
                        permissionInfo={permInfo}
                        value={permissions[permType] || permInfo.defaultSetting}
                        onChange={(value) => onPermissionChange(permType, value)}
                        riskLevelStyle={RISK_LEVEL_STYLES[permInfo.riskLevel]}
                    />
                ))}
            </div>
        </div>
    );
};

PermissionGroupCard.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        permissions: PropTypes.object.isRequired
    }).isRequired,
    permissions: PropTypes.object.isRequired,
    onPermissionChange: PropTypes.func.isRequired
};

export default PermissionGroupCard;
