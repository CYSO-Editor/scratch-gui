




import {PERMISSION_TYPES} from './extension-permissions';

export const decodeExtensionSource = url => {
    if (typeof url !== 'string' || !url.startsWith('data:')) {
        return null;
    }
    const commaIndex = url.indexOf(',');
    if (commaIndex === -1) {
        return null;
    }
    const payload = url.slice(commaIndex + 1);
    const isBase64 = /;base64,/i.test(url);

    if (isBase64) {
        try {
            const binary = typeof atob === 'function' ? atob(payload) : '';
            if (!binary) {
                return null;
            }
            
            try {
                return decodeURIComponent(escape(binary));
            } catch (e) {
                return binary;
            }
        } catch (e) {
            return null;
        }
    }

    try {
        return decodeURIComponent(payload);
    } catch (e) {
        return payload;
    }
};

// Remote (http/https) extension URLs cannot be decoded inline; the source must
// be fetched before it can be displayed or parsed for permissions.
export const isRemoteExtensionUrl = url =>
    typeof url === 'string' && /^https?:\/\//i.test(url);

export const fetchExtensionSource = async (url, timeoutMs = 5000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {mode: 'cors', signal: controller.signal});
        if (!res.ok) {
            return null;
        }
        return await res.text();
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
};




const matchQuotedValue = (text, key) => {
    const pattern = `(?:^|[^A-Za-z0-9_])${key}\\s*:\\s*(['\"])((?:\\\\.|(?!\\1).)*?)\\1`;
    const m = text.match(new RegExp(pattern));
    return m ? m[2] : null;
};






//   name: Scratch.translate('KEY')
export const extractExtensionInfo = source => {
    if (typeof source !== 'string') {
        return {id: null, name: null, isCysoCore: false};
    }
    const getInfoIdx = source.search(/getInfo\s*\(/);
    const region = getInfoIdx >= 0 ? source.slice(getInfoIdx, getInfoIdx + 1500) : source;

    const id = matchQuotedValue(region, 'id');

    
    let name = null;
    const translateName = region.match(/(?:^|[^A-Za-z0-9_])name\s*:\s*Scratch\.translate\s*\(\s*(['"])((?:\\.|(?!\1).)*?)\1\s*\)/);
    if (translateName) {
        name = translateName[2];
    } else {
        name = matchQuotedValue(region, 'name');
    }

    
    
    
    const cysoCorePattern = /cyso[\W_]{0,3}core/i;
    const isCysoCore = cysoCorePattern.test(id || '') ||
        cysoCorePattern.test(name || '') ||
        /cyso[\W_]{0,3}core/i.test(region);

    return {id, name, isCysoCore};
};

const escapeRegex = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


const getCurrentLocaleKey = () => {
    let locale = 'en';
    try {
        if (typeof navigator !== 'undefined' && navigator.language) {
            locale = navigator.language;
        }
    } catch (e) {
        // ignore
    }
    return locale.toLowerCase().replace(/_/g, '-');
};



const matchTranslationFromSetup = (source, key) => {
    if (typeof source !== 'string' || !key) {
        return null;
    }
    const setupMatch = source.match(/Scratch\.translate\.setup\s*\(\s*\{/);
    if (!setupMatch) {
        return null;
    }

    // Only scan a bounded region after the setup marker. The translation table
    // is normally small and near the top of the file; scanning the entire
    // (possibly huge) source for every extension is what made loading slow.
    const SCAN_LIMIT = 65536;
    const start = setupMatch.index + setupMatch[0].length - 1;
    const scanEnd = Math.min(source.length, start + SCAN_LIMIT);
    let depth = 0;
    let end = -1;
    for (let i = start; i < scanEnd; i++) {
        if (source[i] === '{') depth++;
        else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    if (end === -1) {
        return null;
    }
    const objText = source.slice(start, end + 1);

    
    const localeKey = getCurrentLocaleKey();
    const candidates = [localeKey];
    const primary = localeKey.split('-')[0];
    if (primary && primary !== localeKey) {
        candidates.push(primary);
    }

    for (const candidate of candidates) {
        
        const localeBlock = objText.match(new RegExp(`['"]?${escapeRegex(candidate)}['"]?\\s*:\\s*\\{`));
        if (!localeBlock) {
            continue;
        }
        const blockStart = localeBlock.index + localeBlock[0].length - 1; 
        let d = 0;
        let be = -1;
        for (let i = blockStart; i < objText.length; i++) {
            if (objText[i] === '{') d++;
            else if (objText[i] === '}') {
                d--;
                if (d === 0) {
                    be = i;
                    break;
                }
            }
        }
        if (be === -1) {
            continue;
        }
        const pairsText = objText.slice(blockStart, be + 1);
        
        const pairMatch = pairsText.match(new RegExp(`['"]${escapeRegex(key)}['"]\\s*:\\s*(['"])((?:\\\\.|(?!\\1).)*?)\\1`));
        if (pairMatch) {
            return pairMatch[2];
        }
    }
    return null;
};







export const extractExtensionPermissions = source => {
    if (typeof source !== 'string') {
        return [];
    }
    const validValues = new Set(Object.values(PERMISSION_TYPES));
    const valueByKey = {};
    Object.entries(PERMISSION_TYPES).forEach(([key, value]) => {
        valueByKey[key] = value;
    });

    const results = new Set();

    const collectFromArray = body => {
        
        const strRegex = /['"]([^'"]+)['"]/g;
        let s;
        while ((s = strRegex.exec(body))) {
            if (validValues.has(s[1])) {
                results.add(s[1]);
            }
        }
        
        const tokenRegex = /PERMISSION_TYPES\.([A-Z_][A-Z0-9_]*)/g;
        let t;
        while ((t = tokenRegex.exec(body))) {
            const value = valueByKey[t[1]];
            if (value) {
                results.add(value);
            }
        }
    };

    
    const arrayRegex = /permissions\s*:\s*\[([^\]]*)\]/g;
    let m;
    while ((m = arrayRegex.exec(source))) {
        collectFromArray(m[1]);
    }

    
    const altRegex = /(?:this\.permissions|registerExtensionPermissions\s*\([^,]*,\s*)\[([^\]]*)\]/g;
    while ((m = altRegex.exec(source))) {
        collectFromArray(m[1]);
    }

    return [...results];
};

export const localizeExtensionName = (raw, source) => {
    if (!raw || typeof raw !== 'string') {
        return raw;
    }
    try {
        if (typeof window !== 'undefined' && window.Scratch && typeof window.Scratch.translate === 'function') {
            const translated = window.Scratch.translate(raw);
            if (translated && translated !== raw) {
                return translated;
            }
        }
    } catch (e) {
        
    }
    const fromSetup = matchTranslationFromSetup(source, raw);
    if (fromSetup) {
        return fromSetup;
    }
    return raw;
};
