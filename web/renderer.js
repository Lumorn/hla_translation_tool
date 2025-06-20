// Elemente holen
const urlInput = document.getElementById('videoUrlInput');
const addBtn   = document.getElementById('addVideoBtn');

// Button-Status je nach Eingabe anpassen
function updateAddBtn() {
    addBtn.disabled = urlInput.value.trim() === '';
}

// Initial deaktivieren, falls kein Text
updateAddBtn();

// Eingaben überwachen
urlInput.addEventListener('input', updateAddBtn);

// Klick auf "Hinzufügen"
addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    const list = await window.videoApi.loadBookmarks();
    if (list.some(b => b.url === url)) { alert('Schon vorhanden'); return; }
    list.push({url, time:0});
    await window.videoApi.saveBookmarks(list);
    alert('Gespeichert');
});
