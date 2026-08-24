import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import {
    getCustomLibraries,
    addCustomLibrary,
    updateCustomLibrary,
    removeCustomLibrary,
    CUSTOM_LIBRARY_STANDARD_SCHEMA
} from '../lib/libraries/cysoeditor-hub';

import CysoDialog from '../components/cyso-dialog/cyso-dialog.jsx';

const messages = defineMessages({
    title: {
        defaultMessage: '自定义扩展库管理',
        description: 'Custom library modal title',
        id: 'tw.customLibrary.title'
    },
    close: {
        defaultMessage: '关闭',
        description: 'Close button',
        id: 'tw.customLibrary.close'
    },
    add: {
        defaultMessage: '添加库',
        description: 'Add library button',
        id: 'tw.customLibrary.add'
    },
    nameLabel: {
        defaultMessage: '库名称',
        description: 'Library name label',
        id: 'tw.customLibrary.nameLabel'
    },
    urlLabel: {
        defaultMessage: '扩展库 JSON 地址',
        description: 'Library JSON URL label',
        id: 'tw.customLibrary.urlLabel'
    },
    namePlaceholder: {
        defaultMessage: '例如：我的扩展库',
        description: 'Name placeholder',
        id: 'tw.customLibrary.namePlaceholder'
    },
    urlPlaceholder: {
        defaultMessage: 'https://example.com/extensions.json',
        description: 'URL placeholder',
        id: 'tw.customLibrary.urlPlaceholder'
    },
    modeManual: {
        defaultMessage: '手动绑定',
        description: 'Manual binding mode',
        id: 'tw.customLibrary.modeManual'
    },
    modeJs: {
        defaultMessage: '自定义 JS',
        description: 'Custom JS mode',
        id: 'tw.customLibrary.modeJs'
    },
    mappingId: {
        defaultMessage: '扩展ID字段名',
        description: 'ID field mapping',
        id: 'tw.customLibrary.mappingId'
    },
    mappingName: {
        defaultMessage: '名称字段名',
        description: 'Name field mapping',
        id: 'tw.customLibrary.mappingName'
    },
    mappingDescription: {
        defaultMessage: '简介字段名',
        description: 'Description field mapping',
        id: 'tw.customLibrary.mappingDescription'
    },
    mappingAuthor: {
        defaultMessage: '作者字段名',
        description: 'Author field mapping',
        id: 'tw.customLibrary.mappingAuthor'
    },
    mappingAuthorHomepage: {
        defaultMessage: '作者主页字段名（可选，提供后作者名可点击跳转）',
        description: 'Author homepage field mapping',
        id: 'tw.customLibrary.mappingAuthorHomepage'
    },
    errorCover: {
        defaultMessage: '请填写封面字段名或封面地址模板',
        description: 'Error: missing cover mapping/template',
        id: 'tw.customLibrary.errorCover'
    },
    errorDownload: {
        defaultMessage: '请填写下载地址字段名或文件地址模板',
        description: 'Error: missing download mapping/template',
        id: 'tw.customLibrary.errorDownload'
    },
    mappingCover: {
        defaultMessage: '封面字段名',
        description: 'Cover field mapping',
        id: 'tw.customLibrary.mappingCover'
    },
    mappingDownload: {
        defaultMessage: '下载地址字段名',
        description: 'Download URL field mapping',
        id: 'tw.customLibrary.mappingDownload'
    },
    mappingCategory: {
        defaultMessage: '分类字段名',
        description: 'Category field mapping',
        id: 'tw.customLibrary.mappingCategory'
    },
    mappingNameTranslations: {
        defaultMessage: '名称翻译字段（默认 nameTranslations）',
        description: 'Name translations field mapping',
        id: 'tw.customLibrary.mappingNameTranslations'
    },
    mappingDescriptionTranslations: {
        defaultMessage: '描述翻译字段（默认 descriptionTranslations）',
        description: 'Description translations field mapping',
        id: 'tw.customLibrary.mappingDescriptionTranslations'
    },
    fileTemplate: {
        defaultMessage: '文件地址模板（{id} 占位扩展ID）',
        description: 'File URL template',
        id: 'tw.customLibrary.fileTemplate'
    },
    coverTemplate: {
        defaultMessage: '封面地址模板（{id} 占位扩展ID）',
        description: 'Cover URL template',
        id: 'tw.customLibrary.coverTemplate'
    },
    filePlaceholder: {
        defaultMessage: '{domain}/{id}.js',
        description: 'File template placeholder',
        id: 'tw.customLibrary.filePlaceholder'
    },
    coverPlaceholder: {
        defaultMessage: '{domain}/{image}',
        description: 'Cover template placeholder',
        id: 'tw.customLibrary.coverPlaceholder'
    },
    jsCode: {
        defaultMessage: '自定义 JS 代码（会收到 fetch 与 libraryUrl 两个参数，需 return 标准结构）',
        description: 'Custom JS code label',
        id: 'tw.customLibrary.jsCode'
    },
    jsPlaceholder: {
        defaultMessage: 'const res = await fetch(libraryUrl);\nconst data = await res.json();\nreturn (data.extensions || []).map(it => ({\n  id: it.ext_id,\n  name: it.title,\n  description: it.desc,\n  author: it.creator\n}));',
        description: 'JS code placeholder',
        id: 'tw.customLibrary.jsPlaceholder'
    },
    standardSchema: {
        defaultMessage: '标准 JSON 结构（自定义 JS 需返回此结构）',
        description: 'Standard schema title',
        id: 'tw.customLibrary.standardSchema'
    },
    save: {
        defaultMessage: '保存',
        description: 'Save button',
        id: 'tw.customLibrary.save'
    },
    cancel: {
        defaultMessage: '取消',
        description: 'Cancel button',
        id: 'tw.customLibrary.cancel'
    },
    edit: {
        defaultMessage: '编辑',
        description: 'Edit button',
        id: 'tw.customLibrary.edit'
    },
    delete: {
        defaultMessage: '删除',
        description: 'Delete button',
        id: 'tw.customLibrary.delete'
    },
    type: {
        defaultMessage: '类型：{type}',
        description: 'Library type display',
        id: 'tw.customLibrary.type'
    },
    noLibrary: {
        defaultMessage: '暂无自定义扩展库',
        description: 'No custom library',
        id: 'tw.customLibrary.noLibrary'
    },
    confirmDelete: {
        defaultMessage: '确定删除该自定义扩展库？',
        description: 'Confirm delete',
        id: 'tw.customLibrary.confirmDelete'
    },
    errorName: {
        defaultMessage: '请填写库名称',
        description: 'Error: missing name',
        id: 'tw.customLibrary.errorName'
    },
    errorUrl: {
        defaultMessage: '手动绑定方式请填写扩展库 JSON 地址',
        description: 'Error: missing url',
        id: 'tw.customLibrary.errorUrl'
    },
    errorCode: {
        defaultMessage: '自定义 JS 方式请填写代码',
        description: 'Error: missing code',
        id: 'tw.customLibrary.errorCode'
    }
});

const DEFAULT_FILE_TEMPLATE = '{domain}/{id}.js';
const DEFAULT_COVER_TEMPLATE = '{domain}/{image}';

const emptyForm = () => ({
    name: '',
    url: '',
    fieldMapping: {
        id: 'id',
        name: 'name',
        description: 'description',
        author: 'by[0].name',
        author_homepage: 'by[0].link',
        cover: 'cover',
        download_url: 'download_url',
        category: 'category',
        name_translations: '',
        description_translations: ''
    },
    fileTemplate: DEFAULT_FILE_TEMPLATE,
    coverTemplate: DEFAULT_COVER_TEMPLATE,
    code: '',
    localize: true
});

const CustomLibraryModal = ({intl, visible, onClose, onChanged}) => {
    const [libs, setLibs] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [mode, setMode] = useState('manual');
    const [form, setForm] = useState(emptyForm());
    const [error, setError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [downloadMode, setDownloadMode] = useState('field');
    const [coverMode, setCoverMode] = useState('field');
    const [localize, setLocalize] = useState(true);

    useEffect(() => {
        if (visible) {
            setLibs(getCustomLibraries());
            setError(null);
        }
    }, [visible]);

    const setField = (key, value) => setForm(prev => ({...prev, [key]: value}));
    const setMapping = (key, value) => setForm(prev => ({...prev, fieldMapping: {...prev.fieldMapping, [key]: value}}));

    const startAdd = () => {
        setFormOpen(true);
        setEditingId(null);
        setMode('manual');
        setForm(emptyForm());
        setDownloadMode('field');
        setCoverMode('field');
        setLocalize(true);
        setError(null);
    };

    const startEdit = lib => {
        const fm = lib.fieldMapping || emptyForm().fieldMapping;
        setFormOpen(true);
        setEditingId(lib.id);
        setMode(lib.type || 'manual');
        setForm({
            name: lib.name || '',
            url: lib.url || '',
            fieldMapping: fm,
            fileTemplate: lib.fileTemplate || DEFAULT_FILE_TEMPLATE,
            coverTemplate: lib.coverTemplate || DEFAULT_COVER_TEMPLATE,
            code: lib.code || ''
        });
        setDownloadMode(lib.downloadMode || ((lib.fileTemplate && lib.fileTemplate !== DEFAULT_FILE_TEMPLATE) ? 'template' : 'field'));
        setCoverMode(lib.coverMode || ((lib.coverTemplate && lib.coverTemplate !== DEFAULT_COVER_TEMPLATE) ? 'template' : 'field'));
        setLocalize(lib.localize !== false);
        setError(null);
    };

    const cancelEdit = () => {
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm());
        setError(null);
    };

    const handleSave = () => {
        setError(null);
        if (!form.name.trim()) {
            setError(intl.formatMessage(messages.errorName));
            return;
        }
        if (mode === 'manual' && !form.url.trim()) {
            setError(intl.formatMessage(messages.errorUrl));
            return;
        }
        if (mode === 'js' && !form.code.trim()) {
            setError(intl.formatMessage(messages.errorCode));
            return;
        }
        if (mode === 'manual') {
            if (downloadMode === 'field' && !form.fieldMapping.download_url) {
                setError(intl.formatMessage(messages.errorDownload));
                return;
            }
            if (downloadMode === 'template' && !form.fileTemplate) {
                setError(intl.formatMessage(messages.errorDownload));
                return;
            }
            if (coverMode === 'field' && !form.fieldMapping.cover) {
                setError(intl.formatMessage(messages.errorCover));
                return;
            }
            if (coverMode === 'template' && !form.coverTemplate) {
                setError(intl.formatMessage(messages.errorCover));
                return;
            }
        }
        const fieldMapping = {...form.fieldMapping};
        fieldMapping.download_url = downloadMode === 'field' ? (fieldMapping.download_url || '') : '';
        fieldMapping.cover = coverMode === 'field' ? (fieldMapping.cover || '') : '';
        const payload = {
            name: form.name.trim(),
            url: form.url.trim(),
            type: mode,
            fieldMapping,
            fileTemplate: downloadMode === 'template' ? form.fileTemplate : DEFAULT_FILE_TEMPLATE,
            coverTemplate: coverMode === 'template' ? form.coverTemplate : DEFAULT_COVER_TEMPLATE,
            downloadMode,
            coverMode,
            localize,
            code: form.code
        };
        if (editingId) {
            updateCustomLibrary(editingId, payload);
        } else {
            addCustomLibrary(payload);
        }
        setLibs(getCustomLibraries());
        setFormOpen(false);
        setEditingId(null);
        setForm(emptyForm());
        setError(null);
        if (onChanged) onChanged();
    };

    const confirmDelete = () => {
        if (confirmDeleteId) {
            removeCustomLibrary(confirmDeleteId);
            setLibs(getCustomLibraries());
            if (onChanged) onChanged();
        }
        setConfirmDeleteId(null);
    };

    const cancelDelete = () => {
        setConfirmDeleteId(null);
    };

    const inputStyle = {
        width: '100%',
        padding: '6px 8px',
        fontSize: 13,
        boxSizing: 'border-box',
        background: 'var(--input-background, #fff)',
        color: 'var(--text-primary, #575e75)',
        border: '1px solid var(--ui-white, #ccc)',
        borderRadius: 4
    };

    const labelStyle = {
        fontSize: 12,
        color: 'var(--text-primary-transparent, #666)',
        marginBottom: 2
    };

    const field = (label, value, onChange, placeholder, required) => (
        <div style={{marginBottom: 8}}>
            <div style={labelStyle}>
                {label}
                {required && <span style={{color: '#e74c3c', marginLeft: 4}}>*</span>}
            </div>
            <input
                value={value || ''}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                style={inputStyle}
            />
        </div>
    );

    if (!visible) return null;

    const mistySandLight = typeof document !== 'undefined' &&
        document.documentElement.classList.contains('tw-misty-sand-theme') &&
        !document.documentElement.classList.contains('tw-misty-sand-dark');

    const themeEl = typeof document !== 'undefined' ? document.documentElement : null;
    const isDark = !!themeEl && (
        themeEl.classList.contains('tw-misty-sand-dark') ||
        themeEl.classList.contains('scratch-dark-mode') ||
        themeEl.classList.contains('tw-dark-mode') ||
        (!themeEl.classList.contains('tw-misty-sand-theme') &&
            typeof window !== 'undefined' && window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
    const mutedColor = isDark ? '#9a9fac' : '#999';
    const softBorder = isDark ? 'rgba(255, 255, 255, 0.14)' : '#eee';
    const strongBorder = isDark ? 'rgba(255, 255, 255, 0.22)' : '#ccc';
    const btnBg = isDark ? '#2a2c34' : '#fff';
    const btnText = isDark ? '#e8e9ee' : '#333';
    const dangerColor = isDark ? '#ff7a85' : '#c33';
    const dangerBorder = isDark ? 'rgba(255, 100, 110, 0.5)' : '#e88';

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: mistySandLight ? 'rgba(45, 60, 92, 0.45)' : 'var(--ui-modal-overlay, rgba(0,0,0,0.5))',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: mistySandLight ? '#ffffff' : 'var(--ui-modal-background, #fff)',
                    color: mistySandLight ? '#575e75' : 'var(--ui-modal-foreground, #575e75)',
                    borderRadius: 8,
                    width: 720,
                    maxWidth: '95vw',
                    maxHeight: '88vh',
                    overflow: 'auto',
                    padding: 20,
                    boxSizing: 'border-box'
                }}
            >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                    <div style={{fontSize: 18, fontWeight: 'bold'}}>{intl.formatMessage(messages.title)}</div>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{border: 'none', background: 'transparent', fontSize: 20, cursor: 'pointer', lineHeight: 1}}
                    >
                        {'×'}
                    </button>
                </div>

                <div style={{marginBottom: 16}}>
                    <div style={{fontSize: 14, fontWeight: 'bold', marginBottom: 8}}>
                        <FormattedMessage defaultMessage="已有扩展库" id="tw.customLibrary.existing" />
                    </div>
                    {libs.length === 0 ? (
                        <div style={{fontSize: 13, color: mutedColor}}>{intl.formatMessage(messages.noLibrary)}</div>
                    ) : (
                        libs.map(lib => (
                            <div
                                key={lib.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    border: `1px solid ${softBorder}`,
                                    borderRadius: 4,
                                    marginBottom: 6,
                                    background: isDark ? 'rgba(255, 255, 255, 0.04)' : 'transparent'
                                }}
                            >
                                <div style={{fontSize: 13}}>
                                    <span style={{fontWeight: 'bold'}}>{lib.name}</span>
                                    {'  '}
                                    <span style={{color: mutedColor, fontSize: 12}}>
                                        {intl.formatMessage(messages.type, {type: lib.type === 'js' ? intl.formatMessage(messages.modeJs) : intl.formatMessage(messages.modeManual)})}
                                    </span>
                                </div>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => startEdit(lib)}
                                        style={{marginRight: 8, cursor: 'pointer', fontSize: 12, padding: '3px 10px', border: `1px solid ${strongBorder}`, borderRadius: 4, background: btnBg, color: btnText}}
                                    >
                                        {intl.formatMessage(messages.edit)}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDeleteId(lib.id)}
                                        style={{cursor: 'pointer', fontSize: 12, padding: '3px 10px', border: `1px solid ${dangerBorder}`, borderRadius: 4, background: btnBg, color: dangerColor}}
                                    >
                                        {intl.formatMessage(messages.delete)}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                    {!formOpen && (
                        <button
                            type="button"
                            onClick={startAdd}
                            style={{marginTop: 6, cursor: 'pointer', fontSize: 13, padding: '6px 14px', border: '1px solid #4a90e2', borderRadius: 4, background: '#4a90e2', color: '#fff'}}
                        >
                            {intl.formatMessage(messages.add)}
                        </button>
                    )}
                </div>

                {formOpen && (
                    <div style={{borderTop: `1px solid ${softBorder}`, paddingTop: 16, marginBottom: 16}}>
                        <div style={{display: 'flex', gap: 8, marginBottom: 12}}>
                            <button
                                type="button"
                                onClick={() => setMode('manual')}
                                style={{
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    padding: '6px 14px',
                                    borderRadius: 4,
                                    border: `1px solid ${strongBorder}`,
                                    background: mode === 'manual' ? '#4a90e2' : btnBg,
                                    color: mode === 'manual' ? '#fff' : btnText
                                }}
                            >
                                {intl.formatMessage(messages.modeManual)}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('js')}
                                style={{
                                    cursor: 'pointer',
                                    fontSize: 13,
                                    padding: '6px 14px',
                                    borderRadius: 4,
                                    border: `1px solid ${strongBorder}`,
                                    background: mode === 'js' ? '#4a90e2' : btnBg,
                                    color: mode === 'js' ? '#fff' : btnText
                                }}
                            >
                                {intl.formatMessage(messages.modeJs)}
                            </button>
                        </div>

                        {field(intl.formatMessage(messages.nameLabel), form.name, v => setField('name', v), intl.formatMessage(messages.namePlaceholder))}
                        <label
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                color: btnText,
                                cursor: 'pointer',
                                margin: '2px 0 8px',
                                userSelect: 'none'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={localize}
                                onChange={e => setLocalize(e.target.checked)}
                                style={{cursor: 'pointer', width: 14, height: 14}}
                            />
                            <FormattedMessage defaultMessage="名称与描述自动按当前语言取 nameTranslations / descriptionTranslations，没有则回退默认 name / description" id="tw.customLibrary.localize" />
                        </label>
                        {mode === 'manual' && (
                            <div>
                                {field(intl.formatMessage(messages.urlLabel), form.url, v => setField('url', v), intl.formatMessage(messages.urlPlaceholder))}
                                <div style={{fontSize: 12, color: mutedColor, margin: '4px 0 8px'}}>
                                    <FormattedMessage defaultMessage="字段映射：填写源 JSON 中对应的字段名（默认已匹配标准结构）" id="tw.customLibrary.mappingHint" />
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px'}}>
                                    {field(intl.formatMessage(messages.mappingId), form.fieldMapping.id, v => setMapping('id', v))}
                                    {field(intl.formatMessage(messages.mappingName), form.fieldMapping.name, v => setMapping('name', v))}
                                    {field(intl.formatMessage(messages.mappingDescription), form.fieldMapping.description, v => setMapping('description', v))}
                                    {field(intl.formatMessage(messages.mappingAuthor), form.fieldMapping.author, v => setMapping('author', v))}
                                    {field(intl.formatMessage(messages.mappingAuthorHomepage), form.fieldMapping.author_homepage, v => setMapping('author_homepage', v))}
                                    {field(intl.formatMessage(messages.mappingCategory), form.fieldMapping.category, v => setMapping('category', v))}
                                    {field(intl.formatMessage(messages.mappingNameTranslations), form.fieldMapping.name_translations, v => setMapping('name_translations', v), 'nameTranslations')}
                                    {field(intl.formatMessage(messages.mappingDescriptionTranslations), form.fieldMapping.description_translations, v => setMapping('description_translations', v), 'descriptionTranslations')}
                                </div>
                                <div style={{borderTop: `1px solid ${softBorder}`, marginTop: 8, paddingTop: 10}}>
                                    <div style={{...labelStyle, fontWeight: 'bold'}}>
                                        <FormattedMessage defaultMessage="下载地址（字段名 或 地址模板，二选一）" id="tw.customLibrary.downloadSource" />
                                    </div>
                                    <div style={{display: 'flex', gap: 4, marginBottom: 4}}>
                                        <button
                                            type="button"
                                            onClick={() => setDownloadMode('field')}
                                            style={{cursor: 'pointer', fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${strongBorder}`, background: downloadMode === 'field' ? '#4a90e2' : btnBg, color: downloadMode === 'field' ? '#fff' : btnText}}
                                        >
                                            <FormattedMessage defaultMessage="使用字段名" id="tw.customLibrary.useField" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDownloadMode('template')}
                                            style={{cursor: 'pointer', fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${strongBorder}`, background: downloadMode === 'template' ? '#4a90e2' : btnBg, color: downloadMode === 'template' ? '#fff' : btnText}}
                                        >
                                            <FormattedMessage defaultMessage="使用地址模板" id="tw.customLibrary.useTemplate" />
                                        </button>
                                    </div>
                                    {downloadMode === 'field'
                                        ? field(intl.formatMessage(messages.mappingDownload), form.fieldMapping.download_url, v => setMapping('download_url', v), 'download_url', true)
                                        : field(intl.formatMessage(messages.fileTemplate), form.fileTemplate, v => setField('fileTemplate', v), intl.formatMessage(messages.filePlaceholder), true)}
                                </div>
                                <div style={{borderTop: `1px solid ${softBorder}`, marginTop: 8, paddingTop: 10}}>
                                    <div style={{...labelStyle, fontWeight: 'bold'}}>
                                        <FormattedMessage defaultMessage="封面图片（字段名 或 地址模板，二选一）" id="tw.customLibrary.coverSource" />
                                    </div>
                                    <div style={{display: 'flex', gap: 4, marginBottom: 4}}>
                                        <button
                                            type="button"
                                            onClick={() => setCoverMode('field')}
                                            style={{cursor: 'pointer', fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${strongBorder}`, background: coverMode === 'field' ? '#4a90e2' : btnBg, color: coverMode === 'field' ? '#fff' : btnText}}
                                        >
                                            <FormattedMessage defaultMessage="使用字段名" id="tw.customLibrary.useField" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCoverMode('template')}
                                            style={{cursor: 'pointer', fontSize: 12, padding: '3px 8px', borderRadius: 4, border: `1px solid ${strongBorder}`, background: coverMode === 'template' ? '#4a90e2' : btnBg, color: coverMode === 'template' ? '#fff' : btnText}}
                                        >
                                            <FormattedMessage defaultMessage="使用地址模板" id="tw.customLibrary.useTemplate" />
                                        </button>
                                    </div>
                                    {coverMode === 'field'
                                        ? field(intl.formatMessage(messages.mappingCover), form.fieldMapping.cover, v => setMapping('cover', v), 'cover', true)
                                        : field(intl.formatMessage(messages.coverTemplate), form.coverTemplate, v => setField('coverTemplate', v), intl.formatMessage(messages.coverPlaceholder), true)}
                                </div>
                            </div>
                        )}
                        {mode === 'js' && (
                            <div style={{marginBottom: 8}}>
                                <div style={labelStyle}>{intl.formatMessage(messages.jsCode)}</div>
                                <textarea
                                    value={form.code || ''}
                                    placeholder={intl.formatMessage(messages.jsPlaceholder)}
                                    onChange={e => setField('code', e.target.value)}
                                    style={{...inputStyle, minHeight: 180, fontFamily: 'monospace', fontSize: 12, resize: 'vertical'}}
                                />
                            </div>
                        )}

                        {error && (
                            <div style={{color: dangerColor, fontSize: 13, marginBottom: 8}}>{error}</div>
                        )}

                        <div style={{display: 'flex', gap: 8}}>
                            <button
                                type="button"
                                onClick={handleSave}
                                style={{cursor: 'pointer', fontSize: 13, padding: '6px 18px', border: '1px solid #4a90e2', borderRadius: 4, background: '#4a90e2', color: '#fff'}}
                            >
                                {intl.formatMessage(messages.save)}
                            </button>
                            <button
                                type="button"
                                onClick={cancelEdit}
                                style={{cursor: 'pointer', fontSize: 13, padding: '6px 18px', border: `1px solid ${strongBorder}`, borderRadius: 4, background: btnBg, color: btnText}}
                            >
                                {intl.formatMessage(messages.cancel)}
                            </button>
                        </div>
                    </div>
                )}

                <div style={{borderTop: `1px solid ${softBorder}`, paddingTop: 12}}>
                    <div style={{fontSize: 13, fontWeight: 'bold', marginBottom: 6}}>
                        {intl.formatMessage(messages.standardSchema)}
                    </div>
                    <pre
                        style={{
                            background: 'var(--ui-secondary, #f6f6f6)',
                            color: 'var(--text-primary, #575e75)',
                            padding: 12,
                            borderRadius: 4,
                            fontSize: 12,
                            maxHeight: 240,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            margin: 0
                        }}
                    >
                        {CUSTOM_LIBRARY_STANDARD_SCHEMA}
                    </pre>
                </div>
            </div>
            <CysoDialog
                open={!!confirmDeleteId}
                type="confirm"
                title="提示"
                message={intl.formatMessage(messages.confirmDelete)}
                confirmText="删除"
                cancelText="取消"
                onConfirm={confirmDelete}
                onCancel={cancelDelete}
            />
        </div>
    );
};

CustomLibraryModal.propTypes = {
    intl: intlShape.isRequired,
    visible: PropTypes.bool,
    onClose: PropTypes.func,
    onChanged: PropTypes.func
};

export default injectIntl(CustomLibraryModal);
