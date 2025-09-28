const { PassThrough } = require('stream');
const EventEmitter = require('events');
const { TranslationWorkerManager } = require('../electron/translationWorker');

class FakeChild extends EventEmitter {
  constructor() {
    super();
    this.stdout = new PassThrough();
    this.stderr = new PassThrough();
    this.stdinWrites = [];
    const self = this;
    this.stdin = new PassThrough();
    this.stdin.write = function (chunk) {
      self.stdinWrites.push(chunk.toString());
      return true;
    };
    this.kill = jest.fn();
  }
}

describe('TranslationWorkerManager', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('sendet Anfragen nach dem Start und liefert Antworten aus', () => {
    const child = new FakeChild();
    const spawnFn = jest.fn(() => child);
    const manager = new TranslationWorkerManager('/tmp/translate.py', { spawnFn });
    const handler = jest.fn();

    manager.queueRequest({ id: '1', text: 'Test', handler });
    expect(spawnFn).toHaveBeenCalledTimes(1);
    expect(child.stdinWrites).toHaveLength(0);

    child.emit('spawn');
    expect(child.stdinWrites).toHaveLength(1);
    expect(JSON.parse(child.stdinWrites[0])).toEqual({ id: '1', text: 'Test' });

    child.stdout.emit('data', Buffer.from('{"id":"1","text":"Antwort","error":""}\n'));
    expect(handler).toHaveBeenCalledWith({ text: 'Antwort', error: '' });
  });

  test('startet nach Absturz neu und sendet offene Aufträge erneut', () => {
    const firstChild = new FakeChild();
    const secondChild = new FakeChild();
    const spawnFn = jest.fn()
      .mockReturnValueOnce(firstChild)
      .mockReturnValueOnce(secondChild);
    const manager = new TranslationWorkerManager('/tmp/translate.py', { spawnFn, restartDelay: 500 });
    const handler = jest.fn();

    manager.queueRequest({ id: '1', text: 'Neuversuch', handler });
    firstChild.emit('spawn');
    expect(firstChild.stdinWrites).toHaveLength(1);

    firstChild.emit('exit', 1, null);
    jest.advanceTimersByTime(500);
    secondChild.emit('spawn');
    expect(secondChild.stdinWrites).toHaveLength(1);
    const payload = JSON.parse(secondChild.stdinWrites[0]);
    expect(payload).toEqual({ id: '1', text: 'Neuversuch' });

    secondChild.stdout.emit('data', Buffer.from('{"id":"1","text":"Fertig","error":""}\n'));
    expect(handler).toHaveBeenCalledWith({ text: 'Fertig', error: '' });
  });
});
