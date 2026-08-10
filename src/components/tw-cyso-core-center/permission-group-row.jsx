import PropTypes from 'prop-types';
import React from 'react';
import PermissionInlineItem from './permission-inline-item.jsx';
import styles from './styles.css';

const PermissionGroupRow = props => {
    const {group, permissions, onPermissionChange, isDarkMode, filter} = props;

    const visible = filter
        ? Object.entries(group.permissions).filter(([permType]) => filter.includes(permType))
        : Object.entries(group.permissions);

    if (visible.length === 0) {
        return null;
    }

    return (
        <div className={styles.groupRow}>
            <div className={styles.groupLabel}>
                <span className={styles.groupIcon}>{group.icon}</span>
                <div className={styles.groupText}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupDesc}>{group.description}</div>
                </div>
            </div>

            <div className={styles.permissionsRow}>
                {visible.map(([permType, permInfo]) => (
                    <PermissionInlineItem
                        key={permType}
                        permissionType={permType}
                        permissionInfo={permInfo}
                        value={permissions[permType] || permInfo.defaultSetting}
                        onChange={(value) => onPermissionChange(permType, value)}
                        riskLevel={permInfo.riskLevel}
                        isDarkMode={isDarkMode}
                    />
                ))}
            </div>
        </div>
    );
};

PermissionGroupRow.propTypes = {
    group: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        permissions: PropTypes.object.isRequired
    }).isRequired,
    permissions: PropTypes.object.isRequired,
    onPermissionChange: PropTypes.func.isRequired,
    isDarkMode: PropTypes.bool,
    filter: PropTypes.arrayOf(PropTypes.string)
};

export default PermissionGroupRow;