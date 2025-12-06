import { parseSize } from '../gameUtils.js';

describe('parseSize', () => {
  it('parses valid size and enforces even slots', () => {
    const { rows, cols } = parseSize('3x4');
    expect(rows).toBe(3);
    expect(cols).toBe(4);
  });

  it('rejects odd slot boards', () => {
    expect(() => parseSize('3x3')).toThrow(/even number of slots/i);
  });

  it('rejects invalid format', () => {
    expect(() => parseSize('abc')).toThrow(/rowsxcols/i);
  });
});

