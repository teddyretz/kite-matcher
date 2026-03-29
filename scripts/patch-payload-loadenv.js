// Patches payload/dist/bin/loadEnv.js to handle @next/env ESM interop issue
// where loadEnvConfig is only available as a default export in Next.js 15
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const file = resolve('node_modules/payload/dist/bin/loadEnv.js')
const patched = `import nextEnvImport from '@next/env';
import { findUpSync } from '../utilities/findUp.js';

const loadEnvConfig = nextEnvImport.loadEnvConfig ?? nextEnvImport.default?.loadEnvConfig ?? (() => ({ loadedEnvFiles: [] }));

export function loadEnv(path) {
    if (path?.length) {
        loadEnvConfig(path, true);
        return;
    }
    const dev = process.env.NODE_ENV !== 'production';
    const { loadedEnvFiles } = loadEnvConfig(process.cwd(), dev);
    if (!loadedEnvFiles?.length) {
        findUpSync({
            condition: (dir) => {
                const { loadedEnvFiles } = loadEnvConfig(dir, true);
                if (loadedEnvFiles?.length) return true;
            },
            dir: process.cwd()
        });
    }
}
`
writeFileSync(file, patched)
console.log('Patched payload/dist/bin/loadEnv.js')
