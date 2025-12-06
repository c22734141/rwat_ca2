/**
 * MemoryGame DOM test with mocked firebase and shape-card.
 */
import { jest } from '@jest/globals';

// Mock firebase client to avoid emulator usage
jest.mock('../firebaseClient.js', () => ({
    saveResult: jest.fn().mockResolvedValue(undefined),
    getAverageClicks: jest.fn().mockResolvedValue(2.5),
}));

// Mock shape-card with deterministic cards and minimal behavior
jest.mock('../shapecard.js', () => {
  const Base = globalThis.HTMLElement;
  const registry = globalThis.customElements;
  class MockShapeCard extends Base {
    constructor() {
      super();
      this._faceUp = false;
    }
    static WIDTH = '100px';
    static getUniqueRandomCardsAsHTML() {
      // four cards, two pairs
      return `
        <shape-card type="circle" colour="red"></shape-card>
        <shape-card type="square" colour="blue"></shape-card>
        <shape-card type="circle" colour="red"></shape-card>
        <shape-card type="square" colour="blue"></shape-card>
      `;
    }
    isFaceUp() {
      return this._faceUp;
    }
    flip() {
      this._faceUp = !this._faceUp;
    }
  }
  if (registry && !registry.get('shape-card')) {
    registry.define('shape-card', MockShapeCard);
  }
  return { ShapeCard: MockShapeCard };
});

// Provide required template for shape-card use
document.body.innerHTML = `
  <template id="shape-card-template">
    <div class="card card-face-down">
      <div class="card-front"></div>
      <div class="card-back"></div>
    </div>
  </template>
  <memory-game size="2x2"></memory-game>
  <section>
    <button id="show-average">Show average clicks</button>
    <span id="average-output"></span>
    <span id="average-error"></span>
  </section>
`;

// Import after mocks and template are set
import '../main.js';

describe('memory-game', () => {
    it('initializes board with correct columns and stats', () => {
        const game = document.querySelector('memory-game');
        const shadow = game.shadowRoot;
        const board = shadow.querySelector('.board');
        const moves = shadow.querySelector('#moves');
        const matches = shadow.querySelector('#matches');

        expect(board.children.length).toBe(4);
        expect(board.style.gridTemplateColumns).toBe('repeat(2, 100px)');
        expect(moves.textContent).toBe('0');
        expect(matches.textContent).toBe('0/2');
    });
});

