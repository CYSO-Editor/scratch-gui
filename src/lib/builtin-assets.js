import {TextEncoder} from './tw-text-encoder';

import catSvg from '!raw-loader!../../static/library-assets/f88bf1935daea28f8ca098462a31dbb0.svg';
import dangoSvg from '!raw-loader!../../static/library-assets/b4ab6b3b69de1bc3ed6a94ace172a0b0.svg';
import dangoCatSvg from '!raw-loader!../../static/library-assets/927d672925e7b99f7813735c484c6922.svg';

const builtinAssets = () => {
    let _TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('text-encoding').TextEncoder;
    } else {
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    return [{
        id: 'f88bf1935daea28f8ca098462a31dbb0',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(catSvg)
    }, {
        id: 'b4ab6b3b69de1bc3ed6a94ace172a0b0',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(dangoSvg)
    }, {
        id: '927d672925e7b99f7813735c484c6922',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(dangoCatSvg)
    }];
};

export default builtinAssets;
