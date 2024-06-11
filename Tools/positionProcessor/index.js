const fs = require('fs');
const data = require('./positions.json');

(() => {
    const positions = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        positions.push([row.z, row.x])
    }
    
    fs.writeFileSync(`${__dirname}/output.json`, JSON.stringify(positions), 'utf-8');
})();