import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';
import {intlShape, injectIntl, defineMessages} from 'react-intl';
import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import {connect} from 'react-redux';

import {setTheme, setCustomTheme} from '../../reducers/theme';
import {persistTheme} from '../../lib/themes/themePersistance';
import {applyCustomTheme, MISTY_SAND_DEFAULT_CSS} from '../../lib/themes/guiHelpers';
import {save as saveCustomTheme, makeDefault} from '../../lib/themes/customTheme';
import {
    Theme,
    ACCENT_PURPLE,
    ACCENT_BLUE_CYAN,
    ACCENT_BLUE,
    ACCENT_RED,
    ACCENT_RAINBOW,
    GUI_AURORA,
    GUI_LIGHT,
    GUI_DARK,
    GUI_MISTY_SAND,
    BLOCKS_DEFAULT,
    BLOCKS_DARK,
    BLOCKS_HIGH_CONTRAST,
    BLOCKS_CUSTOM
} from '../../lib/themes';

import styles from './tw-personalization.css';

const messages = defineMessages({
    label: {
        defaultMessage: '个性化',
        description: 'Title of the personalization panel',
        id: 'tw.personalization.title'
    },
    close: {
        defaultMessage: '关闭',
        description: 'Accessible label for the close button of the personalization panel',
        id: 'tw.personalization.close'
    },
    themeTitle: {
        defaultMessage: '主题',
        description: 'Label for theme section',
        id: 'tw.personalization.theme'
    },
    customLocked: {
        defaultMessage: '自定义主题仅在「雾砂」主题下可用，请先选择「雾砂」主题。',
        description: 'Hint shown when custom theme is locked (not on misty-sand theme)',
        id: 'tw.personalization.customLocked'
    },
    accentTitle: {
        defaultMessage: '主题色',
        description: 'Label for accent color section',
        id: 'tw.personalization.accent'
    },
    accentCustom: {
        defaultMessage: '自定义',
        description: 'Label for custom accent color swatch',
        id: 'tw.personalization.accentCustom'
    },
    accentCustomHint: {
        defaultMessage: '选择你的专属主题色，将应用到按钮、选中态等界面高亮',
        description: 'Hint for custom accent color',
        id: 'tw.personalization.accentCustomHint'
    },
    apply: {
        defaultMessage: '应用',
        description: 'Button to apply the custom accent color',
        id: 'tw.personalization.apply'
    },
    blocksTitle: {
        defaultMessage: '积木颜色',
        description: 'Label for blocks color section',
        id: 'tw.personalization.blocks'
    },
    customTitle: {
        defaultMessage: '自定义主题',
        description: 'Label for custom theme section',
        id: 'tw.personalization.custom'
    },
    globalCss: {
        defaultMessage: '全局样式',
        description: 'Label for global custom CSS',
        id: 'tw.personalization.customCss'
    },
    globalCssHint: {
        defaultMessage: '可输入自定义 CSS（如背景色、渐变、圆角等），作用于整个编辑器',
        description: 'Hint for global CSS field',
        id: 'tw.personalization.customCssHint'
    },
    performanceMode: {
        defaultMessage: '性能模式（背景独立运行，减少卡顿）',
        description: 'Option to run HTML/video background on an isolated layer to avoid repaint lag',
        id: 'tw.personalization.performanceMode'
    },
    performanceModeHint: {
        defaultMessage: '使用动态或视频背景时开启，能让编辑器更流畅、减少卡顿。',
        description: 'Hint for performance mode',
        id: 'tw.personalization.performanceModeHint'
    },
    editorBackground: {
        defaultMessage: '编辑器背景',
        description: 'Label for editor background',
        id: 'tw.personalization.editorBackground'
    },
    toolbarBackground: {
        defaultMessage: '工具栏背景',
        description: 'Label for toolbar background',
        id: 'tw.personalization.toolbarBackground'
    },
    removeBackground: {
        defaultMessage: '移除',
        description: 'Button to remove a custom background',
        id: 'tw.personalization.removeBackground'
    },
    toolbarTransparent: {
        defaultMessage: '透明同步（编辑器背景透到工具栏）',
        description: 'Make menu bar transparent so the editor background shows through the toolbar',
        id: 'tw.personalization.toolbarTransparent'
    },
    toolbarTransparentHint: {
        defaultMessage: '开启后菜单栏透明，直接显示「编辑器背景」，无需上传工具栏素材',
        description: 'Hint for toolbar transparent sync',
        id: 'tw.personalization.toolbarTransparentHint'
    },
    backgroundColor: {
        defaultMessage: '颜色',
        description: 'Editor background type: color',
        id: 'tw.personalization.bgColor'
    },
    backgroundHtml: {
        defaultMessage: 'HTML',
        description: 'Editor background type: HTML',
        id: 'tw.personalization.bgHtml'
    },
    backgroundValue: {
        defaultMessage: '背景内容',
        description: 'Label for background value field',
        id: 'tw.personalization.bgValue'
    },
    uploadHtml: {
        defaultMessage: '上传 HTML 文件',
        description: 'Button to upload an HTML file as background',
        id: 'tw.personalization.uploadHtml'
    },
    uploadFolder: {
        defaultMessage: '上传文件夹（以 index.html 为入口）',
        description: 'Button to upload a folder as a webpage background',
        id: 'tw.personalization.uploadFolder'
    },
    reupload: {
        defaultMessage: '重新上传',
        description: 'Button to re-upload background',
        id: 'tw.personalization.reupload'
    },
    resetCustom: {
        defaultMessage: '重置自定义主题',
        description: 'Button to reset custom theme',
        id: 'tw.personalization.resetCustom'
    }
});

const GUIS = [
    {
        key: GUI_AURORA,
        message: '极光',
        id: 'tw.personalization.aurora'
    },
    {
        key: GUI_LIGHT,
        message: '浅色',
        id: 'tw.personalization.light'
    },
    {
        key: GUI_DARK,
        message: '深色',
        id: 'tw.personalization.dark'
    },
    {
        key: GUI_MISTY_SAND,
        message: '雾砂',
        id: 'tw.personalization.mistySand'
    }
];

const ACCENTS = [
    {
        key: ACCENT_BLUE_CYAN,
        message: '蓝青',
        id: 'tw.personalization.blueCyan'
    },
    {
        key: ACCENT_PURPLE,
        message: '紫色',
        id: 'tw.personalization.purple'
    },
    {
        key: ACCENT_BLUE,
        message: '蓝色',
        id: 'tw.personalization.blue'
    },
    {
        key: ACCENT_RED,
        message: '红色',
        id: 'tw.personalization.red'
    },
    {
        key: ACCENT_RAINBOW,
        message: '彩虹',
        id: 'tw.personalization.rainbow'
    },
    {
        key: 'custom',
        message: '自定义',
        id: 'tw.personalization.accentCustom'
    }
];

const BLOCKS = [
    {
        key: BLOCKS_DEFAULT,
        message: '默认',
        id: 'tw.personalization.blocksDefault'
    },
    {
        key: BLOCKS_DARK,
        message: '深色',
        id: 'tw.personalization.blocksDark'
    },
    {
        key: BLOCKS_HIGH_CONTRAST,
        message: '高对比',
        id: 'tw.personalization.blocksHighContrast'
    },
    {
        key: BLOCKS_CUSTOM,
        message: '自定义',
        id: 'tw.personalization.blocksCustom'
    }
];

const accentColor = key => new Theme(key).getGuiColors()['looks-secondary'];
const blockColor = key => new Theme(null, null, key).getBlockColors()['motion'];

const PaletteIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="1rem"
        height="1rem"
        aria-hidden="true"
    >
        <path
            fill="currentColor"
            d="M12 3a9 9 0 0 0 0 18c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.39-.61-.39-.99 0-.83.67-1.5 1.5-1.5H16a5 5 0 0 0 5-5c0-4.42-4.03-8-9-8Zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"
        />
    </svg>
);

const CheckIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="0.9rem"
        height="0.9rem"
        aria-hidden="true"
    >
        <path
            fill="currentColor"
            d="M9.55 17.05 4.5 12l1.4-1.4 3.65 3.6 8.65-8.65 1.4 1.45z"
        />
    </svg>
);

const CloseIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="1.1rem"
        height="1.1rem"
        aria-hidden="true"
    >
        <path
            fill="currentColor"
            d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4L10.6 10.6 16.9 4.3z"
        />
    </svg>
);

const ExternalIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="0.85rem"
        height="0.85rem"
        aria-hidden="true"
    >
        <path
            fill="currentColor"
            d="M14 3v2h3.6l-9.3 9.3 1.4 1.4L19 6.4V10h2V3h-7zM5 5h5V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-5h-2v5H5V5z"
        />
    </svg>
);

const PlusIcon = () => (
    <svg
        viewBox="0 0 24 24"
        width="1rem"
        height="1rem"
        aria-hidden="true"
    >
        <path
            fill="currentColor"
            d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"
        />
    </svg>
);

const Section = ({title, children}) => (
    <div className={styles.section}>
        <div className={styles.sectionTitle}>{title}</div>
        <div className={styles.sectionBody}>{children}</div>
    </div>
);

Section.propTypes = {
    title: PropTypes.node,
    children: PropTypes.node
};

class PersonalizationMenu extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            showUploader: false,
            showToolbarUploader: false,
            accentDraft: props.customTheme.accentCustom || '#6e5bd6',
            editingCustom: false,
            globalCssDraft: props.customTheme.globalCss || ''
        };
        bindAll(this, [
            'handleChange',
            'handleClose',
            'handleKey',
            'handleBlockChange',
            'openAddonSettings',
            'updateCustom',
            'applyAccent',
            'syncMistySand'
        ]);
        this.panelRef = React.createRef();
        this._priorFocus = null;
    }
    syncMistySand (gui) {
        if (typeof document === 'undefined') return;
        document.documentElement.classList.toggle('tw-misty-sand-theme', gui === GUI_MISTY_SAND);
    }
    componentDidMount () {
        if (this.props.open) {
            document.addEventListener('keydown', this.handleKey);
        }
        this.syncMistySand(this.props.theme.gui);
    }
    componentDidUpdate (prevProps) {
        if (this.props.open && !prevProps.open) {
            document.addEventListener('keydown', this.handleKey);
        } else if (!this.props.open && prevProps.open) {
            document.removeEventListener('keydown', this.handleKey);
        }
        if (prevProps.theme && prevProps.theme.gui !== this.props.theme.gui) {
            this.syncMistySand(this.props.theme.gui);
        }
        if (this.props.open && !prevProps.open) {
            this._priorFocus = document.activeElement;
            if (this.panelRef.current) {
                this.panelRef.current.focus();
            }
        }
        if (prevProps.customTheme.globalCss !== this.props.customTheme.globalCss &&
            this.props.customTheme.globalCss !== this.state.globalCssDraft) {
            this.setState({globalCssDraft: this.props.customTheme.globalCss || ''});
        }
    }
    componentWillUnmount () {
        if (this._customTextTimer) {
            clearTimeout(this._customTextTimer);
            this._customTextTimer = null;
        }
        document.removeEventListener('keydown', this.handleKey);
    }
    handleKey (e) {
        if (e.key === 'Escape') {
            this.handleClose();
            return;
        }
        if (e.key === 'Tab') {
            this.trapFocus(e);
        }
    }
    trapFocus (e) {
        const panel = this.panelRef.current;
        if (!panel) {
            return;
        }
        const focusable = panel.querySelectorAll(
            'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) {
            return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
    handleClose () {
        if (this._priorFocus && typeof this._priorFocus.focus === 'function') {
            this._priorFocus.focus();
        }
        this._priorFocus = null;
        this.props.onClose();
    }
    handleChange (what, value) {
        const next = this.props.theme.set(what, value);
        this.props.onSetTheme(next);
        persistTheme(next);
    }
    handleBlockChange (key) {
        if (key === BLOCKS_CUSTOM) {
            this.handleChange('blocks', BLOCKS_CUSTOM);
            this.openAddonSettings();
            if (typeof this.props.onClose === 'function') {
                this.props.onClose();
            }
            return;
        }
        this.handleChange('blocks', key);
    }
    handleAccent (key) {
        if (key === 'custom') {
            const cur = this.props.customTheme.accentCustom || '#6e5bd6';
            this.setState({
                accentDraft: cur,
                editingCustom: true
            });
            return;
        }
        this.setState({editingCustom: false});
        this.handleChange('accent', key);
        if (this.props.customTheme.accentCustom) {
            this.updateCustom({...this.props.customTheme, accentCustom: ''});
        }
    }
    handleAccentColor (e) {
        this.setState({accentDraft: e.target.value});
    }
    applyAccent () {
        this.updateCustom({...this.props.customTheme, accentCustom: this.state.accentDraft});
    }
    openAddonSettings () {
        if (typeof this.props.onClickAddonSettings === 'function') {
            this.props.onClickAddonSettings('editor-theme3');
            return;
        }
        const root = (typeof process !== 'undefined' && process.env && process.env.ROOT) || '';
        const path = (typeof process !== 'undefined' && process.env && process.env.ROUTING_STYLE === 'wildcard') ? 'addons' : 'addons.html';
        window.open(`${root}${path}#editor-theme3`);
    }
    updateCustom (next) {
        saveCustomTheme(next);
        applyCustomTheme();
        this.props.onSetCustomTheme(next);
    }
    handleCustomText (next) {
        if (this._customTextTimer) {
            clearTimeout(this._customTextTimer);
        }
        this._customTextTimer = setTimeout(() => this.updateCustom(next), 200);
    }
    _readAsText (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
    _readAsDataUrl (file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
    _rewriteRelativeUrls (html, blobMap) {
        if (!blobMap || blobMap.size === 0) {
            return html;
        }
        const attrRegex = /((?:src|href|poster)\s*=\s*)(["'])((?:[^"']+?))(?:\2)/gi;
        html = html.replace(attrRegex, (m, pre, q, url) => {
            if (/^(https?:|data:|blob:|#|mailto:)/i.test(url)) {
                return m;
            }
            const key = url.replace(/^\.\//, '').split('?')[0];
            if (blobMap.has(key)) {
                return `${pre}${q}${blobMap.get(key)}${q}`;
            }
            return m;
        });
        const cssRegex = /(url\(\s*)(["']?)([^)"']+?)(?:\2)(\s*\))/gi;
        html = html.replace(cssRegex, (m, pre, q, url, post) => {
            if (/^(https?:|data:|blob:|#)/i.test(url)) {
                return m;
            }
            const key = url.replace(/^\.\//, '').split('?')[0];
            if (blobMap.has(key)) {
                return `${pre}${q}${blobMap.get(key)}${q}${post}`;
            }
            return m;
        });
        return html;
    }
    async _readFolderAsHtml (files) {
        const blobMap = new Map();
        let indexText = null;
        for (const file of files) {
            const rel = (file.webkitRelativePath || file.name).replace(/^.*?\//, '');
            if (/^index\.html?$/i.test(rel)) {
                indexText = await this._readAsText(file);
            } else {
                try {
                    blobMap.set(rel, await this._readAsDataUrl(file));
                } catch (err) {
                    
                }
            }
        }
        if (indexText === null) {
            for (const file of files) {
                if (/\.html?$/i.test(file.name)) {
                    indexText = await this._readAsText(file);
                    break;
                }
            }
        }
        return indexText === null ? null : this._rewriteRelativeUrls(indexText, blobMap);
    }
    async handleBackgroundUpload (field, e) {
        const input = e.target;
        const files = input.files;
        if (!files || !files.length) {
            return;
        }
        const isFolder = files.length > 1 ||
            (files[0].webkitRelativePath && files[0].webkitRelativePath.includes('/'));
        try {
            const text = isFolder
                ? await this._readFolderAsHtml(files)
                : await this._readAsText(files[0]);
            if (text === null) {
                return;
            }
            this.updateCustom({
                ...this.props.customTheme,
                [field]: {type: 'html', kind: isFolder ? 'folder' : 'file', value: text}
            });
            this.setState({showUploader: false, showToolbarUploader: false});
        } catch (err) {
            // no-op
        }
        input.value = '';
    }
    render () {
        const {
            theme,
            open,
            onClose,
            customTheme,
            intl
        } = this.props;

        if (!open) {
            return null;
        }

        const selectedGui = theme.gui;
        const selectedAccent = theme.accent;
        const selectedBlocks = theme.blocks;
        const editorBackground = customTheme.editorBackground;
        const toolbarBackground = customTheme.toolbarBackground;

        return ReactDOM.createPortal(
            <div
                className={styles.overlay}
                onClick={e => {
                    if (e.target === e.currentTarget) {
                        onClose();
                    }
                }}
            >
                <div
                    className={styles.panel}
                    ref={this.panelRef}
                    onClick={e => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label={intl.formatMessage(messages.label)}
                    tabIndex={-1}
                >
                    <div className={styles.header}>
                        <span className={styles.title}>
                            <PaletteIcon />
                            {intl.formatMessage(messages.label)}
                        </span>
                        <button
                            type="button"
                            className={styles.closeButton}
                            onClick={onClose}
                            aria-label={intl.formatMessage(messages.close)}
                        >
                            <CloseIcon />
                        </button>
                    </div>

                    <div className={styles.panelBody}>
                    <div className={styles.panelCol}>
                    <div className={styles.groupCard}>
                    <Section title={intl.formatMessage(messages.themeTitle)}>
                        <div className={styles.themeRow}>
                            {GUIS.map(opt => (
                                <button
                                    key={opt.key}
                                    type="button"
                                    className={classNames(styles.themeCard, {
                                        [styles.themeCardSelected]: selectedGui === opt.key
                                    })}
                                    onClick={() => {
                                    this.handleChange('gui', opt.key);
                                    this.syncMistySand(opt.key);
                                    if (opt.key === GUI_MISTY_SAND && !customTheme.globalCss) {
                                        this.updateCustom({
                                            ...customTheme,
                                            globalCss: MISTY_SAND_DEFAULT_CSS
                                        });
                                    }
                                }}
                                >
                                <div
                                    className={classNames(styles.themePreview, styles[`preview_${opt.key}`])}
                                >
                                    <span className={styles.themeStage} />
                                    <span className={styles.themeBlocks} />
                                    {selectedGui === opt.key && (
                                        <span className={styles.themeBadge}>
                                            <CheckIcon />
                                        </span>
                                    )}
                                </div>
                                <div className={styles.themeMeta}>
                                    <span className={styles.themeName}>
                                        {intl.formatMessage({defaultMessage: opt.message, id: opt.id})}
                                    </span>
                                </div>
                                </button>
                            ))}
                        </div>
                    </Section>
                    </div>

                    <div className={styles.groupCard}>
                    <Section title={intl.formatMessage(messages.accentTitle)}>
                        <div className={styles.swatchRow}>
                            {ACCENTS.map(opt => {
                                const isCustom = opt.key === 'custom';
                                const isRainbow = opt.key === ACCENT_RAINBOW;
                                const color = isCustom ? null : accentColor(opt.key);
                                const customActive = !!customTheme.accentCustom;
                                const customEditing = this.state.editingCustom;
                                const customPreview = customEditing ? this.state.accentDraft : null;
                                const selected = isCustom
                                    ? customActive
                                    : (!customActive && selectedAccent === opt.key);
                                const swatchStyle = isRainbow ? {
                                    background: 'linear-gradient(90deg, rgba(255,0,0,0.75) 0%, rgba(255,154,0,0.75) 10%, rgba(208,222,33,0.75) 20%, rgba(79,220,74,0.75) 30%, rgba(63,218,216,0.75) 40%, rgba(47,201,226,0.75) 50%, rgba(28,127,238,0.75) 60%, rgba(95,21,242,0.75) 70%, rgba(186,12,248,0.75) 80%, rgba(251,7,217,0.75) 90%, rgba(255,0,0,0.75) 100%)'
                                } : isCustom ? (customActive ? {background: customTheme.accentCustom} : (customPreview ? {background: customPreview} : {})) : {'--swatch': color};
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        className={classNames(styles.swatch, {
                                            [styles.swatchCustom]: isCustom,
                                            [styles.swatchSelected]: selected
                                        })}
                                        style={swatchStyle}
                                        title={intl.formatMessage({defaultMessage: opt.message, id: opt.id})}
                                        aria-label={intl.formatMessage({defaultMessage: opt.message, id: opt.id})}
                                        onClick={() => this.handleAccent(opt.key)}
                                    >
                                        {isCustom && !customActive && !customEditing && (
                                            <span className={styles.swatchPlus}>
                                                <PlusIcon />
                                            </span>
                                        )}
                                        {selected && (
                                            <span className={styles.swatchCheck}>
                                                <CheckIcon />
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {this.state.editingCustom && (
                            <div className={styles.accentCustomRow}>
                                <input
                                    type="color"
                                    className={styles.colorInput}
                                    value={this.state.accentDraft}
                                    onChange={e => this.handleAccentColor(e)}
                                />
                                <button
                                    type="button"
                                    className={styles.applyButton}
                                    onClick={() => this.applyAccent()}
                                >
                                    {intl.formatMessage(messages.apply)}
                                </button>
                                <span className={styles.accentCustomHint}>
                                    {intl.formatMessage(messages.accentCustomHint)}
                                </span>
                            </div>
                        )}
                    </Section>
                    </div>

                    <div className={styles.groupCard}>
                        <Section title={intl.formatMessage(messages.blocksTitle)}>
                            <div className={styles.blockRow}>
                                {BLOCKS.map(opt => {
                                    const c = blockColor(opt.key);
                                    const selected = selectedBlocks === opt.key;
                                    const isCustom = opt.key === BLOCKS_CUSTOM;
                                    return (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            className={classNames(styles.blockPill, {
                                                [styles.blockPillSelected]: selected && !isCustom,
                                                [styles.blockPillExternalActive]: selected && isCustom
                                            })}
                                            onClick={() => this.handleBlockChange(opt.key)}
                                        >
                                            <span
                                                className={styles.blockDot}
                                                style={isCustom ? {
                                                    background: 'conic-gradient(#ff8a3d, #ffd23d, #4cd97b, #4f8ec2, #b76cff, #ff8a3d)'
                                                } : {
                                                    background: c.primary
                                                }}
                                            />
                                            <span className={styles.blockName}>
                                                {intl.formatMessage({defaultMessage: opt.message, id: opt.id})}
                                            </span>
                                            {selected && !isCustom && (
                                                <span className={styles.blockCheck}>
                                                    <CheckIcon />
                                                </span>
                                            )}
                                            {isCustom && (
                                                <span className={styles.blockExternal} title="跳转插件设置">
                                                    <ExternalIcon />
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </Section>
                    </div>
                    </div>

                    <div className={styles.panelCol}>
                    {selectedGui === GUI_MISTY_SAND ? (
                        <React.Fragment>
                        <div className={styles.dividerStrong} />

                        <Section title={intl.formatMessage(messages.customTitle)}>
                        <div className={styles.field}>
                            <div className={styles.fieldLabel}>
                                {intl.formatMessage(messages.globalCss)}
                            </div>
                            <textarea
                                className={styles.customTextarea}
                                rows={3}
                                spellCheck={false}
                                placeholder={intl.formatMessage(messages.globalCssHint)}
                                value={this.state.globalCssDraft}
                                onChange={e => {
                                    const next = e.target.value;
                                    this.setState({globalCssDraft: next});
                                    this.handleCustomText({
                                        ...customTheme,
                                        globalCss: next
                                    });
                                }}
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={customTheme.performanceMode}
                                    onChange={e => this.updateCustom({
                                        ...customTheme,
                                        performanceMode: e.target.checked
                                    })}
                                />
                                <span>{intl.formatMessage(messages.performanceMode)}</span>
                            </label>
                            <div className={styles.fieldHint}>
                                {intl.formatMessage(messages.performanceModeHint)}
                            </div>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.fieldLabel}>
                                {intl.formatMessage(messages.editorBackground)}
                            </div>
                            {editorBackground.value && !this.state.showUploader ? (
                                <div className={styles.bgPreviewWrap}>
                                    <div className={styles.bgPreviewLabel}>
                                        {editorBackground.kind === 'folder'
                                            ? intl.formatMessage(messages.uploadFolder)
                                            : editorBackground.kind === 'file'
                                                ? intl.formatMessage(messages.uploadHtml)
                                                : intl.formatMessage(messages.editorBackground)}
                                    </div>
                                    <div className={styles.bgPreview}>
                                        <iframe
                                            title="background-preview"
                                            className={styles.bgPreviewFrame}
                                            sandbox="allow-scripts allow-popups allow-forms allow-presentation"
                                            srcDoc={editorBackground.value}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.reuploadButton}
                                        onClick={() => this.setState({showUploader: true})}
                                    >
                                        {intl.formatMessage(messages.reupload)}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() => this.updateCustom({
                                            ...customTheme,
                                            editorBackground: {type: 'html', kind: 'text', value: ''}
                                        })}
                                    >
                                        {intl.formatMessage(messages.removeBackground)}
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.fileButtons}>
                                    <label className={styles.fileButton}>
                                        <input
                                            type="file"
                                            accept=".html,.htm,text/html"
                                            onChange={e => this.handleBackgroundUpload('editorBackground', e)}
                                        />
                                        {intl.formatMessage(messages.uploadHtml)}
                                    </label>
                                    <label className={styles.fileButton}>
                                        <input
                                            type="file"
                                            webkitdirectory=""
                                            directory=""
                                            multiple=""
                                            onChange={e => this.handleBackgroundUpload('editorBackground', e)}
                                        />
                                        {intl.formatMessage(messages.uploadFolder)}
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className={styles.field}>
                            <div className={styles.fieldLabel}>
                                {intl.formatMessage(messages.toolbarBackground)}
                            </div>

                            <label className={styles.toggleRow}>
                                <input
                                    type="checkbox"
                                    checked={customTheme.toolbarTransparent}
                                    onChange={e => this.updateCustom({
                                        ...customTheme,
                                        toolbarTransparent: e.target.checked
                                    })}
                                />
                                <span>{intl.formatMessage(messages.toolbarTransparent)}</span>
                            </label>
                            <div className={styles.fieldHint}>
                                {intl.formatMessage(messages.toolbarTransparentHint)}
                            </div>

                            {!customTheme.toolbarTransparent && (
                                toolbarBackground.value && !this.state.showToolbarUploader ? (
                                    <div className={styles.bgPreviewWrap}>
                                        <div className={styles.bgPreviewLabel}>
                                            {toolbarBackground.kind === 'folder'
                                                ? intl.formatMessage(messages.uploadFolder)
                                                : toolbarBackground.kind === 'file'
                                                    ? intl.formatMessage(messages.uploadHtml)
                                                    : intl.formatMessage(messages.toolbarBackground)}
                                        </div>
                                        <div className={styles.bgPreview}>
                                            <iframe
                                                title="toolbar-preview"
                                                className={styles.bgPreviewFrame}
                                                sandbox="allow-scripts allow-popups allow-forms allow-presentation"
                                                srcDoc={toolbarBackground.value}
                                            />
                                        </div>
                                    <button
                                        type="button"
                                        className={styles.reuploadButton}
                                        onClick={() => this.setState({showToolbarUploader: true})}
                                    >
                                        {intl.formatMessage(messages.reupload)}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.removeButton}
                                        onClick={() => this.updateCustom({
                                            ...customTheme,
                                            toolbarBackground: {type: 'html', kind: 'text', value: ''}
                                        })}
                                    >
                                        {intl.formatMessage(messages.removeBackground)}
                                    </button>
                                    </div>
                                ) : (
                                    <div className={styles.fileButtons}>
                                        <label className={styles.fileButton}>
                                            <input
                                                type="file"
                                                accept=".html,.htm,text/html"
                                                onChange={e => this.handleBackgroundUpload('toolbarBackground', e)}
                                            />
                                            {intl.formatMessage(messages.uploadHtml)}
                                        </label>
                                        <label className={styles.fileButton}>
                                            <input
                                                type="file"
                                                webkitdirectory=""
                                                directory=""
                                                multiple=""
                                                onChange={e => this.handleBackgroundUpload('toolbarBackground', e)}
                                            />
                                            {intl.formatMessage(messages.uploadFolder)}
                                        </label>
                                    </div>
                                )
                            )}
                        </div>

                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={() => this.updateCustom({
                                ...makeDefault(),
                                globalCss: ''
                            })}
                        >
                            {intl.formatMessage(messages.resetCustom)}
                        </button>
                        </Section>
                        </React.Fragment>
                    ) : (
                        <div className={styles.customLocked}>
                            <div className={styles.customLockedTitle}>
                                {intl.formatMessage(messages.customTitle)}
                            </div>
                            <div className={styles.customLockedHint}>
                                {intl.formatMessage(messages.customLocked)}
                            </div>
                        </div>
                    )}
                    </div>
                    </div>

                </div>
            </div>,
            document.body
        );
    }
}

PersonalizationMenu.propTypes = {
    theme: PropTypes.instanceOf(Theme).isRequired,
    open: PropTypes.bool,
    onClose: PropTypes.func,
    onSetTheme: PropTypes.func,
    onClickAddonSettings: PropTypes.func,
    customTheme: PropTypes.shape({
        globalCss: PropTypes.string,
        editorBackground: PropTypes.shape({
            type: PropTypes.string,
            value: PropTypes.string
        }),
        performanceMode: PropTypes.bool,
        toolbarBackground: PropTypes.shape({
            type: PropTypes.string,
            value: PropTypes.string
        }),
        toolbarTransparent: PropTypes.bool
    }),
    onSetCustomTheme: PropTypes.func,
    intl: intlShape
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme,
    customTheme: state.scratchGui.theme.customTheme
});

const mapDispatchToProps = dispatch => ({
    onSetTheme: theme => dispatch(setTheme(theme)),
    onSetCustomTheme: customTheme => dispatch(setCustomTheme(customTheme))
});

const ConnectedPersonalizationMenu = connect(
    mapStateToProps,
    mapDispatchToProps
)(PersonalizationMenu);

export default injectIntl(ConnectedPersonalizationMenu);
