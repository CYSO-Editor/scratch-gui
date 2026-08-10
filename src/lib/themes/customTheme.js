const STORAGE_KEY = 'tw:customTheme';

const makeDefault = () => ({
    globalCss: '',
    editorBackground: {
        type: 'html',
        kind: 'text',
        value: ''
    },
    performanceMode: false,
    toolbarBackground: {
        type: 'html',
        kind: 'text',
        value: ''
    },
    toolbarTransparent: false,
    accentCustom: ''
});

let current = load();

function load () {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return makeDefault();
        }
        const parsed = JSON.parse(raw);
        const editorBackground = parsed.editorBackground && typeof parsed.editorBackground === 'object' ?
            parsed.editorBackground : makeDefault().editorBackground;
        const toolbarBackground = parsed.toolbarBackground && typeof parsed.toolbarBackground === 'object' ?
            parsed.toolbarBackground : makeDefault().toolbarBackground;
        return {
            globalCss: typeof parsed.globalCss === 'string' ? parsed.globalCss : '',
            editorBackground: {
                type: 'html',
                kind: editorBackground.kind === 'file' || editorBackground.kind === 'folder' ? editorBackground.kind : 'text',
                value: typeof editorBackground.value === 'string' ? editorBackground.value : ''
            },
            performanceMode: typeof parsed.performanceMode === 'boolean' ? parsed.performanceMode : false,
            toolbarBackground: {
                type: 'html',
                kind: toolbarBackground.kind === 'file' || toolbarBackground.kind === 'folder' ? toolbarBackground.kind : 'text',
                value: typeof toolbarBackground.value === 'string' ? toolbarBackground.value : ''
            },
            toolbarTransparent: typeof parsed.toolbarTransparent === 'boolean' ? parsed.toolbarTransparent : false,
            accentCustom: typeof parsed.accentCustom === 'string' ? parsed.accentCustom : ''
        };
    } catch (e) {
        return makeDefault();
    }
}

const getCurrent = () => current;

const save = custom => {
    current = custom;
    try {
        const empty = custom.globalCss === '' &&
            custom.editorBackground.value === '' &&
            !custom.performanceMode &&
            custom.toolbarBackground.value === '' &&
            !custom.toolbarTransparent;
        if (empty) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
        }
    } catch (e) {
        // no-op
    }
    return current;
};

export {
    STORAGE_KEY,
    getCurrent,
    save,
    makeDefault
};
