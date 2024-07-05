import * as fs from 'fs';
import { Logger } from '../../Utils/logger';

function CreateFolder(logger: Logger, parentFolder: string, subFolder: string = '', targetFolder: string = ''): void {

    let paths = [__dirname , '../../..', 'data', parentFolder, subFolder, targetFolder];
    let finalPath = paths.filter(path => path !== '').join('/');

    if (!fs.existsSync(finalPath)) {
        fs.mkdirSync(finalPath, { recursive: true });
        logger.log(`Folder created: ${finalPath}`);
    }
}

function CreateFile(logger: Logger, parentFolder: string, subFolder: string = '', targetFolder: string, fileName: string, keys: string): void {
    CreateFolder(logger, parentFolder);
    CreateFolder(logger, parentFolder, subFolder);
    CreateFolder(logger, parentFolder, subFolder, targetFolder);

    let paths = [__dirname , '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
    let finalPath = paths.filter(path => path !== '').join('/');

    if (!fs.existsSync(finalPath)) {
        fs.writeFileSync(finalPath, '', 'utf-8');
        fs.appendFileSync(finalPath, keys, 'utf-8');
        logger.log(`File created: ${finalPath}`);
    }
}

function WriteLineToFile(logger: Logger, parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string, keys: string, value: string): void {
    CreateFile(logger, parentFolder, subFolder, targetFolder, fileName, keys);

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

function RenameFile(logger: Logger, parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string, newFilename: string): void {
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
        logger.error(`[ERR:RENAME] `, error)
    }
}

function ReadFile(logger: Logger, parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string): string {
    try {
        let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
        let finalPath = paths.filter(path => path !== '').join('/');
        if (fs.existsSync(finalPath)) {
            return fs.readFileSync(finalPath, 'utf-8');
        }
        return ''; 
    } 
    
    catch (error) {
        logger.error(`[ERR:READ]`, error)
        return '';
    }
}

function FileExists(logger: Logger, parentFolder: string, subFolder: string = '', targetFolder: string = '', fileName: string): boolean {
    try {
        let paths = [__dirname, '../../..', 'data', parentFolder, subFolder, targetFolder, `${fileName}`];
        let finalPath = paths.filter(path => path !== '').join('/');
        let exists = fs.existsSync(finalPath);
        return exists;
    } 
    
    catch (error) {
        logger.error(`[ERR:EXISTS]`, error)
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
