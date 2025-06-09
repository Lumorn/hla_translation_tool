# hla_translation_tool
# 🎮 Half‑Life: Alyx Translation Tool

![Half‑Life: Alyx Translation Tool](https://img.shields.io/badge/Version-3.6.0-green?style=for-the-badge)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Offline](https://img.shields.io/badge/Offline-Ready-green?style=for-the-badge)

Eine vollständige **Offline‑Web‑App** zum Verwalten und Übersetzen aller Audio‑Zeilen aus *Half‑Life: Alyx*.

---

## 📋 Inhaltsverzeichnis

* [✨ Neue Features in 3.6.0](#-neue-features-in-360)
* [🚀 Features (komplett)](#-features-komplett)
* [🛠️ Installation](#-installation)
* [🏁 Erste Schritte](#-erste-schritte)
* [🎮 Bedienung](#-bedienung)
* [⌨️ Keyboard Shortcuts](#-keyboard-shortcuts)
* [📥📤 Import & Export](#-import--export)
* [📁 Ordner-Management](#-ordner-management)
* [🔧 Erweiterte Funktionen](#-erweiterte-funktionen)
* [🐛 Troubleshooting](#-troubleshooting)
* [📝 Changelog](#-changelog)

---

## ✨ Neue Features in 3.6.0

|  Kategorie                 |  Beschreibung                                                                                                                                               |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Level‑Management**       | Projekte besitzen jetzt **Level‑Namen** + **Teil‑Nummern**.<br>Alle vorhandenen Namen werden beim Anlegen/Umbenennen als Dropdown angeboten.                |
| **Projekt‑Metaleiste**     | Über der Tabelle erscheint **Projekt • Level • Teil** + Ein‑Klick‑Button ⧉ zum Kopieren des Level‑Namens.                                                   |
| **Globale Text‑Statistik** | Neue Kachel **EN / DE / BEIDE / ∑** in den globalen Statistiken + Live‑Update beim Tippen.                                                                  |
| **Level‑Statistik‑Panel**  | Aufklappbares Panel im Ordner‑Browser: zeigt pro Level<br>• Anzahl Teile  • Fertig‑Prozent  • EN/DE/Both/∑.                                                 |
| **Dateien ignorieren**     | Dateien können als *Nicht benötigt* markiert & jederzeit wieder aufgenommen werden (Ignorieren‑Toggle im Detail‑Dialog).                                    |
| **Pfad‑Anzeige**           | Jeder Eintrag im Ordner‑Browser zeigt den aufgelösten Dateipfad mit Status‑Icons (✅ verfügbar / ❌ problematisch).                                          |
| **Datenbank‑Bereinigung**  | **Ordnernamen bereinigen**: Korrigiert falsche Ordnernamen basierend auf echten Dateipfaden.                                                                |
| **Ordner‑Löschfunktion**   | Komplette Ordner können sicher aus der Datenbank gelöscht werden (mit Schutz vor Datenverlust).                                                             |
| **Cleanup‑Routine**        | Fehlende Dateien **ohne** EN & DE werden automatisch aus der DB entfernt.                                                                                   |
| **Verbesserter UI‑Polish** | • Schließen‑Knopf (×) nun oben rechts 🡆 hover‑animiert.<br>• Fertige Projekte/Ordner erhalten leuchtend grünen Rahmen.<br>• Dark‑Theme‑Kontrast optimiert. |

---

## 🚀 Features (komplett)

### 🎯 Kernfunktionen

* **Mehrere Projekte** mit Icon, Farbe, Level‑Namen & Teil‑Nummer
* **Intelligenter Ordner‑Scan** mit Duplikat‑Prävention und Auto‑Normalisierung
* **Eingebettete Audio‑Wiedergabe** (MP3 / WAV / OGG) direkt im Browser
* **Live‑Statistiken:** EN‑%, DE‑%, Completion‑%, Globale Textzahlen (EN/DE/BEIDE/∑)
* **Vollständig offline** – keine Server, keine externen Abhängigkeiten

### 📊 Fortschritts‑Tracking

* **Globale Dashboard‑Kacheln:** Gesamt, Übersetzt, Ordner komplett, **EN/DE/Both/∑**
* **Level‑Statistik‑Panel** (aufklappbar im Ordner‑Browser)
* **Projekt‑übergreifende Verfolgung:** Dateien zeigen Status über alle Projekte
* **Grüne Rahmen** für **100 %**‑Projekte & vollständig übersetzte Ordner
* **Dateizeilen‑Badges:** Übersetzt / Ignoriert / Offen

### 📁 Ordner‑Management

* **Folder‑Browser** mit Icons, Such‑ & Filter‑Funktionen
* **Pfad‑Anzeige:** Jede Datei zeigt aufgelösten Pfad mit Status
* **Ignorieren‑Toggle** für unnötige Audios (🚫 Ignorieren / ↩ Wieder aufnehmen)
* **Datenbank‑Bereinigung:** Korrigiert falsche Ordnernamen automatisch
* **Ordner‑Löschfunktion:** Sichere Entfernung ganzer Ordner aus der DB
* **Live‑Filter:** *„Übersetzt / Ignoriert / Offen"*
* **Ordner‑Anpassung:** Icons und Farben pro Ordner

### 🖋️ Texteingabe & Navigation

* **Auto‑Resize‑Textfelder** (EN & DE bleiben höhengleich)
* **Sofort‑Speicherung** nach 1 s Inaktivität
* **Tab/Shift+Tab Navigation** zwischen Textfeldern und Zeilen
* **Ctrl+Leertaste:** Audio‑Playback direkt im Textfeld
* **Copy‑Buttons:** 📋 neben jedem Textfeld für direktes Kopieren

### 🔍 Suche & Import

* **Erweiterte Ähnlichkeitssuche** (ignoriert Groß‑/Kleinschreibung, Punkte)
* **Intelligenter Import** mit automatischer Spalten‑Erkennung
* **Multi‑Ordner‑Auswahl** bei mehrdeutigen Dateien
* **Live‑Highlighting** von Suchbegriffen

### ⌨️ Keyboard & Maus

* **Keyboard‑Navigation:** Pfeiltasten, Tab, Leertaste für Audio, Enter für Texteingabe
* **Context‑Menu** (Rechtsklick): Audio, Kopieren, Einfügen, Ordner öffnen, Löschen
* **Drag & Drop:** Projekte und Dateien sortieren
* **Doppelklick:** Zeilennummer ändern, Projekt umbenennen

---

## 🛠️ Installation

1. **`hla_translation_tool.html`** herunterladen
2. **Datei lokal öffnen** (Doppelklick) – fertig!

> **💡 Tipp:** Desktop‑Verknüpfung erstellen ⇒ Ein‑Klick‑Start

### Systemanforderungen

* **Moderner Browser:** Chrome, Firefox, Edge, Safari
* **JavaScript aktiviert**
* **Lokaler Dateizugriff** für Audio‑Wiedergabe & Export
* **Empfohlener Speicher:** 2+ GB freier RAM für große Projekte

---

## 🏁 Erste Schritte

### 1. 📁 Ordner scannen
* Klicken Sie auf **„📁 Ordner scannen"**
* Wählen Sie Ihren Haupt‑`sounds`‑Ordner
* Die App indiziert automatisch alle Audio‑Dateien

### 2. 📂 Neues Projekt erstellen
* Klicken Sie auf **„+ Neues Projekt"**
* Vergeben Sie einen Namen
* Optional: Level‑Name und Teil‑Nummer angeben
* Icon und Farbe werden automatisch zugewiesen

### 3. 📄 Dateien hinzufügen
* **Über Suche:** Live‑Suche nach Dateinamen oder Textinhalten
* **Über Browser:** „📁 Ordner durchsuchen" für visuelles Browsen
* **Direct‑Input:** Dateinamen direkt ins Eingabefeld

### 4. ✏️ Übersetzen
* Englische Texte werden automatisch erkannt
* Deutsche Übersetzung in das DE‑Feld eingeben
* **✓ Fertig‑Checkbox** setzen für Completion‑Tracking
* Auto‑Save speichert alle 1 Sekunde

---

## 🎮 Bedienung

### Projekt‑Management

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Projekt erstellen**     | `+ Neues Projekt` Button                          |
| **Projekt auswählen**     | Klick auf Projekt‑Kachel                          |
| **Projekt anpassen**      | ⚙️ auf Projekt‑Kachel → Icon, Farbe, Level        |
| **Projekt löschen**       | × auf Projekt‑Kachel                              |
| **Projekt umbenennen**    | Doppelklick auf Projekt‑Name                      |
| **Projekt sortieren**     | Drag & Drop der Projekt‑Kacheln                   |
| **Level‑Name kopieren**   | ⧉‑Button in Meta‑Leiste                           |

### Datei‑Management

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Dateien suchen**        | Live‑Suchfeld (mind. 2 Zeichen)                   |
| **Dateien hinzufügen**    | Direct‑Input, Suchresultat‑Klick, Browser         |
| **Datei als fertig**      | ✓ Completion‑Checkbox                             |
| **Datei ignorieren**      | 🚫 Ignorieren‑Button (im Ordner‑Browser)          |
| **Position ändern**       | Doppelklick auf Zeilennummer (#)                  |
| **Sortierung ändern**     | Klick auf Spalten‑Header                          |
| **Datei löschen**         | × am Zeilenende oder Context‑Menu                 |

### Audio & Text

|  Aktion                    |  Bedienung                                          |
| -------------------------- | --------------------------------------------------- |
| **Audio abspielen**       | ▶ Button oder Leertaste (bei ausgewählter Zeile)  |
| **Audio im Textfeld**     | `Ctrl + Leertaste`                                |
| **Text kopieren**         | 📋 Button neben Textfeld                          |
| **Zwischen Feldern**      | `Tab` / `Shift + Tab`                             |
| **Auto‑Resize aktiviert** | Textfelder passen sich automatisch an            |

---

## ⌨️ Keyboard Shortcuts

### Globale Shortcuts

|  Tastenkombination         |  Funktion                                           |
| -------------------------- | --------------------------------------------------- |
| **`Ctrl + S`**            | Projekt manuell speichern                         |
| **`Ctrl + I`**            | Import‑Dialog öffnen                              |
| **`Ctrl + E`**            | Export‑Dialog öffnen                              |
| **`Ctrl + F`**            | Ordner‑Browser öffnen                             |
| **`Escape`**              | Dialoge schließen / Context‑Menu schließen        |

### Tabellen‑Navigation

|  Taste                     |  Funktion                                           |
| -------------------------- | --------------------------------------------------- |
| **`↑` / `↓`**             | Zeile nach oben/unten                             |
| **`Tab` / `Shift+Tab`**   | Zwischen Textfeldern wechseln                     |
| **`Enter`**               | Erstes Textfeld der ausgewählten Zeile fokussieren |
| **`Leertaste`**           | Audio der ausgewählten Zeile abspielen            |
| **`Delete`**              | Ausgewählte Zeile löschen                         |

### Text‑Shortcuts

|  Tastenkombination         |  Funktion                                           |
| -------------------------- | --------------------------------------------------- |
| **`Ctrl + Leertaste`**    | Audio abspielen (im Textfeld)                     |
| **`Tab`**                 | Nächstes Textfeld                                 |
| **`Shift + Tab`**         | Vorheriges Textfeld                               |

---

## 📥📤 Import & Export

### Import‑Funktionen

* **📥 Daten importieren**
  * **Wiki‑Tabellen:** Automatische Spalten‑Erkennung
  * **Pipe‑Format:** `Dateiname|EN Text|DE Text`
  * **Intelligente Zuordnung:** Dateinamen‑Spalte wird automatisch erkannt
  * **Multi‑Ordner‑Support:** Auswahl bei mehrdeutigen Dateien
  * **Database‑Matching:** Vergleich mit vorhandenen Audiodateien

### Export‑Funktionen

* **📤 ZIP‑Export**
  * **Audio‑Dateien** mit angepassten Namen
  * **CSV‑Datei** mit Übersetzungen
  * **Manifest‑JSON** mit Metadaten
  * **Flexible Namensformate:** Nummer‑Ordner, Ordner‑Nummer, Präfix
  * **Fortschritts‑Anzeige** mit Dateiliste

### Backup & Restore

* **💾 Backup:** Vollständige Datensicherung als JSON
* **📂 Restore:** Wiederherstellung mit Migrations‑Support
* **Auto‑Save:** Kontinuierliche Speicherung alle 30 Sekunden

---

## 📁 Ordner‑Management

### Ordner‑Browser Features

* **📊 Globale Statistiken:** Übersetzungsfortschritt über alle Projekte
* **📈 Level‑Statistiken:** Aufklappbares Panel mit Details pro Level
* **🎨 Ordner‑Anpassung:** Icons und Farben individuell einstellbar
* **🔍 Pfad‑Anzeige:** Status und aufgelöster Pfad für jede Datei
* **✅ Completion‑Status:** Visuelle Markierung übersetzter Dateien

### Ordner‑Aktionen

|  Aktion                    |  Beschreibung                                       |
| -------------------------- | --------------------------------------------------- |
| **🚫 Ignorieren**         | Datei als „nicht benötigt" markieren              |
| **↩ Wieder aufnehmen**    | Ignorierte Datei wieder aktivieren                |
| **+ Hinzufügen**          | Datei zum aktuellen Projekt hinzufügen            |
| **▶ Audio abspielen**     | Direkte Wiedergabe im Browser                     |
| **⚙️ Ordner anpassen**    | Icon und Farbe des Ordners ändern                 |
| **❌ Ordner löschen**     | Kompletten Ordner aus Datenbank entfernen         |

### Datenbank‑Wartung

* **🧹 Ordnernamen bereinigen:** Korrigiert falsche Pfade automatisch
* **🧹 Duplikate bereinigen:** Intelligente Zusammenführung ähnlicher Einträge
* **🔄 Projekte bereinigen:** Entfernt veraltete Pfad‑Referenzen
* **🔧 Ordner reparieren:** Aktualisiert Ordnernamen in allen Projekten

---

## 🔧 Erweiterte Funktionen

### Auto‑Scan‑System

* **🔄 Universeller Auto‑Scan:** Alle Funktionen lösen bei Bedarf automatisch Ordner‑Scan aus
* **⚡ Berechtigung‑Erkennung:** Browser‑Berechtigungen werden automatisch geprüft
* **🎯 Intelligente Pfad‑Auflösung:** Dynamisches Matching zwischen Projekten und Datenbank

### Erweiterte Suche

* **🔍 Ähnlichkeitssuche:** Ignoriert Groß‑/Kleinschreibung, Punkte, Kommas
* **📊 Relevanz‑Scoring:** Beste Treffer werden priorisiert
* **🎯 Multi‑Kriterien:** Dateiname, EN‑Text, DE‑Text werden durchsucht
* **📋 Live‑Highlighting:** Suchbegriffe werden in Ergebnissen hervorgehoben

### Intelligente Features

* **🧠 Smart Folder Detection:** Erkennt Half‑Life Charaktere automatisch
* **📏 Auto‑Height Textboxen:** EN/DE Felder bleiben höhengleich
* **🎨 Theme‑System:** Automatische Icon‑ und Farb‑Zuweisungen
* **💡 Context‑Awareness:** Funktionen passen sich dem aktuellen Kontext an

---

## 🐛 Troubleshooting

### Häufige Probleme

**🎵 Audio spielt nicht ab**
* ▶ **Lösung:** Ordner erneut scannen für Browser‑Berechtigungen
* ▶ **Automatisch:** Tool triggert Auto‑Scan bei fehlendem Audio

**📁 Dateien nicht gefunden**
* ▶ **Lösung:** „📁 Ordner scannen" mit Haupt‑Audio‑Ordner
* ▶ **Prüfung:** Debug‑Spalte zeigt Pfad‑Status

**💾 Export funktioniert nicht**
* ▶ **Lösung:** Erst Dateien auswählen, dann Export starten
* ▶ **Auto‑Check:** Tool prüft Berechtigungen vor Export

**🔄 Duplikate in Datenbank**
* ▶ **Lösung:** „🧹 Duplikate bereinigen" verwenden
* ▶ **Intelligente Bereinigung:** Behält beste Versionen automatisch

### Debug‑Tools

* **🔍 Debug‑Spalte:** Zeigt aufgelöste Pfade und Status
* **📊 Datenquellen‑Analyse:** Console‑Logs für Entwickler
* **🎯 Access‑Status:** Echtzeit‑Anzeige der Dateiberechtigungen

### Performance‑Tipps

* **📂 Ordner‑Struktur:** Verwenden Sie sinnvolle Ordner‑Hierarchien
* **🧹 Regelmäßige Bereinigung:** Duplikate und veraltete Einträge entfernen
* **💾 Backup‑Strategie:** Regelmäßige Datensicherung vor größeren Änderungen

---

## 📝 Changelog

### 3.6.0 (aktuell) - Level‑Management & Datenbank‑Tools

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
* **Erweiterte Export‑Optionen:** Flexible Dateinamen‑Formate

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
* **Import/Export:** Wiki‑Tabellen und ZIP‑Archive
* **Offline‑Fähigkeit:** Vollständig lokale Web‑App

---

## 💡 Tipps & Best Practices

### Projekt‑Organisation

* **📋 Level‑Namen verwenden:** Strukturieren Sie Projekte nach Spiel‑Leveln
* **🔢 Teil‑Nummern vergeben:** Für große Level mehrere Teile erstellen
* **🎨 Farb‑Coding:** Ähnliche Level mit gleichen Farben markieren

### Übersetzungs‑Workflow

1. **📁 Vollständigen Ordner scannen** vor Projektbeginn
2. **🔍 Suche verwenden** statt manueller Datei‑Eingabe
3. **🎵 Audio anhören** vor Übersetzung
4. **✓ Fertig‑Status setzen** für Fortschritts‑Tracking
5. **💾 Regelmäßige Backups** erstellen

### Performance‑Optimierung

* **🧹 Duplikate bereinigen** bei großen Datenbanken
* **🚫 Unnötige Dateien ignorieren** für bessere Übersicht
* **📊 Level‑Statistiken nutzen** für Fortschritts‑Übersicht

---

© 2025 Half‑Life: Alyx Translation Tool – Alle Rechte vorbehalten.

**Version 3.6.0** - Level‑Management & Datenbank‑Tools Edition  
🎮 Speziell entwickelt für Half‑Life: Alyx Übersetzungsprojekte


## Code-Ausgabe Regeln

**1. Vollständige Funktionen:**
- Immer die **komplette** Funktion ausgeben, damit sie einfach ersetzt werden kann
- Nie nur Teile oder Snippets

**2. Klare Markierungen:**
- Jede Funktion mit Start- und End-Kommentaren umrahmen:
```javascript
// =========================== FUNKTIONSNAME START ===========================
function meineFunktion() {
    // code hier
}
// =========================== FUNKTIONSNAME END ===========================
```

**3. Schritt für Schritt:**
- **Nur eine Funktion pro Antwort**
- Nach jeder Änderung testen lassen
- Erst wenn eine Funktion funktioniert, zur nächsten

**4. Sichere Änderungen:**
- Minimale Änderungen bevorzugen
- Bei Fehlern sofort zur ursprünglichen Version zurück

**5. Klare Anweisungen:**
- Sagen welche Funktion gesucht und ersetzt werden soll
- Eindeutige Such-Strings angeben

