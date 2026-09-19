const isZhLocale = locale =>
    typeof locale === 'string' && locale.toLowerCase().indexOf('zh') === 0;

const MESSAGES = {
    createWorkspace: {zh: '新建工作区', en: 'Create Workspace'},
    closeWindow: {zh: '关闭工作区', en: 'Close Workspace'},
    closeTab: {zh: '关闭标签页', en: 'Close Tab'},
    openInNewWindow: {zh: '在新窗口中打开', en: 'Open in New Window'},
    addTargetToWorkspace: {zh: '添加角色到工作区', en: 'Add target to workspace'},
    inWorkspace: {zh: '已在新工作区中打开', en: 'Open in a workspace window'},
    releaseToAddTab: {zh: '松开以添加标签', en: 'Release to add tab'},
    dragBlocksHint: {zh: '积木可直接拖到其它工作区', en: 'Blocks can be dragged into another workspace'},
    maximize: {zh: '最大化', en: 'Maximize'},
    restore: {zh: '还原', en: 'Restore'},
    stage: {zh: '舞台', en: 'Stage'},
    focusHint: {zh: '当前工作区', en: 'Focused workspace'},
    shortcutHint: {
        zh: 'Ctrl+W：关闭已聚焦的工作区；未聚焦时则为当前角色新建 · 双击标题栏最大化',
        en: 'Ctrl+W closes the focused workspace, or opens one for the current sprite · double-click the title bar to maximize'
    }
};

const cysoMessage = (intl, key) => {
    const entry = MESSAGES[key];
    if (!entry) return key;
    return isZhLocale(intl && intl.locale) ? entry.zh : entry.en;
};

export {cysoMessage, isZhLocale};
