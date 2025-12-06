export function parseSize(raw) {
  const cleaned = (raw || '').toLowerCase().replace(/\s+/g, '');
  const match = cleaned.match(/^(\d+)x(\d+)$/);
  if (!match) {
    throw new Error('Size attribute must be in the form rowsxcols, e.g., 3x4.');
  }
  const rows = parseInt(match[1], 10);
  const cols = parseInt(match[2], 10);
  if (rows < 1 || cols < 1) {
    throw new Error('Rows and columns must be positive integers.');
  }
  if ((rows * cols) % 2 !== 0) {
    throw new Error('Board must have an even number of slots for pairs.');
  }
  return { rows, cols };
}

