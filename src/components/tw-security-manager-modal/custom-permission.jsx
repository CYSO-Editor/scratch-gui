import React from 'react';
import PropTypes from 'prop-types';
import styles from './url.css';

const PERMISSION_LABELS = {
    'file-read': '读取文件',
    'file-write': '写入文件',
    'file-delete': '删除文件',
    'system-command': '执行命令',
    'system-notification': '系统通知',
    'clipboard-read': '读取剪贴板',
    'clipboard-write': '写入剪贴板',
    'device-camera': '摄像头',
    'device-microphone': '麦克风',
    'device-geolocation': '地理位置'
};

const CustomPermissionModal = props => {
    const {extensionId, permissionType, command, filePath, url} = props;
    const permissionLabel = PERMISSION_LABELS[permissionType] || permissionType;
    
    let details = '';
    if (command) {
        details = `命令: ${command}`;
    } else if (filePath) {
        details = `路径: ${filePath}`;
    } else if (url) {
        details = `URL: ${url}`;
    }
    
    return (
        <div className={styles.container}>
            <div className={styles.body}>
                <h2 className={styles.title}>
                    权限请求
                </h2>
                <p className={styles.description}>
                    扩展 <strong>{extensionId || '未知扩展'}</strong> 请求使用以下权限：
                </p>
                <p className={styles.permission}>
                    <strong>{permissionLabel}</strong>
                </p>
                {details && (
                    <p className={styles.details}>
                        {details}
                    </p>
                )}
                <p className={styles.warning}>
                    请确认是否允许此操作。
                </p>
            </div>
        </div>
    );
};

CustomPermissionModal.propTypes = {
    extensionId: PropTypes.string,
    permissionType: PropTypes.string,
    command: PropTypes.string,
    filePath: PropTypes.string,
    url: PropTypes.string
};

export default CustomPermissionModal;
