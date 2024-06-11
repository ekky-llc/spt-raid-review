const fs = require("fs");

(async () => {
  const raw = fs.readFileSync(`${__dirname}/positions`, "utf-8");
  const [keys, ...rows] = raw.split("\n");

  const output = [];
  for (let i = 0; i < rows.length; i++) {
    const [profileId, time, x, y, z, dir] = rows[i].split(",");
    output.push({
      profileId,
      time,
      x,
      y,
      z,
      dir,
    });
  }
})();
