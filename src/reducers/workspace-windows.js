const CREATE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/CREATE';
const CLOSE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/CLOSE';
const ADD_TARGET_TO_WINDOW = 'scratch-gui/workspace-windows/ADD_TARGET';
const SET_ACTIVE_TARGET = 'scratch-gui/workspace-windows/SET_ACTIVE_TARGET';
const REMOVE_TARGET_FROM_WINDOW = 'scratch-gui/workspace-windows/REMOVE_TARGET';
const MOVE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/MOVE';
const RESIZE_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/RESIZE';
const FOCUS_WORKSPACE_WINDOW = 'scratch-gui/workspace-windows/FOCUS';
const MOVE_TAB_TO_WINDOW = 'scratch-gui/workspace-windows/MOVE_TAB';
const PRUNE_WORKSPACE_WINDOWS = 'scratch-gui/workspace-windows/PRUNE';

const initialState = {
    windows: []
};

const cascadeOffset = 30;

const maxZIndex = windows =>
    windows.reduce((max, w) => Math.max(max, w.zIndex || 0), 10);

const nextZIndex = windows => maxZIndex(windows) + 1;

const reducer = (state = initialState, action) => {
    switch (action.type) {
    case CREATE_WORKSPACE_WINDOW: {
        const existing = state.windows.find(w =>
            w.targets.includes(action.targetId)
        );
        if (existing) {
            const z = nextZIndex(state.windows);
            return {
                ...state,
                windows: state.windows.map(w =>
                    w.id === existing.id ? {...w, zIndex: z} : w
                )
            };
        }
        const z = nextZIndex(state.windows);
        const offset = state.windows.length % 6;
        return {
            ...state,
            windows: [...state.windows, {
                id: `workspace-window-${z}`,
                targets: [action.targetId],
                activeTargetId: action.targetId,
                x: 120 + offset * cascadeOffset,
                y: 60 + offset * cascadeOffset,
                width: 560,
                height: 420,
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
        const otherWindow = state.windows.find(w =>
            w.id !== action.windowId && w.targets.includes(action.targetId)
        );
        let windows = state.windows;
        if (otherWindow) {
            windows = windows.map(w => {
                if (w.id === otherWindow.id) {
                    const targets = w.targets.filter(t => t !== action.targetId);
                    return {
                        ...w,
                        targets: targets,
                        activeTargetId: targets.length > 0 ?
                            (w.activeTargetId === action.targetId ? targets[0] : w.activeTargetId) : null
                    };
                }
                return w;
            }).filter(w => w.targets.length > 0);
        }
        const z = nextZIndex(windows);
        return {
            ...state,
            windows: windows.map(w => {
                if (w.id !== action.windowId) return w;
                const targets = w.targets.includes(action.targetId) ?
                    w.targets : [...w.targets, action.targetId];
                return {
                    ...w,
                    targets: targets,
                    activeTargetId: action.targetId,
                    zIndex: z
                };
            })
        };
    }
    case SET_ACTIVE_TARGET: {
        const z = nextZIndex(state.windows);
        return {
            ...state,
            windows: state.windows.map(w =>
                w.id === action.windowId ? {
                    ...w,
                    activeTargetId: action.targetId,
                    zIndex: z
                } : w
            )
        };
    }
    case REMOVE_TARGET_FROM_WINDOW: {
        const windows = state.windows.map(w => {
            if (w.id !== action.windowId) return w;
            const targets = w.targets.filter(t => t !== action.targetId);
            if (targets.length === 0) return null;
            return {
                ...w,
                targets: targets,
                activeTargetId: w.activeTargetId === action.targetId ?
                    targets[0] : w.activeTargetId
            };
        }).filter(w => w !== null);
        return {...state, windows: windows};
    }
    case MOVE_WORKSPACE_WINDOW:
        return {
            ...state,
            windows: state.windows.map(w =>
                w.id === action.windowId ? {...w, x: action.x, y: action.y} : w
            )
        };
    case RESIZE_WORKSPACE_WINDOW:
        return {
            ...state,
            windows: state.windows.map(w =>
                w.id === action.windowId ? {
                    ...w,
                    width: action.width,
                    height: action.height
                } : w
            )
        };
    case FOCUS_WORKSPACE_WINDOW: {
        const z = nextZIndex(state.windows);
        return {
            ...state,
            windows: state.windows.map(w =>
                w.id === action.windowId ? {...w, zIndex: z} : w
            )
        };
    }
    case PRUNE_WORKSPACE_WINDOWS:
        return {...state, windows: action.windows};
    case MOVE_TAB_TO_WINDOW: {
        const {fromWindowId, toWindowId, targetId} = action;
        const windows = state.windows.map(w => {
            if (w.id === fromWindowId && w.id !== toWindowId) {
                const targets = w.targets.filter(t => t !== targetId);
                return {
                    ...w,
                    targets: targets,
                    activeTargetId: w.activeTargetId === targetId ?
                        (targets.length > 0 ? targets[0] : null) : w.activeTargetId
                };
            }
            return w;
        }).filter(w => w.targets.length > 0);
        const z = nextZIndex(windows);
        return {
            ...state,
            windows: windows.map(w => {
                if (w.id !== toWindowId) return w;
                const targets = w.targets.includes(targetId) ?
                    w.targets : [...w.targets, targetId];
                return {
                    ...w,
                    targets: targets,
                    activeTargetId: targetId,
                    zIndex: z
                };
            })
        };
    }
    default:
        return state;
    }
};

const createWorkspaceWindow = targetId => ({
    type: CREATE_WORKSPACE_WINDOW,
    targetId
});

const closeWorkspaceWindow = windowId => ({
    type: CLOSE_WORKSPACE_WINDOW,
    windowId
});

const addTargetToWindow = (windowId, targetId) => ({
    type: ADD_TARGET_TO_WINDOW,
    windowId,
    targetId
});

const setActiveTarget = (windowId, targetId) => ({
    type: SET_ACTIVE_TARGET,
    windowId,
    targetId
});

const removeTargetFromWindow = (windowId, targetId) => ({
    type: REMOVE_TARGET_FROM_WINDOW,
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

const moveTabToWindow = (fromWindowId, toWindowId, targetId) => ({
    type: MOVE_TAB_TO_WINDOW,
    fromWindowId,
    toWindowId,
    targetId
});

export {
    reducer as default,
    initialState as workspaceWindowsInitialState,
    createWorkspaceWindow,
    closeWorkspaceWindow,
    addTargetToWindow,
    setActiveTarget,
    removeTargetFromWindow,
    moveWorkspaceWindow,
    resizeWorkspaceWindow,
    focusWorkspaceWindow,
    moveTabToWindow
};