import React, {useState, useMemo, useEffect} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, FormattedMessage} from 'react-intl';
import styles from './batch-load-extensions.css';
import {
    getPermissionLabel,
    getPermissionDescription,
    getPermissionRiskLevel
} from '../../lib/extension-permissions';
import FancyCheckbox from '../tw-fancy-checkbox/checkbox.jsx';
import {
    decodeExtensionSource,
    extractExtensionPermissions,
    isRemoteExtensionUrl,
    fetchExtensionSource
} from '../../lib/tw-decode-extension-source.js';

const messages = defineMessages({
    title: {
        defaultMessage: '作品需要加载自定义扩展',
        description: 'Title of the full-page batch load extensions dialog',
        id: 'tw.batchLoadExtensions.title'
    },
    subtitle: {
        defaultMessage: '此作品包含 {count} 个自定义扩展。勾选要加载的扩展即可，未勾选的将不会被加载，但作品仍会正常打开。',
        description: 'Description of the batch load extensions dialog',
        id: 'tw.batchLoadExtensions.subtitle'
    },
    selectAll: {
        defaultMessage: '全选导入',
        description: 'Toggle to select or deselect all extensions',
        id: 'tw.batchLoadExtensions.selectAll'
    },
    allUnsandboxed: {
        defaultMessage: '全部非沙盒',
        description: 'Toggle to enable or disable non-sandboxed mode for all selected extensions',
        id: 'tw.batchLoadExtensions.allUnsandboxed'
    },
    selectedCount: {
        defaultMessage: '已选 {selected} / {total}',
        description: 'Count of selected extensions',
        id: 'tw.batchLoadExtensions.selectedCount'
    },
    allow: {
        defaultMessage: '导入选中的 {count} 个扩展',
        description: 'Button to import the selected extensions',
        id: 'tw.batchLoadExtensions.allow'
    },
    deny: {
        defaultMessage: '不导入，直接打开作品',
        description: 'Button to skip all extensions and open the project',
        id: 'tw.batchLoadExtensions.deny'
    },
    cysoBadge: {
        defaultMessage: 'CYSO',
        description: 'Badge shown for CYSO core extensions',
        id: 'tw.batchLoadExtensions.cysoBadge'
    },
    cysoCoreBadge: {
        defaultMessage: 'CYSO CORE',
        description: 'Badge shown in detail view for CYSO core extensions',
        id: 'tw.batchLoadExtensions.cysoCoreBadge'
    },
    unsandboxed: {
        defaultMessage: '非沙盒运行',
        description: 'Label for the run-without-sandbox option',
        id: 'tw.batchLoadExtensions.unsandboxed'
    },
    unsandboxedWarning: {
        defaultMessage: '非沙盒模式存在风险：扩展可能修改或破坏你的项目、读取本地设置等。仅在信任该扩展来源时开启。',
        description: 'Warning shown when run-without-sandbox is enabled',
        id: 'tw.batchLoadExtensions.unsandboxedWarning'
    },
    detailTitle: {
        defaultMessage: '扩展详情',
        description: 'Title of the detail panel',
        id: 'tw.batchLoadExtensions.detailTitle'
    },
    noSelection: {
        defaultMessage: '在左侧选择一个扩展以查看详情',
        description: 'Placeholder when no extension is selected',
        id: 'tw.batchLoadExtensions.noSelection'
    }
});

const BatchLoadExtensions = props => {
    const {
        extensions,
        isDarkMode,
        enableButtons,
        onToggleImport,
        onToggleUnsandboxed,
        onAllowed,
        onDenied
    } = props;

    const [selectedId, setSelectedId] = useState(extensions.length ? extensions[0].id : null);
    const selected = extensions.find(e => e.id === selectedId) || extensions[0] || null;

    const selectedKey = selected ? selected.id : null;

    // Decode the source once. Prefer the already-decoded source passed from the
    // security manager (avoids re-decoding); otherwise decode the data: URL.
    const decodedSource = useMemo(() => {
        if (!selected) {
            return null;
        }
        if (selected.source != null) {
            return selected.source;
        }
        return decodeExtensionSource(selected.url);
    }, [selectedKey]);

    // For remote (http/https) extensions we must fetch the source to display it
    // and to extract permissions. This is done lazily for the selected extension
    // only, so it never blocks opening the dialog.
    const [fetchedSource, setFetchedSource] = useState(null);
    const [sourceLoading, setSourceLoading] = useState(false);

    useEffect(() => {
        let active = true;
        if (decodedSource != null || !selected) {
            setFetchedSource(null);
            setSourceLoading(false);
            return;
        }
        if (isRemoteExtensionUrl(selected.url)) {
            setSourceLoading(true);
            fetchExtensionSource(selected.url)
                .then(src => {
                    if (active) {
                        setFetchedSource(src);
                        setSourceLoading(false);
                    }
                })
                .catch(() => {
                    if (active) {
                        setSourceLoading(false);
                    }
                });
        } else {
            setFetchedSource(null);
            setSourceLoading(false);
        }
        return () => {
            active = false;
        };
    }, [decodedSource, selectedKey]);

    const finalSource = decodedSource != null ? decodedSource : fetchedSource;

    // Only render/cap the source for the selected extension.
    const selectedSource = useMemo(() => {
        if (finalSource == null) {
            return null;
        }
        const MAX_SOURCE_LENGTH = 200000;
        return finalSource.length > MAX_SOURCE_LENGTH
            ? `${finalSource.slice(0, MAX_SOURCE_LENGTH)}\n…`
            : finalSource;
    }, [finalSource]);

    // Permissions are extracted lazily from the selected extension's real
    // source (reusing the decoded content) instead of scanning every extension
    // in the project when the dialog opens.
    const selectedPermissions = useMemo(() => {
        if (selected && selected.isCysoCore && finalSource) {
            return extractExtensionPermissions(finalSource);
        }
        return [];
    }, [finalSource, selected ? selected.isCysoCore : false]);

    const importedExtensions = extensions.filter(e => e.imported);
    const selectedCount = importedExtensions.length;
    const allSelected = selectedCount === extensions.length && extensions.length > 0;
    
    const allUnsandboxed = importedExtensions.length > 0 &&
        importedExtensions.every(e => e.unsandboxed);

    const toggleAllImport = () => {
        const target = !allSelected;
        extensions.forEach(ext => {
            if (ext.imported !== target) {
                onToggleImport(ext.id);
            }
        });
    };

    const toggleAllUnsandboxed = () => {
        const target = !allUnsandboxed;
        importedExtensions.forEach(ext => {
            if (ext.unsandboxed !== target) {
                onToggleUnsandboxed(ext.id);
            }
        });
    };

    const stop = e => e.stopPropagation();

    return (
        <div className={`${styles.fullPage} ${isDarkMode ? styles.dark : ''}`}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>
                        <FormattedMessage {...messages.title} />
                    </h2>
                    <p className={styles.subtitle}>
                        <FormattedMessage
                            {...messages.subtitle}
                            values={{count: extensions.length}}
                        />
                    </p>
                </div>

                <div className={styles.toolbar}>
                    <label className={styles.toolButton}>
                        <FancyCheckbox
                            checked={allSelected}
                            onChange={toggleAllImport}
                        />
                        <span><FormattedMessage {...messages.selectAll} /></span>
                    </label>
                    <label className={styles.toolButton}>
                        <FancyCheckbox
                            checked={allUnsandboxed}
                            disabled={selectedCount === 0}
                            onChange={toggleAllUnsandboxed}
                        />
                        <span><FormattedMessage {...messages.allUnsandboxed} /></span>
                    </label>
                    <div className={styles.spacer} />
                    <span className={styles.count}>
                        <FormattedMessage
                            {...messages.selectedCount}
                            values={{selected: selectedCount, total: extensions.length}}
                        />
                    </span>
                </div>

                <div className={styles.body}>
                    <div className={styles.list}>
                        {extensions.map(ext => (
                            <div
                                key={ext.id}
                                role="button"
                                tabIndex={0}
                                className={`${styles.item} ${ext.imported ? '' : styles.itemDisabled} ${
                                    selected && selected.id === ext.id ? styles.itemSelected : ''
                                }`}
                                onClick={() => setSelectedId(ext.id)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setSelectedId(ext.id);
                                    }
                                }}
                            >
                                <span className={styles.itemCheck} onClick={stop}>
                                    <FancyCheckbox
                                        checked={ext.imported}
                                        onChange={() => onToggleImport(ext.id)}
                                    />
                                </span>
                                <div className={styles.itemInfo}>
                                    <div className={styles.itemName}>
                                        {ext.isCysoCore && (
                                            <span className={styles.badge}>
                                                <FormattedMessage {...messages.cysoBadge} />
                                            </span>
                                        )}
                                        <span className={styles.itemTitle}>{ext.name}</span>
                                    </div>
                                    <div className={styles.itemId}>{ext.realId}</div>
                                </div>
                                <label
                                    className={`${styles.inlineToggle} ${ext.imported ? '' : styles.inlineToggleDisabled}`}
                                    onClick={stop}
                                    title={ext.unsandboxed ? messages.unsandboxedWarning.defaultMessage : ''}
                                >
                                    <FancyCheckbox
                                        checked={ext.unsandboxed}
                                        disabled={!ext.imported}
                                        onChange={() => onToggleUnsandboxed(ext.id)}
                                    />
                                    <span><FormattedMessage {...messages.unsandboxed} /></span>
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className={styles.detail}>
                        {selected ? (
                            <div className={styles.detailInner}>
                                <div className={styles.detailHeader}>
                                    <div className={styles.detailTitle}>
                                        <FormattedMessage {...messages.detailTitle} />
                                    </div>
                                    <div className={styles.detailName}>
                                        {selected.name}
                                        {selected.isCysoCore && (
                                            <span className={`${styles.badge} ${styles.detailBadge}`}>
                                                <FormattedMessage {...messages.cysoCoreBadge} />
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.detailId}>{selected.realId}</div>
                                </div>

                                <label
                                    className={`${styles.detailToggle} ${selected.imported ? '' : styles.inlineToggleDisabled}`}
                                >
                                    <FancyCheckbox
                                        checked={selected.unsandboxed}
                                        disabled={!selected.imported}
                                        onChange={() => onToggleUnsandboxed(selected.id)}
                                    />
                                    <span><FormattedMessage {...messages.unsandboxed} /></span>
                                </label>

                                <div className={styles.detailCodeWrap}>
                                    {sourceLoading ? (
                                        <div className={styles.itemUrl}>正在加载源代码…</div>
                                    ) : selectedSource !== null ? (
                                        <pre className={styles.code}>{selectedSource}</pre>
                                    ) : (
                                        <div
                                            className={styles.itemUrl}
                                            title={selected.url}
                                        >
                                            {selected.url}
                                        </div>
                                    )}
                                </div>

                                {selected.unsandboxed && (
                                    <div className={styles.warning}>
                                        <FormattedMessage {...messages.unsandboxedWarning} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.detailEmpty}>
                                <FormattedMessage {...messages.noSelection} />
                            </div>
                        )}
                    </div>

                    <div className={styles.permPanel}>
                        <div className={styles.detailTitle}>申请的权限</div>
                        {selected && selected.isCysoCore && selectedPermissions.length > 0 ? (
                            <div className={styles.permSection}>
                                <div className={styles.permSectionTitle}>
                                    <span>📋</span>
                                    <span>该扩展申请的权限（{selectedPermissions.length} 项）</span>
                                </div>
                                <div className={styles.permList}>
                                    {selectedPermissions.map(perm => {
                                    const level = getPermissionRiskLevel(perm);
                                    const risk = level >= 3
                                    ? {text: '高风险', cls: styles.riskHigh}
                                    : level === 2
                                        ? {text: '中风险', cls: styles.riskMedium}
                                        : {text: '低风险', cls: styles.riskLow};
                                    return (
                                    <div key={perm} className={styles.permCard}>
                                        <div
                                            className={styles.permName}
                                            title={getPermissionDescription(perm)}
                                        >
                                            {getPermissionLabel(perm)}
                                        </div>
                                        <span className={`${styles.permRisk} ${risk.cls}`}>
                                            {risk.text}
                                        </span>
                                    </div>
                                    );
                                    })}
                                </div>
                                <div className={styles.permNote}>
                                    导入后将按上述权限运行。你仍可在 CYSO Core 控制中心随时修改各权限设置。
                                </div>
                            </div>
                        ) : (
                            <div className={styles.permEmpty}>该扩展未申请任何 CYSO CORE 权限</div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button
                        type="button"
                        className={styles.denyButton}
                        onClick={onDenied}
                        disabled={!enableButtons}
                    >
                        <FormattedMessage {...messages.deny} />
                    </button>
                    <button
                        type="button"
                        className={styles.allowButton}
                        onClick={onAllowed}
                        disabled={!enableButtons || selectedCount === 0}
                    >
                        <FormattedMessage
                            {...messages.allow}
                            values={{count: selectedCount}}
                        />
                    </button>
                </div>
            </div>
        </div>
    );
};

BatchLoadExtensions.propTypes = {
    extensions: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        url: PropTypes.string,
        name: PropTypes.string,
        realId: PropTypes.string,
        isCysoCore: PropTypes.bool,
        imported: PropTypes.bool,
        unsandboxed: PropTypes.bool
    })).isRequired,
    isDarkMode: PropTypes.bool,
    enableButtons: PropTypes.bool,
    onToggleImport: PropTypes.func.isRequired,
    onToggleUnsandboxed: PropTypes.func.isRequired,
    onAllowed: PropTypes.func.isRequired,
    onDenied: PropTypes.func.isRequired
};

export default BatchLoadExtensions;
