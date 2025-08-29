// Verwaltet einen exklusiven Schreib-Lock pro Projekt
// Verwendet BroadcastChannel und ein Heartbeat im localStorage als Fallback

const HEARTBEAT_INTERVAL = 2000; // ms
const HEARTBEAT_TIMEOUT = 5000;  // ms

/**
 * Versucht einen Schreib-Lock für ein Projekt zu erhalten.
 * Gibt ein Objekt mit `readOnly` und `release()` zurück.
 * @param {number|string} projectId
 */
export async function acquireProjectLock(projectId) {
    const channel = new BroadcastChannel(`project:${projectId}`);
    const flagKey = `project-lock:${projectId}`;
    let isOwner = false;
    let heartbeatHandle;

    function startHeartbeat() {
        localStorage.setItem(flagKey, Date.now().toString());
        heartbeatHandle = setInterval(() => {
            localStorage.setItem(flagKey, Date.now().toString());
        }, HEARTBEAT_INTERVAL);
        channel.onmessage = ev => {
            if (ev.data === 'lock-request') {
                channel.postMessage('lock-taken');
            }
        };
    }

    // Prüfen, ob ein vorhandener Lock abgelaufen ist
    const last = parseInt(localStorage.getItem(flagKey) || '0', 10);
    if (!last || Date.now() - last > HEARTBEAT_TIMEOUT) {
        // Kein aktiver Lock vorhanden
        isOwner = true;
        startHeartbeat();
    } else {
        channel.postMessage('lock-request');
    }

    function release() {
        if (isOwner) {
            clearInterval(heartbeatHandle);
            localStorage.removeItem(flagKey);
            channel.postMessage('lock-released');
        }
        channel.close();
    }

    return new Promise(resolve => {
        if (isOwner) {
            resolve({ readOnly: false, release });
            return;
        }
        let settled = false;
        const timeout = setTimeout(() => {
            if (!settled) {
                settled = true;
                resolve({ readOnly: true, release });
            }
        }, 300);

        channel.onmessage = ev => {
            if (settled) return;
            if (ev.data === 'lock-taken') {
                clearTimeout(timeout);
                settled = true;
                resolve({ readOnly: true, release });
            } else if (ev.data === 'lock-released') {
                clearTimeout(timeout);
                isOwner = true;
                startHeartbeat();
                settled = true;
                resolve({ readOnly: false, release });
            }
        };
    });
}
