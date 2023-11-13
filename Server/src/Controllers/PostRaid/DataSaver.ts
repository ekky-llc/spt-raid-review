import * as fs from 'fs';
import * as path from 'path';

function CreateFolder(targetFolder: string): void {
    const folderPath = path.join(__dirname + '/../../../', 'data', targetFolder);

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`Folder created: ${folderPath}`);
    }
}

function CreateFile(targetFolder: string, fileName: string, keys: string): void {
    CreateFolder(targetFolder);

    const filePath = path.join(__dirname + '/../../../', 'data', targetFolder, `${fileName}.csv`);

    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '', 'utf-8');
        fs.appendFileSync(filePath, keys, 'utf-8');
        console.log(`File created: ${filePath}`);
    }
}

function WriteLineToFile(targetFolder: string, fileName: string, keys: string, value: string): void {
    CreateFile(targetFolder, fileName, keys);

    const filePath = path.join(__dirname + '/../../../', 'data', targetFolder, `${fileName}.csv`);

    fs.appendFileSync(filePath, value, 'utf-8');
}

export {
    WriteLineToFile
}
