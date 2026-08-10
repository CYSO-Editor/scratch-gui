import PropTypes from 'prop-types';
import React, {useState} from 'react';
import ReactModal from 'react-modal';
import PermissionGroupRow from './permission-group-row.jsx';
import Tooltip from './tooltip.jsx';
import styles from './styles.css';

const CYSOCoreCenter = props => {
    const {PERMISSION_GROUPS, defaults, loadedExtensions, extensionPermissions, activeView} = props;
    const isDarkMode = props.isDarkMode;
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        if (closing) {
            return;
        }
        setClosing(true);
        setTimeout(() => {
            props.onClose();
        }, 150);
    };

    const activeExtension = activeView === 'defaults'
        ? null
        : (loadedExtensions || []).find(e => e.id === activeView) || null;

    const renderDefaults = () => (
        <div className={styles.permissionsContainer}>
            <div className={styles.viewTitle}>
                <span className={styles.viewIcon}>⚙️</span>
                <div>
                    <div className={styles.viewName}>默认权限</div>
                    <div className={styles.viewDesc}>新扩展导入时按此基准授予其申请的权限；修改默认值不影响已导入扩展各自的独立设置</div>
                </div>
            </div>
            {Object.values(PERMISSION_GROUPS).map(group => (
                <PermissionGroupRow
                    key={group.id}
                    group={group}
                    permissions={defaults || {}}
                    onPermissionChange={props.onDefaultPermissionChange}
                    isDarkMode={isDarkMode}
                />
            ))}
        </div>
    );

    const renderExtension = extension => {
        const requested = extension.permissions || [];
        const extPerms = (extensionPermissions && extensionPermissions[extension.id]) || {};

        return (
            <div className={styles.permissionsContainer}>
                <div className={styles.viewTitle}>
                    <span className={styles.extensionIconSmall}>{extension.icon ? (
                        <img src={extension.icon} alt={extension.name} />
                    ) : (extension.color ? <span style={{backgroundColor: extension.color}} /> : '⚡')}</span>
                    <div>
                        <div className={styles.viewName}>{extension.name}</div>
                        <div className={styles.viewDesc}>
                            ID: {extension.id} · 该扩展已申请的权限相互独立，未申请的一律禁止且不可设置
                        </div>
                    </div>
                </div>
                {requested.length === 0 ? (
                    <div className={styles.emptyHint}>该扩展未申请任何权限，因此无法访问任何系统能力。</div>
                ) : (
                    Object.values(PERMISSION_GROUPS).map(group => (
                        <PermissionGroupRow
                            key={group.id}
                            group={group}
                            permissions={extPerms}
                            filter={requested}
                            onPermissionChange={(permType, setting) =>
                                props.onExtensionPermissionChange(extension.id, permType, setting)}
                            isDarkMode={isDarkMode}
                        />
                    ))
                )}
            </div>
        );
    };

    return (
        <ReactModal
            isOpen
            contentLabel="CYSO Core 控制中心"
            onRequestClose={handleClose}
            shouldCloseOnOverlayClick
            shouldCloseOnEsc
            overlayClassName={`${styles.fullscreenOverlay} ${closing ? styles.closing : ''}`}
            className={`${styles.fullscreenContainer} ${isDarkMode ? styles.dark : styles.light} ${closing ? styles.closing : ''}`}
        >
            <div className={styles.headerSection}>
                <div className={styles.headerTop}>
                    <div className={styles.titleArea}>
                        <span className={styles.mainIcon}>🛡️</span>
                        <h1 className={styles.mainTitle}>CYSO Core 控制中心</h1>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={handleClose}
                        title="关闭"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className={styles.layout}>
                <div className={styles.sidebar}>
                    <button
                        className={`${styles.sidebarTab} ${activeView === 'defaults' ? styles.sidebarTabActive : ''}`}
                        onClick={() => props.onSelectView('defaults')}
                    >
                        <span className={styles.sidebarIcon}>⚙️</span>
                        默认权限
                    </button>
                    <div className={styles.sidebarDivider}>扩展权限（相互隔离）</div>
                    {(loadedExtensions || []).length === 0 ? (
                        <div className={styles.sidebarEmpty}>尚未导入扩展</div>
                    ) : (
                        (loadedExtensions || []).map(ext => (
                            <button
                                key={ext.id}
                                className={`${styles.sidebarTab} ${activeView === ext.id ? styles.sidebarTabActive : ''}`}
                                onClick={() => props.onSelectView(ext.id)}
                            >
                                <span className={styles.sidebarIcon}>
                                    {ext.icon ? <img src={ext.icon} alt={ext.name} /> : (ext.color ? <span style={{backgroundColor: ext.color}} /> : '⚡')}
                                </span>
                                <span className={styles.sidebarLabel}>{ext.name}</span>
                            </button>
                        ))
                    )}
                </div>

                <div className={styles.contentArea}>
                    {activeExtension ? renderExtension(activeExtension) : renderDefaults()}
                </div>
            </div>

            <div className={styles.footerBar}>
                <span className={styles.footerText}>
                    默认权限为新扩展的授权基准 · 各扩展权限相互独立、不互通
                </span>
                <button
                    className={styles.doneButton}
                    onClick={handleClose}
                >
                    完成
                </button>
            </div>
        </ReactModal>
    );
};

CYSOCoreCenter.propTypes = {
    PERMISSION_GROUPS: PropTypes.object.isRequired,
    defaults: PropTypes.object,
    loadedExtensions: PropTypes.array,
    extensionPermissions: PropTypes.object,
    activeView: PropTypes.string,
    onSelectView: PropTypes.func.isRequired,
    onDefaultPermissionChange: PropTypes.func.isRequired,
    onExtensionPermissionChange: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    isDarkMode: PropTypes.bool
};

CYSOCoreCenter.defaultProps = {
    defaults: {},
    loadedExtensions: [],
    extensionPermissions: {},
    activeView: 'defaults',
    isDarkMode: false
};

export default CYSOCoreCenter;
