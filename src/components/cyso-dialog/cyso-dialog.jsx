import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';

const spinKeyframes = `
@keyframes cysoSpin {
    to { transform: rotate(360deg); }
}
`;

const actionStyle = {
    padding: '7px 16px',
    fontSize: 13,
    borderRadius: 6,
    cursor: 'pointer'
};

const CysoDialog = ({
    open,
    type,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    loading
}) => {
    if (!open) return null;
    const mistySandLight = typeof document !== 'undefined' &&
        document.documentElement.classList.contains('tw-misty-sand-theme') &&
        !document.documentElement.classList.contains('tw-misty-sand-dark');
    const overlayBg = mistySandLight ? 'rgba(45, 60, 92, 0.45)' : 'var(--ui-modal-overlay, rgba(0, 0, 0, 0.5))';
    const panelBg = mistySandLight ? '#ffffff' : 'var(--ui-modal-background, #fff)';
    const panelColor = mistySandLight ? '#575e75' : 'var(--ui-modal-foreground, #575e75)';
    return (
        <React.Fragment>
            <style>{spinKeyframes}</style>
            <div
                role="dialog"
                aria-modal="true"
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 1400,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                boxSizing: 'border-box',
                background: overlayBg
            }}
        >
            <div
                style={{
                    background: panelBg,
                    color: panelColor,
                    borderRadius: 12,
                    padding: '20px 24px',
                    maxWidth: 460,
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 10px 32px rgba(0, 0, 0, 0.28)'
                }}
            >
                <div style={{fontSize: 16, fontWeight: 700, marginBottom: 12}}>
                    {title}
                </div>
                {message ? (
                    <div
                        style={{
                            fontSize: 14,
                            lineHeight: 1.6,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            color: 'var(--text-primary, inherit)'
                        }}
                    >
                        {message}
                    </div>
                ) : null}
                {loading ? (
                    <div>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginTop: 20,
                                color: 'var(--text-primary, #575e75)',
                                fontSize: 13
                            }}
                        >
                            <span
                                style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    border: '2px solid rgba(74, 144, 226, 0.3)',
                                    borderTopColor: '#4a90e2',
                                    animation: 'cysoSpin 0.8s linear infinite',
                                    flexShrink: 0
                                }}
                            />
                            <span>
                                <FormattedMessage defaultMessage="正在处理…" id="tw.customLibrary.processing" />
                            </span>
                        </div>
                        {onCancel ? (
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-end',
                                    marginTop: 16
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={onCancel}
                                    style={{
                                        ...actionStyle,
                                        background: 'var(--ui-secondary, #fff)',
                                        color: 'var(--text-primary, #575e75)',
                                        border: '1px solid var(--ui-white, #ccc)'
                                    }}
                                >
                                    {cancelText}
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8,
                        marginTop: 20
                    }}
                >
                    {type === 'confirm' && (
                        <button
                            type="button"
                            onClick={onCancel}
                            style={{
                                ...actionStyle,
                                background: 'var(--ui-secondary, #fff)',
                                color: 'var(--text-primary, #575e75)',
                                border: '1px solid var(--ui-white, #ccc)'
                            }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        style={{
                            ...actionStyle,
                            background: '#4a90e2',
                            color: '#fff',
                            border: 'none'
                        }}
                    >
                        {type === 'confirm' ? confirmText : '确定'}
                    </button>
                </div>
                )}
            </div>
        </div>
        </React.Fragment>
    );
};

CysoDialog.propTypes = {
    open: PropTypes.bool,
    type: PropTypes.oneOf(['confirm', 'alert']),
    title: PropTypes.string,
    message: PropTypes.node,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    onConfirm: PropTypes.func,
    onCancel: PropTypes.func,
    loading: PropTypes.bool
};

CysoDialog.defaultProps = {
    open: false,
    type: 'alert',
    title: '提示',
    message: null,
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: () => {},
    onCancel: () => {},
    loading: false
};

export default CysoDialog;