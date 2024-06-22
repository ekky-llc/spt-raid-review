const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const tileDirectory = `${__dirname}/tiles/`;
const outputDirectory = `${__dirname}/combined/`;

(async () => {

  async function createTileset(tileDirectory, outputDirectory) {
    const tileFiles = fs.readdirSync(tileDirectory).filter(file => file.endsWith('.png'));
    if (tileFiles.length === 0) {
      console.error('No tiles found in the directory.');
      return;
    }
  
    // Parse the filenames to determine unique zoom levels
    const zoomLevels = new Set();
    const tilesByZoom = {};
  
    tileFiles.forEach(file => {
      const [y, x, z] = file.split('_');
      const zoomLevel = parseInt(y.split('.')[0]); // Assuming y is the zoom level
  
      zoomLevels.add(zoomLevel);
      if (!tilesByZoom[zoomLevel]) {
        tilesByZoom[zoomLevel] = [];
      }
      tilesByZoom[zoomLevel].push(file);
    });
  
    // Get tile dimensions from the first tile
    const firstTile = await sharp(path.join(tileDirectory, tileFiles[0])).metadata();
    const tileWidth = firstTile.width;
    const tileHeight = firstTile.height;
  
    // Create tilesets for each zoom level
    for (const zoomLevel of zoomLevels) {
      const tiles = tilesByZoom[zoomLevel];
      const numTiles = tiles.length;
      const numColumns = Math.ceil(Math.sqrt(numTiles));
      const numRows = Math.ceil(numTiles / numColumns);
  
      const totalWidth = tileWidth * numColumns;
      const totalHeight = tileHeight * numRows;
  
      const tileset = sharp({
        create: {
          width: totalWidth,
          height: totalHeight,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      });
  
      // Sort tiles by their coordinates (x, z) to ensure correct placement
      tiles.sort((a, b) => {
        const [, ax, az] = a.split('_').map(part => parseInt(part.split('.')[0]));
        const [, bx, bz] = b.split('_').map(part => parseInt(part.split('.')[0]));
        if (ax === bx) {
          return az - bz;
        } else {
          return ax - bx;
        }
      });
  
      const tilesToInsert = [];
      // Composite tiles into tileset image
      for (let i = 0; i < numTiles; i++) {

        const [y,x,z] = tiles[i].replace('.png', '').split('_');

        const tilePath = path.join(tileDirectory, tiles[i]);
        const tile = await sharp(tilePath).toBuffer();
        // const x = col * tileWidth;
        // const y = row * tileHeight;
        tilesToInsert.push({ input: tile, left: Number(x) * tileWidth, top: Number(z) * tileHeight });
      }

      console.log('Compiling image')
      tileset.composite(tilesToInsert);
  
      const outputPath = path.join(outputDirectory, `tileset_zoom_${zoomLevel}.png`);
      await tileset.toFile(outputPath);
      console.log(`Tileset image created at ${outputPath} with zoom level ${zoomLevel}`);
    }
  }
  
  createTileset(tileDirectory, outputDirectory)
  .then(() => console.log('Tilesets created successfully'))
  .catch(err => console.error('Error creating tilesets:', err));

})();
