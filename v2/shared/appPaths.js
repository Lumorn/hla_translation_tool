const path = require('node:path');

// Gemeinsamer Wurzelpfad für alle V2-Bestandteile
const v2Root = path.join(__dirname, '..');

// Fester Ablageort für alle Projekte der zweiten Generation
const defaultProjectsRoot = path.join(v2Root, 'projects');

// Liefert den absoluten Pfad zu einer Datei im Renderer-Verzeichnis
function resolveRenderer(relativeFile) {
  return path.join(v2Root, 'renderer', relativeFile);
}

// Liefert den absoluten Pfad zu einer Datei im gebauten Renderer-Verzeichnis
function resolveRendererDist(relativeFile) {
  return path.join(v2Root, 'dist', 'renderer', relativeFile);
}

// Liefert den Projektstamm, erlaubt aber eine Umgebungsvariable zur Überschreibung
function resolveProjectsRoot() {
  const override = process.env.HLA_V2_PROJECTS_ROOT;
  if (override && override.trim().length > 0) {
    return path.resolve(override);
  }
  return defaultProjectsRoot;
}

module.exports = {
  v2Root,
  defaultProjectsRoot,
  resolveRenderer,
  resolveRendererDist,
  resolveProjectsRoot,
};
