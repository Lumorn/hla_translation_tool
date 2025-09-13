const { test, expect } = require('@jest/globals');

// Variablen wie im Hauptskript
let isNeighborEffect = false;
let neighborHall = false;
let isHallEffect = false;

// Platzhalter für den allgemeinen Hall-Schalter
function toggleHallEffect(active) {
  isHallEffect = active;
}

// Zu testende Funktion in vereinfachter Form
function toggleNeighborHall(active) {
  neighborHall = active;
  if (isNeighborEffect) {
    // hier würde der Nebenraum-Effekt neu berechnet
  } else {
    toggleHallEffect(active);
  }
}

// Der Hall-Effekt muss auch ohne Nebenraum funktionieren
// (erst aktivieren, dann wieder deaktivieren)
test('Hall-Effekt ohne Nebenraum', () => {
  isNeighborEffect = false;
  toggleNeighborHall(true);
  expect(isHallEffect).toBe(true);
  toggleNeighborHall(false);
  expect(isHallEffect).toBe(false);
});
