import * as fs from 'fs';
import * as path from 'path';

function ReadFileContent(parentFolder: string, subFolder: string, targetFolder: string, fileName: string) {

    let paths = [__dirname + '/../../../', 'data', parentFolder, subFolder, targetFolder, fileName];
        paths = paths.filter(path => path !== '');
    const filePath = path.join(...paths);

    let content = fs.readFileSync(filePath, 'utf-8');

    if (fileName.includes('json')) {
        content = JSON.parse(content);
    }

    return content;
};

export {
    ReadFileContent
}