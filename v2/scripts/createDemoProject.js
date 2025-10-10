#!/usr/bin/env node
// Deutscher Hilfsskript-Kommentar: Dieses Skript erzeugt ein V2-Demo-Projekt mit Beispieldaten.
const path = require('node:path');
const fs = require('node:fs/promises');

async function createDemoProject() {
  const projectStore = require('../dist/backend/projectStore.js');
  const { resolveProjectsRoot } = require('../shared/appPaths.js');
  const demoRoot = path.join(__dirname, '..', 'demo-project');

  await fs.rm(demoRoot, { recursive: true, force: true });

  const initialData = {
    segments: [
      {
        id: 'demo_line_001',
        text: 'Das ist eine Beispielzeile für das neue Projekt.',
        translation: 'This is a sample line for the new project.',
        audio: 'demo_line_001.txt',
      },
      {
        id: 'demo_line_002',
        text: 'Hier könnte Ihre Übersetzung stehen.',
        translation: 'Your translation could be here.',
        audio: 'demo_line_002.txt',
      },
    ],
    meta: {
      description: 'Demo-Projekt für das Electron-Frontend der zweiten Generation.',
      createdBy: 'createDemoProject.js',
    },
  };

  const paths = await projectStore.createProject(demoRoot, {
    manifest: {
      name: 'V2 Demo-Projekt',
    },
    settings: {
      language: 'de-DE',
      playbackRate: 1.0,
      theme: 'dark',
    },
    data: initialData,
  });

  await fs.writeFile(
    path.join(paths.audioDir, 'demo_line_001.txt'),
    'Platzhalterinhalt für demo_line_001 – hier würde eine Audiodatei liegen.',
    'utf8'
  );
  await fs.writeFile(
    path.join(paths.audioDir, 'demo_line_002.txt'),
    'Platzhalterinhalt für demo_line_002 – ersetzt Audiodateien während der Demo.',
    'utf8'
  );

  await projectStore.writeData(
    paths,
    {
      ...initialData,
      segments: initialData.segments.map((segment, index) => ({
        ...segment,
        status: index === 0 ? 'translated' : 'pending',
      })),
    },
    'Demo-Daten mit Statusangabe gespeichert.'
  );

  await projectStore.writeSettings(paths, {
    language: 'de-DE',
    playbackRate: 0.95,
    theme: 'dark',
    notes: 'Dieses Projekt dient als Vorschau für die neue Oberfläche.',
  });

  const firstBackup = await projectStore.createBackup(paths);
  const firstSnapshot = await projectStore.createAudioSnapshot(paths);

  await projectStore.writeData(
    paths,
    {
      ...initialData,
      segments: initialData.segments.map((segment) => ({
        ...segment,
        status: 'translated',
      })),
    },
    'Demo-Daten nach einer fiktiven Importaktion aktualisiert.'
  );

  const secondBackup = await projectStore.createBackup(paths);
  const secondSnapshot = await projectStore.createAudioSnapshot(paths);

  const libraryRoot = await projectStore.ensureProjectsLibrary(resolveProjectsRoot());
  const libraryDemoRoot = path.join(libraryRoot, path.basename(demoRoot));

  await fs.rm(libraryDemoRoot, { recursive: true, force: true });
  await fs.cp(demoRoot, libraryDemoRoot, { recursive: true });

  console.log('Demo-Projekt wurde erstellt unter:', demoRoot);
  console.log('Backups:', firstBackup.name, 'und', secondBackup.name);
  console.log('Audio-Schnappschüsse:', firstSnapshot.name, 'und', secondSnapshot.name);
  console.log('Demo-Projekt wurde zusätzlich in der Projektbibliothek abgelegt unter:', libraryDemoRoot);
}

createDemoProject().catch((error) => {
  console.error('Demo-Projekt konnte nicht erstellt werden:', error);
  process.exitCode = 1;
});
