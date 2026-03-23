import { DXFWriter } from '../../../core/lib/dxf/dxfWrite.js';
import { DXFFile } from '../../../core/lib/dxf/dxfFile.js';
import { DesignCore } from '../../../core/designCore.js';
import { jest } from '@jest/globals';

const createManager = (styleName = 'default') => ({
  items: [],
  getCstyle: jest.fn(() => styleName),
  dxf: jest.fn(),
});

const createCoreMock = (options = {}) => {
  const blocks = options.blocks || [];
  const entities = options.entities || [];

  return {
    dxfVersion: options.dxfVersion || 'R2018',
    handleManager: { next() {
      return '1';
    }, get handseed() {
      return '1';
    } },
    layerManager: options.layerManager || createManager('Layer0'),
    ltypeManager: options.ltypeManager || createManager('Continuous'),
    styleManager: options.styleManager || createManager('Standard'),
    dimStyleManager: options.dimStyleManager || createManager('ISO-25'),
    viewManager: options.viewManager || { dxf: jest.fn() },
    vportManager: options.vportManager || { dxf: jest.fn() },
    ucsManager: options.ucsManager || { dxf: jest.fn() },
    appIdManager: options.appIdManager || { dxf: jest.fn() },
    blockRecordManager: options.blockRecordManager || { dxf: jest.fn() },
    dictionaryManager: options.dictionaryManager || { dxf: jest.fn() },
    scene: {
      dxf: jest.fn(),
      entities: {
        count: jest.fn(() => entities.length),
        get: jest.fn((index) => entities[index]),
      },
      blockManager: {
        items: blocks,
      },
    },
  };
};

describe('DXFWriter', () => {
  let originalCore;

  beforeAll(() => {
    originalCore = DesignCore._core;
  });

  afterAll(() => {
    DesignCore.Core = originalCore;
  });

  test('Test DXFWriter.writeHeaders', () => {
    const core = createCoreMock({
      entities: [{}, {}],
      blocks: [{ name: 'BlockA' }, { name: 'BlockB' }],
    });

    core.layerManager.items = [{}, {}, {}];
    core.ltypeManager.items = [{}, {}, {}, {}];
    core.styleManager.items = [{}, {}, {}, {}, {}];
    core.dimStyleManager.items = [{}, {}, {}, {}, {}, {}];

    DesignCore.Core = core;

    const writer = new DXFWriter();
    const file = new DXFFile('R2018');
    writer.writeHeaders(file);

    expect(file.contents).toContain('0\nSECTION\n2\nHEADER\n');
    expect(file.contents).toContain('9\n$ACADVER\n1\nAC1032\n');
    expect(file.contents).toContain('9\n$TEXTSTYLE\n7\nStandard\n');
    expect(file.contents).toContain('9\n$CLAYER\n8\nLayer0\n');
    expect(file.contents).toContain('9\n$DIMSTYLE\n2\nISO-25\n');
    // expect(file.contents).toContain('9\n$HANDSEED\n5\n3F\n');
    expect(file.contents).toContain('0\nENDSEC\n');
  });

  test('Test DXFWriter.writeTables', () => {
    const core = createCoreMock({
      blocks: [{ name: 'BlockOne' }, { name: 'BlockTwo' }],
    });
    DesignCore.Core = core;

    const writer = new DXFWriter();
    const file = new DXFFile('R2018');
    writer.writeTables(file);

    expect(core.ltypeManager.dxf).toHaveBeenCalledWith(file);
    expect(core.layerManager.dxf).toHaveBeenCalledWith(file);
    expect(core.styleManager.dxf).toHaveBeenCalledWith(file);
    expect(core.dimStyleManager.dxf).toHaveBeenCalledWith(file);
    expect(core.vportManager.dxf).toHaveBeenCalledWith(file);
    expect(core.viewManager.dxf).toHaveBeenCalledWith(file);
    expect(core.ucsManager.dxf).toHaveBeenCalledWith(file);
    expect(core.appIdManager.dxf).toHaveBeenCalledWith(file);
    expect(core.blockRecordManager.dxf).toHaveBeenCalledWith(file);

    expect(file.contents).toContain('0\nSECTION\n2\nTABLES\n');
    expect(file.contents).toContain('0\nENDSEC\n');
  });

  test('Test DXFWriter.writeBlocks', () => {
    const blockA = { dxf: jest.fn() };
    const blockB = { dxf: jest.fn() };
    const core = createCoreMock({
      blocks: [blockA, blockB],
    });
    DesignCore.Core = core;

    const writer = new DXFWriter();
    const file = new DXFFile('R2018');
    writer.writeBlocks(file);

    expect(blockA.dxf).toHaveBeenCalledWith(file);
    expect(blockB.dxf).toHaveBeenCalledWith(file);
    expect(file.contents).toContain('0\nSECTION\n2\nBLOCKS\n');
    expect(file.contents).toContain('0\nENDSEC\n');
  });

  test('Test DXFWriter.writeEntities', () => {
    const entityA = { dxf: jest.fn() };
    const entityB = { dxf: jest.fn() };
    const core = createCoreMock({
      entities: [entityA, entityB],
    });
    DesignCore.Core = core;

    const writer = new DXFWriter();
    const file = new DXFFile('R2018');
    writer.writeEntities(file);

    expect(entityA.dxf).toHaveBeenCalledWith(file);
    expect(entityB.dxf).toHaveBeenCalledWith(file);
    expect(file.contents).toContain('0\nSECTION\n2\nENTITIES\n');
    expect(file.contents).toContain('0\nENDSEC\n');
  });

  test('Test DXFWriter.write default version from core', () => {
    const core = createCoreMock({
      dxfVersion: 'R12',
    });
    DesignCore.Core = core;

    const writer = new DXFWriter();
    const output = writer.write();

    expect(output).toContain('999\nDXF created from Design-Core\n');
    expect(output).toContain('2\nHEADER\n');
    expect(output).toContain('2\nTABLES\n');
    expect(output).toContain('2\nBLOCKS\n');
    expect(output).toContain('2\nENTITIES\n');
    expect(output).toContain('0\nEOF\n');

    expect(output).not.toContain('2\nOBJECTS\n');
    expect(output).not.toContain('0\nDICTIONARY\n');
  });

  test('Test DXFWriter.write supports explicit version', () => {
    const core = createCoreMock({
      dxfVersion: 'R12',
    });
    DesignCore.Core = core;

    const writer = new DXFWriter();
    const output = writer.write('R2018');

    expect(output).toContain('2\nOBJECTS\n');
    expect(core.dictionaryManager.dxf).toHaveBeenCalled();
    expect(output).toContain('0\nEOF\n');
  });
});
