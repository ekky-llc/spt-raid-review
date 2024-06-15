import * as fs from 'fs';
import * as path from 'path';

function CreateFolder(parentFolder: string, subFolder: string = '', targetFolder: string = ''): void {

    let paths = [__dirname , '../../..', 'data', parentFolder, subFolder, targetFolder];
    let finalPath = paths.filter(path => path !== '').join('/');

    if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
        console.log(`[RAID-REVIEW] Folder created: ${finalPath}`);
    }
}

function CreateFile(parentFolder: string, subFolder: string = '', targetFolder: string, fileName: string, keys: string): void {
    CreateFolder(parentFolder);
    CreateFolder(parentFolder, subFolder);
    CreateFolder(parentFolder, subFolder, targetFolder);

    let paths = [__dirname , '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
    let finalPath = paths.filter(path => path !== '').join('/');

    if (!fs.existsSync(finalPath)) {
        fs.writeFileSync(finalPath, '', 'utf-8');
        fs.appendFileSync(finalPath, keys, 'utf-8');
        console.log(`[RAID-REVIEW] File created: ${finalPath}`);
    }
}

function WriteLineToFile(parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string, keys: string, value: string): void {
    CreateFile(parentFolder, subFolder, targetFolder, fileName, keys);

    let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
    let finalPath = paths.filter(path => path !== '').join('/');

    fs.appendFileSync(finalPath, value, 'utf-8');
}

function DeleteFile(parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string): void {
    let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
    let finalPath = paths.filter(path => path !== '').join('/');

    let exists = fs.existsSync(finalPath);
    if (exists) {
        fs.rmSync(finalPath);
    }
}

function RenameFile(parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string, newFilename: string): void {
    try {
        let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
        let finalPath = paths.filter(path => path !== '').join('/');

        let rename_paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${newFilename}`];
        let renameFinalPath = rename_paths.filter(path => path !== '').join('/');

        let exists = fs.existsSync(finalPath);
        if (exists) {
            fs.renameSync(finalPath, renameFinalPath);
        }
    } 

    catch (error) {
        console.log(`[RAID-REVIEW]`, error)
        return null;
    }
}

function ReadFile(parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string): string {
    try {
        let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
        let finalPath = paths.filter(path => path !== '').join('/');
        if (fs.existsSync(finalPath)) {
            return fs.readFileSync(finalPath, 'utf-8');
        }
        return ''; 
    } 
    
    catch (error) {
        console.log(`[RAID-REVIEW]`, error)
        return '';
    }
}

function FileExists(parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string): boolean {
    try {
        let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
        let finalPath = paths.filter(path => path !== '').join('/');
        let exists = fs.existsSync(finalPath);
        return exists;
    } 
    
    catch (error) {
        console.log(`[RAID-REVIEW]`, error)
        return false;
    }
}


export {
    WriteLineToFile,
    CreateFolder,
    DeleteFile,
    RenameFile,
    ReadFile,
    FileExists
}
