const { z } = require('zod');

// Schema für das Projekt-Manifest (project.json)
const projectManifestSchema = z.object({
    schemaVersion: z.number().int(), // Versionsnummer des Schemas
    name: z.string(),                // Anzeigename des Projekts
    created: z.string().optional()   // optionales Erstellungsdatum
});

/**
 * Validiert ein Projekt-Manifest gegen das definierte Schema.
 * Löst bei ungültigen Daten eine Ausnahme aus.
 * @param {unknown} data - zu prüfendes Objekt
 * @returns {object} - validierte Daten
 */
function validateProjectManifest(data) {
    return projectManifestSchema.parse(data);
}

module.exports = { projectManifestSchema, validateProjectManifest };
