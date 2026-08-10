const PERMISSION_TYPES = {
    FILE_READ: 'file-read',
    FILE_WRITE: 'file-write',
    FILE_DELETE: 'file-delete',
    SYSTEM_COMMAND: 'system-command',
    FILE_METADATA: 'file-metadata',
    GLOBAL_SHORTCUT: 'global-shortcut',
    DRAW_WINDOW: 'draw-window',
    SCREEN_CAPTURE: 'screen-capture',
    ADVANCED_WINDOW: 'advanced-window',
    HARDWARE_STATUS: 'hardware-status'
};

const PERMISSION_SETTINGS = {
    ALWAYS: 'always',
    ASK: 'ask',
    DENY: 'deny'
};

const RISK_LEVELS = {
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3
};

const PERMISSION_GROUPS = {
    FILE_OPS: {
        id: 'cysoFileOps',
        name: '文件操作',
        icon: '📁',
        description: '文件的读取、写入、删除等操作',
        permissions: {
            'file-read': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.LOW, description: '读取文件内容', label: '读取文件' },
            'file-write': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.MEDIUM, description: '写入或创建文件（仅安全路径）', label: '写入文件' },
            'file-delete': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.HIGH, description: '删除文件（仅安全路径）', label: '删除文件' },
            'file-metadata': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.LOW, description: '获取文件元数据信息', label: '文件元数据' }
        }
    },
    SYSTEM_OPS: {
        id: 'cysoSystemOps',
        name: '系统操作',
        icon: '⚙️',
        description: '系统命令执行、全局快捷键等操作',
        permissions: {
            'system-command': { defaultSetting: 'deny', riskLevel: RISK_LEVELS.HIGH, description: '执行系统命令（禁止危险命令）', label: '执行命令' },
            'global-shortcut': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.MEDIUM, description: '注册全局快捷键', label: '全局快捷键' }
        }
    },
    UI_OPS: {
        id: 'cysoUiOps',
        name: '界面操作',
        icon: '🖥️',
        description: '屏幕绘制、窗口控制、屏幕捕获等操作',
        permissions: {
            'draw-window': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.MEDIUM, description: '在屏幕上绘制窗口', label: '屏幕绘制' },
            'screen-capture': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.HIGH, description: '捕获屏幕或窗口内容', label: '屏幕捕获' },
            'advanced-window': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.MEDIUM, description: '创建无边框/透明/置顶窗口', label: '高级窗口' }
        }
    },
    HARDWARE_OPS: {
        id: 'cysoHardwareOps',
        name: '硬件操作',
        icon: '🔌',
        description: '硬件状态读取等操作',
        permissions: {
            'hardware-status': { defaultSetting: 'ask', riskLevel: RISK_LEVELS.LOW, description: '读取硬件状态信息', label: '硬件状态' }
        }
    }
};

const getDefaultPermissionSetting = permissionType => {
    for (const group of Object.values(PERMISSION_GROUPS)) {
        if (group.permissions[permissionType]) {
            return group.permissions[permissionType].defaultSetting;
        }
    }
    return 'ask';
};

const getPermissionRiskLevel = permissionType => {
    for (const group of Object.values(PERMISSION_GROUPS)) {
        if (group.permissions[permissionType]) {
            return group.permissions[permissionType].riskLevel;
        }
    }
    return RISK_LEVELS.MEDIUM;
};

const getPermissionLabel = permissionType => {
    for (const group of Object.values(PERMISSION_GROUPS)) {
        if (group.permissions[permissionType]) {
            return group.permissions[permissionType].label;
        }
    }
    return permissionType;
};

const getPermissionDescription = permissionType => {
    for (const group of Object.values(PERMISSION_GROUPS)) {
        if (group.permissions[permissionType]) {
            return group.permissions[permissionType].description;
        }
    }
    return '';
};

const getGlobalPermissions = () => {
    const globalPerms = {};
    Object.values(PERMISSION_GROUPS).forEach(group => {
        Object.entries(group.permissions).forEach(([permType, permInfo]) => {
            globalPerms[permType] = permInfo.defaultSetting;
        });
    });
    return globalPerms;
};


const PERMISSION_CATEGORIES = {};
Object.keys(PERMISSION_GROUPS).forEach(key => {
    const group = PERMISSION_GROUPS[key];
    const catKey = key.replace(/^cyso/i, '').toUpperCase();
    PERMISSION_CATEGORIES[catKey] = { permissions: Object.keys(group.permissions) };
});


const STORAGE_KEY = 'cyso-core-permissions';

const loadAll = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object') {
                return {
                    defaults: parsed.defaults || {},
                    extensions: parsed.extensions || {}
                };
            }
        }
    } catch (e) {
        console.error('Failed to load permissions:', e);
    }
    return { defaults: {}, extensions: {} };
};

const saveAll = obj => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
        console.error('Failed to save permissions:', e);
    }
};

const loadDefaults = () => {
    const all = loadAll();
    return { ...getGlobalPermissions(), ...all.defaults };
};

const saveDefaults = defaults => {
    const all = loadAll();
    saveAll({ ...all, defaults: { ...all.defaults, ...defaults } });
};

const loadExtensionPermissions = extensionId => {
    const all = loadAll();
    return all.extensions[extensionId] || {};
};

const saveExtensionPermissions = (extensionId, map) => {
    const all = loadAll();
    saveAll({
        ...all,
        extensions: { ...all.extensions, [extensionId]: map }
    });
};

export {
    PERMISSION_TYPES,
    PERMISSION_SETTINGS,
    PERMISSION_GROUPS,
    RISK_LEVELS,
    getDefaultPermissionSetting,
    getPermissionRiskLevel,
    getPermissionLabel,
    getPermissionDescription,
    getGlobalPermissions,
    PERMISSION_CATEGORIES,
    loadAll,
    saveAll,
    loadDefaults,
    saveDefaults,
    loadExtensionPermissions,
    saveExtensionPermissions
};
