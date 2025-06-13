const fs = require('fs');
const path = require('path');

// Liefert den ersten vorhandenen Ordnernamen aus der Liste
function chooseExisting(base, names) {
  for (const name of names) {
    if (fs.existsSync(path.join(base, name))) return name;
  }
  return names[0];
}

module.exports = { chooseExisting };
