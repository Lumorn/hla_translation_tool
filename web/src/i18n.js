// Zentrales i18n-Modul mit Sprachressourcen und Helfern
(function() {
    const resources = {
        de: {
            'app.title': 'Half-Life: Alyx Translation Tool',
            'loading.project': 'Projekt wird geladen...',
            'loading.retry': 'Erneut versuchen',
            'sidebar.projects': '🎮 Projekte',
            'project.add': '+ Neues Projekt',
            'tab.project': 'Projekt',
            'tab.tools': 'Werkzeuge',
            'tab.media': 'Medien',
            'tab.system': 'System',
            'tab.search': 'Suche & Verlauf',
            'toolbar.project.title': 'Projekt',
            'toolbar.tools.title': 'Werkzeuge',
            'toolbar.media.title': 'Medien',
            'toolbar.system.title': 'System',
            'toolbar.search.title': 'Suche & Verlauf',
            'button.import': '📥 Import',
            'button.ccImport': '🎬 Untertitel',
            'button.folder': '📁 Ordner',
            'label.addFiles': 'Dateien hinzufügen',
            'placeholder.addFiles': 'Dateinamen eingeben (einer pro Zeile)...',
            'button.addFiles': 'Hinzufügen',
            'button.gptScore': 'Bewerten (GPT)',
            'button.randomProject': '🎲 Zufall',
            'button.wordList': '📚 Wörter',
            'button.generateEmotions': 'Emotionen (DE)',
            'button.sendElevenLabs': 'An ElevenLabs schicken',
            'button.assignAudio': '🔊 Audio-Datei zuordnen',
            'button.importZip': 'ZIP importieren',
            'button.copyAssistant': 'Kopierhilfe',
            'button.copyAssistant2': 'Kopierhilfe 2',
            // Übersetzungen für die Kopierhilfe inkl. Platzhalter
            'copyAssistant.status.complete': 'Kopierassistent abgeschlossen',
            'copyAssistant.progress.files': 'Datei {current} von {total}',
            'copyAssistant.progress.steps': 'Schritt {current} / {total}',
            'button.copyEmotions': 'Emotionen kopieren',
            'button.subtitleSearchAll': 'UT-Suche alles',
            'button.dubbingLog': '📝 Protokoll',
            'button.devTools': '🐞 DevTools',
            'button.debugReport': '📋 Debug-Bericht',
            'settings.title': '⚙️ Einstellungen',
            'settings.cleanupDuplicates': '🧹 Duplikate bereinigen',
            'settings.audioDuplicates': '🎵 Audio-Duplikate',
            'settings.backup': '💾 Backup',
            'settings.elevenLabs': '🔊 ElevenLabs API',
            'settings.gpt': '💬 ChatGPT API',
            'settings.resetDb': '🔄 Reset DB',
            'settings.cleanupProjects': '🔄 Projekte bereinigen',
            'settings.repairFolders': '🔧 Ordner reparieren',
            'settings.language': '🌐 Sprache',
            'toolbar.media.videos': '🎬 Videos',
            'label.mode': 'Spiel',
            'label.workshop': 'Workshop',
            'label.mapToggle': '+map',
            'placeholder.level': 'Level',
            'button.start': 'Starten',
            'option.godmode': 'Godmode',
            'option.ammo': 'Unendliche Munition',
            'option.console': 'Entwicklerkonsole',
            'system.menu': 'Verwaltung',
            'system.migration.title': 'Migration',
            'system.migration.start': 'Migration starten',
            'system.migration.load': 'Migration laden',
            'system.migration.process': 'Daten migrieren',
            'system.storage.title': 'Speicher',
            'system.storage.switch': 'Wechseln',
            'system.storage.folder': '📂 Speicherordner',
            'system.storage.cleanup': 'Aufräumen',
            'storage.dialog.title': 'Speichermodus wählen',
            'storage.dialog.description': 'Bitte Speichersystem auswählen:',
            'storage.dialog.local': 'LocalStorage',
            'storage.dialog.indexed': 'Neues System',
            'storage.mode.local': 'LocalStorage',
            'storage.mode.file': 'Datei-Modus',
            'storage.mode.fileOpfs': 'Datei-Modus (OPFS)',
            'storage.mode.fileBase64': 'Datei-Modus (Base64)',
            'storage.switch.toLocal': 'Wechsel zu LocalStorage',
            'storage.switch.toFile': 'Wechsel zu Datei-Modus',
            'storage.switch.loading': 'Lade {mode}...',
            'storage.switch.toast': 'Wechsle zu {mode} (ohne Kopieren der Daten)',
            'storage.switch.loaded': '{mode} geladen',
            'storage.switch.now': 'Jetzt im {mode}',
            'storage.persist.denied': 'Persistenter Speicher wurde nicht gewährt',
            'storage.persist.granted': 'Lokaler Speicher gesichert, verfügbar: {free} MB',
            'storage.visualize.indexedOnly': '„{key}“ liegt im neuen Speichersystem.',
            'storage.visualize.localOnly': '„{key}“ liegt noch im LocalStorage.',
            'storage.visualize.both': '„{key}“ existiert in beiden Speichersystemen.',
            'storage.visualize.none': '„{key}“ wurde in keinem Speichersystem gefunden.',
            'storage.folder.unavailable': 'Pfad zum neuen Speichersystem ist nicht verfügbar',
            'storage.usage.label': '{used} MB von {quota} MB',
            'storage.cleanup.last': 'Zuletzt bereinigt am {date}',
            'storage.cleanup.never': 'Noch nie bereinigt',
            'storage.cleanup.toast': 'Speicher bereinigt',
            'search.placeholder': 'Live-Suche: Dateiname oder Text... (Groß-/Kleinschreibung, Punkte ignoriert)',
            'search.copy.remainder': 'Reste-Modus',
            'search.copy.time': 'Zeit voranstellen',
            'search.copy.dashes': '--- anhängen',
            'search.copy.speed': '„extrem schnell reden“ ergänzen',
            'search.sort': 'Sortierung:',
            'search.sort.position': 'Position',
            'search.sort.filename': 'Dateiname',
            'search.sort.folder': 'Ordner',
            'search.sort.completion': 'Fertig',
            'progress.total': '0% vollständig',
            'progress.folders': '0 Ordner',
            'progress.global': '0% gesamt',
            'empty.title': 'Keine Dateien im Projekt',
            'empty.hint': 'Füge Dateien über die Suche oder das Eingabefeld hinzu.',
            'empty.tips': '💡 Tipps:<br>• Doppelklick auf Zeilennummern (#) um Position zu ändern<br>• Tab/Shift+Tab für Navigation zwischen Textfeldern<br>• Rechtsklick für Kontext-Menü<br>• Leertaste für Audio-Wiedergabe (wenn Zeile ausgewählt)',
            'levelStats.empty': 'Noch keine Level eingetragen.',
            'levelStats.header.level': 'Level',
            'levelStats.header.parts': 'Teile',
            'levelStats.header.languages': 'EN / DE / BEIDE / ∑',
            'levelStats.header.completion': 'Fertig-%',
            'table.header.number': '#',
            'table.header.filename': 'Dateiname',
            'table.header.folder': 'Ordner',
            'table.header.storage': 'Speicher',
            'table.header.version': 'Version\nScore',
            'table.header.text': 'EN/DE Text',
            'table.header.search': 'UT-Suche',
            'table.header.path': 'Pfad',
            'table.header.length': 'Länge',
            'table.header.actions': 'Aktionen',
            'status.ready': 'Bereit',
            'status.unsaved': 'Ungespeicherte Änderungen',
            'status.savedKeyword': 'gespeichert',
            'status.saved.append': '(im {mode})',
            'status.files': '0 Dateien',
            'status.selected': '0 ausgewählt',
            'status.folder': 'sounds',
            'status.access': '📂 Keine Auswahl',
            'context.play': 'Audio abspielen',
            'context.copyEn': 'EN Text kopieren',
            'context.copyDe': 'DE Text kopieren',
            'context.pasteEn': 'In EN Text einfügen',
            'context.pasteDe': 'In DE Text einfügen',
            'context.uploadDe': 'DE-Datei hochladen',
            'context.history': 'Historie',
            'context.openFolder': 'In Ordner-Browser öffnen',
            'context.delete': 'Datei löschen',
            'dubbing.saved.empty': 'Keine Dubbing-Parameter gespeichert',
            'dubbing.saved.none': 'Keine gespeichert',
            'dubbing.param.entry': '{label}: {value}',
            'dubbing.param.stability': 'Stabilität',
            'dubbing.param.similarityBoost': 'Similarity Boost',
            'dubbing.param.style': 'Stil',
            'dubbing.param.speed': 'Geschwindigkeit',
            'dubbing.param.speakerBoost': 'Speaker-Boost',
            'dubbing.label.stability': 'Stabilität',
            'dubbing.label.similarityBoost': 'Similarity Boost',
            'dubbing.label.style': 'Stil',
            'dubbing.label.speed': 'Geschwindigkeit',
            'dubbing.label.speakerBoost': 'Speaker-Boost',
            'dubbing.emo.completeStatus': 'Emo-Download abgeschlossen',
            'dubbing.emo.logComplete': 'Fertig.',
            'emo.error.missingGptKey': 'GPT-Key fehlt',
            'emo.generate.button.label': 'Emotionen generieren',
            'emo.generate.button.start': 'Generiere...',
            'emo.generate.button.progress': 'Generiere... ({done}/{total})',
            'emo.generate.status.complete': 'Fertig ({done}/{total})',
            'emo.progress.placeholder': '🟣 ...',
            'emo.progress.counter': '🟣 {current}/{total}',
            'emo.progress.done': '🟣 fertig',
            'emo.status.updated': 'Emotional-Texte aktualisiert ({count})',
            'auto.trans.line': 'Übersetzung für diese Zeile',
            'auto.trans.all': 'Übersetzung für alle Zeilen',
            'project.menu.edit': 'Projekt bearbeiten',
            'project.menu.analyze': 'Projekt analysieren',
            'project.menu.delete': 'Projekt löschen',
            'loading.scan': 'Scanne Dateien...',
            'loading.translate': 'Übersetze...',
            'loading.subtitle': 'Suche Untertitel...',
            'meta.level': '| Level:',
            'meta.part': '| Teil:',
            'language.label': 'Sprache',
            'language.german': 'Deutsch',
            'language.english': 'Englisch',
            'project.tooltip.level': 'Level: {level}',
            'project.tooltip.part': 'Teil: {part}',
            'project.tooltip.label.level': 'Level',
            'project.tooltip.label.part': 'Teil',
            'project.tooltip.label.en': 'EN',
            'project.tooltip.label.de': 'DE',
            'project.tooltip.label.deAudio': 'DE-Audio',
            'project.tooltip.label.complete': 'Fertig',
            'project.tooltip.label.gpt': 'GPT',
            'project.tooltip.label.files': 'Dateien',
            'project.tooltip.line.progress': '• EN: {enPercent}%  • DE: {dePercent}%',
            'project.tooltip.line.audio': '• DE-Audio: {deAudioPercent}%  • Fertig: {completedPercent}%{done}',
            'project.tooltip.line.gptFiles': '• GPT: {score}  • Dateien: {files}',
            'project.tooltip.done': ' ✅'
        },
        en: {
            'app.title': 'Half-Life: Alyx Translation Tool',
            'loading.project': 'Loading project...',
            'loading.retry': 'Retry',
            'sidebar.projects': '🎮 Projects',
            'project.add': '+ New Project',
            'tab.project': 'Project',
            'tab.tools': 'Tools',
            'tab.media': 'Media',
            'tab.system': 'System',
            'tab.search': 'Search & History',
            'toolbar.project.title': 'Project',
            'toolbar.tools.title': 'Tools',
            'toolbar.media.title': 'Media',
            'toolbar.system.title': 'System',
            'toolbar.search.title': 'Search & History',
            'button.import': '📥 Import',
            'button.ccImport': '🎬 Subtitles',
            'button.folder': '📁 Folder',
            'label.addFiles': 'Add files',
            'placeholder.addFiles': 'Enter filenames (one per line)...',
            'button.addFiles': 'Add',
            'button.gptScore': 'Score (GPT)',
            'button.randomProject': '🎲 Random',
            'button.wordList': '📚 Words',
            'button.generateEmotions': 'Emotions (DE)',
            'button.sendElevenLabs': 'Send to ElevenLabs',
            'button.assignAudio': '🔊 Assign audio file',
            'button.importZip': 'Import ZIP',
            'button.copyAssistant': 'Copy helper',
            'button.copyAssistant2': 'Copy helper 2',
            // Copy assistant translations with placeholders
            'copyAssistant.status.complete': 'Copy assistant completed',
            'copyAssistant.progress.files': 'File {current} of {total}',
            'copyAssistant.progress.steps': 'Step {current} / {total}',
            'button.copyEmotions': 'Copy emotions',
            'button.subtitleSearchAll': 'Subtitle search all',
            'button.dubbingLog': '📝 Log',
            'button.devTools': '🐞 DevTools',
            'button.debugReport': '📋 Debug report',
            'settings.title': '⚙️ Settings',
            'settings.cleanupDuplicates': '🧹 Remove duplicates',
            'settings.audioDuplicates': '🎵 Audio duplicates',
            'settings.backup': '💾 Backup',
            'settings.elevenLabs': '🔊 ElevenLabs API',
            'settings.gpt': '💬 ChatGPT API',
            'settings.resetDb': '🔄 Reset DB',
            'settings.cleanupProjects': '🔄 Clean projects',
            'settings.repairFolders': '🔧 Repair folders',
            'settings.language': '🌐 Language',
            'toolbar.media.videos': '🎬 Videos',
            'label.mode': 'Game',
            'label.workshop': 'Workshop',
            'label.mapToggle': '+map',
            'placeholder.level': 'Level',
            'button.start': 'Start',
            'option.godmode': 'Godmode',
            'option.ammo': 'Infinite ammo',
            'option.console': 'Developer console',
            'system.menu': 'Administration',
            'system.migration.title': 'Migration',
            'system.migration.start': 'Start migration',
            'system.migration.load': 'Load migration',
            'system.migration.process': 'Migrate data',
            'system.storage.title': 'Storage',
            'system.storage.switch': 'Switch',
            'system.storage.folder': '📂 Storage folder',
            'system.storage.cleanup': 'Clean up',
            'storage.dialog.title': 'Choose storage mode',
            'storage.dialog.description': 'Please select a storage system:',
            'storage.dialog.local': 'LocalStorage',
            'storage.dialog.indexed': 'New system',
            'storage.mode.local': 'LocalStorage',
            'storage.mode.file': 'File mode',
            'storage.mode.fileOpfs': 'File mode (OPFS)',
            'storage.mode.fileBase64': 'File mode (Base64)',
            'storage.switch.toLocal': 'Switch to LocalStorage',
            'storage.switch.toFile': 'Switch to file mode',
            'storage.switch.loading': 'Loading {mode}...',
            'storage.switch.toast': 'Switching to {mode} (without copying data)',
            'storage.switch.loaded': '{mode} loaded',
            'storage.switch.now': 'Now using {mode}',
            'storage.persist.denied': 'Persistent storage was not granted',
            'storage.persist.granted': 'Local storage secured, available: {free} MB',
            'storage.visualize.indexedOnly': '“{key}” lives in the new storage system.',
            'storage.visualize.localOnly': '“{key}” is still in LocalStorage.',
            'storage.visualize.both': '“{key}” exists in both storage systems.',
            'storage.visualize.none': '“{key}” was not found in any storage system.',
            'storage.folder.unavailable': 'Path to the new storage system is unavailable',
            'storage.usage.label': '{used} MB of {quota} MB',
            'storage.cleanup.last': 'Last cleaned on {date}',
            'storage.cleanup.never': 'Never cleaned',
            'storage.cleanup.toast': 'Storage cleaned',
            'search.placeholder': 'Live search: filename or text... (case-insensitive, dots ignored)',
            'search.copy.remainder': 'Remainder mode',
            'search.copy.time': 'Prefix time',
            'search.copy.dashes': 'Append ---',
            'search.copy.speed': 'Add “extremely fast speech”',
            'search.sort': 'Sort:',
            'search.sort.position': 'Position',
            'search.sort.filename': 'Filename',
            'search.sort.folder': 'Folder',
            'search.sort.completion': 'Done',
            'progress.total': '0% complete',
            'progress.folders': '0 folders',
            'progress.global': '0% overall',
            'empty.title': 'No files in project',
            'empty.hint': 'Add files via search or the input field.',
            'empty.tips': '💡 Tips:<br>• Double-click row numbers (#) to change position<br>• Tab/Shift+Tab to navigate between fields<br>• Right-click for context menu<br>• Spacebar for audio playback (when a row is selected)',
            'levelStats.empty': 'No levels added yet.',
            'levelStats.header.level': 'Level',
            'levelStats.header.parts': 'Parts',
            'levelStats.header.languages': 'EN / DE / BOTH / ∑',
            'levelStats.header.completion': 'Done-%',
            'table.header.number': '#',
            'table.header.filename': 'Filename',
            'table.header.folder': 'Folder',
            'table.header.storage': 'Storage',
            'table.header.version': 'Version\nScore',
            'table.header.text': 'EN/DE text',
            'table.header.search': 'Subtitle search',
            'table.header.path': 'Path',
            'table.header.length': 'Length',
            'table.header.actions': 'Actions',
            'status.ready': 'Ready',
            'status.unsaved': 'Unsaved changes',
            'status.savedKeyword': 'saved',
            'status.saved.append': '(in {mode})',
            'status.files': '0 files',
            'status.selected': '0 selected',
            'status.folder': 'sounds',
            'status.access': '📂 No selection',
            'context.play': 'Play audio',
            'context.copyEn': 'Copy EN text',
            'context.copyDe': 'Copy DE text',
            'context.pasteEn': 'Paste into EN text',
            'context.pasteDe': 'Paste into DE text',
            'context.uploadDe': 'Upload DE file',
            'context.history': 'History',
            'context.openFolder': 'Open in folder browser',
            'context.delete': 'Delete file',
            'dubbing.saved.empty': 'No dubbing parameters stored yet',
            'dubbing.saved.none': 'None saved',
            'dubbing.param.entry': '{label}: {value}',
            'dubbing.param.stability': 'Stability',
            'dubbing.param.similarityBoost': 'Similarity Boost',
            'dubbing.param.style': 'Style',
            'dubbing.param.speed': 'Speed',
            'dubbing.param.speakerBoost': 'Speaker boost',
            'dubbing.label.stability': 'Stability',
            'dubbing.label.similarityBoost': 'Similarity Boost',
            'dubbing.label.style': 'Style',
            'dubbing.label.speed': 'Speed',
            'dubbing.label.speakerBoost': 'Speaker boost',
            'dubbing.emo.completeStatus': 'Emo download complete',
            'dubbing.emo.logComplete': 'Done.',
            'emo.error.missingGptKey': 'GPT key missing',
            'emo.generate.button.label': 'Generate emotions',
            'emo.generate.button.start': 'Generating...',
            'emo.generate.button.progress': 'Generating... ({done}/{total})',
            'emo.generate.status.complete': 'Done ({done}/{total})',
            'emo.progress.placeholder': '🟣 ...',
            'emo.progress.counter': '🟣 {current}/{total}',
            'emo.progress.done': '🟣 done',
            'emo.status.updated': 'Emotional texts updated ({count})',
            'auto.trans.line': 'Translate this line',
            'auto.trans.all': 'Translate all lines',
            'project.menu.edit': 'Edit project',
            'project.menu.analyze': 'Analyze project',
            'project.menu.delete': 'Delete project',
            'loading.scan': 'Scanning files...',
            'loading.translate': 'Translating...',
            'loading.subtitle': 'Searching subtitles...',
            'meta.level': '| Level:',
            'meta.part': '| Part:',
            'language.label': 'Language',
            'language.german': 'German',
            'language.english': 'English',
            'project.tooltip.level': 'Level: {level}',
            'project.tooltip.part': 'Part: {part}',
            'project.tooltip.label.level': 'Level',
            'project.tooltip.label.part': 'Part',
            'project.tooltip.label.en': 'EN',
            'project.tooltip.label.de': 'DE',
            'project.tooltip.label.deAudio': 'DE audio',
            'project.tooltip.label.complete': 'Done',
            'project.tooltip.label.gpt': 'GPT',
            'project.tooltip.label.files': 'Files',
            'project.tooltip.line.progress': '• EN: {enPercent}%  • DE: {dePercent}%',
            'project.tooltip.line.audio': '• DE audio: {deAudioPercent}%  • Done: {completedPercent}%{done}',
            'project.tooltip.line.gptFiles': '• GPT: {score}  • Files: {files}',
            'project.tooltip.done': ' ✅'
        }
    };

    const defaultLanguage = 'de';
    const registeredTargets = [];
    const listeners = [];
    let currentLanguage = defaultLanguage;

    function getActiveStorage() {
        return window.storage || window.localStorage;
    }

    function getStoredLanguage() {
        const storage = getActiveStorage();
        const stored = storage && storage.getItem('hla_language');
        return stored && resources[stored] ? stored : null;
    }

    function persistLanguage(lang) {
        const storage = getActiveStorage();
        try {
            storage && storage.setItem('hla_language', lang);
        } catch (err) {
            console.warn('Konnte Sprache nicht speichern:', err);
        }
    }

    function t(key) {
        const langPack = resources[currentLanguage] || resources[defaultLanguage];
        if (langPack && Object.prototype.hasOwnProperty.call(langPack, key)) {
            return langPack[key];
        }
        const fallbackPack = resources[defaultLanguage];
        if (fallbackPack && Object.prototype.hasOwnProperty.call(fallbackPack, key)) {
            return fallbackPack[key];
        }
        return key;
    }

    function applyTargets() {
        registeredTargets.forEach(entry => {
            const el = typeof entry.selector === 'string'
                ? document.querySelector(entry.selector)
                : entry.element;
            if (!el) return;
            const value = t(entry.key);
            if (entry.attribute) {
                el.setAttribute(entry.attribute, value);
            } else if (entry.html) {
                el.innerHTML = value;
            } else {
                el.textContent = value;
            }
        });
    }

    // Ersetzt Platzhalter in Übersetzungen, z.B. {current} oder {total}
    function format(key, replacements = {}) {
        const template = t(key);
        return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
            return acc.replaceAll(`{${placeholder}}`, value);
        }, template);
    }

    function setLanguage(lang) {
        const nextLang = resources[lang] ? lang : defaultLanguage;
        currentLanguage = nextLang;
        persistLanguage(nextLang);
        document.documentElement.lang = nextLang === 'en' ? 'en' : 'de';
        applyTargets();
        listeners.forEach(fn => fn(nextLang));
    }

    function getLanguage() {
        return currentLanguage;
    }

    function initializeLanguage() {
        const stored = getStoredLanguage();
        setLanguage(stored || defaultLanguage);
    }

    function onLanguageChange(fn) {
        listeners.push(fn);
    }

    function registerTranslationTargets(targets) {
        if (Array.isArray(targets)) {
            registeredTargets.push(...targets);
            applyTargets();
        }
    }

    window.i18n = {
        t,
        setLanguage,
        getLanguage,
        format,
        registerTranslationTargets,
        onLanguageChange,
        initializeLanguage
    };
})();
