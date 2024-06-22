import * as fs from 'fs';
import * as path from 'path';

function ReadFileContent(parentFolder: string, subFolder: string, targetFolder: string, fileName: string) {

    let paths = [__dirname + '/../../../', 'data', parentFolder, subFolder, targetFolder, fileName];
        paths = paths.filter(path => path !== '');
    const filePath = path.join(...paths);

    const fileExists = fs.existsSync(filePath);
    if (fileExists) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        if (fileName.includes('json')) {
            content = JSON.parse(content);
        }
        
        return content;
    }

    return null;
};

/**
 * Returns a file listing of the target folder.
 * @param parentFolder Default = ''
 * @param subFolder Default = ''
 * @param targetFolder Default = ''
 * @param fullPath If true, returns the full system path.
 * @returns Array of file names with or without the full path depending on 'fullPath' value.
 */
function ReadFolderContents(parentFolder: string = '', subFolder: string = '', targetFolder: string = '', fullPath : boolean = false) : string[] {
    const directoryListing = [];
    let paths = [__dirname + '/../../../', 'data', parentFolder, subFolder, targetFolder];
        paths = paths.filter(path => path !== '');
    const folderPath = path.join(...paths);

    const folderExists = fs.existsSync(folderPath);
    if (folderExists) {
        const files = fs.readdirSync(folderPath);
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (fullPath) {
                directoryListing.push(`${folderPath}/${file}`);
            } else {
                directoryListing.push(file);
            }
        }
    }

    return directoryListing
}

export {
    ReadFileContent,
    ReadFolderContents
}