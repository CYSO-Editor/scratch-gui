export const CREATE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/CREATE_WORKSPACE_WINDOW';
export const CLOSE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/CLOSE_WORKSPACE_WINDOW';
export const ADD_TARGET_TO_WINDOW = 'scratch-gui/workspace-windows/ADD_TARGET_TO_WINDOW';
export const REMOVE_TARGET_FROM_WINDOW = 'scratch-gui/workspace-windows/REMOVE_TARGET_FROM_WINDOW';
export const SET_ACTIVE_TARGET = 'scratch-gui/workspace-windows/SET_ACTIVE_TARGET';
export const MOVE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/MOVE_WORKSPACE_WINDOW';
export const RESIZE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/RESIZE_WORKSPACE_WINDOW';
export const FOCUS_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/FOCUS_WORKSPACE_WINDOW';
export const MOVE_TAB_TO_WINDOW = 'scratch-gui/workspace-windows/MOVE_TAB_TO_WINDOW';
export const PRUNE_WORKSPACE_WINDOWS = 'scratch-gui/workspace-windows/PRUNE_WORKSPACE_WINDOWS';

const cascadeOffset = 30;
const defaultWidth = 560;
const defaultHeight = 420;

const initialState = {
    windows: []
};

const maxZIndex = windows => windows.reduce((max, windowRect) => Math.max(max, windowRect.zIndex || 0), 0);

const nextZIndex = windows => maxZIndex(windows) + 1;

const asTargetId = value => (typeof value === 'string' && value ? value : null);

const asTargetName = value => (typeof value === 'string' && value ? value : null);

const mergeName = (names, targetId, targetName) => {
    const id = asTargetId(targetId);
    const name = asTargetName(targetName);
    if (!id || !name) return names || {};
    return {...(names || {}), [id]: name};
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
    case CREATE_WORKSPACE_WINDOW: {
        const targetId = asTargetId(action.targetId);
        if (!targetId) return state;
        const existing = state.windows.find(w => w.targets.includes(targetId));
        if (existing) {
            const z = nextZIndex(state.windows);
            return {
                ...state,
                windows: state.windows.map(w =>
                    w.id === existing.id ? {
                        ...w,
                        names: mergeName(w.names, targetId, action.targetName),
                        zIndex: z
                    } : w
                )
            };
        }
        const z = nextZIndex(state.windows);
        const offset = state.windows.length % 6;
        return {
            ...state,
            windows: [...state.windows, {
                id: `workspace-window-${z}`,
                targets: [targetId],
                activeTargetId: targetId,
                names: mergeName(null, targetId, action.targetName),
                x: 120 + offset * cascadeOffset,
                y: 60 + offset * cascadeOffset,
                width: defaultWidth,
                height: defaultHeight,
                zIndex: z
            }]
        };
    }
    case CLOSE_WORKSPACE_WINDOW:
        return {
            ...state,
            windows: state.windows.filter(w => w.id !== action.windowId)
        };
    case ADD_TARGET_TO_WINDOW: {
        const targetId = asTargetId(action.targetId);
        if (!targetId) return state;
        const otherWindow = state.windows.find(w =>
            w.id !== action.windowId && w.targets.includes(targetId)
        );
        let windows = state.windows;
        if (otherWindow) {
            windows = windows.map(w => {
                if (w.id !== otherWindow.id) return w;
                const targets = w.targets.filter(t => t !== targetId);
                return {
                    ...w,
                    targets: targets,
                    activeTargetId: targets.length > 0 ?
                        (w.activeTargetId === targetId ? targets[0] : w.activeTargetId) : null
                };
            }).filter(w => w.targets.length > 0);
        }
        const z = nextZIndex(windows);
        return {
            ...state,
            windows: windows.map(w => {
                if (w.id !== action.windowId) return w;
                const targets = w.targets.includes(targetId) ?
                    w.targets : [...w.targets, targetId];
                return {
                    ...w,
                    targets: targets,
                    activeTargetId: targetId,
                    names: mergeName(w.names, targetId, action.targetName),
                    zIndex: z
                };
            })
        };
    }
    case REMOVE_TARGET_FROM_WINDOW: {
        const targetId = asTargetId(action.targetId);
        if (!targetId) return state;
        const newWindows = state.windows.map(w => {
            if (w.id !== action.windowId) return w;
            const targets = w.targets.filter(t => t !== targetId);
            return {
                ...w,
                targets: targets,
                activeTargetId: targets.length > 0 ?
                    (w.activeTargetId === targetId ? targets[0] : w.activeTargetId) : null
            };
        }).filter(w => w.targets.length > 0);
        return {
            ...state,
            windows: newWindows
        };
    }
    case SET_ACTIVE_TARGET: {
        const targetId = asTargetId(action.targetId);
        if (!targetId) return state;
        const z = nextZIndex(state.windows);
        return {
            ...state,
            windows: state.windows.map(w => {
                if (w.id !== action.windowId) return w;
                if (!w.targets.includes(targetId)) return w;
                return {
                    ...w,
                    activeTargetId: targetId,
                    zIndex: z
                };
            })
        };
    }
    case MOVE_WORKSPACE_WINDOW:
        return {
            ...state,
            windows: state.windows.map(w => {
                if (w.id !== action.windowId) return w;
                return {
                    ...w,
                    x: action.x,
                    y: action.y
                };
            })
        };
    case RESIZE_WORKSPACE_WINDOW:
        return {
            ...state,
            windows: state.windows.map(w => {
                if (w.id !== action.windowId) return w;
                return {
                    ...w,
                    width: action.width,
                    height: action.height
                };
            })
        };
    case FOCUS_WORKSPACE_WINDOW: {
        const target = state.windows.find(w => w.id === action.windowId);
        if (!target || target.zIndex === maxZIndex(state.windows)) return state;
        const z = nextZIndex(state.windows);
        return {
            ...state,
            windows: state.windows.map(w => {
                if (w.id !== action.windowId) return w;
                return {
                    ...w,
                    zIndex: z
                };
            })
        };
    }
    case MOVE_TAB_TO_WINDOW: {
        const targetId = asTargetId(action.targetId);
        if (!targetId || action.fromWindowId === action.toWindowId) return state;
        const source = state.windows.find(w => w.id === action.fromWindowId);
        if (!source || !source.targets.includes(targetId)) return state;
        let windows = state.windows.map(w => {
            if (w.id !== action.fromWindowId) return w;
            const targets = w.targets.filter(t => t !== targetId);
            return {
                ...w,
                targets: targets,
                activeTargetId: targets.length > 0 ?
                    (w.activeTargetId === targetId ? targets[0] : w.activeTargetId) : null
            };
        }).filter(w => w.targets.length > 0);
        const z = nextZIndex(windows);
        windows = windows.map(w => {
            if (w.id !== action.toWindowId) return w;
            const targets = w.targets.includes(targetId) ?
                w.targets : [...w.targets, targetId];
            return {
                ...w,
                targets: targets,
                activeTargetId: targetId,
                names: mergeName(w.names, targetId, action.targetName),
                zIndex: z
            };
        });
        return {
            ...state,
            windows: windows
        };
    }
    case PRUNE_WORKSPACE_WINDOWS:
        return {
            ...state,
            windows: action.windows
        };
    default:
        return state;
    }
};

const createWorkspaceWindow = (targetId, targetName) => ({
    type: CREATE_WORKSPACE_WINDOW,
    targetId,
    targetName
});

const closeWorkspaceWindow = windowId => ({
    type: CLOSE_WORKSPACE_WINDOW,
    windowId
});

const addTargetToWindow = (windowId, targetId, targetName) => ({
    type: ADD_TARGET_TO_WINDOW,
    windowId,
    targetId,
    targetName
});

const removeTargetFromWindow = (windowId, targetId) => ({
    type: REMOVE_TARGET_FROM_WINDOW,
    windowId,
    targetId
});

const setActiveTarget = (windowId, targetId) => ({
    type: SET_ACTIVE_TARGET,
    windowId,
    targetId
});

const moveWorkspaceWindow = (windowId, x, y) => ({
    type: MOVE_WORKSPACE_WINDOW,
    windowId,
    x,
    y
});

const resizeWorkspaceWindow = (windowId, width, height) => ({
    type: RESIZE_WORKSPACE_WINDOW,
    windowId,
    width,
    height
});

const focusWorkspaceWindow = windowId => ({
    type: FOCUS_WORKSPACE_WINDOW,
    windowId
});

const moveTabToWindow = (fromWindowId, toWindowId, targetId, targetName) => ({
    type: MOVE_TAB_TO_WINDOW,
    fromWindowId,
    toWindowId,
    targetId,
    targetName
});

const pruneWorkspaceWindows = windows => ({
    type: PRUNE_WORKSPACE_WINDOWS,
    windows
});

export {
    createWorkspaceWindow,
    closeWorkspaceWindow,
    addTargetToWindow,
    removeTargetFromWindow,
    setActiveTarget,
    moveWorkspaceWindow,
    resizeWorkspaceWindow,
    focusWorkspaceWindow,
    moveTabToWindow,
    pruneWorkspaceWindows
};

export default reducer;
