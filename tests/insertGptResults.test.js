let insertGptResults, __setFiles, __setRenderFileTable, __setSaveCurrentProject;

function loadMain() {
    jest.resetModules();
    global.window = {
        addEventListener: jest.fn(),
        parseEvaluationResults: text => JSON.parse(text),
        attachScoreHandlers: jest.fn(),
        electronAPI: undefined
    };
    global.document = {
        addEventListener: jest.fn(),
        getElementById: jest.fn(id => {
            if (id === 'gptPromptInsert') return { disabled: false };
            if (id === 'gptResultArea') return { value: '[{"id":1,"score":88,"suggestion":"neu","comment":"ok"}]' };
            if (id === 'fileTableBody') return {};
            if (id === 'gptPromptDialog') return { classList: { add: jest.fn() } };
            return null;
        })
    };
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    };
    ({ insertGptResults, __setFiles, __setRenderFileTable, __setSaveCurrentProject } = require('../web/src/main.js'));
    __setRenderFileTable(jest.fn());
    __setSaveCurrentProject(jest.fn());
}

describe('insertGptResults', () => {
    beforeEach(loadMain);

    test('uebernimmt Score und Vorschlag in die Dateien', async () => {
        const files = [{ id: 1 }];
        __setFiles(files);
        await insertGptResults();
        expect(files[0].score).toBe(88);
        expect(files[0].suggestion).toBe('neu');
    });

    test('rendert Tabelle und speichert Projekt', async () => {
        const files = [{ id: 1 }];
        const renderMock = jest.fn();
        const saveMock = jest.fn();
        __setFiles(files);
        __setRenderFileTable(renderMock);
        __setSaveCurrentProject(saveMock);
        await insertGptResults();
        expect(renderMock).toHaveBeenCalled();
        expect(saveMock).toHaveBeenCalled();
    });
});
