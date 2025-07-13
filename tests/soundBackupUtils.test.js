const fs = require('fs');
const path = require('path');
const os = require('os');
const { createSoundBackup, listSoundBackups, deleteSoundBackup } = require('../soundBackupUtils');

describe('soundBackupUtils', () => {
  test('erstellt und listet ZIP-Backups', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'sbu-'));
    const backupRoot = path.join(base, 'Backups');
    const de = path.join(base, 'Sounds', 'DE');
    const deb = path.join(base, 'DE-Backup');
    const deh = path.join(base, 'DE-History');
    fs.mkdirSync(de, { recursive: true });
    fs.mkdirSync(deb, { recursive: true });
    fs.mkdirSync(deh, { recursive: true });
    fs.writeFileSync(path.join(de, 'a.txt'), 'x');

    await createSoundBackup(backupRoot, de, deb, deh, 5);

    const list = listSoundBackups(backupRoot);
    expect(list.length).toBe(1);
    expect(list[0]).toHaveProperty('name');
    expect(list[0]).toHaveProperty('size');
    expect(list[0]).toHaveProperty('mtime');

    deleteSoundBackup(backupRoot, list[0].name);
    expect(listSoundBackups(backupRoot).length).toBe(0);
  });
});
