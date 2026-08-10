import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import {PERMISSION_GROUPS, getPermissionLabel, getPermissionDescription} from '../../lib/extension-permissions';
import Tooltip from '../tw-cyso-core-center/tooltip.jsx';
import styles from './extension-permission-modal.css';

const ExtensionPermissionModal = props => {
    if (!props.extension) return null;

    const extensionPermissions = props.extension.permissions || [];
    const pruned = props.extension.pruned || [];
    const {isDarkMode} = props;

    if (extensionPermissions.length === 0 && pruned.length === 0) return null;

    const getPermissionGroupInfo = (permissionType) => {
        for (const group of Object.values(PERMISSION_GROUPS)) {
            if (group.permissions[permissionType]) return group;
        }
        return null;
    };

    const getRiskBadge = (permissionType) => {
        for (const group of Object.values(PERMISSION_GROUPS)) {
            if (group.permissions[permissionType]) {
                const riskLevel = group.permissions[permissionType].riskLevel;
                if (riskLevel === 3) return { text: '高风险', className: styles.riskHigh };
                if (riskLevel === 2) return { text: '中风险', className: styles.riskMedium };
                return { text: '低风险', className: styles.riskLow };
            }
        }
        return { text: '未知', className: '' };
    };

    return (
        <Modal
            className={`${styles.modalEnhanced} ${isDarkMode ? styles.dark : ''}`}
            contentLabel="扩展权限说明"
            id="extensionPermissionModal"
            onRequestClose={props.onClose}
        >
            <Box className={styles.modalBody}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <span className={styles.extensionIcon}>⚡</span>
                    </div>
                    <div className={styles.titleSection}>
                        <h2 className={styles.title}>扩展权限说明</h2>
                        <p className={styles.extensionName}>{props.extension.name}</p>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={props.onClose}
                        title="关闭"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.permissionsContainer}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionIcon}>📋</span>
                        <span>所需权限</span>
                        <span className={styles.permissionCount}>
                            {extensionPermissions.length} 项
                        </span>
                    </div>

                    <div className={styles.permissionsList}>
                        {extensionPermissions.map(permissionType => {
                            const label = getPermissionLabel(permissionType);
                            const description = getPermissionDescription(permissionType);
                            const group = getPermissionGroupInfo(permissionType);
                            const risk = getRiskBadge(permissionType);

                            return (
                                <div key={permissionType} className={styles.permissionCard}>
                                    <div className={styles.permLeft}>
                                        <span className={styles.groupEmoji}>
                                            {group?.icon || '📋'}
                                        </span>
                                        <div className={styles.permInfo}>
                                            <div className={styles.permTitleRow}>
                                                <span className={styles.permName}>{label}</span>
                                                <Tooltip content={description}>
                                                    <span className={styles.helpCircle}>ⓘ</span>
                                                </Tooltip>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`${styles.riskBadge} ${risk.className}`}>
                                        {risk.text}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {pruned.length > 0 && (
                    <div className={styles.prunedBox}>
                        <span className={styles.noticeIcon}>🚫</span>
                        <span>
                            已自动取消 {pruned.length} 项未申请的权限设置（{pruned.map(getPermissionLabel).join('、')}），
                            确保该扩展仅拥有其声明的权限，且各扩展权限相互隔离、不互通。
                        </span>
                    </div>
                )}

                <div className={styles.noticeBox}>
                    <span className={styles.noticeIcon}>💡</span>
                    <span>您可以在 CYSO Core 控制中心统一管理默认权限与各扩展的独立权限设置</span>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.confirmButton}
                        onClick={props.onClose}
                    >
                        我知道了，继续加载
                    </button>
                </div>
            </Box>
        </Modal>
    );
};

ExtensionPermissionModal.propTypes = {
    extension: PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        permissions: PropTypes.arrayOf(PropTypes.string)
    }),
    permissions: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    isDarkMode: PropTypes.bool
};

ExtensionPermissionModal.defaultProps = {
    isDarkMode: false
};

export default ExtensionPermissionModal;