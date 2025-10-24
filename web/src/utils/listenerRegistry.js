const originalAdd = EventTarget.prototype.addEventListener;
const originalRemove = EventTarget.prototype.removeEventListener;

/**
 * Set mit allen aktuell registrierten Listenern.
 * Wir speichern den Ziel-Knoten sowie den ursprünglichen Listener,
 * um spätere Bereinigungen durchführen zu können.
 */
const registeredListeners = new Set();

/**
 * Normalisiert die übergebenen Optionen, sodass wir sie zuverlässig vergleichen können.
 * @param {boolean|AddEventListenerOptions|undefined} options
 */
function normalizeOptions(options) {
  if (typeof options === 'boolean') {
    return { capture: options === true, once: false, passive: undefined, signal: undefined, raw: options };
  }
  if (options && typeof options === 'object') {
    return {
      capture: !!options.capture,
      once: !!options.once,
      passive: 'passive' in options ? !!options.passive : undefined,
      signal: options.signal,
      raw: options
    };
  }
  return { capture: false, once: false, passive: undefined, signal: undefined, raw: options };
}

/**
 * Entfernt einen Listener-Eintrag aus dem Set und räumt Signale auf.
 */
function cleanupRecord(record) {
  if (record.signal && record.abortHandler) {
    try { record.signal.removeEventListener('abort', record.abortHandler); } catch {}
    record.abortHandler = null;
  }
  registeredListeners.delete(record);
}

EventTarget.prototype.addEventListener = function addEventListenerWrapped(type, listener, options) {
  if (listener == null) {
    return originalAdd.call(this, type, listener, options);
  }

  const normalized = normalizeOptions(options);
  const record = {
    target: this,
    type,
    listener,
    actualListener: listener,
    capture: normalized.capture,
    options: options,
    signal: normalized.signal,
    abortHandler: null
  };

  const cleanup = () => cleanupRecord(record);

  if (normalized.once) {
    const originalListener = listener;
    const onceWrapper = function onceWrapper(...args) {
      cleanup();
      if (typeof originalListener === 'function') {
        return originalListener.apply(this, args);
      }
      if (originalListener && typeof originalListener.handleEvent === 'function') {
        return originalListener.handleEvent.apply(originalListener, args);
      }
      return undefined;
    };
    record.actualListener = onceWrapper;
  }

  if (record.signal && typeof record.signal.addEventListener === 'function') {
    const abortHandler = () => {
      cleanup();
    };
    record.abortHandler = abortHandler;
    try { record.signal.addEventListener('abort', abortHandler, { once: true }); } catch {}
  }

  try {
    originalAdd.call(this, type, record.actualListener, options);
  } catch (err) {
    cleanupRecord(record);
    throw err;
  }

  registeredListeners.add(record);
};

EventTarget.prototype.removeEventListener = function removeEventListenerWrapped(type, listener, options) {
  const normalized = normalizeOptions(options);
  for (const record of registeredListeners) {
    if (record.target === this && record.type === type && record.listener === listener && record.capture === normalized.capture) {
      cleanupRecord(record);
      originalRemove.call(this, type, record.actualListener, options);
      return;
    }
  }
  originalRemove.call(this, type, listener, options);
};

/**
 * Entfernt alle registrierten Listener und stellt den ursprünglichen Zustand wieder her.
 */
export function resetRegisteredListeners() {
  for (const record of Array.from(registeredListeners)) {
    cleanupRecord(record);
    try { originalRemove.call(record.target, record.type, record.actualListener, record.options); } catch {}
  }
}

if (typeof window !== 'undefined') {
  window.resetRegisteredListeners = resetRegisteredListeners;
}
