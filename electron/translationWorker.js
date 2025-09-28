const { spawn } = require('child_process');
const { EventEmitter } = require('events');

/**
 * Verwaltet einen persistenten Übersetzungsprozess.
 */
class TranslationWorkerManager extends EventEmitter {
  constructor(scriptPath, options = {}) {
    super();
    this.scriptPath = scriptPath;
    this.command = options.command || 'python';
    this.args = options.args || [scriptPath, '--server'];
    const env = options.env || process.env;
    this.spawnOptions = options.spawnOptions || { env: { ...env, PYTHONIOENCODING: 'utf-8' } };
    this.spawnFn = options.spawnFn || spawn;
    this.restartDelay = options.restartDelay ?? 1000;
    this.maxAttempts = options.maxAttempts ?? 3;

    this.child = null;
    this.ready = false;
    this.draining = false;
    this.stdoutBuffer = '';
    this.restartTimer = null;
    this.requests = new Map();
  }

  /**
   * Startet den Worker, falls er noch nicht läuft.
   */
  start() {
    if (this.child) return;
    try {
      const child = this.spawnFn(this.command, this.args, this.spawnOptions);
      if (!child) {
        this._handleWorkerFailure('Start fehlgeschlagen: Kein Prozess-Handle erhalten');
        return;
      }
      this.child = child;
      this.ready = false;
      this.draining = false;
      this.stdoutBuffer = '';

      if (child.stdout?.setEncoding) child.stdout.setEncoding('utf-8');
      if (child.stderr?.setEncoding) child.stderr.setEncoding('utf-8');
      if (child.stdin?.setDefaultEncoding) child.stdin.setDefaultEncoding('utf-8');

      child.stdout?.on('data', chunk => this._handleStdout(chunk));
      child.stderr?.on('data', chunk => this.emit('worker-stderr', chunk.toString()));
      child.on('spawn', () => {
        this.ready = true;
        this.emit('worker-spawned');
        this._flushPending();
      });
      child.on('error', err => {
        this.emit('worker-error', err);
        this._handleWorkerFailure(`Prozessfehler: ${err.message}`);
      });
      child.on('exit', (code, signal) => {
        this.emit('worker-exit', code, signal);
        this._handleWorkerFailure(`Prozess beendet (code ${code}, signal ${signal})`);
      });
    } catch (err) {
      this.emit('worker-error', err);
      this._handleWorkerFailure(`Start fehlgeschlagen: ${err.message}`);
    }
  }

  /**
   * Fügt eine neue Übersetzungsanfrage hinzu und sorgt für die Ausführung.
   */
  queueRequest({ id, text, handler }) {
    if (id === undefined || id === null) {
      throw new Error('Übersetzungsanfrage benötigt eine ID');
    }
    if (typeof handler !== 'function') {
      throw new Error('Übersetzungsanfrage benötigt einen Handler');
    }
    const key = String(id);
    if (this.requests.has(key)) {
      throw new Error(`Übersetzungs-ID bereits vergeben: ${key}`);
    }
    this.requests.set(key, {
      text: typeof text === 'string' ? text : String(text ?? ''),
      handler,
      sent: false,
      attempts: 0,
    });
    this.start();
    this._flushPending();
  }

  /**
   * Entfernt eine Anfrage, z.B. wenn der Renderer geschlossen wurde.
   */
  dropRequest(id) {
    const key = String(id);
    this.requests.delete(key);
  }

  /**
   * Beendet den Worker und leert alle Warteschlangen ohne Rückmeldung.
   */
  dispose() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.child) {
      try {
        this.child.removeAllListeners();
        this.child.stdout?.removeAllListeners();
        this.child.stderr?.removeAllListeners();
        this.child.stdin?.removeAllListeners();
        this.child.kill();
      } catch (err) {
        this.emit('worker-error', err);
      }
    }
    this.child = null;
    this.ready = false;
    this.draining = false;
    this.requests.clear();
  }

  _handleStdout(chunk) {
    this.stdoutBuffer += chunk.toString();
    let index;
    while ((index = this.stdoutBuffer.indexOf('\n')) >= 0) {
      const line = this.stdoutBuffer.slice(0, index).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(index + 1);
      if (!line) continue;
      let data;
      try {
        data = JSON.parse(line);
      } catch (err) {
        this.emit('worker-error', new Error(`Ungültige Antwort des Workers: ${line}`));
        continue;
      }
      const key = data?.id !== undefined && data?.id !== null ? String(data.id) : null;
      if (key && this.requests.has(key)) {
        const entry = this.requests.get(key);
        this.requests.delete(key);
        try {
          entry.handler({
            text: typeof data.text === 'string' ? data.text : '',
            error: data.error ? String(data.error) : '',
          });
        } catch (err) {
          this.emit('worker-error', err);
        }
      } else {
        this.emit('worker-error', new Error(`Unbekannte Antwort-ID: ${line}`));
      }
    }
  }

  _flushPending() {
    if (!this.child || !this.ready || !this.child.stdin) return;
    if (this.draining) return;
    for (const [key, entry] of this.requests) {
      if (entry.sent) continue;
      const payload = JSON.stringify({ id: key, text: entry.text });
      entry.sent = true;
      entry.attempts += 1;
      const ok = this.child.stdin.write(payload + '\n');
      if (!ok) {
        this.draining = true;
        this.child.stdin.once('drain', () => {
          this.draining = false;
          this._flushPending();
        });
        break;
      }
    }
  }

  _handleWorkerFailure(message) {
    if (this.child) {
      this.child.removeAllListeners();
      this.child.stdout?.removeAllListeners();
      this.child.stderr?.removeAllListeners();
      this.child.stdin?.removeAllListeners();
    }
    this.child = null;
    this.ready = false;
    this.draining = false;
    this.stdoutBuffer = '';

    for (const [key, entry] of this.requests) {
      if (entry.attempts >= this.maxAttempts) {
        this.requests.delete(key);
        try {
          entry.handler({ text: '', error: message });
        } catch (err) {
          this.emit('worker-error', err);
        }
      } else {
        entry.sent = false;
      }
    }

    if (!this.restartTimer) {
      this.restartTimer = setTimeout(() => {
        this.restartTimer = null;
        if (!this.child) {
          this.start();
          this._flushPending();
        }
      }, this.restartDelay);
    }
  }
}

module.exports = { TranslationWorkerManager };
