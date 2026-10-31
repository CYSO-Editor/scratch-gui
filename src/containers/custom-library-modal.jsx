import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import {defineMessages, injectIntl, intlShape, FormattedMessage} from 'react-intl';
import {
    getCustomLibraries,
    addCustomLibrary,
    updateCustomLibrary,
    removeCustomLibrary
} from '../lib/libraries/cysoeditor-hub';

import CysoDialog from '../components/cyso-dialog/cyso-dialog.jsx';

const JS_PLACEHOLDER = 'const res = await fetch(libraryUrl);\nconst data = await res.json();\nreturn data.extensions.map(it => ({\n  slug: it.slug,\n  id: it.id,\n  name: it.name,\n  description: it.description,\n  nameTranslations: it.nameTranslations,\n  descriptionTranslations: it.descriptionTranslations,\n  image: it.image,\n  by: it.by\n}));';

const JS_REQUIREMENTS = [
    '━━━━━━ 自定义 JS 编写要求 ━━━━━━',
    '',
    '一、执行方式',
    '· 代码作为异步函数体运行，可直接使用 await / return',
    '· 收到两个参数：',
    '    fetch       请求函数（浏览器原生 fetch）',
    '    libraryUrl  库配置中填写的地址',
    '· 必须通过 return 返回数据，无返回值会报错',
    '· 运行失败时请直接抛出错误（throw），错误信息会显示在扩展库列表中',
    '',
    '二、返回值结构（必须与官方 extensions-v0.json 一致）',
    'return [ { ... }, { ... } ]              （扩展对象数组）',
    '或 return { "extensions": [ { ... } ] }  （对象）',
    '',
    '数组元素字段：',
    '  slug                     必需  扩展文件名（不含 .js），',
    '                                 文件地址 = JSON目录 + /{slug}.js',
    '  id                       必需  扩展唯一ID',
    '  name                     必需  显示名称',
    '  description              建议  简介，过长自动截断',
    '  nameTranslations         建议  { "zh-cn": "名称" }，按语言显示',
    '  descriptionTranslations  建议  同上，无对应语言时回退 name / description',
    '  image                    建议  封面地址，相对路径基于 JSON 目录解析，',
    '                                 也可填完整 http(s) 地址',
    '  by                       建议  [{ "name": "作者", "link": "主页或null" }]',
    '  缺少 slug / id / name 任一字段的条目会被自动忽略',
    '',
    '三、完整示例',
    'const res = await fetch("https://example.com/api/list");',
    'const data = await res.json();',
    'return data.map(it => ({',
    '  slug: it.file,',
    '  id: it.file,',
    '  name: it.title,',
    '  description: it.desc,',
    '  nameTranslations: { "zh-cn": it.title_zh },',
    '  image: `images/${it.file}.png`,',
    '  by: [{ name: it.author, link: it.homepage || null }]',
    '}));',
    '',
    '四、注意事项',
    '1. 地址推导与官方一致：扩展文件 = JSON目录/{slug}.js，',
    '   封面、详情页、示例项目的相对地址均基于 JSON 目录解析',
    '2. 返回空数组是允许的，将显示为空的自定义库分区',
    '3. 只需负责返回数据；封面加载、地址拼接、缓存均由编辑器处理'
].join('\n');

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
    urlLabel: {
        defaultMessage: '扩展库 JSON 地址',
        description: 'Library JSON URL label',
        id: 'tw.customLibrary.urlLabel'
    },
    urlHint: {
        defaultMessage: '填入 TurboWarp 标准格式（extensions-v0.json）地址即可一键使用，无需其他配置',
        description: 'Library URL hint',
        id: 'tw.customLibrary.urlHint'
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
    modeStandard: {
        defaultMessage: '标准格式',
        description: 'Standard format mode',
        id: 'tw.customLibrary.modeStandard'
    },
    modeCustom: {
        defaultMessage: '自定义字段',
        description: 'Custom field mapping mode',
        id: 'tw.customLibrary.modeCustom'
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
    mappingSlug: {
        defaultMessage: 'slug字段名（用于拼接文件地址）',
        description: 'Slug field mapping',
        id: 'tw.customLibrary.mappingSlug'
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
    mappingImage: {
        defaultMessage: '封面字段名',
        description: 'Image field mapping',
        id: 'tw.customLibrary.mappingImage'
    },
    mappingBy: {
        defaultMessage: '作者字段名（by）',
        description: 'By field mapping',
        id: 'tw.customLibrary.mappingBy'
    },
    mappingOriginal: {
        defaultMessage: '原作者字段名（original）',
        description: 'Original field mapping',
        id: 'tw.customLibrary.mappingOriginal'
    },
    mappingDocs: {
        defaultMessage: '文档字段名（docs）',
        description: 'Docs field mapping',
        id: 'tw.customLibrary.mappingDocs'
    },
    mappingSamples: {
        defaultMessage: '示例字段名（samples）',
        description: 'Samples field mapping',
        id: 'tw.customLibrary.mappingSamples'
    },
    mappingScratchCompatible: {
        defaultMessage: 'Scratch 兼容字段名（scratchCompatible）',
        description: 'Scratch compatible field mapping',
        id: 'tw.customLibrary.mappingScratchCompatible'
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
    jsCode: {
        defaultMessage: '自定义 JS 代码（会收到 fetch 与 libraryUrl 两个参数，需 return 标准结构）',
        description: 'Custom JS code label',
        id: 'tw.customLibrary.jsCode'
    },
    jsTutorial: {
        defaultMessage: '自定义 JS 编写教程',
        description: 'Custom JS tutorial dialog title',
        id: 'tw.customLibrary.jsTutorial'
    },
    jsTutorialButton: {
        defaultMessage: '查看编写教程',
        description: 'Custom JS tutorial button title',
        id: 'tw.customLibrary.jsTutorialButton'
    },
    save: {
        defaultMessage: '保存',
        description: 'Save button',
        id: 'tw.customLibrary.save'
    },
    importOneClick: {
        defaultMessage: '一键导入',
        description: 'One-click import button',
        id: 'tw.customLibrary.importOneClick'
    },
    nameLabelOptional: {
        defaultMessage: '库名称（可选，留空自动使用域名）',
        description: 'Library name label optional',
        id: 'tw.customLibrary.nameLabelOptional'
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
    errorUrl: {
        defaultMessage: '请填写扩展库 JSON 地址',
        description: 'Error: missing url',
        id: 'tw.customLibrary.errorUrl'
    },
    errorCode: {
        defaultMessage: '自定义 JS 方式请填写代码',
        description: 'Error: missing code',
        id: 'tw.customLibrary.errorCode'
    },
    standardStepHint: {
        defaultMessage: '第 1 步：粘贴扩展库 JSON 地址 → 第 2 步：点击“一键导入”',
        description: 'Standard mode steps hint',
        id: 'tw.customLibrary.standardStepHint'
    }
});

const emptyForm = () => ({
    name: '',
    url: '',
    fieldMapping: {
        slug: 'slug',
        id: 'id',
        name: 'name',
        description: 'description',
        name_translations: 'nameTranslations',
        description_translations: 'descriptionTranslations',
        image: 'image',
        by: 'by',
        original: 'original',
        docs: 'docs',
        samples: 'samples',
        scratchCompatible: 'scratchCompatible'
    },
    code: '',
    localize: true
});

const CustomLibraryModal = ({intl, visible, onClose, onChanged}) => {
    const [libs, setLibs] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [mode, setMode] = useState('standard');
    const [form, setForm] = useState(emptyForm());
    const [error, setError] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [localize, setLocalize] = useState(true);
    const [showJsTutorial, setShowJsTutorial] = useState(false);

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
        setMode('standard');
        setForm(emptyForm());
        setLocalize(true);
        setError(null);
    };

    const hasCustomMapping = lib => {
        const fm = lib.fieldMapping;
        if (!fm || typeof fm !== 'object') return false;
        const defaults = emptyForm().fieldMapping;
        return Object.entries(fm).some(([key, value]) =>
            typeof value === 'string' && value.trim() !== '' && value !== defaults[key]);
    };

    const startEdit = lib => {
        const fm = lib.fieldMapping || emptyForm().fieldMapping;
        setFormOpen(true);
        setEditingId(lib.id);
        setMode(lib.type === 'js' ? 'js' : (hasCustomMapping(lib) ? 'custom' : 'standard'));
        setForm({
            name: lib.name || '',
            url: lib.url || '',
            fieldMapping: fm,
            code: lib.code || ''
        });
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
        if ((mode === 'standard' || mode === 'custom') && !form.url.trim()) {
            setError(intl.formatMessage(messages.errorUrl));
            return;
        }
        if (mode === 'js' && !form.code.trim()) {
            setError(intl.formatMessage(messages.errorCode));
            return;
        }
        let name = form.name.trim();
        if (!name) {
            try {
                name = new URL(form.url.trim()).hostname;
            } catch (e) {
                name = '';
            }
            if (!name) {
                name = '自定义扩展库';
            }
        }
        const payload = {
            name,
            url: form.url.trim(),
            type: mode === 'js' ? 'js' : 'manual',
            fieldMapping: mode === 'custom' ? {...form.fieldMapping} : {},
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
                                        {intl.formatMessage(messages.type, {type: lib.type === 'js' ? intl.formatMessage(messages.modeJs) : intl.formatMessage(messages.modeStandard)})}
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
                            {[
                                ['standard', messages.modeStandard],
                                ['custom', messages.modeCustom],
                                ['js', messages.modeJs]
                            ].map(([modeValue, modeMessage]) => (
                                <button
                                    type="button"
                                    key={modeValue}
                                    onClick={() => setMode(modeValue)}
                                    style={{
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        padding: '6px 14px',
                                        borderRadius: 4,
                                        border: `1px solid ${mode === modeValue ? '#4a90e2' : strongBorder}`,
                                        background: mode === modeValue ? '#4a90e2' : btnBg,
                                        color: mode === modeValue ? '#fff' : btnText
                                    }}
                                >
                                    {intl.formatMessage(modeMessage)}
                                </button>
                            ))}
                        </div>

                        {field(intl.formatMessage(messages.nameLabelOptional), form.name, v => setField('name', v), intl.formatMessage(messages.namePlaceholder))}

                        {mode === 'standard' && (
                            <div>
                                <div style={{fontSize: 12, color: mutedColor, margin: '0 0 8px'}}>
                                    <FormattedMessage {...messages.standardStepHint} />
                                </div>
                                <div style={{marginBottom: 8}}>
                                    <div style={labelStyle}>
                                        {intl.formatMessage(messages.urlLabel)}
                                        <span style={{color: '#e74c3c', marginLeft: 4}}>*</span>
                                    </div>
                                    <input
                                        value={form.url || ''}
                                        placeholder="https://extensions.turbowarp.org/generated-metadata/extensions-v0.json"
                                        onChange={e => setField('url', e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleSave();
                                            }
                                        }}
                                        style={inputStyle}
                                    />
                                </div>
                                <div style={{fontSize: 12, color: mutedColor, margin: '4px 0 8px'}}>
                                    <FormattedMessage {...messages.urlHint} />
                                </div>
                            </div>
                        )}
                        {mode === 'custom' && (
                            <div>
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
                                {field(intl.formatMessage(messages.urlLabel), form.url, v => setField('url', v), intl.formatMessage(messages.urlPlaceholder), true)}
                                <div style={{fontSize: 12, color: mutedColor, margin: '4px 0 8px'}}>
                                    <FormattedMessage defaultMessage="字段映射：仅当源 JSON 键名与标准键值不同时才需填写（默认已匹配 TurboWarp 官方键值）" id="tw.customLibrary.mappingHint" />
                                </div>
                                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px'}}>
                                    {field(intl.formatMessage(messages.mappingSlug), form.fieldMapping.slug, v => setMapping('slug', v))}
                                    {field(intl.formatMessage(messages.mappingId), form.fieldMapping.id, v => setMapping('id', v))}
                                    {field(intl.formatMessage(messages.mappingName), form.fieldMapping.name, v => setMapping('name', v))}
                                    {field(intl.formatMessage(messages.mappingDescription), form.fieldMapping.description, v => setMapping('description', v))}
                                    {field(intl.formatMessage(messages.mappingNameTranslations), form.fieldMapping.name_translations, v => setMapping('name_translations', v), 'nameTranslations')}
                                    {field(intl.formatMessage(messages.mappingDescriptionTranslations), form.fieldMapping.description_translations, v => setMapping('description_translations', v), 'descriptionTranslations')}
                                    {field(intl.formatMessage(messages.mappingImage), form.fieldMapping.image, v => setMapping('image', v))}
                                    {field(intl.formatMessage(messages.mappingBy), form.fieldMapping.by, v => setMapping('by', v))}
                                    {field(intl.formatMessage(messages.mappingOriginal), form.fieldMapping.original, v => setMapping('original', v))}
                                    {field(intl.formatMessage(messages.mappingDocs), form.fieldMapping.docs, v => setMapping('docs', v))}
                                    {field(intl.formatMessage(messages.mappingSamples), form.fieldMapping.samples, v => setMapping('samples', v))}
                                    {field(intl.formatMessage(messages.mappingScratchCompatible), form.fieldMapping.scratchCompatible, v => setMapping('scratchCompatible', v))}
                                </div>
                            </div>
                        )}
                        {mode === 'js' && (
                            <div style={{marginBottom: 8}}>
                                <div style={{...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <span>{intl.formatMessage(messages.jsCode)}</span>
                                    <button
                                        type="button"
                                        title={intl.formatMessage(messages.jsTutorialButton)}
                                        onClick={() => setShowJsTutorial(true)}
                                        style={{
                                            border: 'none',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: 0,
                                            color: mutedColor
                                        }}
                                    >
                                        <svg
                                            width="15"
                                            height="15"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                        </svg>
                                    </button>
                                </div>
                                <textarea
                                    value={form.code || ''}
                                    placeholder={JS_PLACEHOLDER}
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
                                {mode === 'standard' ? intl.formatMessage(messages.importOneClick) : intl.formatMessage(messages.save)}
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
            </div>
            <CysoDialog
                open={showJsTutorial}
                type="alert"
                title={intl.formatMessage(messages.jsTutorial)}
                message={(
                    <pre
                        style={{
                            background: 'var(--ui-secondary, #f6f6f6)',
                            color: 'var(--text-primary, #575e75)',
                            padding: 12,
                            borderRadius: 4,
                            fontSize: 12,
                            maxHeight: '55vh',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            margin: 0,
                            textAlign: 'left'
                        }}
                    >
                        {JS_REQUIREMENTS}
                    </pre>
                )}
                confirmText="知道了"
                onConfirm={() => setShowJsTutorial(false)}
                onCancel={() => setShowJsTutorial(false)}
            />
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
