import PropTypes from 'prop-types';
import React from 'react';
import Modal from '../../containers/modal.jsx';
import Box from '../box/box.jsx';
import styles from './settings-modal.css';

const CYSOCoreModal = props => (
    <Modal
        className={styles.modalContent}
        onRequestClose={props.onCancel}
        contentLabel="CYSO Core"
        id="cysoCoreModal"
    >
        <Box className={styles.body}>
            <div className={styles.dangerZone}>
                <div className={styles.dangerZoneHeader}>
                    ⚡ 突破边界，也请保持警惕
                </div>
                <div style={{lineHeight: '1.8', marginBottom: '1rem', color: '#d1d5db'}}>
                    <p>
                        您即将开启 <strong style={{color: '#7ec8e3'}}>CYSO Core</strong> 模式——让创意真正挣脱束缚，像应用一样自由驰骋。
                    </p>
                    <p>
                        但力量越大，责任越大。当 Scratch 项目获得应用级权限时，它拥有了改变您设备的能力。
                        请确保您运行的每一个项目都值得信任，就像您不会随意运行一个陌生人的 .exe 文件一样。
                    </p>
                    <p style={{
                        background: 'linear-gradient(135deg, rgba(79, 142, 194, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%)',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(79, 142, 194, 0.2)',
                        fontSize: '0.9rem'
                    }}>
                        <span style={{color: '#7ec8e3'}}>▪️</span> 自由的前提是安全<br />
                        <span style={{color: '#f87171'}}>▪️</span> 创造的前提是责任
                    </p>
                    <p style={{marginTop: '1rem', fontSize: '13px', color: '#9ca3af'}}>
                        我已阅读并理解以上提醒，将继续开启 CYSO Core 模式。
                    </p>
                </div>
                <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                    <button
                        className={styles.button}
                        onClick={props.onCancel}
                    >
                        取消
                    </button>
                    <button
                        className={styles.dangerZoneButton}
                        onClick={props.onConfirm}
                    >
                        我了解，继续
                    </button>
                </div>
            </div>
        </Box>
    </Modal>
);

CYSOCoreModal.propTypes = {
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default CYSOCoreModal;
