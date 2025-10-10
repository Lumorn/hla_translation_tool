<template>
  <section class="wizard" aria-labelledby="import-wizard-headline">
    <h2 id="import-wizard-headline">Import-Assistent für V1-Daten</h2>
    <p class="wizard__intro">
      Dieser Assistent liest exportierte JSON-Dateien und Audiodateien aus der klassischen Version ein,
      prüft auf Konflikte und überträgt bestätigte Inhalte in das aktuell geöffnete Projekt.
    </p>

    <form id="import-source-form" class="wizard__form">
      <fieldset>
        <legend>Quellpfade</legend>
        <label class="wizard__label">
          Quellstamm
          <input name="root" type="text" required placeholder="/Pfad/zum/V1-Export" />
        </label>
        <label class="wizard__label">
          Daten-Dateien (eine pro Zeile)
          <textarea name="dataFiles" rows="4" placeholder="data/dialoge.json&#10;export/kapitel1.json"></textarea>
        </label>
        <label class="wizard__label">
          Audio-Ordner (eine Zeile pro Ordner)
          <textarea name="audioDirs" rows="3" placeholder="audio&#10;sounds/kapitel1"></textarea>
        </label>
      </fieldset>
      <div class="wizard__buttons">
        <button type="submit" id="import-source-submit">Quellen scannen</button>
        <button type="button" id="import-cancel-button" class="secondary">Zurücksetzen</button>
      </div>
    </form>

    <section id="import-progress" class="wizard__progress" aria-live="polite"></section>

    <section id="import-conflicts" class="wizard__conflicts" aria-live="polite"></section>

    <section id="import-actions" class="wizard__actions">
      <button type="button" id="import-run-button" disabled>Import durchführen</button>
    </section>

    <section id="import-report" class="wizard__report" aria-live="polite"></section>
  </section>
</template>
