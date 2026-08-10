const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const LIBRARY_FILES_JSON = path.join(__dirname, '../../desktop/scripts/library-files.json');
const OUTPUT_DIR = path.join(__dirname, '../static/library-assets');

const CDN_HOSTS = [
    'https://cdn.assets.scratch.mit.edu',
    'https://assets.scratch.mit.edu'
];

const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlinkSync(dest);
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                reject(new Error(`HTTP ${response.statusCode}: ${url}`));
                return;
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            file.close();
            fs.unlinkSync(dest);
            reject(err);
        });
    });
};

const downloadWithFallback = async (md5ext) => {
    const dest = path.join(OUTPUT_DIR, md5ext);
    
    if (fs.existsSync(dest)) {
        console.log(`[SKIP] ${md5ext} already exists`);
        return true;
    }
    
    for (const host of CDN_HOSTS) {
        const url = `${host}/internalapi/asset/${md5ext}/get/`;
        try {
            console.log(`[TRY] ${url}`);
            await downloadFile(url, dest);
            console.log(`[OK] ${md5ext} downloaded from ${host}`);
            return true;
        } catch (err) {
            console.log(`[FAIL] ${host}: ${err.message}`);
        }
    }
    
    console.log(`[ERROR] Failed to download ${md5ext}`);
    return false;
};

const main = async () => {
    console.log('Library Assets Downloader');
    console.log('=========================');
    
    if (!fs.existsSync(LIBRARY_FILES_JSON)) {
        console.error(`Library files JSON not found: ${LIBRARY_FILES_JSON}`);
        console.error('Please ensure the desktop/scripts/library-files.json exists.');
        process.exit(1);
    }
    
    const libraryFiles = JSON.parse(fs.readFileSync(LIBRARY_FILES_JSON, 'utf-8'));
    console.log(`Found ${libraryFiles.length} assets to download`);
    
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    let downloaded = 0;
    let failed = 0;
    let skipped = 0;
    
    const batchSize = 10;
    for (let i = 0; i < libraryFiles.length; i += batchSize) {
        const batch = libraryFiles.slice(i, i + batchSize);
        const results = await Promise.all(batch.map(async (asset) => {
            const ext = asset.src.split('.').pop();
            const md5ext = `${asset.md5}.${ext}`;
            const dest = path.join(OUTPUT_DIR, md5ext);
            
            if (fs.existsSync(dest)) {
                skipped++;
                return true;
            }
            
            return downloadWithFallback(md5ext);
        }));
        
        results.forEach(success => {
            if (success) downloaded++;
            else failed++;
        });
        
        console.log(`Progress: ${Math.min(i + batchSize, libraryFiles.length)}/${libraryFiles.length}`);
    }
    
    console.log('');
    console.log('Download Summary');
    console.log('================');
    console.log(`Downloaded: ${downloaded}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
};

main().catch(console.error);
