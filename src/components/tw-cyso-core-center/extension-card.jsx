import PropTypes from 'prop-types';
import React from 'react';
import PermissionItem from './permission-item.jsx';
import styles from './styles.css';
import {PERMISSION_CATEGORIES} from '../../lib/extension-permissions';

const getPermissionCategory = permissionName => {
    for (const [categoryKey, category] of Object.entries(PERMISSION_CATEGORIES)) {
        if (category.permissions.includes(permissionName)) {
            return categoryKey;
        }
    }
    return 'OTHER';
};

const groupPermissionsByCategory = permissionList => {
    const grouped = {};
    permissionList.forEach(permission => {
        const category = getPermissionCategory(permission);
        if (!grouped[category]) {
            grouped[category] = [];
        }
        grouped[category].push(permission);
    });
    return grouped;
};

const CATEGORY_LABELS = {
    FILE: '文件',
    NETWORK: '网络',
    SYSTEM: '系统',
    CLIPBOARD: '剪贴板',
    DEVICE: '设备',
    OTHER: '其他'
};

const ExtensionCard = props => {
    const {extension, permissions, onPermissionChange} = props;
    const permissionList = extension.permissions || [];
    const groupedPermissions = groupPermissionsByCategory(permissionList);
    
    const hasIcon = extension.icon && extension.icon.length > 0;
    const iconStyle = !hasIcon && extension.color ? {
        backgroundColor: extension.color
    } : {};

    return (
        <div className={styles.extensionCard}>
            <div className={styles.extensionHeader}>
                <div 
                    className={styles.extensionIcon}
                    style={iconStyle}
                >
                    {hasIcon ? (
                        <img 
                            src={extension.icon} 
                            alt={extension.name}
                        />
                    ) : null}
                </div>
                <div className={styles.extensionInfo}>
                    <div className={styles.extensionName}>{extension.name}</div>
                    <div className={styles.extensionId}>{extension.id}</div>
                </div>
            </div>
            {permissionList.length > 0 && (
                <div className={styles.permissionList}>
                    {Object.entries(groupedPermissions).map(([category, perms]) => (
                        <div key={category} className={styles.permissionCategory}>
                            <div className={styles.categoryName}>
                                {CATEGORY_LABELS[category] || '其他'}
                            </div>
                            {perms.map(permission => (
                                <PermissionItem
                                    key={permission}
                                    permission={permission}
                                    value={permissions[permission] || 'ask'}
                                    onChange={value => onPermissionChange(extension.id, permission, value)}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

ExtensionCard.propTypes = {
    extension: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string,
        color: PropTypes.string,
        permissions: PropTypes.arrayOf(PropTypes.string)
    }).isRequired,
    permissions: PropTypes.object,
    onPermissionChange: PropTypes.func.isRequired
};

ExtensionCard.defaultProps = {
    permissions: {}
};

export default ExtensionCard;
