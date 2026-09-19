import AddonHooks from '../addons/hooks';
import LazyScratchBlocks from './tw-lazy-scratch-blocks';
import {blockScreenPoint, moveBlockToWorkspace} from './block-transfer';

const MAIN_WORKSPACE_ID = 'main';
const DROP_TARGET_ATTR = 'data-cyso-block-drop-target';
const DRAG_THRESHOLD_PX = 4;
const DRAG_SURFACE_SELECTOR = '.blocklyDragSurface, .blocklyBlockDragSurface';
const ELEVATED_Z_INDEX = '9990';
const ELEVATED_PROPS = ['position', 'left', 'top', 'right', 'bottom', 'width', 'height',
    'zIndex', 'pointerEvents', 'overflow'];
const STALE_DRAG_TIMEOUT_MS = 300;

const entries = new Map();
const pointer = {x: -1, y: -1};
let globalsBound = false;
let draggerPatched = false;
let mainWorkspace = null;
let registryVm = null;
let pointerDown = null;
let dragSourceId = null;
let dropTargetId = null;
let dropTargetFrame = null;
let dropTargetListener = null;
let elevatedSurface = null;

const getScratchBlocks = () => {
    try {
        return LazyScratchBlocks.get();
    } catch (e) {
        return null;
    }
};

const resolveHost = (workspace, hostEl) => {
    if (hostEl) return hostEl;
    if (!workspace) return null;
    try {
        return workspace.getInjectionDiv();
    } catch (e) {
        return null;
    }
};

const entryTargetId = entry => {
    if (!entry) return null;
    if (entry.targetId) return entry.targetId;
    if (entry.id !== MAIN_WORKSPACE_ID || !registryVm) return null;
    const editing = registryVm.editingTarget;
    return editing && editing.id ? editing.id : null;
};

const findEntryByWorkspace = workspace => {
    for (const entry of entries.values()) {
        if (entry.workspace === workspace) return entry;
    }
    return null;
};

const isDragSurface = element => {
    if (!element || !element.closest) return false;
    return !!element.closest(DRAG_SURFACE_SELECTOR);
};

const findEntryAtPoint = (x, y) => {
    if (typeof document === 'undefined' || x < 0 || y < 0) return null;
    let elements = [];
    try {
        elements = document.elementsFromPoint ?
            (document.elementsFromPoint(x, y) || []) :
            [document.elementFromPoint(x, y)];
    } catch (e) {
        elements = [];
    }
    for (const element of elements) {
        if (!element) continue;
        if (isDragSurface(element)) continue;
        if (element.closest) {
            const windowEl = element.closest('[data-workspace-window]');
            if (windowEl) {
                const windowId = windowEl.getAttribute('data-workspace-window');
                if (windowId && entries.has(windowId)) return entries.get(windowId);
                continue;
            }
        }
        for (const entry of entries.values()) {
            if (entry.hostEl && entry.hostEl.contains(element)) return entry;
        }
    }
    return null;
};

const pointerInsideEntry = entry => {
    if (!entry || !entry.hostEl || typeof document === 'undefined') return false;
    let element = null;
    try {
        element = document.elementFromPoint(pointer.x, pointer.y);
    } catch (e) {
        element = null;
    }
    if (!element || isDragSurface(element)) return false;
    return !!entry.hostEl.contains(element);
};

const clearDropTargetAttr = entry => {
    if (entry && entry.hostEl && entry.hostEl.removeAttribute) {
        entry.hostEl.removeAttribute(DROP_TARGET_ATTR);
    }
};

const setDropTarget = nextId => {
    if (dropTargetId === nextId) return;
    clearDropTargetAttr(dropTargetId ? entries.get(dropTargetId) : null);
    dropTargetId = nextId;
    const next = nextId ? entries.get(nextId) : null;
    if (next && next.hostEl && next.hostEl.setAttribute) {
        next.hostEl.setAttribute(DROP_TARGET_ATTR, 'true');
    }
    if (dropTargetListener) {
        try {
            dropTargetListener(nextId);
        } catch (e) {
            dropTargetListener = null;
        }
    }
};

const resolveDropTargetId = () => {
    if (!dragSourceId) return null;
    const entry = findEntryAtPoint(pointer.x, pointer.y);
    return entry && entry.id !== dragSourceId ? entry.id : null;
};

const scheduleDropTargetUpdate = () => {
    if (typeof requestAnimationFrame !== 'function') {
        setDropTarget(resolveDropTargetId());
        return;
    }
    if (dropTargetFrame) return;
    dropTargetFrame = requestAnimationFrame(() => {
        dropTargetFrame = null;
        if (!dragSourceId) return;
        setDropTarget(resolveDropTargetId());
    });
};

const cancelDropTargetUpdate = () => {
    if (!dropTargetFrame) return;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(dropTargetFrame);
    dropTargetFrame = null;
};

const restoreDragSurface = () => {
    const elevated = elevatedSurface;
    elevatedSurface = null;
    if (!elevated) return;
    ELEVATED_PROPS.forEach(property => {
        elevated.svg.style[property] = '';
    });
    if (!elevated.parent) return;
    try {
        elevated.parent.appendChild(elevated.svg);
    } catch (e) {
        return;
    }
};

const elevateDragSurface = workspace => {
    restoreDragSurface();
    if (!workspace || typeof document === 'undefined' || !document.body) return;
    try {
        const surface = workspace.getBlockDragSurface && workspace.getBlockDragSurface();
        const svg = surface && surface.SVG_;
        if (!svg || !svg.parentNode || svg.parentNode === document.body) return;
        const previousTransform = svg.style.transform;
        const previousWebkitTransform = svg.style.webkitTransform;
        svg.style.transform = 'none';
        svg.style.webkitTransform = 'none';
        let rect = null;
        try {
            rect = svg.getBoundingClientRect();
        } finally {
            svg.style.transform = previousTransform || '';
            svg.style.webkitTransform = previousWebkitTransform || '';
        }
        if (!rect || !rect.width || !rect.height) {
            try {
                rect = workspace.getInjectionDiv().getBoundingClientRect();
            } catch (e) {
                rect = null;
            }
        }
        if (!rect || !rect.width || !rect.height) return;
        elevatedSurface = {svg: svg, parent: svg.parentNode};
        svg.style.position = 'fixed';
        svg.style.left = `${rect.left}px`;
        svg.style.top = `${rect.top}px`;
        svg.style.right = 'auto';
        svg.style.bottom = 'auto';
        svg.style.width = `${rect.width}px`;
        svg.style.height = `${rect.height}px`;
        svg.style.zIndex = ELEVATED_Z_INDEX;
        svg.style.pointerEvents = 'none';
        svg.style.overflow = 'visible';
        document.body.appendChild(svg);
    } catch (e) {
        elevatedSurface = null;
    }
};

const clearDragState = () => {
    cancelDropTargetUpdate();
    restoreDragSurface();
    dragSourceId = null;
    pointerDown = null;
    setDropTarget(null);
};

const beginDrag = workspace => {
    const entry = findEntryByWorkspace(workspace);
    if (!entry) return;
    try {
        if (typeof workspace.recordCachedAreas === 'function') {
            workspace.recordCachedAreas();
        }
    } catch (e) {
        return;
    }
    elevateDragSurface(workspace);
    if (!entry.onDragStart) return;
    try {
        entry.onDragStart();
    } catch (e) {
        entry.onDragStart = null;
    }
};

const finishDrag = (workspace, block, targetEntry) => {
    cancelDropTargetUpdate();
    restoreDragSurface();
    const sourceEntry = workspace ? findEntryByWorkspace(workspace) : null;
    if (sourceEntry && block && targetEntry) {
        const blocks = getScratchBlocks();
        const screenPoint = blockScreenPoint(block) || {x: pointer.x, y: pointer.y};
        const moved = moveBlockToWorkspace(blocks, {
            sourceEntry: sourceEntry,
            targetEntry: targetEntry,
            sourceTargetId: entryTargetId(sourceEntry),
            targetTargetId: entryTargetId(targetEntry),
            blockId: block.id,
            screenPoint: screenPoint,
            vm: registryVm
        });
        if (moved && targetEntry.onDragStart) {
            try {
                targetEntry.onDragStart();
            } catch (e) {
                targetEntry.onDragStart = null;
            }
        }
    }
    dragSourceId = null;
    pointerDown = null;
    setDropTarget(null);
};

const guardInstanceMethod = (owner, name, replacement) => {
    if (!owner || typeof owner[name] !== 'function') return null;
    const hadOwn = Object.prototype.hasOwnProperty.call(owner, name);
    const previous = owner[name];
    owner[name] = replacement;
    return () => {
        if (hadOwn) {
            owner[name] = previous;
        } else {
            delete owner[name];
        }
    };
};

const guardSourceWorkspace = (workspace, dragger) => {
    if (!workspace) return null;
    const restores = [];
    const insideRestore = guardInstanceMethod(workspace, 'isInsideBlocksArea', () => true);
    if (insideRestore) restores.push(insideRestore);
    const deleteRestore = guardInstanceMethod(workspace, 'isDeleteArea', () => false);
    if (deleteRestore) restores.push(deleteRestore);
    if (dragger && dragger.draggedConnectionManager_) {
        const connectRestore = guardInstanceMethod(
            dragger.draggedConnectionManager_, 'wouldConnectBlock', () => false);
        if (connectRestore) restores.push(connectRestore);
    }
    if (!restores.length) return null;
    return () => {
        restores.forEach(restore => restore());
    };
};

const resolveTransferTarget = workspace => {
    const sourceEntry = findEntryByWorkspace(workspace);
    if (!sourceEntry) return null;
    const targetEntry = findEntryAtPoint(pointer.x, pointer.y);
    if (!targetEntry || !targetEntry.workspace || targetEntry.id === sourceEntry.id) return null;
    return targetEntry;
};

const needsSourceGuard = (sourceEntry, targetEntry) => {
    if (targetEntry) return true;
    return !!(sourceEntry && sourceEntry.id !== MAIN_WORKSPACE_ID &&
        !pointerInsideEntry(sourceEntry));
};

const patchBlockDragger = () => {
    if (draggerPatched) return true;
    const Blocks = getScratchBlocks();
    const proto = Blocks && Blocks.BlockDragger && Blocks.BlockDragger.prototype;
    if (!proto || typeof proto.endBlockDrag !== 'function') return false;
    const originalEnd = proto.endBlockDrag;
    proto.endBlockDrag = function (event, delta) {
        const workspace = this.workspace_;
        const draggingBlock = this.draggingBlock_;
        if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
            pointer.x = event.clientX;
            pointer.y = event.clientY;
        }
        const sourceEntry = findEntryByWorkspace(workspace);
        const targetEntry = resolveTransferTarget(workspace);
        const restoreGuard = needsSourceGuard(sourceEntry, targetEntry) ?
            guardSourceWorkspace(workspace, this) : null;
        let result = null;
        let failure = null;
        try {
            result = originalEnd.call(this, event, delta);
        } catch (e) {
            failure = e;
        } finally {
            if (restoreGuard) restoreGuard();
        }
        if (failure) {
            clearDragState();
            throw failure;
        }
        try {
            finishDrag(workspace, draggingBlock, targetEntry);
        } catch (e) {
            clearDragState();
        }
        return result;
    };
    if (typeof proto.startBlockDrag === 'function') {
        const originalStart = proto.startBlockDrag;
        proto.startBlockDrag = function (block, delta) {
            const result = originalStart.call(this, block, delta);
            try {
                beginDrag(this.workspace_);
            } catch (e) {
                return result;
            }
            return result;
        };
    }
    draggerPatched = true;
    return true;
};

const handlePointerDown = e => {
    pointerDown = null;
    if (e.button !== 0) return;
    ensureMainWorkspace();
    const element = e.target;
    if (!element || !element.closest) return;
    if (isDragSurface(element)) return;
    if (!element.closest('.blocklyDraggable')) return;
    if (element.closest('.blocklyFlyout')) return;
    const entry = findEntryAtPoint(e.clientX, e.clientY);
    if (!entry) return;
    pointerDown = {
        entryId: entry.id,
        x: e.clientX,
        y: e.clientY
    };
};

const handlePointerMove = e => {
    if (!pointerDown && !dragSourceId) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    if (dragSourceId) {
        scheduleDropTargetUpdate();
        return;
    }
    const dx = e.clientX - pointerDown.x;
    const dy = e.clientY - pointerDown.y;
    if (Math.sqrt((dx * dx) + (dy * dy)) < DRAG_THRESHOLD_PX) return;
    if (!entries.has(pointerDown.entryId)) {
        pointerDown = null;
        return;
    }
    dragSourceId = pointerDown.entryId;
    setDropTarget(resolveDropTargetId());
};

const handlePointerUp = e => {
    if (!dragSourceId && !elevatedSurface) return;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    setTimeout(() => {
        if (dragSourceId || elevatedSurface) clearDragState();
    }, STALE_DRAG_TIMEOUT_MS);
};

const bindGlobals = () => {
    if (globalsBound || typeof document === 'undefined') return;
    globalsBound = true;
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('pointermove', handlePointerMove, true);
    document.addEventListener('pointerup', handlePointerUp, true);
    if (typeof window !== 'undefined') {
        window.addEventListener('blur', clearDragState);
    }
};

const registerWorkspace = (id, workspace, hostEl, targetId, onDragStart) => {
    if (!id || !workspace) return;
    const existing = entries.get(id);
    if (existing && existing.workspace === workspace) {
        existing.hostEl = resolveHost(workspace, hostEl) || existing.hostEl;
        existing.targetId = targetId || null;
        existing.onDragStart = onDragStart || null;
        return;
    }
    if (existing) unregisterWorkspace(id);
    entries.set(id, {
        id,
        workspace,
        hostEl: resolveHost(workspace, hostEl),
        targetId: targetId || null,
        onDragStart: onDragStart || null
    });
    bindGlobals();
};

const unregisterWorkspace = id => {
    const entry = entries.get(id);
    if (!entry) return;
    clearDropTargetAttr(entry);
    entries.delete(id);
    if (dropTargetId === id) {
        dropTargetId = null;
        if (dropTargetListener) dropTargetListener(null);
    }
    if (dragSourceId === id) clearDragState();
};

const ensureMainWorkspace = vm => {
    if (vm) registryVm = vm;
    const workspace = AddonHooks.blocklyWorkspace;
    if (!workspace) {
        if (mainWorkspace) {
            unregisterWorkspace(MAIN_WORKSPACE_ID);
            mainWorkspace = null;
        }
        return null;
    }
    if (workspace === mainWorkspace && entries.has(MAIN_WORKSPACE_ID)) return workspace;
    if (mainWorkspace) unregisterWorkspace(MAIN_WORKSPACE_ID);
    mainWorkspace = workspace;
    registerWorkspace(MAIN_WORKSPACE_ID, workspace, null, null, null);
    patchBlockDragger();
    return workspace;
};

const subscribeDropTarget = listener => {
    dropTargetListener = listener;
    return () => {
        if (dropTargetListener === listener) dropTargetListener = null;
    };
};

export default {
    MAIN_WORKSPACE_ID,
    ensureMainWorkspace,
    registerWorkspace,
    subscribeDropTarget,
    unregisterWorkspace
};
