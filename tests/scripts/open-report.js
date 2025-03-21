import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function findHtmlFiles(dir) {
    const htmlFiles = [];
    const files = readdirSync(dir);

    for (const file of files) {
        const filePath = join(dir, file);
        const stats = statSync(filePath);

        if (stats.isDirectory()) {
            htmlFiles.push(...findHtmlFiles(filePath));
        } else if (file.endsWith('.html')) {
            htmlFiles.push(filePath);
        }
    }

    return htmlFiles;
}

try {
    const htmlFiles = findHtmlFiles('playwright-report');
    if (htmlFiles.length === 0) {
        console.log('No HTML reports found in playwright-report');
        process.exit(0);
    }

    htmlFiles.forEach(file => {
        if (process.platform === 'win32') {
            execSync(`start "" "${file}"`);
        } else {
            execSync(`open "${file}"`);
        }
    });
} catch (error) {
    console.error('Error opening reports:', error.message);
    process.exit(1);
}