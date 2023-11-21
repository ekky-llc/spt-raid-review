import * as fs from 'fs';
import * as path from 'path';

function CreateFolder(parentFolder: string, subFolder: string = '', targetFolder: string = ''): void {

    let paths = [__dirname , '../../..', 'data', parentFolder, subFolder, targetFolder];
    let finalPath = paths.filter(path => path !== '').join('/');

    if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
        console.log(`[STATS] Folder created: ${finalPath}`);
    }
}

function CreateFile(parentFolder: string, subFolder: string = '', targetFolder: string, fileName: string, keys: string): void {
    CreateFolder(parentFolder);
    CreateFolder(parentFolder, subFolder);
    CreateFolder(parentFolder, subFolder, targetFolder);

    let paths = [__dirname , '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}.csv`];
    let finalPath = paths.filter(path => path !== '').join('/');

    if (!fs.existsSync(finalPath)) {
        fs.writeFileSync(finalPath, '', 'utf-8');
        fs.appendFileSync(finalPath, keys, 'utf-8');
        console.log(`[STATS] File created: ${finalPath}`);
    }
}

function WriteLineToFile(parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string, keys: string, value: string): void {
    CreateFile(parentFolder, subFolder, targetFolder, fileName, keys);

    let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}.csv`];
    let finalPath = paths.filter(path => path !== '').join('/');

    fs.appendFileSync(finalPath, value, 'utf-8');
}

export {
    WriteLineToFile,
    CreateFolder
}
