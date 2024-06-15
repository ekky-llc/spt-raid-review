const fs = require('fs');
const path = require('path');
const { mkdir } = require('fs').promises;
const { pipeline } = require('stream');
const { promisify } = require('util');

(async () => {
    
    const pipelineAsync = promisify(pipeline);
    
    const baseURL = 'target_url';
    const maxTileNumber = 40; // Assuming 10 as an upper limit for tiles, adjust as needed
    
    async function downloadTile(x, y, z) {
      const url = `${baseURL}/${x}/${y}/${z}.png`;
      const filePath = path.join(__dirname, 'tiles', `${x}_${y}_${z}.png`);
    
      try {
        // Ensure the directory exists
        await mkdir(path.dirname(filePath), { recursive: true });
    
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to download ${url}`);
        }
    
        const fileStream = fs.createWriteStream(filePath);
        await pipelineAsync(response.body, fileStream);
        return filePath;
      } catch (err) {
        throw new Error(`Error downloading tile (${x}, ${y}, ${z}): ${err.message}`);
      }
    }
    
    async function downloadAllTiles() {
      for (let y = 0; y <= maxTileNumber; y++) {
        for (let z = 0; z <= maxTileNumber; z++) {
          try {
            const filePath = await downloadTile(5, y, z);
            console.log(`Downloaded ${filePath}`);
          } catch (err) {
            console.error(err.message);
          }
        }
      }
    }
    
    downloadAllTiles().catch(console.error);

})()