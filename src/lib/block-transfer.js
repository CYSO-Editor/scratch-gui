const TRANSFORM_TRANSLATE_REGEX = /translate\(\s*([-+\d.e]+)(?:[ ,]\s*([-+\d.e]+))?\)/;
const TRANSFORM_SCALE_REGEX = /scale\(\s*([-+\d.e]+)\s*\)/;

const elementTransformParts = element => {
    const parts = {x: 0, y: 0, scale: 1};
    let transform = null;
    try {
        transform = element.getAttribute ? element.getAttribute('transform') : null;
    } catch (e) {
        transform = null;
    }
    if (!transform) return parts;
    const translate = TRANSFORM_TRANSLATE_REGEX.exec(transform);
    if (translate) {
        parts.x = parseFloat(translate[1]) || 0;
        parts.y = translate[2] ? (parseFloat(translate[2]) || 0) : 0;
    }
    const scale = TRANSFORM_SCALE_REGEX.exec(transform);
    if (scale) parts.scale = parseFloat(scale[1]) || 1;
    return parts;
};

const blockScreenPoint = block => {
    if (!block || !block.getSvgRoot || !block.workspace || !block.workspace.getInjectionDiv) {
        return null;
    }
    try {
        const injection = block.workspace.getInjectionDiv();
        const rect = injection.getBoundingClientRect();
        let x = 0;
        let y = 0;
        let element = block.getSvgRoot();
        let reached = false;
        while (element) {
            if (element === injection) {
                reached = true;
                break;
            }
            const parts = elementTransformParts(element);
            x = (x * parts.scale) + parts.x;
            y = (y * parts.scale) + parts.y;
            element = element.parentNode;
        }
        if (!reached) return null;
        return {x: rect.left + x, y: rect.top + y};
    } catch (e) {
        return null;
    }
};

const stripBlockIds = node => {
    if (!node || node.nodeType !== 1) return;
    const name = node.nodeName.toLowerCase();
    if (name === 'block' || name === 'shadow') {
        node.removeAttribute('id');
    }
    for (let i = 0; i < node.childNodes.length; i++) {
        stripBlockIds(node.childNodes[i]);
    }
};

const placeBlock = (Blocks, block, screenPoint) => {
    const workspace = block && block.workspace;
    if (!Blocks || !workspace || !screenPoint) return;
    const actual = blockScreenPoint(block);
    if (!actual) return;
    const scale = (typeof workspace.scale === 'number' && workspace.scale) || 1;
    const dx = (screenPoint.x - actual.x) / scale;
    const dy = (screenPoint.y - actual.y) / scale;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
    let moveEvent = null;
    try {
        if (Blocks.Events && Blocks.Events.Move && Blocks.Events.isEnabled()) {
            moveEvent = new Blocks.Events.Move(block);
        }
    } catch (e) {
        moveEvent = null;
    }
    try {
        block.moveBy(dx, dy);
    } catch (e) {
        return;
    }
    if (!moveEvent) return;
    try {
        moveEvent.recordNew();
        Blocks.Events.fire(moveEvent);
    } catch (e) {
        return;
    }
};

const collectSubtreeIds = rootBlock => {
    let blocks = [];
    try {
        blocks = rootBlock.getDescendants() || [];
    } catch (e) {
        blocks = [];
    }
    if (!blocks.length) blocks = [rootBlock];
    const ids = [];
    blocks.forEach(block => {
        if (block && block.id && ids.indexOf(block.id) === -1) ids.push(block.id);
    });
    if (ids.indexOf(rootBlock.id) === -1) ids.unshift(rootBlock.id);
    return ids;
};

const disposeBlock = block => {
    if (!block) return;
    try {
        block.dispose(false);
    } catch (e) {
        return;
    }
};

const disposeSubtree = (rootBlock, ids) => {
    const workspace = rootBlock.workspace;
    const lookup = workspace && typeof workspace.getBlockById === 'function' ?
        workspace.getBlockById.bind(workspace) : null;
    for (let i = ids.length - 1; i >= 0; i--) {
        const id = ids[i];
        if (id === rootBlock.id) continue;
        let block = null;
        try {
            block = lookup ? lookup(id) : null;
        } catch (e) {
            block = null;
        }
        disposeBlock(block);
    }
    disposeBlock(rootBlock);
    if (!lookup) return;
    ids.forEach(id => {
        let leftover = null;
        try {
            leftover = lookup(id);
        } catch (e) {
            leftover = null;
        }
        if (leftover) disposeBlock(leftover);
    });
};

const resolveTarget = (vm, targetId) => {
    if (!vm || !targetId || !vm.runtime || typeof vm.runtime.getTargetById !== 'function') {
        return null;
    }
    try {
        return vm.runtime.getTargetById(targetId);
    } catch (e) {
        return null;
    }
};

const forgetTargetBlocks = (target, blockId) => {
    if (!target || !target.blocks || !blockId) return;
    const blocks = target.blocks;
    try {
        const root = typeof blocks.getBlock === 'function' ? blocks.getBlock(blockId) : null;
        const parent = root && root.parent && typeof blocks.getBlock === 'function' ?
            blocks.getBlock(root.parent) : null;
        if (parent) {
            if (parent.next === blockId) parent.next = null;
            if (parent.inputs) {
                Object.keys(parent.inputs).forEach(name => {
                    const input = parent.inputs[name];
                    if (!input) return;
                    if (input.block === blockId) input.block = null;
                    if (input.shadow === blockId) input.shadow = null;
                });
            }
        }
    } catch (e) {
        return;
    }
    try {
        if (typeof blocks.deleteBlock === 'function') {
            blocks.deleteBlock(blockId);
        } else {
            delete blocks._blocks[blockId];
        }
    } catch (e) {
        return;
    }
};

const moveBlockToWorkspace = (Blocks, options) => {
    const {
        sourceEntry,
        targetEntry,
        sourceTargetId,
        targetTargetId,
        blockId,
        screenPoint,
        vm
    } = options;
    if (!Blocks || !Blocks.Xml || typeof Blocks.Xml.domToBlock !== 'function') return false;
    if (!sourceEntry || !targetEntry || !sourceEntry.workspace || !targetEntry.workspace) return false;
    if (sourceTargetId && targetTargetId && sourceTargetId === targetTargetId) return false;
    let sourceBlock = null;
    try {
        sourceBlock = sourceEntry.workspace.getBlockById(blockId);
    } catch (e) {
        sourceBlock = null;
    }
    if (!sourceBlock) return false;
    let xmlBlock = null;
    try {
        xmlBlock = Blocks.Xml.blockToDom(sourceBlock);
    } catch (e) {
        return false;
    }
    if (!xmlBlock) return false;
    stripBlockIds(xmlBlock);
    const subtreeIds = collectSubtreeIds(sourceBlock);
    let created = null;
    try {
        created = Blocks.Xml.domToBlock(xmlBlock, targetEntry.workspace);
    } catch (e) {
        created = null;
    }
    if (!created) return false;
    try {
        placeBlock(Blocks, created, screenPoint);
    } catch (e) {
        return false;
    }
    disposeSubtree(sourceBlock, subtreeIds);
    forgetTargetBlocks(resolveTarget(vm, sourceTargetId), blockId);
    return true;
};

export {blockScreenPoint, moveBlockToWorkspace};
