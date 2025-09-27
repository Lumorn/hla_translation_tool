# Changelog
## 🛠️ Patch in 1.40.397
* `web/src/main.js` setzt beim Zurücksetzen per Doppelklick oder Esc das Ende sofort auf die gerundete Gesamtlänge, validiert die Eingaben direkt und triggert das erneute Zeichnen der Markierung, damit `start < end` aktiv bleibt.
* `README.md` dokumentiert den erneuten Aktivierungs-Flow der Markierung nach Doppelklick oder Esc.
* `CHANGELOG.md` hält die aktualisierte Reset-Logik für den DE-Audio-Editor fest.
## 🛠️ Patch in 1.40.396
* `web/src/main.js` lädt nach jedem Speichern sowohl die DE- als auch die EN-Wellenform komplett neu, damit die Originalspur nicht mehr zur Miniatur schrumpft und der Editor wie ein frisch geöffneter Dialog wirkt.
* `README.md` beschreibt die neu aufgebaute Doppel-Vorschau und den direkten Zugriff auf die gespeicherte DE-Version.
* `CHANGELOG.md` hält die vollständige Neuinitialisierung der Wave-Ansicht fest.
## 🛠️ Patch in 1.40.395
* `web/src/main.js` baut die EN-Vorschau nach jedem Speichern aus einer unveränderten Kopie neu auf, damit sie nicht mehr bei mehreren Speichervorgängen zusammenschrumpft.
* `README.md` erwähnt die frische EN-Kopie und den Wegfall der schleichenden Verkleinerung nach aufeinanderfolgenden Speichervorgängen.
* `CHANGELOG.md` dokumentiert die regenerierte EN-Anzeige nach dem Speichern.
## 🛠️ Patch in 1.40.394
* `web/src/main.js` gleicht nach jedem Speichern die EN-Wellenform mit Trims, Pausenentfernungen und Tempoanpassungen ab und aktualisiert zugleich die Laufzeitlabels.
* `README.md` erwähnt die sofort synchronisierte EN-Vorschau nach gespeicherten Änderungen.
* `CHANGELOG.md` dokumentiert die neue Anpassung der EN-Anzeige.
## 🛠️ Patch in 1.40.393
* `web/src/main.js` belässt nach dem Speichern die Trim-Markierung aktiv und ergänzt den Speichern-Hinweis um DE- und EN-Längen.
* `README.md` erwähnt den dauerhaft markierten Bereich und die kombinierte Längenanzeige im DE-Audio-Editor.
* `CHANGELOG.md` dokumentiert die sichtbare Markierung und die zusätzliche Infozeile im Speichern-Hinweis.
## 🛠️ Patch in 1.40.392
* `web/hla_translation_tool.html` ergänzt im Kopfbereich des DE-Audio-Dialogs eine zweite Aktionsleiste mit „Zurücksetzen“, „Speichern“ sowie „Speichern & schließen“.
* `web/src/style.css` richtet die neue Kopfzeile per Flex-Layout aus und sorgt für passende Abstände und Button-Umbruch.
* `README.md` weist auf die doppelten Aktionsknöpfe hin, damit die Bedienung oben und unten möglich ist.
## 🛠️ Patch in 1.40.391
* `web/src/main.js` lässt `applyDeEdit` nach dem Speichern offen, aktualisiert die Arbeits-Puffer und schließt den Dialog nur nach ausdrücklicher Anforderung.
* `web/hla_translation_tool.html` ergänzt neben dem regulären Speichern-Button eine separate Aktion „Speichern & schließen“.
* `README.md` beschreibt die Möglichkeit, mehrere Speichervorgänge hintereinander durchzuführen und verweist auf den neuen Button.
* `CHANGELOG.md` dokumentiert die getrennten Speicher- und Schließen-Aktionen im DE-Audio-Editor.
## 🛠️ Patch in 1.40.390
* `web/hla_translation_tool.html` verwandelt den Kopfbereich in eine kompakte Werkzeugzeile mit Projekt-, Werkzeug-, Medien-, System- und Suchsegment; Speicher- und Migrationsaktionen sitzen jetzt gemeinsam im Verwaltungs-Dropdown.
* `web/src/style.css` liefert das verschlankte Flex-Layout samt einheitlichen Dropdown-Stilen, schlankeren Buttons und neuen Breakpoints für <1200 px sowie <900 px.
* `README.md` beschreibt die neue Kopfzeile mit gebündelten Aktionen und verweist auf das Verwaltungs-Dropdown.
* `CHANGELOG.md` dokumentiert die Überarbeitung des kompakten Headers.
## 🛠️ Patch in 1.40.389
* `web/src/main.js` berechnet die Waveform-Breite direkt aus dem Laufzeitverhältnis und setzt die Pixelbreite inline, damit EN- und DE-Spuren exakt nach Dauer skaliert werden.
* `web/src/style.css` erlaubt die inline gesetzten Pixelbreiten und sichert mit Mindestmaßen die Bedienbarkeit auch bei sehr kurzen Takes ab.
* `README.md` beschreibt die dynamische Breitenanpassung samt sauber synchronisierten Scrollleisten, Linealen und Zoom-Reglern.
* `CHANGELOG.md` dokumentiert die dynamische Pixelbreite der Wave-Canvas im DE-Editor.
## 🛠️ Patch in 1.40.388
* `web/src/main.js` setzt die Canvas-Breite jetzt in Pixeln, damit lange DE-Aufnahmen proportional zur Laufzeit dargestellt und korrekt gescrollt werden können.
* `web/src/style.css` überlässt die Breite der Wave-Canvas dem Inline-Stil, sodass die neue Pixelbreite nicht mehr überschrieben wird.
* `README.md` erwähnt die proportional skalierte DE-Wellenform.
* `CHANGELOG.md` dokumentiert die neue Breitenlogik der Wave-Canvas.
## 🛠️ Patch in 1.40.387
* `web/src/dubbing.js` entfernt den Aufbau der Master-Timeline, bindet die Toolbar-Elemente als gemeinsame Regler und synchronisiert nur noch Zoom- und Positionswerte.
* `web/src/main.js` verzichtet auf die Timeline-Initialisierung, koppelt die neuen Toolbar-Controls an die bestehenden Callback-Pfade und aktualisiert Scroll- und Zoom-Anzeigen ohne zusätzliche Zeitleiste.
* `web/hla_translation_tool.html` verlegt Zoom-Tasten, Positions-Slider und Sprungknöpfe direkt in die Wave-Toolbar.
* `web/src/style.css` streicht Timeline- und Master-Bar-Stile und gestaltet die kompakten Toolbar-Buttons samt Positionsregler.
* `README.md` weist auf den Wegfall der Master-Timeline und die verlegten Regler hin.
* `CHANGELOG.md` dokumentiert die Umstellung auf die Toolbar-Regler ohne Master-Timeline.
## 🛠️ Patch in 1.40.386
* `web/hla_translation_tool.html` ersetzt die alte Effekt-Toolbar durch eine schlanke Fußleiste mit Zurücksetzen und Speichern.
* `web/src/style.css` entfernt Sticky-Regeln sowie Toolbar-Stile und ergänzt ein kompaktes Layout für `.edit-footer`.
* `web/src/main.js` aktualisiert die Effekt-Statuslogik und Schnellaktionen, damit ausschließlich die Buttons in den Feldsets angesprochen werden.
* `README.md` beschreibt die neue Fußleiste im DE-Audio-Editor und vermerkt den Versionswechsel in der Übersicht.
* `CHANGELOG.md` dokumentiert die Umstellung auf die platzsparende Fußleiste.
## 🛠️ Patch in 1.40.385
* `web/hla_translation_tool.html` ersetzt das Kartenraster des Schnellzugriffs durch eine schlanke Toolbar mit kurzen Labels und eindeutigen Aria-Beschreibungen.
* `web/src/style.css` verschlankt die Schnellzugriffsknöpfe, reduziert Polsterung und Icon-Größen, sorgt für Flex-Layout mit automatischem Umbruch und blendet auf schmalen Displays optional die Texte aus.
* `README.md` beschreibt die neue Toolbar mit kompakten Icon-Labels.
* `CHANGELOG.md` dokumentiert die Umstellung auf die schlanke Schnellzugriffsleiste.
## 🛠️ Patch in 1.40.384
* `web/src/main.js` senkt den Standardwert für `waveHeightPx` auf 80 px und erzwingt denselben Fallback, damit frische Sitzungen schlanke Wellenformen nutzen.
* `web/hla_translation_tool.html` setzt den Startwert des Höhen-Sliders auf 80 px, sodass Regler und Anzeige übereinstimmen.
* `web/src/style.css` reduziert Padding, Gaps und Button-Größen im DE-Audio-Editor, ohne die Bedienelemente zu überlappen.
* `README.md` beschreibt die schmalere Standard-Wellenform und den angepassten Slider.
* `CHANGELOG.md` dokumentiert die neue Standardhöhe und die kompakteren Abstände.
## 🛠️ Patch in 1.40.383
* `web/src/style.css` stellt Toolbar, Wellenraster und EN-Übernahmeleiste auf engere Gaps, geringeres Padding und kleinere Buttons um, damit der DE-Audio-Editor weniger vertikalen Platz beansprucht.
* `README.md` beschreibt das feinjustierte Toolbar-Grid, die engeren Wave-Blöcke und die gestraffte EN-Leiste.
* `CHANGELOG.md` hält die neuesten Layout-Anpassungen am Wave-Editor fest.
## 🛠️ Patch in 1.40.382
* `web/src/style.css` reduziert Padding, Abstände und große-Screen-Aufweitungen im Kopfbereich des DE-Audio-Dialogs, damit Toolbar und Wave-Raster kompakter bleiben.
* `README.md` beschreibt den verschlankten Kopfbereich mit engerer Überschrift und dichterem Wellen-Layout.
* `CHANGELOG.md` dokumentiert den entschlackten Wave-Header.
## 🛠️ Patch in 1.40.381
* `web/src/style.css` verdichtet Wave-Area, Toolbar, Blöcke, Steuerleisten und Scrollbereich, sodass beide Wellenformen dichter nebeneinander liegen.
* `README.md` ergänzt den Hinweis auf das kompaktere Waveform-Raster mit geringeren Abständen.
* `CHANGELOG.md` hält die neue Verdichtung der Wave-Layouts fest.
## 🛠️ Patch in 1.40.380
* `web/src/style.css` reduziert Abstände in Wave-Area und Toolbar, damit der obere Editorbereich kompakter erscheint und Buttons weiterhin gut erreichbar bleiben.
* `README.md` beschreibt die verschlankte Waveform-Werkzeugleiste mit den neuen Abständen.
* `CHANGELOG.md` dokumentiert die verdichtete Toolbar und das engere Raster.
## 🛠️ Patch in 1.40.379
* `web/src/style.css` vergrößert die DE-Wiedergabeknöpfe auf 44 px, hebt die Symbole auf 18 px an und ordnet sie in einer horizontalen Leiste mit klaren Hover-Kontrasten an.
* `web/hla_translation_tool.html` ergänzt aussagekräftige `aria-label`-Attribute für die Play- und Stop-Schaltflächen.
* `README.md` beschreibt die neue, kontraststarke Wiedergabesteuerung im DE-Audio-Editor.
* `CHANGELOG.md` dokumentiert die überarbeitete Steuerungsleiste.
## 🛠️ Patch in 1.40.378
* `web/src/style.css` stellt das Waveform-Raster auf zwei feste Spalten um, bricht auf kleinen Bildschirmen einspaltig um und schafft mehr Abstand für den EN-Einfügebereich.
* `README.md` beschreibt die neue Zweispalten-Logik im DE-Audio-Editor und den zusätzlichen Freiraum für den Einfügebereich.
* `CHANGELOG.md` hält das aktualisierte Layout der Wave-Area fest.
## 🛠️ Patch in 1.40.377
* `web/src/dubbing.js` erzeugt eine zentrale Timeline-Leiste samt Zoom- und Scroll-Steuerung und stellt Helfer zum Aktualisieren der Marker bereit.
* `web/src/main.js` bindet die Timeline in den DE-Audio-Editor ein, synchronisiert Zoom/Scroll mit beiden Wellenformen und visualisiert Trim-, Ignorier-, Stille- sowie Cursor-Markierungen.
* `web/src/style.css` gestaltet Timeline, Marker und Master-Steuerung mit kontrastreichen Hintergründen, Buttons und responsiven Range-Slidern.
* README und CHANGELOG dokumentieren die neue Master-Timeline samt gemeinsamen Zoom- und Scroll-Reglern.
## 🛠️ Patch in 1.40.376
* `web/src/dubbing.js` ordnet die rechte Effekt-Seitenleiste in Tabs für Kernfunktionen und erweiterte Optionen und versieht die Gruppen mit klaren Überschriften.
* `web/src/style.css` liefert neue Tab-Layouts inklusive Hintergründen, Abständen und responsiver Anpassung für die Abschnittspaneele.
* README und CHANGELOG dokumentieren die tabbasierte Effekt-Steuerung im DE-Editor.
## 🛠️ Patch in 1.40.375
* `web/hla_translation_tool.html` ergänzt eine Waveform-Werkzeugleiste mit Zoom- und Höhenreglern, Fokusknöpfen sowie eigenen Scrollbereichen für Original- und DE-Wellenform.
* `web/src/style.css` liefert das Layout für die Toolbar, definiert Scrollleisten, Zeitlineale und sorgt für großzügige Abstände auf Ultrawide-Monitoren.
* `web/src/main.js` speichert Zoom- und Höhenwerte, koppelt das Scrollen beider Wellen, zeichnet Zeitmarken-Lineale und bindet die neuen Bedienelemente in die Bearbeitungslogik ein.
* README und CHANGELOG dokumentieren die erweiterte Audiobearbeitung für große Monitore inklusive der neuen Werkzeuge.
## 🛠️ Patch in 1.40.374
* `web/hla_translation_tool.html` fasst die Wellenformen in einem klassengebundenen Raster zusammen, damit Original- und DE-Ansicht auf breiten Monitoren nebeneinander Platz finden.
* `web/src/style.css` vergrößert den Dialog für Ultra-Wide-Displays, verteilt Wellenformen und Effektgruppen in responsiven Gittern und reduziert Abstände automatisch auf kleineren Screens.
* README und CHANGELOG vermerken die adaptive DE-Audio-Ansicht für breite Monitore.
## 🛠️ Patch in 1.40.373
* `web/hla_translation_tool.html` gestaltet den Schnellzugriff als Kartenraster mit erklärenden Titeln und ergänzt den Button „Tempo angleichen“, der die EN-Laufzeit sofort übernimmt.
* `web/src/style.css` schärft die Optik mit größeren Karten, klareren Überschriften und feineren Schatten für Schnellzugriff und Timing-Bereiche.
* `web/src/main.js` bindet den neuen Schnellzugriffsknopf an die bestehende Tempo-Autoanpassung und hebt die betroffenen Felder visuell hervor.
* README und CHANGELOG dokumentieren die verfeinerte Ansicht samt zusätzlichem Tempo-Knopf.
## 🛠️ Patch in 1.40.372
* `web/hla_translation_tool.html` ordnet den DE-Audio-Editor in eine zweispaltige Struktur mit eigener Schnellzugriffsleiste für Trimmen, Auto-Trim, Lautstärkeabgleich und Funkgerät-Effekt ein.
* `web/src/style.css` liefert das responsive Grid, Scrollbereiche für Effekte sowie optische Rückmeldungen der Schnellzugriffe.
* `web/src/main.js` verknüpft die neuen Schnellzugriffsknöpfe mit bestehenden Aktionen und sorgt für visuelles Feedback.
* README und CHANGELOG beschreiben den dynamischen Editor inklusive Schnellzugriffsleiste.
## 🛠️ Patch in 1.40.371
* `web/src/gptService.js` bevorzugt bei Responses-Antworten jetzt echte Ausgabeblöcke und überspringt Reasoning-Texte, damit `gpt-5-chat-latest` zuverlässig JSON liefert.
* `tests/gptService.test.js` simuliert einen Reasoning-Block im Responses-Format und prüft, dass nur der eigentliche Output übernommen wird.
* README beschreibt die automatische Filterung der Reasoning-Blöcke und die stabileren Bewertungen mit GPT‑5.

## 🛠️ Patch in 1.40.370
* `web/src/gptService.js` liest Fehlermeldungen der OpenAI-API vollständig ein, ergänzt sie bei HTTP-Fehlern um den Originaltext und verhindert so rätselhafte `HTTP 400`-Hinweise bei GPT‑5.
* `tests/gptService.test.js` simuliert die neuen Antwortpfade über `response.text()`, damit die Testumgebung das verbesserte Fehler-Parsing abdeckt.
* README verweist auf die ausführlichen GPT‑5-Fehlertexte und beschreibt, wie sich falsch konfigurierte Modelle schneller erkennen lassen.

## 🛠️ Patch in 1.40.369
* `web/src/gptService.js` erkennt GPT-5-Modelle automatisch und nutzt bei Bedarf den neuen Responses-Endpunkt inklusive gemeinsamer JSON-Auswertung.
* `tests/gptService.test.js` prüft den Responses-Pfad mit einem simulierten `gpt-5.0`-Modell.
* README dokumentiert die zusätzliche Responses-Unterstützung für kommende GPT-Generationen.

## 🛠️ Patch in 1.40.368
* `web/hla_translation_tool.html` ergänzt ein neues Kopier-Häkchen, das bei Bedarf „extrem schnell reden“ in Emotionstags einfügt.
* `web/src/main.js` erweitert das Kopieren einzelner und aller Emotional-Texte um die optionale Schnellsprech-Anweisung.
* README und Changelog dokumentieren die neue Kopieroption für extrem schnelles Sprechen.

## 🛠️ Patch in 1.40.367
* `web/src/main.js` merkt sich die Projekt-ID jeder Übersetzungsanfrage, synchronisiert das Ergebnis mit dem richtigen Projektobjekt und speichert sofort, damit automatische Vorschläge auch nach einem Projektwechsel sichtbar bleiben.
* README beschreibt die zuverlässige Übernahme der Auto-Übersetzungen trotz laufender Warteschlange.

## 🛠️ Patch in 1.40.366
* `web/src/main.js` übernimmt jetzt auch Dateien mit der ID `0` in die Übersetzungswarteschlange, damit frisch erzeugte Projekte beim ersten Öffnen sofort automatische Vorschläge erhalten.
* README dokumentiert die stabilisierte Initialübersetzung.

## 🛠️ Patch in 1.40.365
* `web/src/main.js` organisiert automatische Übersetzungen jetzt in einer globalen Warteschlange, damit laufende Jobs bei Projektwechseln zu Ende geführt werden und wartende Projekte nacheinander abgearbeitet werden.
* README beschreibt die neue Hintergrund-Warteschlange für automatische Übersetzungen.

## 🛠️ Patch in 1.40.364
* `electron/main.js` speichert ignorierte Ordner-Dateien jetzt als `ignoredFiles.json` im Nutzerverzeichnis und stellt passende IPC-Handler bereit.
* `electron/preload.cjs` reicht neue `loadIgnoredFiles`- und `saveIgnoredFiles`-Brücken an den Renderer weiter.
* `web/src/main.js` synchronisiert die Ignorierliste zwischen Electron-Speicher und Browser-Backend, damit Markierungen nach einem Neustart erhalten bleiben.
* README nennt das neue Speicherziel der Ignorierliste in der Desktop-Version.

## 🛠️ Patch in 1.40.363
* `web/src/storage/indexedDbBackend.js` speichert große Dateien bei blockiertem OPFS automatisch als Base64 in IndexedDB und verhindert so die `worker-src`-Fehlermeldung im `file://`-Kontext.
* `web/src/main.js` kennzeichnet den Fallback im UI als „Datei-Modus (Base64)“, damit sofort sichtbar ist, welcher Speicherpfad aktiv ist.
* README erläutert den neuen Base64-Fallback und listet die angepassten Speicher-Fähigkeiten.

## 🛠️ Patch in 1.40.362
* `web/src/main.js` lädt und speichert ignorierte Ordner-Einträge jetzt asynchron, sodass der Datei-Modus (IndexedDB) die Auswahlen dauerhaft behält.
* README ergänzt den Hinweis, dass der Ordner-Browser ignorierte Dateien dauerhaft merkt.

## 🛠️ Patch in 1.40.361
* `web/src/main.js` markiert Pfad-Zellen nach dem Binden mit einem Datenattribut und registriert den globalen Klick-Listener nur ein einziges Mal, sodass sich keine stetig wachsende Zahl an Handlern ansammelt und die Oberfläche nach langer Laufzeit flott bleibt.
* README beschreibt das behobene Performance-Problem und nennt die neue Schutzlogik für den Dokument-Listener.

## 🛠️ Patch in 1.40.360
* README strukturiert das komplette Feature-Archiv jetzt mit einklappbaren Kapiteln, ergänzt einen Schnellüberblick und erweitert das Inhaltsverzeichnis für eine schnellere Orientierung.

## 🛠️ Patch in 1.40.359
* README verweist jetzt auf den YouTube-Kanal „Half-Life Alyx DE“, damit Interessierte das Übersetzungsprojekt in Aktion verfolgen können.
## 🛠️ Patch in 1.40.358
* `web/src/style.css` erhöht `scroll-padding-top` der Dateitabelle auf die reale Höhe des sticky Tabellenkopfs, damit die erste Zeile vollständig sichtbar bleibt.
* README und Changelog dokumentieren das korrigierte Scroll-Padding des Tabellenkopfs.
## 🛠️ Patch in 1.40.357
* `web/src/main.js` verzichtet auf den ungenutzten Helfer `createDubbing` und lädt im Browser nur noch `downloadDubbingAudio`.
* `web/src/elevenlabs.js` exportiert ausschließlich `downloadDubbingAudio`; das Anlegen neuer Dubbings erfolgt über das Node-Modul `elevenlabs.js`.
* README und Changelog dokumentieren die verschlankte Exportliste ohne Browser-Variante von `createDubbing`.
## 🛠️ Patch in 1.40.356
* `web/renderer.js` fasst das Ermitteln der DOM-Elemente samt Listenern im neuen Helfer `initVideoManager` zusammen, exportiert ihn global und stellt die aktuellen Referenzen über `window.videoManager` bereit.
* `web/src/main.js` öffnet den Video-Manager stets über die gemeinsam genutzten Referenzen, leert das Suchfeld, prüft `dialog.open` und triggert danach direkt `refreshTable()`.
* `web/src/projectSwitch.js` ruft `window.initVideoManager?.()` nach jedem Projektwechsel auf, damit Grid, Filter und Buttons erneut verdrahtet werden.
* README und Changelog dokumentieren den neu initialisierten Video-Manager.
## 🛠️ Patch in 1.40.355
* `web/src/fileUtils.js` entfernt die ungenutzte Konstante `allWords`, damit der Textvergleich ohne überflüssige Zwischenspeicher auskommt.
* README und Changelog dokumentieren die bereinigte Textanalyse.
## 🛠️ Patch in 1.40.354
* `web/src/config.js` exportiert nur noch die fertigen Pfade; der ermittelte Download-Ordnername bleibt intern und entfällt aus der Exportliste.
* README und Changelog vermerken die bereinigte Download-Konfiguration ohne öffentlichen Ordnernamen.
## 🛠️ Patch in 1.40.353
* `launch_hla.py` bündelt die Cheat-Voreinstellungen als Modulkonstante `CHEAT_ARGS`, damit beide Startpfade dieselben Parameter verwenden.
* README und Changelog vermerken die zentrale Konstante für konsistente Cheat-Voreinstellungen.
## 🛠️ Patch in 1.40.352
* `web/src/projectHelpers.js` entfernt den globalen Setter `setStorageAdapter`; Speicherwechsel setzen weiterhin auf `switchStorage` aus `web/src/main.js`.
* README und Changelog dokumentieren, dass globale Speicherwechsel über die vorhandene Funktion erfolgen und kein separater Setter mehr nötig ist.
## 🛠️ Patch in 1.40.351
* `extensionUtils.js` entfernt die Hilfsfunktion `syncProjectData` samt Export und `window`-Alias; übrig bleibt `repairFileExtensions`.
* Testsuite und Dokumentation verweisen nicht länger auf `syncProjectData` und beschreiben den Funktionswegfall.
## 🛠️ Patch in 1.40.350
* `web/src/migrationUI.js` entfernt den UI-Helfer `switchStorageDirection`; Speicherwechsel laufen direkt über die bestehende Funktion `switchStorage`.
* README und Changelog vermerken den Wegfall des Richtungsschalters in der Migration-Oberfläche.
## 🛠️ Patch in 1.40.349
* `web/src/elevenlabs.js` entfernt den ungenutzten Export `isDubReady`; Statusabfragen erfolgen ausschließlich über `web/src/dubbing.js`.
* README und Changelog dokumentieren die verschobene Statusprüfung und die abgespeckte Exportliste.
## 🛠️ Patch in 1.40.348
* `web/src/scoreColumn.js` entfernt den ungenutzten Helfer `applySuggestion`, sodass die Score-Spalte ausschließlich Kommentare präsentiert.
* README und Changelog dokumentieren die bereinigte Score-Spalte ohne automatische Übernahmevorschläge.
## 🛠️ Patch in 1.40.347
* `electron/preload.cjs` entfernt die ehemalige Capture-Bridge und verlässt sich ausschließlich auf die bestehenden Preload-Schnittstellen.
* README und Changelog beschreiben nur noch die tatsächlich genutzte `window.videoApi` für Renderer-Aufrufe.
## 🛠️ Patch in 1.40.346
* `web/src/projectSwitch.js` entfernt `switchStorageSafe`; Speichermodus-Wechsel laufen wieder über den vorhandenen Helfer `switchStorage` in `web/src/main.js`.
* README und Changelog verweisen auf den Standard-Helfer für den Speichermoduswechsel.
## 🛠️ Patch in 1.40.345
* `web/src/gptService.js` entfernt den Export `getEmotionPrompt`; das Emotion-Prompt bleibt ausschließlich intern verfügbar.
* README und Changelog vermerken, dass der Helfer nicht mehr öffentlich angeboten wird.
## 🛠️ Patch in 1.40.344
* `web/src/main.js` entfernt die überholten Helfer `toggleFileCompletion`, `toggleCompletionAll`, `toggleFileSelection` und `toggleSelectAll`, weil der Fertig-Status automatisch anhand der Projektdaten berechnet wird.
* README und Changelog dokumentieren den Wegfall der manuellen Abschluss-Schaltflächen.
## 🛠️ Patch in 1.40.343
* `web/src/main.js` bindet `extractTime` aus `utils/videoFrameUtils.js` ein, damit Video-Zeitstempel überall identisch berechnet werden.
* README und Changelog dokumentieren die gemeinsame Nutzung des YouTube-Helfers.
## 🛠️ Patch in 1.40.342
* `extractRelevantFolder` erwartet nur noch das Ordner-Array; der ungenutzte Parameter für vollständige Pfade wurde entfernt und alle Aufrufe angepasst.
* README und Changelog dokumentieren die verschlankte Signatur für Frontend-Helfer.
## 🛠️ Patch in 1.40.341
* `web/src/main.js` vereinfacht `addFileToProject` auf die Parameter `filename` und `folder`; alle Aufrufe arbeiten ohne das frühere Ergebnisobjekt.
* README und Changelog dokumentieren die neue Funktionssignatur für Entwicklerinnen und Entwickler.
## 🛠️ Patch in 1.40.340
* Video-Manager setzt das Suchfeld beim Öffnen zurück, damit keine alten Filter hängen bleiben.
## 🛠️ Patch in 1.40.339
* `utils/videoFrameUtils.js` entfernt sämtliche Storyboard-Helfer; `extractTime` bleibt als einziger Export.
* README dokumentiert den Wegfall des Storyboard-Fallbacks und die ausschließliche Nutzung von ffmpeg-Vorschaubildern.
## 🛠️ Patch in 1.40.338
* Projektstatistik-Logik liegt jetzt zentral in `web/src/calculateProjectStats.js`, sodass Browser und Node-Tests dieselben Werte berechnen.
* `web/src/main.js` lädt die gemeinsame Funktion und verwendet weiterhin die bestehenden Pfadhelfer.
* Test und HTML binden den neuen Helfer ein, wodurch doppelte Implementierungen entfallen.
## 🛠️ Patch in 1.40.337
* Browser-Modul `web/src/localIndex.js` entfernt die ungenutzte Methode `remove`; der Index wird bei Bedarf vollständig neu aufgebaut.
* README dokumentiert den abgespeckten `LocalIndex` samt Fokus auf `add` und `search`.
## 🛠️ Patch in 1.40.336
* Ungenutztes Node-Modul `utils/dataLayout.js` entfernt; Browser-Storage bleibt als einzige Quelle für Journaling-Helfer.
* Dokumentation passt Datenlayout-Beschreibung und Funktionsliste an den Wegfall der Blob-Verwaltung an.
## 🛠️ Patch in 1.40.335
* Node-Modul `elevenlabs.js` entfernt die Exporte `getDubbingStatus` und `getDefaultVoiceSettings`; Statusprüfungen laufen über `waitForDubbing`.
* Test-Suite bereinigt veraltete Szenarien und Dokumentation listet nur noch die aktiven ElevenLabs-Exporte.
## 🛠️ Patch in 1.40.334
* Browser-Modul `web/src/elevenlabs.js` entfernt `waitForDubbing` und nutzt ausschließlich `isDubReady` für Statusabfragen.
## 🛠️ Patch in 1.40.333
* Telefon-auf-Tisch-Effekt bietet wählbare Raum-Presets wie Wohnzimmer oder Halle.
## 🛠️ Patch in 1.40.332
* Neuer Telefon-auf-Tisch-Effekt simuliert ein abgelegtes Mikrofon.
## 🛠️ Patch in 1.40.331
* Hall-Effekt wird beim Speichern angewendet, auch wenn der Nebenraum-Effekt deaktiviert ist.
## 🛠️ Patch in 1.40.330
* Hall-Effekt des Nebenraum-Dialogs funktioniert nun auch ohne aktivierten Nebenraum-Effekt.
## 🛠️ Patch in 1.40.329
* Nebenraum- und Hall-Effekt lassen sich über eigene Kontrollkästchen unabhängig aktivieren.
## 🛠️ Patch in 1.40.328
* EM-Störgeräusch-Presets können gespeichert und geladen werden.
## 🛠️ Patch in 1.40.327
* Canvas zeigt die EM-Störgeräusch-Hüllkurve und reagiert auf Regleränderungen.
* Info-Icons mit Tooltips erklären alle Parameter des Störgeräuschs.
## 🛠️ Patch in 1.40.326
* EM-Störgeräusch kann das Originalsignal auf Wunsch synchron zu Aussetzern und Knacksern dämpfen.
## 🛠️ Patch in 1.40.325
* EM-Störgeräusch bietet Regler für Knackser- und Spike-Häufigkeit sowie deren Amplituden.
## 🛠️ Patch in 1.40.324
* EM-Störgeräusch besitzt Regler für Aussetzer-Häufigkeit und Aussetzer-Dauer.
## 🛠️ Patch in 1.40.323
* EM-Störgeräusch simuliert nun Aussetzer und Knackser und bietet wählbare Verlaufsformen.
## 🛠️ Patch in 1.40.322
* EM-Störgeräusch bietet einen Regler für den Anstieg der Störintensität.
## 🛠️ Patch in 1.40.321
* Ordner-Browser besitzt einen neuen „Bericht“-Knopf, der globale Ordnerstatistiken in die Zwischenablage kopiert.
## 🛠️ Patch in 1.40.320
* Projekte aus fehlenden Dateien werden automatisch in Pakete zu höchstens 50 Dateien aufgeteilt.
## 🛠️ Patch in 1.40.319
* Texteingaben werden nun ohne Verzögerung sofort gespeichert.
## 🛠️ Patch in 1.40.318
* Ordner-Browser zeigt jetzt Gesamt-, übersetzte und offene Dateien pro Ordner an.
## 🛠️ Patch in 1.40.317
* Projektliste zentriert nach einem Wechsel automatisch das gewählte Projekt.
## 🛠️ Patch in 1.40.316
* Schnellprojekt setzt die Teil-Nummer automatisch auf den nächsten freien Wert.
## 🛠️ Patch in 1.40.315
* Schnellprojekt vergibt nun die nächste freie Projektnummer.
## 🛠️ Patch in 1.40.314
* GPT-Bewertungen und Emotionstexte werden nach dem Einfügen sofort gespeichert.
## 🛠️ Patch in 1.40.313
* Toolbar-Schaltflächen werden nach einem Projektwechsel zuverlässig neu initialisiert.
## 🛠️ Patch in 1.40.312
* Live-Speichern: Änderungen werden nach kurzer Verzögerung automatisch gesichert.
## 🛠️ Patch in 1.40.311
* Live-Suche funktioniert nach Projektwechsel, da `switchProjectSafe` die Event-Listener erneut setzt.
## 🛠️ Patch in 1.40.310
* Navigationsfunktionen sind wieder global verfügbar und der Scroll-Listener wird beim Initialisieren gesetzt, wodurch Vor-/Zurück-Schaltflächen und manuelles Scrollen erneut korrekt arbeiten.
## 🛠️ Patch in 1.40.309
* Toolbar-Knöpfe werden nach einem Projektwechsel erneut gebunden und bleiben dadurch funktionsfähig.
## 🛠️ Patch in 1.40.308
* Beim Projektwechsel startet nun automatisch ein Ordnerscan, sodass Audiodateien unmittelbar verfügbar sind.
## 🛠️ Patch in 1.40.307
* `window.projects` bleibt nun synchron, damit alle Module dieselbe Projektreferenz verwenden.
## 🛠️ Patch in 1.40.306
* Nach einem globalen Reset wird der Klick-Listener der Projektliste neu gesetzt, sodass Projekte wieder anwählbar sind.
## 🛠️ Patch in 1.40.305
* Projektwechsel lädt die Projektliste vor dem Öffnen neu und übergibt `skipSelect=true`, sodass kein Projekt automatisch geladen wird und der Fehler „Projekte konnten nicht geladen werden“ ausbleibt.
## 🛠️ Patch in 1.40.304
* Fehlende Projekt-IDs laden nun einen Platzhalter; der Projektwechsel bricht nicht mehr ab.
## 🛠️ Patch in 1.40.303
* Tests bereinigen nun Timer und Mocks in `saveFormats.test.js`, wodurch Jest sauber beendet wird.
## 🛠️ Patch in 1.40.302
* Projektwechsel bricht nicht mehr ab, wenn das vorherige Projekt fehlt; `reloadProjectList` reindiziert die Projektliste automatisch
## 🛠️ Patch in 1.40.301
* Start und Speichermodus-Wechsel rufen `reloadProjectList` auf und ergänzen fehlende Projekte, bevor eines geöffnet wird.
## 🛠️ Patch in 1.40.300
* Integritätsprüfung ergänzt fehlende Projekte beim Start automatisch.
* LocalStorage-Bereinigung entfernt `hla_projects` nur noch ohne neue Projektschlüssel.
* Fehlermeldung „Projekt nicht gefunden“ erscheint erst nach erfolgloser Reparatur.
## 🛠️ Patch in 1.40.299
* Englische Fehlermeldungen wie "Project not found" werden erkannt und die Projektliste wird erneut geladen.
## 🛠️ Patch in 1.40.298
* Neuer 🎲 Zufallsprojekt-Knopf lädt ein zufälliges Projekt und speichert ein Protokoll als Datei oder in der Zwischenablage.
## 🛠️ Patch in 1.40.297
* Lade-Mechanik komplett überarbeitet; Projekte lassen sich wieder zuverlässig laden.
## 🛠️ Patch in 1.40.296
* Ersetzt `navigator.userAgent` und `navigator.platform` durch `navigator.userAgentData` mit Fallback, um künftige User-Agent-Reduktionen zu unterstützen.
## 🛠️ Patch in 1.40.295
* Bleibt ein Projekt trotz Reparatur unauffindbar, lädt `switchProjectSafe` die Projektliste erneut, um verwaiste Einträge zu entfernen.
## 🛠️ Patch in 1.40.294
* Fehlender `switchProjectSafe` verhindert das Öffnen nicht mehr; Projektkarten greifen auf `selectProject` zurück.
## 🛠️ Patch in 1.40.293
* Projektkarten nutzen jetzt einen delegierten Click-Listener; doppelte `selectProject`-Aufrufe entfallen.
* `repairProjectIntegrity` wartet auf alle Schreibvorgänge und aktualisiert den In-Memory-Projektcache sofort.
## 🛠️ Patch in 1.40.292
* Fehlende Projekte werden vor dem erneuten Laden automatisch repariert; `switchProjectSafe` ruft bei einem Fehler sofort `repairProjectIntegrity` auf.
## 🛠️ Patch in 1.40.291
* Fehlende Projekte führen nur zu einer Warnung; `switchProjectSafe` protokolliert keinen Fehler mehr, wenn ein Projekt endgültig fehlt.
## 🛠️ Patch in 1.40.290
* Fehlende Projekte lösen nun einen erneuten Ladeversuch aus; `switchProjectSafe` lädt dafür die Projektliste neu und startet den Wechsel erneut.
## 🛠️ Patch in 1.40.289
* Projektliste lässt sich neu laden, ohne automatisch ein Projekt zu öffnen; `loadProjects(skipSelect)` verhindert veraltete Projekt-IDs.
## 🛠️ Patch in 1.40.288
* Projektladen verhindert Doppelaufrufe, lädt bei leerer Liste automatisch nach und vergleicht Projekt-IDs als Strings. Fehlende Projekte brechen mit Meldung ab.
## 🛠️ Patch in 1.40.287
* Ergänzt Debug-Logs: `selectProject` protokolliert Start und Ende, `loadProjectData` meldet den Aufruf von `finalize()`.
## 🛠️ Patch in 1.40.286
* Behebt einen Fehler, bei dem nach dem Projektladen keine Elemente mehr klickbar waren.
## 🛠️ Patch in 1.40.285
* Fehlende Projekte werden der Projektliste hinzugefügt und die Liste wird nach der Reparatur neu geladen.
## 🛠️ Patch in 1.40.284
* LocalStorage-Bereinigung lässt das Schema `project:<id>:meta` unangetastet.
## 🛠️ Patch in 1.40.283
* Projektschlüssel im Schema `project:<id>:meta` werden bei der Reparatur korrekt erkannt.
## 🛠️ Patch in 1.40.282
* Fehlende Projekte werden nach der Reparatur automatisch neu geladen.
## 🛠️ Patch in 1.40.281
* Projektladen fängt Speicherfehler ab und zeigt einen Dialog.
## 🛠️ Patch in 1.40.280
* Projektwechsel wartet nun asynchron auf `selectProject`, bevor Folgearbeiten starten.
## 🛠️ Patch in 1.40.279
* GPT-Ergebnisse enthalten eine `projectId` und werden nur im entsprechenden Projekt übernommen.
## 🛠️ Patch in 1.40.278
* Projektwechsel leert zusätzlich die Zeilenreihenfolge, indem `displayOrder` zurückgesetzt wird.
## 🛠️ Patch in 1.40.277
* Projektwechsel sichert Dateien, bevor der GPT-Zustand bereinigt wird.
## 🛠️ Patch in 1.40.276
* GPT-Auswertung vergleicht Datei-IDs nun als Strings, sodass Ganzzahl- und Gleitkomma-IDs korrekt zugeordnet werden.
## 🛠️ Patch in 1.40.275
* Projektkarten nutzen `switchProjectSafe` und `selectProject` löscht vorsorglich den GPT-Zustand.
## 🛠️ Patch in 1.40.274
* Abbrechbare GPT-Bewertungen: Projekt- und Speicherwechsel verwerfen offene GPT-Jobs und protokollieren den Abbruch.
## 🛠️ Patch in 1.40.273
* Projektwechsel bereinigt GPT-Zustände, bricht laufende Bewertungsanfragen ab und entfernt alte Vorschläge.
## 🛠️ Patch in 1.40.272
* Zentrale Helfer wie `pauseAutosave` und `clearInMemoryCachesHard` ermöglichen einen sicheren Projekt- und Speicherwechsel.
## 🛠️ Patch in 1.40.271
* Level-Kontextmenü bietet Export eines Debug-Berichts nur für dieses Level.
## 🛠️ Patch in 1.40.270
* Debug-Fenster ruft `showModal` direkt auf und vermeidet damit den Fehler "ui.showModal ist keine Funktion".
## 🛠️ Patch in 1.40.269
* Debug-Bericht-Knopf öffnet Fenster nun auch ohne Dateisystem-API und kopiert die Daten direkt in die Zwischenablage.
## 🛠️ Patch in 1.40.268
* DevTools- und Debug-Bericht-Knöpfe reagieren wieder auf Klicks.
## 🛠️ Patch in 1.40.267
* DevTools lassen sich wieder per Knopf und F12 öffnen.
* Debug-Fenster zeigt nun Prozesslaufzeit und RAM-Verbrauch an.
## 🛠️ Patch in 1.40.266
* Pro Projekt zuschaltbarer Reste-Modus, der GPT mitteilt, dass Zeilen unabhängig und nicht chronologisch sind.
## 🛠️ Patch in 1.40.265
* Notiz-Hinweis zeigt jetzt auch die Anzahl gleicher Einträge im gesamten Kapitel.
## 🛠️ Patch in 1.40.264
* Ordner-Browser legt beim ersten Knopfdruck das Kapitel "Offene" (Nr. 9999) an und erzeugt darin pro Ordner ein Level mit allen fehlenden Dateien.
## 🛠️ Patch in 1.40.263
* DE- und EN-Wellenform besitzen nun oben und unten kleine Anfasser, sodass Start- und Endpunkte leichter verschoben werden können.
## 🛠️ Patch in 1.40.262
* Zweiter Tempo-Auto-Knopf erhöht das Tempo automatisch, bis die DE-Zeit etwa der EN-Zeit entspricht; der erste setzt nur auf das Minimum.
## 🛠️ Patch in 1.40.261
* DE-Audio-Editor zeigt neben der DE-Zeit nun auch die EN-Originalzeit an.
## 🛠️ Patch in 1.40.260
* Markierte Zeilen erscheinen nun mit leichtem Abstand unter dem Tabellenkopf und bleiben bei jeder Bildschirmauflösung komplett sichtbar.
## 🛠️ Patch in 1.40.259
* Markierungen in EN- und DE-Wellenform aktualisieren sich jetzt live beim Ziehen.
## 🛠️ Patch in 1.40.258
* Optionaler Hall im Nebenraum-Effekt wird in Vorschau und beim Speichern korrekt übernommen.
## 🛠️ Patch in 1.40.257
* Nebenraum-Effekt bietet einen optional zuschaltbaren Hall.
## 🛠️ Patch in 1.40.256
* Ausgewählte Zeile bleibt vollständig sichtbar und wird nicht mehr von der Tabellenüberschrift überdeckt.
## 🛠️ Patch in 1.40.255
* Nebenraum-Effekt wird beim Speichern korrekt angewendet.
## 🛠️ Patch in 1.40.254
* Neuer Nebenraum-Effekt simuliert gedämpfte Stimmen aus dem angrenzenden Raum.
## 🛠️ Patch in 1.40.253
* EN-Text und emotionaler DE-Text werden unter den Wellenformen im DE-Audio-Editor angezeigt.
## 🛠️ Patch in 1.40.252
* Zoom-Funktion per Maus in EN- und DE-Wellenformen des DE-Audio-Editors entfernt.
## 🛠️ Patch in 1.40.251
* Abschnitt „Timing & Bereiche“ im DE-Audio-Editor nutzt jetzt ein zweispaltiges Kartenlayout, das bei schmaler Breite sauber auf eine Spalte umbricht.
## 🛠️ Patch in 1.40.250
* Bereiche in EN- und DE-Wellenformen lassen sich direkt per Ziehen markieren, Start-/End-Felder synchronisieren sich bidirektional und ungültige Eingaben werden markiert.

## 🛠️ Patch in 1.40.249
* Effekt-Toolbar im DE-Audio-Editor bleibt als Sticky-Footer sichtbar und die Buttons besitzen gleiche Breite.
* Speichern ist nun als primärer Button hervorgehoben und Zurücksetzen fragt vor dem Wiederherstellen nach einer Bestätigung.
## 🛠️ Patch in 1.40.248
* Tippfehler im vorherigen Eintrag korrigiert und Versionsabzeichen in der README auf 1.40.248 aktualisiert.
## 🛠️ Patch in 1.40.247
* HTML-Kommentare der Reset-Knöpfe verwenden nun durchgehend den Hinweis „Setzt nur diesen Effekt zurück“.
## 🛠️ Patch in 1.40.246
* Reset-Knöpfe in allen Effektbereichen heißen jetzt einheitlich **⟳ Standardwerte** und das Tooltip erläutert: „Setzt nur diesen Effekt zurück.“
## 🛠️ Patch in 1.40.245
* Score-Zellen zeigen Prozentwerte mit geschütztem Leerzeichen und deutschem Dezimaltrennzeichen an.
## 🛠️ Patch in 1.40.244
* DE-Audio-Editor besitzt nun eine untere Effekt-Toolbar mit schnellen Aktionsknöpfen.

## 🛠️ Patch in 1.40.243
* DE-Audio-Editor nutzt jetzt ein dreispaltiges Layout mit scrollbaren Listen, damit sich Elemente nicht überlappen.
## 🛠️ Patch in 1.40.242
* DE-Audio-Editor stellt Elemente jetzt zweispaltig dar und benötigt kein Scrollen mehr.
## 🛠️ Patch in 1.40.241
* Wörterbuch lädt gespeicherte Einträge wieder korrekt im Datei-Modus.
## 🛠️ Patch in 1.40.240
* Ladebalken beim Projektwechsel blockiert weitere Wechsel, bis das Projekt vollständig geladen ist.

## 🛠️ Patch in 1.40.239
* Sicherer Projekt- und Speicherwechsel verhindert Race-Conditions und repariert verwaiste Einträge.

## 🛠️ Patch in 1.40.238
* Speichermigration leert nach erfolgreichem Kopieren automatisch den alten Speicher.
## 🛠️ Patch in 1.40.237
* Datei-Modus bereinigt beim Start alte LocalStorage-Projekt- und Datei-Schlüssel automatisch.
## 🛠️ Patch in 1.40.236
* Wechsel des Speichersystems löscht jetzt automatisch alte LocalStorage-Daten und setzt den gewählten Modus direkt wieder.
## 🛠️ Patch in 1.40.235
* Debug-Bericht-Export kopiert Daten in die Zwischenablage, wenn das Speichern fehlschlägt.
## 🛠️ Patch in 1.40.234
* Debug-Bericht-Knopf öffnet nun ein Fenster mit einzelnen Berichten und zeigt die Dateigröße in MB an.
## 🛠️ Patch in 1.40.233
* Ordnerauswahl verweigerte Dateisystem-Zugriffe und zeigt nun eine verständliche Fehlermeldung.
## 🛠️ Patch in 1.40.232
* Debug-Bericht-Knopf entfernt nicht serialisierbare Felder und erzeugt wieder getrennte Dateien.
## 🛠️ Patch in 1.40.231
* Debug-Bericht exportiert mehrere getrennte Dateien in einem gewählten Ordner.
## 🛠️ Patch in 1.40.230
* Fehlende Vorschlagsdatei bietet an, einen Debug-Bericht zu speichern.
## 🛠️ Patch in 1.40.229
* Fehlermeldungen bieten an, einen Debug-Bericht mit Umgebung zu speichern.
## 🛠️ Patch in 1.40.228
* Neuer Debug-Bericht-Knopf exportiert den vollständigen Zustand von Projekten, Dateien und Einstellungen als JSON.
## 🛠️ Patch in 1.40.227
* Speichern über File System Access nutzt jetzt temporäre Dateien und ein `journal.json`, um Schreibvorgänge atomar abzuschließen.
## 🛠️ Patch in 1.40.226
* Dateiimport validiert jetzt das Manifest und entfernt fehlende Datei-IDs.
* Filterlogik in `cleanupProject.js` wurde in die Hilfsfunktion `removeUnknownFileIds` ausgelagert.
## 🛠️ Patch in 1.40.225
* Dateiimport fängt Lese- und JSON-Fehler ab und bietet bei Problemen eine Sicherungsdatei an.
## 🛠️ Patch in 1.40.224
* Kontextmenü bietet Projekt-Analyse mit optionaler Reparatur.
## 🛠️ Patch in 1.40.223
* Beim Wechsel des Speichersystems werden alle globalen Caches geleert, sodass keine Datenreste zwischen den Backends verbleiben.
## 🛠️ Patch in 1.40.222
* Virtuelle Listen rendern nur sichtbare Zeilen und laden Daten bei Bedarf.
* Optionaler invertierter Suchindex pro Projekt für schnelle lokale Treffer.
* Speicher-Monitor zeigt belegten Platz und bietet einen „Aufräumen“-Knopf.
* Toolbar kennzeichnet den aktiven Speichermodus deutlicher.
## 🛠️ Patch in 1.40.221
* Speicher-Backends liefern jetzt Feature-Flags über `storage.capabilities`, um fehlendes OPFS zu erkennen.
* `validateProjectManifest` prüft `project.json` gegen ein Zod-Schema.
## 🛠️ Patch in 1.40.220
* Single-Writer-Lock pro Projekt mit BroadcastChannel und Heartbeat im localStorage.
* `storage.runTransaction` bündelt Mehrfach-Schreibvorgänge und verwirft alle bei Fehlern.
## 🛠️ Patch in 1.40.219
* Schreibvorgänge nutzen nun ein Journal und atomare Umbenennungen, um korrupte Dateien zu vermeiden.
* `garbageCollect` räumt nicht referenzierte Blobs aus `.hla_store/objects` auf und unterstützt einen Dry-Run.
* Oberfläche fordert persistenten Speicher an und zeigt die verbleibende Quote an.
## 🛠️ Patch in 1.40.218
* Content-Addressed Storage legt große Dateien unter `.hla_store/objects/<sha256-prefix>/<sha256>` ab und speichert Verweise als `blob://sha256:<hash>`.
* Projektdateien werden kapitelweise als NDJSON in `data/chapters/<id>.ndjson` ausgelagert.
* Schlüssel folgen jetzt einem strikten Schema (`project:<id>:*`, `cache:<typ>:<hash>`), um Kollisionen zu vermeiden.
## 🛠️ Patch in 1.40.217
* Debug-Modus protokolliert jetzt unbehandelte Promise-Ablehnungen und zeigt Datei-, Zeilen- sowie Stack-Informationen an.
## 🛠️ Patch in 1.40.216
* Reitermenü bietet jetzt einen Knopf, der den Ordner des neuen Speichersystems öffnet.
## 🛠️ Patch in 1.40.215
* Dateiliste zeigt jetzt pro Datei, ob der Eintrag im neuen Speichersystem liegt.
## 🛠️ Patch in 1.40.214
* Neue Funktion `visualizeFileStorage` zeigt an, ob ein Eintrag im neuen Speichersystem liegt.
## 🛠️ Patch in 1.40.213
* Wechsel des Speichersystems lädt den gewählten Speicher ohne automatische Migration und setzt interne Daten zurück.
## 🛠️ Patch in 1.40.212
* Wechsel zwischen Speichersystemen zeigt jetzt Ladehinweise an, und die Statusleiste meldet beim Speichern das aktive System.
## 🛠️ Patch in 1.40.211
* JSON-Fehler beim Laden der Level- und Kapitel-Daten behoben; Speicherzugriffe nutzen jetzt `await`.
## 🛠️ Patch in 1.40.210
* Kommentar im Speicher-Adapter bereinigt; Dokumentation betont den Wegfall des Benutzerschlüssels.
## 🛠️ Patch in 1.40.209
* IndexedDB-Backend speichert Daten jetzt unverschlüsselt ohne Benutzerschlüssel.
* `createIndexedDbBackend` benötigt keinen Parameter mehr.
## 🛠️ Patch in 1.40.208
* Anzeige des aktuellen Speichermodus mit direktem Wechsel und Migration.
## 🛠️ Patch in 1.40.207
* Startdialog ermöglicht die Auswahl zwischen LocalStorage und verschlüsseltem System.
* Neues Speichersystem mit Adapter und Datenmigration.
## 🛠️ Patch in 1.40.206
* Speicher-Adapter enthält `migrateStorage`, um Daten zwischen Backends zu kopieren.
* UI-Knopf „Daten migrieren“ überträgt alle Einträge in das neue System.
## 🛠️ Patch in 1.40.205
* Beim Start Auswahl zwischen LocalStorage und neuem System; alle Zugriffe laufen über einen Speicher-Adapter.
## 🛠️ Patch in 1.40.204
* IndexedDB-Backend mit AES-GCM-Verschlüsselung und Auslagerung großer Dateien nach OPFS oder Blob.
## 🛠️ Patch in 1.40.203
* Neuer Speicher-Adapter mit LocalStorage-Backend.
## 🛠️ Patch in 1.40.202
* OPFS-Datei kann über einen neuen UI-Knopf geladen und in den LocalStorage importiert werden.
## 🛠️ Patch in 1.40.201
* `exportLocalStorageToFile` sichert LocalStorage-Einträge ohne sie zu löschen; der alte Name `migrateLocalStorageToFile` bleibt als Alias erhalten.
## 🛠️ Patch in 1.40.200
* Migration speichert bei verweigertem Dateizugriff automatisch im internen Browser-Speicher (OPFS).
## 🛠️ Patch in 1.40.199
* Migration zeigt bei verweigertem Dateizugriff eine verständliche Fehlermeldung an.
## 🛠️ Patch in 1.40.198
* Migration fängt fehlende File-System-API ab und zeigt eine verständliche Fehlermeldung an.
## 🛠️ Patch in 1.40.197
* Migration zeigt alte und neue Eintragsanzahl und speichert die Daten in einen gewählten Ordner.
## 🛠️ Patch in 1.40.196
* UI-Knopf „Migration starten“ exportiert alle LocalStorage-Einträge in eine Datei und zeigt Statusmeldungen an.
## 🛠️ Patch in 1.40.195
* Projektdaten lassen sich per File System Access API als JSON speichern und wieder laden.
* `migrateLocalStorageToFile` exportiert bestehende LocalStorage-Daten in das neue Dateiformat.
## 🛠️ Patch in 1.40.194
* Neuer globaler Knopf durchsucht alle Dateien ohne deutschen Text und übernimmt eindeutige Untertitel automatisch.
## 🛠️ Patch in 1.40.193
* `cleanupProject.js` entfernt unbekannte Datei-IDs aus Projekten oder protokolliert sie als Fehler.
## 🛠️ Patch in 1.40.192
* Vorschlagsfelder prüfen nun die zugehörige Datei, entfernen ungültige Einträge aus der Tabelle und zeigen eine Fehlermeldung an.
## 🛠️ Patch in 1.40.191
* Kann ein Projekt nicht geladen werden, erscheint ein Fenster mit genauer Ursache und Reparaturhinweis.
## 🛠️ Patch in 1.40.190
* Beim Laden eines Projekts führen Vorschlagsfelder ohne zugehörige Datei nicht mehr zu einem Fehler
## 🛠️ Patch in 1.40.189
* 📊‑Symbol neben jedem Level zeigt die Notizen dieses Levels samt Gesamtanzahl im Projekt.
## 🛠️ Patch in 1.40.188
* Gleichlautende Notizen werden farbig hervorgehoben und zeigen die Anzahl identischer Einträge.
## 🛠️ Patch in 1.40.187
* Pro Datei kann jetzt eine individuelle Notiz unter dem Ordnernamen gespeichert werden.
## 🛠️ Patch in 1.40.186
* "Emotionen kopieren" bietet Checkboxen, um Zeit und/oder `---` anzufügen.
## 🛠️ Patch in 1.40.185
* Beim Hochladen einer DE-Audiodatei wird der Tempo-Faktor nun zuverlässig auf 1,0 gesetzt.
## 🛠️ Patch in 1.40.184
* `translate_text.py` installiert fehlendes `argostranslate` automatisch und weist bei DLL-Problemen auf das VC++‑Laufzeitpaket hin.
## 🛠️ Patch in 1.40.183
* Automatische Übersetzung zeigt den konkreten Fehltext nun in einem Hinweis an.
## 🛠️ Patch in 1.40.182
* `start_tool.py` nutzt jetzt die Python-Suchroutine von `verify_environment.py` und startet sich bei Bedarf mit einer unterstuetzten Version neu.
* README beschreibt die gemeinsame automatische Wahl einer passenden Python-Version.
## 🛠️ Patch in 1.40.181
* `start_tool.py` bricht bei Python 3.13 oder neuer mit einem Hinweis ab.
* README erwaehnt den Abbruch von `start_tool.py` bei zu neuer Python-Version.
## 🛠️ Patch in 1.40.180
* `verify_environment.py` sucht bei Python 3.13 oder neuer automatisch eine unterstuetzte Installation und startet sich gegebenenfalls neu.
* README beschreibt die automatische Wahl einer passenden Python-Version.
## 🛠️ Patch in 1.40.179
* `verify_environment.py` verweigert Python 3.13 oder neuer mit einem klaren Hinweis.
* README betont, dass nur Python 3.9–3.12 unterstuetzt wird.
## 🛠️ Patch in 1.40.178
* `start_tool.py` prüft fehlende Python-Module durch Import und installiert sie bei Bedarf neu.
* `reset_repo.py` installiert jetzt automatisch alle Python-Abhängigkeiten aus `requirements.txt`.
## 🛠️ Patch in 1.40.177
* Fehlgeschlagene automatische Übersetzungen werden nach einem Neustart beim ersten Projektaufruf einmalig erneut versucht.
* Rechtsklick auf den grauen Übersetzungstext bietet Optionen zum erneuten Übersetzen einzelner oder aller Zeilen.
## 🛠️ Patch in 1.40.176
* `translate_text.py` fängt fehlende Abhängigkeiten wie PyTorch ab und gibt einen klaren Hinweis aus.
## 🛠️ Patch in 1.40.175
* Fehlermeldungen der automatischen Übersetzung werden nun an die Oberfläche weitergegeben und als Hinweis angezeigt.
## 🛠️ Patch in 1.40.174
* `selectRow` blockiert `updateNumberFromScroll` während des automatischen Scrollens.
## 🛠️ Patch in 1.40.173
* Dateitabelle scrollt nur, wenn keine neue Zeile zur Auswahl ansteht oder nach dem Selektieren der neuen Zeile.
## 🛠️ Patch in 1.40.172
* Zeilenauswahl scrollt die markierte Zeile vollständig unter den Tabellenkopf.
## 🛠️ Patch in 1.40.171
* DE-Editor: Kopieren-Knopf überträgt markierten EN-Ausschnitt zuverlässig.
* Start- und Endpunkte des EN-Bereichs lassen sich direkt auf der Welle verschieben; die Eingabefelder aktualisieren sich automatisch.
## 🛠️ Patch in 1.40.170
* `start_tool.py` sucht bei mehreren Python-Installationen automatisch eine passende Version und startet sich gegebenenfalls neu.
## 🛠️ Patch in 1.40.169
* DE-Editor: Auswahlfelder und Einfügeposition werden nach dem Schließen zurückgesetzt.
* Alt+Ziehen zum Markieren funktioniert zuverlässiger.
## 🛠️ Patch in 1.40.168
* DE-Editor: EN-Ausschnitte lassen sich per Alt+Ziehen im Original markieren. Ein Pfeil zwischen beiden Wellen kopiert den markierten Bereich an Anfang, Ende oder an die Cursor-Position der DE-Datei.
## 🛠️ Patch in 1.40.167
* Neuer Effekt für elektromagnetische Störgeräusche mit regelbarer Stärke.
* Störgeräusch-Effekt wird wie Funkgerät- und Hall-Effekt beim Upload oder Dubbing zurückgesetzt.
## 🛠️ Patch in 1.40.166
* Neue Dateien werden nach dem Einfügen automatisch markiert.
## 🛠️ Patch in 1.40.165
* `verify_environment.py` prüft jetzt auch Paketversionen für Python und Node, repariert Abweichungen automatisch und wartet am Ende auf eine Eingabe.
## 🛠️ Patch in 1.40.164
* `reset_repo.py` richtet fehlendes `npm` über `corepack` automatisch ein.
## 🛠️ Patch in 1.40.163
* `start_tool.py` erkennt fehlendes `npm` und zeigt einen Hinweis auf `corepack enable` statt mit `FileNotFoundError` zu abbrechen.
## 🛠️ Patch in 1.40.162
* `fetchJson` bricht Netzwerkabfragen nach fünf Sekunden mit verständlicher Fehlermeldung ab und beendet den Prozess.
## 🛠️ Patch in 1.40.161
* `chooseExisting` prüft jetzt leere Namenslisten und wirft bei Bedarf einen Fehler.
* Kommentar von `copyDubbedFile` nutzt korrekte JSDoc-Syntax.
## 🛠️ Patch in 1.40.160
* Python-Skripte setzen jetzt auf `subprocess.run` mit `check=True` ohne `shell=True`.
* `needs_npm_ci` und `write_npm_hash` verwenden `with`-Blöcke und schließen Dateien automatisch.
## 🛠️ Patch in 1.40.159
* Offline-Übersetzung meldet fehlende Sprachpakete nun verständlich und beendet sich mit Status 1.
## 🛠️ Patch in 1.40.158
* `settingsStore` nutzt jetzt einen zufälligen IV pro Speicherung und leitet den Schlüssel aus `HLA_ENC_KEY` ab.
## 🛠️ Patch in 1.40.157
* Schnellstart-Dropdown bietet jetzt Checkboxen für Godmode, unendliche Munition und die Entwicklerkonsole. Das Spiel startet erst nach Klick auf „Starten“ mit den gewählten Optionen.
## 🛠️ Patch in 1.40.156
* Schnellstart-Knöpfe mit Cheat-Presets (Godmode, unendliche Munition, Kombination oder nur Entwicklerkonsole) hinzugefügt.
## ✨ Neue Features in 1.40.0
* GitHub-Workflow `node-test.yml` führt automatisch `npm ci` und `npm test` für Node 18–22 bei jedem Push und Pull Request aus.

## 🛠️ Patch in 1.40.1
* Abhängigkeit `glob` auf Version `^9.0.0` aktualisiert.
## 🛠️ Patch in 1.40.2
* `updateVersion.js` aktualisiert jetzt zusätzlich `electron/package.json`.
## 🛠️ Patch in 1.40.3
* Pfad zur Konfiguration wird in der Desktop-Version nun dynamisch ermittelt.
## 🛠️ Patch in 1.40.4
* Preload-Skript fängt nun unbehandelte Fehler ab und meldet "erfolgreich geladen".
* Renderer prüft die Verfügbarkeit der Electron-API über `window.electronAPI`.
## 🛠️ Patch in 1.40.5
* Manuell heruntergeladene Dateien werden nun auch nach einem Neustart automatisch erkannt und importiert.
## 🛠️ Patch in 1.40.6
* `validateCsv` kommt jetzt mit Zeilenumbrüchen in Übersetzungen zurecht.
## 🛠️ Patch in 1.40.7
* Der fertige Dubbing-Status wird jetzt dauerhaft im Projekt gespeichert.
## 🛠️ Patch in 1.40.8
* Verschieben heruntergeladener Dateien klappt nun auch über Laufwerksgrenzen hinweg.
## 🛠️ Patch in 1.40.9
* Level-Dialog zeigt die letzten fünf gewählten Farben zur schnellen Auswahl.
## 🛠️ Patch in 1.40.10
* Kapitel-Liste sortiert sich in der Projekt-Ansicht sofort korrekt.
## 🛠️ Patch in 1.40.11
* Kapitel-Auswahllisten sind jetzt nach der Kapitelnummer sortiert.
## 🛠️ Patch in 1.40.12
* Level-Auswahlliste in den Projekt-Einstellungen folgt nun der Level-Nummer.
## 🛠️ Patch in 1.40.13
* Offline-Übersetzung erkennt installierte Sprachpakete jetzt korrekt.
## 🛠️ Patch in 1.40.14
* Halbautomatisch importierte Dateien werden korrekt nach `web/sounds/DE` verschoben.
## 🛠️ Patch in 1.40.15
* Importierte Dateien erzeugen sofort einen History-Eintrag und gelten als fertig.
## 🛠️ Patch in 1.40.16
* `validateCsv` erhält nun Anführungszeichen, sodass Kommata in Übersetzungen keinen Fehler mehr auslösen.
## 🛠️ Patch in 1.40.17
* Dateiwächter findet nun auch Dateien mit leicht verändertem Namen und gibt bei fehlender Zuordnung eine Warnung aus.
## 🛠️ Patch in 1.40.18
* Halbautomatisch heruntergeladene Dateien wandern jetzt in den dynamisch erkannten Sounds-Ordner.
## 🛠️ Patch in 1.40.19
* Korrigiert die Ordnerstruktur beim halbautomatischen Import: Der "sounds"-Unterordner wird nun korrekt angelegt.
## 🛠️ Patch in 1.40.20
* Neuer Button setzt die Funk-Effektparameter auf Standardwerte zurück.
## 🛠️ Patch in 1.40.21
* Typdefinitionen für die IPC-Kommunikation ergänzen `ipcContracts.ts`.
## 🛠️ Patch in 1.40.22
* Entfernt die ungenutzte Datei `web/src/watcher.js`.
## 🛠️ Patch in 1.40.23
* Entfernt die Startskripte `start_tool.js` und `start_tool.bat`. `start_tool.py` bleibt als einzige Einstiegsmöglichkeit erhalten.
## 🛠️ Patch in 1.40.24
* MP3-Encoding entfernt: `bufferToMp3` und die Abhängigkeit `lamejs` wurden gestrichen.
## 🛠️ Patch in 1.40.25
* Die Untertitel-Suche bewertet nur noch ganze Wörter, wodurch keine falschen 100-%-Treffer mehr erscheinen.
## 🛠️ Patch in 1.40.26
* Die Content Security Policy lässt nun Bilder von `i.ytimg.com` zu, damit der YouTube-Player ohne Fehlermeldung startet.
## 🛠️ Patch in 1.40.27
* Problem behoben, bei dem der YouTube-Player nach erneutem Öffnen den `videoPlayerFrame` nicht fand.
## 🛠️ Patch in 1.40.28
* Der YouTube-Player bleibt sichtbar, wenn man dasselbe Video erneut auswählt.
## 🛠️ Patch in 1.40.29
* Neues Skript `verify_environment.py` prüft Python-, Node- und npm-Version und meldet fehlende Pakete.
## 🛠️ Patch in 1.40.30
* `verify_environment.py` gibt nun alle Prüfungen mit Häkchen aus und warnt bei fehlenden Dateien oder lokalen Änderungen.
## 🛠️ Patch in 1.40.31
* ResizeObserver im Video-Manager reagiert nur noch einmal pro Frame und vermeidet so "loop limit exceeded"-Fehler.
## 🛠️ Patch in 1.40.32
* Neues Wörterbuch speichert englische Begriffe mit deutscher Lautschrift.
## 🛠️ Patch in 1.40.33
* Ein kleines 📝 zeigt in der Tabelle an, wenn der DE-Text einen Eintrag aus dem Wörterbuch enthält.
## 🛠️ Patch in 1.40.34
* Dateiwächter wartet auf stabile Dateigröße und löscht nur noch die importierte Datei.
## 🛠️ Patch in 1.40.35
* Der Dateiwächter importiert Dateien jetzt nur automatisch, wenn eine passende Dubbing-ID vorhanden ist. Unbekannte Dateien öffnen stattdessen den manuellen Import-Dialog.
## 🛠️ Patch in 1.40.36
* Fehler behoben: Beim Einfügen von GPT-Ergebnissen erschien teilweise "applyEvaluationResults is not a function".
## 🛠️ Patch in 1.40.37
* "Emotionen kopieren" zeigt nun vor jedem Eintrag die Laufzeit der EN-Datei an, z.B. `[8,57sec]`.
## 🛠️ Patch in 1.40.38
* Neuer Button „Anpassen-Kürzen“ unter dem Emotional-Text passt den Inhalt automatisch an die Länge der EN-Datei an.
## 🛠️ Patch in 1.40.39
* Der Erklärungstext nach "Anpassen-Kürzen" nennt jetzt, wie der Text gekürzt wurde und verweist auf die Länge der EN-Datei.
## 🛠️ Patch in 1.40.108
* Preset-Verwaltung für den Funkgeräte-Effekt. Einstellungen lassen sich speichern und löschen.
## 🛠️ Patch in 1.40.109
* Speichern eines Funkgeräte-Presets öffnet nun einen eigenen Dialog, da `prompt()` in Electron nicht unterstützt wird.
## 🛠️ Patch in 1.40.110
* Der 📋-Knopf unter dem Emotional-Text kopiert jetzt zusätzlich die Laufzeit der EN-Datei im Format `[8,57sec]`.
## 🛠️ Patch in 1.40.111
* Hall-Effekt wird beim Dubbing jetzt ebenfalls zurückgesetzt.
## 🛠️ Patch in 1.40.112
* Neues Skript `update_repo.py` aktualisiert das Repository und zeigt die eingespielten Commits an.
## 🛠️ Patch in 1.40.113
* Beim Speichern leert der DE-Editor nun automatisch die Ignorier-Liste. Automatisch erkannte Pausen landen damit nicht mehr im Projekt.
## 🛠️ Patch in 1.40.114
* Neuer Puffer-Knopf verschiebt alle Ignorier-Bereiche in 50-ms-Schritten nach innen oder außen.
## 🛠️ Patch in 1.40.115
* Alt-Drag fügt nun Stille-Bereiche ein, um Audios zeitlich zu verschieben.
## 🛠️ Patch in 1.40.116
* Uploads ersetzen nun die Sicherungsdatei in `DE-Backup`, sodass "Zurücksetzen" die zuletzt geladene Version wiederherstellt.
## 🛠️ Patch in 1.40.117
* Beim Speichern wird die Sicherung nicht mehr überschrieben, damit stets die ursprünglich hochgeladene Datei wiederhergestellt werden kann.
## 🛠️ Patch in 1.40.118
* Fehler behoben: Die Projekt-Wiedergabe hält jetzt immer die Positionsreihenfolge ein.
## 🛠️ Patch in 1.40.119
* Sortierung bleibt bei der Projekt-Wiedergabe unverändert, dadurch werden keine Zeilen mehr übersprungen.
## 🛠️ Patch in 1.40.120
* Vor der Projekt-Wiedergabe wird die Reihenfolge der Dateien geprüft und bei Bedarf korrigiert.
## 🛠️ Patch in 1.40.121
* Wiedergabeliste zeigt während der Projekt-Wiedergabe alle Dateinamen in korrekter Reihenfolge an.
## 🛠️ Patch in 1.40.122
* Wiedergabeliste zeigt nun die Positionsnummern statt fortlaufender Zählung.
## 🛠 Patch in 1.40.123
* Wiedergabeliste zeigt nun zusätzliche Pfadinformationen zu jeder Datei.
## 🛠 Patch in 1.40.124
* Wiedergabeliste prüft jede Datei und zeigt Icons für Existenz, Abspielstatus und korrekte Reihenfolge.
## 🛠 Patch in 1.40.125
* Wiedergabeliste erzeugt nun ein Protokoll der erwarteten und der tatsächlichen Abspielreihenfolge.
## 🛠 Patch in 1.40.126
* Beim Kürzen eines Emotional-Texts darf die Übersetzung nun leicht verändert werden, um sehr kurze EN-Zeilen besser abzudecken.
## 🛠 Patch in 1.40.127
* DE-Audio-Editor mit verbesserten Buttons und erläuternden Tooltips.
## 🛠 Patch in 1.40.128
* Tabelle vereint EN- und DE-Spalte sowie alle Aktionen in zwei übersichtlichen Feldern.
## 🛠 Patch in 1.40.129
* Spaltenbreiten korrigiert: Ordnertext überlappt nicht mehr und Aktions-Symbole sind gruppiert.
## 🛠 Patch in 1.40.130
* Aktions-Symbole besitzen nun Tooltips mit kurzen Erklärungen.
## 🛠 Patch in 1.40.131
* Versions- und Score-Spalte sind nun schmaler: Überschrift und Werte werden untereinander dargestellt.
## 🛠 Patch in 1.40.132
* Neue Aktionsleiste mit runden Symbolknöpfen, die alle Funktionen übersichtlich in Zeilen gruppiert.
## 🛠 Patch in 1.40.133
* Einheitliche Icon-Größen, dunkler Hintergrund und klare Abstände machen die Aktionsspalte übersichtlicher.
## 🛠 Patch in 1.40.134
* Dezente Trennlinien strukturieren die Aktionszeile in Upload-, Dubbing-, Bearbeitungs- und Löschbereich.
## 🛠 Patch in 1.40.135
* Zusätzliche Kommentare im Code erläutern den kompakten Tabellenaufbau und die vertikal gruppierten Aktionen.
## 🛠 Patch in 1.40.136
* Jede Aktionsgruppe steckt nun in einem eigenen Block mit Abstand; der Löschknopf ist deutlich nach unten versetzt.
## 🛠 Patch in 1.40.137
* Aktionsknöpfe besitzen nun abgerundete Ecken und passen optisch zu den anderen Buttons.
## 🛠 Patch in 1.40.138
* Beim Hochladen einer DE-Audiodatei wird der Tempo-Faktor wieder auf 1,0 gesetzt.
## 🛠 Patch in 1.40.139
* Beim Kürzen eines Emotional-Texts bleiben abgebrochene Sätze und Fülllaute aus dem Original erhalten.
## 🛠 Patch in 1.40.140
* ZIP-Import ersetzt nun ebenfalls die Sicherungsdatei in `DE-Backup`, sodass der "Zurücksetzen"-Knopf die importierte Version wiederherstellt.
## 🛠 Patch in 1.40.141
* Entfernt die komplette OCR-Funktion samt `easyocr`-Abhängigkeiten.
## 🛠 Patch in 1.40.142
* Neuer Button "Verbessern" unter dem Emotional-Text zeigt drei alternative Übersetzungen mit Begründung an.
## 🛠 Patch in 1.40.143
* "Verbessern" berücksichtigt nun den gesamten Kontext, zeigt eine Ladeanimation am Knopf und der Dialog besitzt ein überarbeitetes Layout.
## 🛠 Patch in 1.40.144
* Anpassen-Kürzen sorgt nun dafür, dass die deutsche Variante die Länge der EN-Aufnahme nie unterschreitet.
## 🛠 Patch in 1.40.145
* ZIP-Import setzt den Tempo-Regler jeder importierten Zeile wieder auf 1,0.
## 🛠 Patch in 1.40.146
* Button "Verbesserungsvorschläge" öffnet einen Dialog mit drei Alternativen, die Länge und Sprechzeit des englischen Originals berücksichtigen.
## 🛠 Patch in 1.40.147
* ▲/▼-Knöpfe neben ▶/⏹ springen zur nächsten oder vorherigen Nummer und merken die letzte Position.
## 🛠 Patch in 1.40.148
* Beim Scrollen bleibt die aktuelle Zeile am Tabellenkopf fixiert und wird dezent hervorgehoben.
## 🛠 Patch in 1.40.149
* Debug-Konsole ist nun standardmäßig ausgeblendet und erscheint nur bei Entwickleraktionen.
## 🛠 Patch in 1.40.150
* ▲/▼-Knöpfe zentrieren die gewählte Zeile nun in der Tabellenmitte.
## 🛠 Patch in 1.40.151
* Schnelle Klicks auf den ▼-Knopf springen nun zuverlässig zur nächsten Nummer, ohne wieder hochzuspringen.
## 🛠 Patch in 1.40.152
* ▲/▼-Knöpfe richten die gewählte Zeile jetzt an der Bildschirmmitte aus. Beim Scrollen mit dem Mausrad wird automatisch die Zeile in der Mitte des Monitors markiert, ohne den Scrollpunkt zu verändern.
## 🛠 Patch in 1.40.153
* Ein-Nummer-Zurück/Vor zeigt Nummer, Dateiname und Ordner stets vollständig unter dem Tabellenkopf an.
## 🛠 Patch in 1.40.154
* Längen-Vergleich zeigt nun zusätzlich, ob die bearbeitete deutsche Datei länger, kürzer oder gleich lang wie das englische Original ist.
## 🛠 Patch in 1.40.155
* Tempo-Regler besitzt jetzt kleine ➖/➕-Knöpfe und einen zweiten Auto-Knopf zum Zurücksetzen auf den gespeicherten Wert.
## 🛠 Patch in 1.40.156
* Letzte OCR-Reste entfernt: `ocrApi` im Preload und der zugehörige IPC-Handler wurden gestrichen.
## ✨ Neue Features in 1.38.0
* Neues Skript `check_environment.js` prueft Node-Version, installiert Abhaengigkeiten und startet einen Electron-Testlauf.

## 🛠️ Patch in 1.38.1
* Start-Skripte nutzen nun `git reset --hard HEAD`, da `web/sounds` und `web/backups` durch `.gitignore` geschuetzt sind.

## 🛠️ Patch in 1.38.2
* Start-Skripte pruefen nach `npm ci`, ob das Electron-Modul vorhanden ist. Fehlt es, wird `npm install electron` ausgefuehrt. Scheitert auch dieser Versuch, bricht das Skript mit einem Fehler ab.

## 🛠️ Patch in 1.38.3
* `start_tool.bat` prueft nun die installierte Node-Version und verlangt Node 18 bis 22.

## 🛠️ Patch in 1.38.6
* Debug-Fenster zeigt nun ausfuehrliche System- und Pfadinformationen sowie die letzten Zeilen aus `setup.log`.

## 🛠️ Patch in 1.38.7
* Debug-Fenster meldet jetzt, ob das Programm mit Administratorrechten gestartet wurde.

## 🛠️ Patch in 1.38.8
* Debug-Fenster zeigt nun die App-, Node-, Electron- und Chrome-Version an.

## ✨ Neue Features in 1.39.0
* Neues Skript `reset_repo.py` setzt das Repository per Doppelklick zurueck und holt Updates.

Alle wesentlichen Änderungen des Projekts. Die jeweils aktuelle Version steht an erster Stelle.

## 🛠️ Patch in 1.37.6
* Start-Skripte verwenden nun `npm ci` anstelle von `npm install`.

## 🛠️ Patch in 1.37.5
* Nach einem erfolgreichen `npm install` im `electron`-Ordner pruefen die Start-Skripte, ob das Electron-Modul fehlt und installieren es gegebenenfalls nach.

## 🛠️ Patch in 1.37.4
* Node 22 wird jetzt unterstuetzt. `start_tool.py` und `start_tool.js` akzeptieren diese Version.

## 🛠️ Patch in 1.37.3
* `package.json` verlangt jetzt Node 18–21.

## 🛠️ Patch in 1.37.2
* `start_tool.py` und `start_tool.js` pruefen die installierte Node-Version und erwarten Node 18–21.

## 🛠️ Patch in 1.37.1
* `start_tool.py` erkennt nun automatisch, ob es im Repository oder davor gestartet wurde.

## 🛠️ Patch in 1.37.0
* Debug-Fenster zeigt nun weitere Systeminformationen wie Fenster- und Bildschirmgröße sowie den Sandbox-Status.

## 🛠️ Patch in 1.36.12
* Start-Skripte protokollieren UID und melden den Sandbox-Modus von Electron.

## 🛠️ Patch in 1.36.11
* Fehlermeldungen beim Starten der Anwendung werden verständlich angezeigt und im Log festgehalten.

## 🛠️ Patch in 1.36.10
* Python-Startskript hält das Fenster offen, damit Fehlermeldungen sichtbar bleiben.

## 🛠️ Patch in 1.36.9
* Debug-Fenster zeigt zusätzliche Browser- und Prozessinformationen.

## 🛠️ Patch in 1.36.8
* Electron startet jetzt garantiert mit aktivierter `contextIsolation`.

## 🛠️ Patch in 1.36.7
* Debug-Fenster besitzt nun einen Kopierknopf.

## 🛠️ Patch in 1.36.6
* Fehlende Electron-API wird im Debug-Fenster erklärt.

## 🛠️ Patch in 1.36.5
* Debug-Button zeigt nun Pfad-Informationen an.

## 🛠️ Patch in 1.36.4
* Start-Skripte löschen automatisch Dateien, die nicht mehr im Repository vorhanden sind. `web/sounds` und `web/backups` bleiben erhalten.

## 🛠️ Patch in 1.36.3
* Desktop-Version erkennt nun `web/Sounds` und `web/Backups`

## 🛠️ Patch in 1.36.2
* Start-Skripte bewahren nun auch `web/backups/` bei `git reset`

## 🛠️ Patch in 1.36.1
* `.gitignore` ignoriert nun `web/sounds/`, `web/backups/` und `web/Download/`

## 🛠️ Strukturänderung in 1.36.0
* Web-Dateien befinden sich nun im Ordner `web/`

## 🛠️ Verbesserung in 1.35.7
* `.env.example` als Vorlage für `.env.local`

## 🛠️ Aufräumarbeiten in 1.35.5

* Überflüssige TypeScript-Dateien entfernt

## ✨ Neue Features in 1.35.0

* Backup-Dateien lassen sich im Browser hochladen und sofort wiederherstellen

## 🛠️ Bugfix in 1.35.1

* DevTools-Button wird wieder dauerhaft angezeigt

## 🛠️ Verbesserung in 1.35.2

* Dev-Button öffnet nun zusätzlich die Debug-Konsole

## 🛠️ Bugfix in 1.35.3

* Browser-Version erkennt den Ordner `sounds` jetzt automatisch

## 🛠️ Verbesserung in 1.35.4

* Dev-Button zeigt nun JavaScript-Fehler im Debug-Bereich an


## ✨ Neue Features in 1.34.0

* Neue Spalte "Dub-Status" mit farbigen Punkten
* Klick auf gelben Punkt öffnet erneut das Studio

## ✨ Neue Features in 1.34.1

* Pfade basieren nun auf `path.resolve(projectRoot, 'sounds/DE', …)`
* Fehlermeldung bei `dubbing_not_found` ersetzt durch "Spur manuell generieren oder Beta freischalten"
* Nach dem Verschieben wird die Datei im Download-Ordner entfernt

## ✨ Neue Features in 1.34.2

* Fehlendes `chokidar`-Modul in der Desktop-Version ergänzt

## ✨ Neue Features in 1.34.3

* Start-Skripte installieren automatisch die Haupt-Abhängigkeiten

## ✨ Neue Features in 1.34.4

* Backup-Ordner lässt sich jetzt auch im Browser öffnen
* Fallback auf Standardordner `sounds`, falls kein Directory Picker vorhanden ist

## 🛠️ Bugfix in 1.34.5

* Backups aus dem alten Ordner `backups` werden wieder erkannt

## 🛠️ Bugfix in 1.34.6

* DevTools-Button wird im Browser ausgeblendet

## ✨ Neue Features in 1.33.0

* Ordnerüberwachung für manuell heruntergeladene Audios

## ✨ Neue Features in 1.31.0

* Neuer Ordner `Download` für manuelle Audios
* Konstante `DL_WATCH_PATH` sorgt beim Start für die Ordner-Erstellung

## ✨ Neue Features in 1.32.0

* Automatischer Download über die Resource-API (Beta)

## ✨ Neue Features in 1.30.0

* Fehler-Toast bei fehlgeschlagenem Dubbing
* Automatische Status-Prüfung alle 60 s
* Gewählte Stimme im Dubbing-Dialog sichtbar

## ✨ Neue Features in 1.29.0

* Neues Protokoll-Menü listet alle API-Aufrufe mit Zeitstempel und Statuscode

## ✨ Neue Features in 1.28.0

* Farbige Status-Punkte zeigen den Fortschritt jedes Dubbings direkt in der Tabelle

## ✨ Neue Features in 1.27.0

* Neue Spalte mit "Download DE"-Button in der Datei-Tabelle

## ✨ Neue Features in 1.26.0

* Öffnet nach dem Starten des Dubbings automatisch das ElevenLabs Studio
* Neues Overlay hält den Vorgang an, bis der Benutzer "OK" klickt

## ✨ Neue Features in 1.25.0

* API-Modul nutzt ausschließlich `/dubbing/{id}`
* `renderLanguage` und Studio-Endpunkte entfernt

## ✨ Neue Features in 1.24.0

* Halb-manueller Studio-Workflow ohne `renderLanguage`
* Neue Funktion `isDubReady` prüft den Status eines Dubbings

## ✨ Neue Features in 1.23.1

* `renderLanguage` und `waitForDubbing` verwenden nun `/dubbing/resource/...`.

## ✨ Neue Features in 1.23.0

* Ausführlicheres Logging aller API-Aufrufe

## ✨ Neue Features in 1.22.13

* Changelog ausgelagert in eigene Datei.

## ✨ Neue Features in 1.22.12

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Dokumentation** | Neuer Abschnitt "E2E-Test" beschreibt den kompletten Testablauf. |

## ✨ Neue Features in 1.22.11

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Workflow** | Nach `createDubbing` wird automatisch `renderLanguage('de')`, `waitForDubbing(id, 'de')` und `downloadDubbingAudio(id, 'de')` ausgeführt. |

## ✨ Neue Features in 1.22.10

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Bugfix** | `waitForDubbing` berücksichtigt jetzt den übergebenen `targetLang`-Parameter. |

## ✨ Neue Features in 1.22.8

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **API** | Neue Funktion `renderLanguage` rendert eine Sprache mit gewünschtem Format. |

## ✨ Neue Features in 1.22.7

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Deutsches Dubbing** | `target_lang` und `target_languages` sind nun immer `de`. |

## ✨ Neue Features in 1.22.6

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Konfiguration** | `.env.example` als Vorlage für `.env.local` nutzen. |

## ✨ Neue Features in 1.22.5

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Deutsches Dubbing** | `disable_voice_cloning` wird gesetzt, wenn keine Voice-ID gewählt ist. |

## ✨ Neue Features in 1.22.4

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **Cache-Fix** | Session-Daten werden nun im Ordner `.hla_translation_tool/SessionData` gespeichert, um Cache-Fehler unter Windows zu verhindern. |

## ✨ Neue Features in 1.22.3

| Kategorie | Beschreibung |
| ---------- | ------------- |
| **ElevenLabs-Fix** | Stabileres Polling bis `status="complete"` und bis zu 10 Download-Versuche. |
| **Dokumentation** | Anleitung gegen 404-Fehler beim Dubbing ergänzt. |

## ✨ Neue Features in 1.22.2

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Browser-Dubbing**        | Neue Datei `src/elevenlabs.js` stellt die Dubbing-Funktionen im Browser bereit. |

## ✨ Neue Features in 1.22.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **CLI-Update**             | `cliRedownload.js` akzeptiert jetzt optional einen Sprachparameter. |

## ✨ Neue Features in 1.21.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ---------------------------------------------- |
| **Gemeinsame Funktion**    | `waitForDubbing` liegt jetzt in `elevenlabs.js` und wird überall genutzt. |

## ✨ Neue Features in 1.20.3

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Polling vereinfacht**    | `waitForDubbing` prüft nur noch `status` und ignoriert `progress`. |

## ✨ Neue Features in 1.20.2

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Fehler-Protokoll**       | Detaillierte Meldungen aus `detail.message` und `error` werden angezeigt. |

## ✨ Neue Features in 1.20.1

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Konstante API**          | Alle API-Aufrufe nutzen nun die zentrale Variable `API`. |


## ✨ Neue Features in 1.19.4

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Neue Funktion**        | StartDubbing akzeptiert jetzt eine frei wählbare Sprache. |

## ✨ Neue Features in 1.19.2

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Bugfix**                | Verwendet nur noch `/v1/dubbing`-Endpunkte und behebt `no_dubbing_api_access`. |

## ✨ Neue Features in 1.19.1

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Fehlerbehebung**        | API-Aufruf übergibt jetzt `segments` und `languages`. |

## ✨ Neue Features in 1.19.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Studio-Workflow**        | Entfernt: Ab 1.19.2 genügt `POST/GET /v1/dubbing` zum Dubben. |

## ✨ Neue Features in 1.18.8

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Besseres Fehlerlogging** | Hinweis bei `dubbing_not_found` im Download. |

## ✨ Neue Features in 1.18.7

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Frisches Dubbing-Log** | Log wird bei jedem Start automatisch geleert. |

## ✨ Neue Features in 1.18.6

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Versionsplatzhalter** | HTML und JavaScript nutzen nun `1.18.6` statt fester Zahlen. |
| **Update-Skript** | `npm run update-version` ersetzt alle Platzhalter automatisch. |
| **cliRedownload.js** | Neues Node-Skript lädt eine vorhandene Dub-Datei erneut herunter. |
| **CSV prüfen** | `validateCsv()` stellt sicher, dass die CSV korrekt aufgebaut ist. |
| **Fehlerprotokoll** | Bei fehlgeschlagenen Git-, Node- oder npm-Aufrufen wird nun der genaue Fehler in `setup.log` gespeichert. |
| **Fehlerdetails** | `detail.message` aus der API-Antwort wird separat geloggt. |
| **Sekundenformat** | `createDubbingCSV()` nutzt nun Sekundenwerte statt `HH:MM:SS.mmm`. |

## ✨ Neue Features in 1.16.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Log löschen** | Neuer Button im Dubbing-Protokoll leert das Log bei Bedarf. |

## ✨ Neue Features in 1.15.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Zeilenende wählbar** | Neues Dropdown im Backup-Dialog legt LF oder CRLF fest. |

## ✨ Neue Features in 1.14.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **CSV-Ausschnitt bei Fehler** | Upload schlägt mit Status 400 fehl? Im Dubbing-Protokoll erscheinen nun die ersten 200 Zeichen der CSV. |

## ✨ Neue Features in 1.12.7

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **HH:MM:SS Zeitformat**   | `createDubbingCSV()` liefert Start- und Endzeiten nun als `HH:MM:SS.mmm`. |
|                           | Ab Version 1.18.6 werden wieder Sekundenwerte genutzt. |

## ✨ Neue Features in 1.12.6

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Retry-Download**        | Nach einem Fehler wird der Audiodownload bis zu drei Mal wiederholt. |

## ✨ Neue Features in 1.12.5

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Komplette Antwort**     | POST-Antwort im Dubbing-Protokoll inklusive `target_languages`. |

## ✨ Neue Features in 1.12.4

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **CSV-Header**            | `createDubbingCSV()` fügt nun eine Kopfzeile ein. |
| **Neuer Test**            | `manualDub.test.js` kontrolliert den CSV-Inhalt. |
| **GET-Test**              | `elevenlabs.test.js` simulierte `getDubbingStatus` (seit 1.40.335 entfernt). |

## ✨ Neue Features in 1.11.0

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Schneller Dialog**      | Dubbing-Einstellungsfenster öffnet sich nun sofort. |
| **Manual Dub**            | Eigener DE-Text wird zusammen mit Start- und Endzeiten \*als CSV\* an die API geschickt. |
## ✨ Neue Features in 1.10.3

|  Kategorie                 |  Beschreibung |
| -------------------------- | ----------------------------------------------- |
| **Voice-Settings**        | Dubbing-Einstellungen werden im Browser gespeichert, lassen sich per `getDefaultVoiceSettings` zurücksetzen und zeigen jetzt ein Einstellungsfenster vor dem Start (Node-Export entfiel in 1.40.335). |

## ✨ Neue Features in 1.8.0

|  Kategorie                 |  Beschreibung
| -------------------------- | ------------------------------------------------- |
| **API-Menü**            | Einstellungsdialog jetzt mit Kategorien, Dropdowns und Live-Validierung des Keys. |
| **Alle zurücksetzen**   | Ein Klick leert sämtliche Voice-IDs. |
| **Voice-IDs testen**    | Prüft alle gewählten Stimmen auf Erreichbarkeit. |
| **API-Key testen**      | Getrennter Button prüft den Key und färbt sich grün bei Erfolg. |
| **Sichtbarer API-Key**  | Augen-Button zeigt/versteckt den eingegebenen Schlüssel. |
| **Eigene IDs**          | Neue Voice-IDs können über einen Dialog hinzugefügt werden. |
| **Fortschrittsanzeige** | Projektübergreifender Fortschritt mit Farbkennzeichnung im Dashboard. |
| **Automatische Version** | Versionsnummer wird nun bei jedem Build aktualisiert. |
| **Stimmenverwaltung**  | Benutzerdefinierte IDs umbenennen, löschen und Name abrufen. |
| **CSP-Fix**          | API-Tests im Browser funktionieren jetzt dank angepasster Content Security Policy. |
| **Fehlende Ordner**  | Neues Tool sucht in der Datenbank nach Ordnern ohne Dateien und bietet deren Löschung an. |
| **Ordnerliste**      | Zweite Liste zeigt alle Ordner mit Pfad aus der Datenbank. |
| **Bereinigung**      | API-Menü und Ordner-Browser verwenden jetzt dieselbe Liste. |
| **Dubbing-Knopf**    | Automatische Vertonung jeder Datei per ElevenLabs. |
| **Dubbing-Protokoll**| Neues Fenster zeigt jeden Schritt beim Dubbing an und bleibt offen, bis es manuell geschlossen wird. |
| **Dubbing-Einstellungen** | Vor dem Start lassen sich Stabilität, Tempo und mehr anpassen. |
---
### 1.8.0 - Automatische Versionsverwaltung

**✨ Neue Features:**
* Versionsnummer wird nun automatisch aus `package.json` in HTML und JS eingetragen.

### 3.22.0 - Dubbing-Feinjustierung

**✨ Neue Features:**
* Dialog fragt vor dem Vertonen nach Stabilität, Ähnlichkeit, Stil, Geschwindigkeit und Speaker-Boost.

### 3.21.1 - Ordnerlisten bereinigt

**🛠️ Bugfix:**
* API-Menü zeigt jetzt nur Ordner aus der Datenbank an.
* Verwaiste Ordner-Anpassungen werden automatisch entfernt.

### 3.21.0 - Fehlende Ordner

**✨ Neue Features:**
* Benutzerdefinierte Stimmen lassen sich jetzt bearbeiten und löschen.
* Voice-Namen können per API abgerufen werden.
* Test-Button für den API-Key mit grüner Erfolgsanzeige.
* Fehler beim "Neue Stimme"-Knopf behoben; neuer Dialog zum Hinzufügen.
* Neues Tool listet fehlende Ordner auf und erlaubt deren Löschung.
* Zusätzlich zeigt eine zweite Liste alle Ordner mit Pfad aus der Datenbank an.

### 3.15.0 - Überarbeitetes API-Menü

**✨ Neue Features:**
* Gruppierte Voice-IDs, Dropdown-Auswahl und Key-Prüfung.

### 3.13.3 - GPU-Cache-Fehler behoben

**🛠️ Bugfix:**
* Fehlerhafte GPU-Cache-Erstellung führte zu Fehlermeldungen; der Shader-Cache wird nun deaktiviert.

### 3.13.2 - Verbesserte Backup-Funktion

**✨ Neue Features:**
* Backups enthalten nun Level-Farben, Reihenfolgen, Icons, ignorierte Dateien, Auto-Backup-Einstellungen und den API-Key.

### 3.13.1 - Ordnerübergreifende Voice-IDs

**✨ Neue Features:**
* API-Dialog listet jetzt alle Ordner aus der Datenbank.

### 3.13.0 - API-Menü & Voice-IDs

**✨ Neue Features:**
* **ElevenLabs-Dubbing**: Audiodateien lassen sich jetzt direkt per API vertonen.
* **API-Menü**: API-Key eingeben und Stimmen für Ordner hinterlegen.

### 3.11.0 - Icon-Auswahl & Haken-Fix

**✨ Neue Features:**
* **Icon-Auswahl**: Im Level-Dialog steht nun eine Liste gängiger Icons zur Verfügung.
* **Haken unter dem Icon**: Der grüne Fertig-Haken wird unter dem Icon angezeigt.

### 3.10.0 - Gemeinsame Projekt-Icons

**✨ Neue Features:**
* **Gemeinsame Icons**: Projekte eines Levels verwenden automatisch das Icon des Levels.
* **Haken-Layout**: Der grüne Fertig-Haken verdeckt das Icon nicht mehr.

### 3.7.1 - Level‑Nummern-Fix

**✨ Neue Features:**
* **Level-Reihenfolge sichtbar**: Dropdowns und Level-Kopfzeilen zeigen jetzt die zugehörige Zahl, z.B. `1.Levelname`.
* **Level-Nummern bis 9999**: Reihenfolge und Teil-Nummern akzeptieren vierstellige Werte.

### 3.6.0 - Level‑Management & Datenbank‑Tools

**✨ Neue Features:**
* **Level‑System:** Projekte erhalten Level‑Name + Teil‑Nummer
* **Projekt‑Meta‑Leiste:** Anzeige von Projekt • Level • Teil mit Kopier‑Button
* **Globale Text‑Statistik:** EN / DE / BEIDE / ∑ Kachel mit Live‑Update
* **Level‑Statistik‑Panel:** Aufklappbare Übersicht pro Level
* **Dateien‑Ignorieren:** 🚫 Ignorieren / ↩ Wieder aufnehmen Toggle
* **Pfad‑Anzeige:** Debug‑Info für jeden Ordner‑Browser‑Eintrag
* **Datenbank‑Bereinigung:** Korrigiert falsche Ordnernamen automatisch
* **Ordner‑Löschfunktion:** Sichere Entfernung ganzer Ordner

**🔧 Verbesserungen:**
* **Auto‑Cleanup:** Fehlende Dateien ohne Texte werden entfernt
* **UI‑Polish:** Schließen‑Button (×) oben rechts, grüne Rahmen für 100%
* **Dark‑Theme:** Optimierte Kontraste und Animationen

### 3.5.0 - Global Completion Tracking

**✨ Neue Features:**
* **Projekt‑übergreifende Verfolgung:** Globale Completion‑Statistiken
* **Grüne Rahmen:** Vollständig übersetzte Ordner und Projekte
* **Datei‑Markierungen:** Übersetzungsstatus pro Datei sichtbar
* **Erweiterte Ordner‑Stats:** Detaillierte Fortschritts‑Prozentsätze

### 3.4.0 - Enhanced User Experience

**✨ Neue Features:**
* **Copy‑Buttons:** Direkte Kopierfunktion neben Textfeldern
* **Context‑Menu:** Rechtsklick für erweiterte Optionen
* **Keyboard‑Navigation:** Vollständige Tastatur‑Unterstützung
* **Auto‑Height Textboxen:** Synchronisierte Höhen für EN/DE

### 3.3.0 - Smart Import & Search

**✨ Neue Features:**
* **Intelligenter Import:** Automatische Spalten‑Erkennung
* **Ähnlichkeitssuche:** Normalisierte Suche mit Scoring
* **Multi‑Ordner‑Auswahl:** Lösung für mehrdeutige Dateien

### 3.2.0 - Audio & Visual Enhancements

**✨ Neue Features:**
* **Audio‑System:** Vollständig im Browser, Auto‑Scan‑Integration
* **Projekt‑Anpassung:** Icons und Farben für Projekte
* **Ordner‑Anpassung:** Icons und Farben für Ordner
* **Responsive Design:** Optimiert für verschiedene Bildschirmgrößen

### 3.1.0 - Advanced Management

**✨ Neue Features:**
* **Ordner‑Browser:** Visuelles Durchsuchen der Audio‑Datenbank
* **Fortschritts‑Tracking:** Completion‑Status und Statistiken
* **Drag & Drop:** Sortierung von Projekten und Dateien
* **Auto‑Save:** Kontinuierliche Speicherung

### 3.0.0 - Foundation Release

**✨ Neue Features:**
* **Multi‑Projekt‑Support:** Verwaltung mehrerer Übersetzungsprojekte
* **Intelligenter Ordner‑Scan:** Automatische Audio‑Datei‑Erkennung
* **Text‑Datenbank:** Globale Speicherung aller Übersetzungen
* **Import:** Wiki‑Tabellen
* **Offline‑Fähigkeit:** Vollständig lokale Web‑App

---
