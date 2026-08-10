import ScratchBlocks from 'scratch-blocks';

const isLoaded = () => true;

const get = () => ScratchBlocks;

const load = () => Promise.resolve(ScratchBlocks);

export default {
    get,
    isLoaded,
    load
};
