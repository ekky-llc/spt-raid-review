import * as zlib from 'zlib';

async function compressData(jsonString: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        zlib.gzip(jsonString, (err, buffer) => {
            if (err) return reject(err);
            resolve(buffer);
        });
    });
}

async function decompressData(compressedData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        zlib.gunzip(compressedData, (err, decompressed) => {
            if (err) return reject(err);
            resolve(decompressed.toString());
        });
    });
}

export {
    compressData,
    decompressData
};