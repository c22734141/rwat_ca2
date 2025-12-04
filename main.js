import { ShapeCard } from './shapecard.js';
import { saveResult, getAverageClicks } from './firebaseClient.js';

const memoryGameTemplate = document.createElement('template');
memoryGameTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      color: #222;
    }
    .container {
      max-width: 720px;
      margin: 2rem auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .title {
      font-size: 1.25rem;
      margin: 0;
    }
    .stats {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      font-size: 0.95rem;
    }
    .stats .value {
      font-variant-numeric: tabular-nums;
      font-weight: 600;
    }
    .board {
      display: grid;
      gap: 12px;
      justify-content: start;
    }
    .board shape-card {
      cursor: pointer;
    }
    .board shape-card[aria-disabled="true"] {
      cursor: default;
      filter: grayscale(0.2) brightness(0.95);
    }
    .message {
      min-height: 1.25rem;
      font-weight: 600;
      color: #0a6b2f;
    }
  </style>
  <div class="container">
    <div class="heading">
      <h2 class="title">Memory Game</h2>
      <div class="stats" aria-live="polite">
        <span>Moves: <span class="value" id="moves">0</span></span>
        <span>Matches: <span class="value" id="matches">0</span></span>
      </div>
    </div>
    <div class="board" role="grid"></div>
    <div class="message" id="message" aria-live="polite"></div>
  </div>
`;

class MemoryGame extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.handleCardClick = this.handleCardClick.bind(this);
        this.rows = 0;
        this.cols = 0;
        this.pairs = 0;
        this.moves = 0;
        this.matches = 0;
        this.firstCard = null;
        this.secondCard = null;
        this.locked = false;
    }

    connectedCallback() {
        this.setup();
    }

    setup() {
        const sizeAttr = this.getAttribute('size') || this.getAttribute('data-size');
        const { rows, cols } = this.parseSize(sizeAttr);
        this.rows = rows;
        this.cols = cols;
        this.pairs = (rows * cols) / 2;
        this.moves = 0;
        this.matches = 0;
        this.firstCard = null;
        this.secondCard = null;
        this.locked = false;

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(memoryGameTemplate.content.cloneNode(true));
        this.boardEl = this.shadowRoot.querySelector('.board');
        this.movesEl = this.shadowRoot.querySelector('#moves');
        this.matchesEl = this.shadowRoot.querySelector('#matches');
        this.messageEl = this.shadowRoot.querySelector('#message');

        this.boardEl.style.gridTemplateColumns = `repeat(${cols}, ${ShapeCard.WIDTH})`;
        this.renderBoard();
        this.setMessage(`Board ${rows} x ${cols}. Find all ${this.pairs} pairs.`);
    }

    parseSize(raw) {
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

    renderBoard() {
        const cardsHtml = ShapeCard.getUniqueRandomCardsAsHTML(this.pairs, true);
        this.boardEl.innerHTML = cardsHtml;
        this.boardEl.setAttribute('aria-label', `Memory board ${this.rows} by ${this.cols}`);

        this.boardEl.querySelectorAll('shape-card').forEach(card => {
            card.dataset.type = card.getAttribute('type');
            card.dataset.colour = card.getAttribute('colour');
            card.dataset.matched = 'false';
            card.addEventListener('click', this.handleCardClick);
        });
        this.updateStats();
    }

  async handleCardClick(event) {
        const card = event.currentTarget;
        if (this.locked || card.dataset.matched === 'true' || card === this.firstCard) {
            return;
        }
        if (card.isFaceUp()) {
            return;
        }

        card.flip();
        this.moves += 1;
        this.updateStats();

        if (!this.firstCard) {
            this.firstCard = card;
            return;
        }

    this.secondCard = card;
    this.locked = true;
    await this.checkMatch();
    }

  async checkMatch() {
        const isMatch = this.firstCard.dataset.type === this.secondCard.dataset.type &&
            this.firstCard.dataset.colour === this.secondCard.dataset.colour;

        if (isMatch) {
      await this.markMatch();
        } else {
            this.resetMismatch();
        }
    }

  async markMatch() {
        [this.firstCard, this.secondCard].forEach(card => {
            card.dataset.matched = 'true';
            card.setAttribute('aria-disabled', 'true');
        });
        this.matches += 1;
        this.updateStats();
        this.clearSelection();

        if (this.matches === this.pairs) {
      this.setMessage(`Completed in ${this.moves} moves.`);
      try {
        await saveResult(this.moves);
      } catch (err) {
        this.setMessage(`Completed in ${this.moves} moves (save failed)`);
        console.error('Failed to save result', err);
      }
        }
        this.locked = false;
    }

    resetMismatch() {
        setTimeout(() => {
            this.firstCard.flip();
            this.secondCard.flip();
            this.clearSelection();
            this.locked = false;
        }, 700);
    }

    clearSelection() {
        this.firstCard = null;
        this.secondCard = null;
    }

    updateStats() {
        this.movesEl.textContent = this.moves.toString();
        this.matchesEl.textContent = `${this.matches}/${this.pairs}`;
    }

    setMessage(text) {
        this.messageEl.textContent = text;
    }
}

customElements.define('memory-game', MemoryGame);

const averageButton = document.getElementById('show-average');
const averageOutput = document.getElementById('average-output');
const averageError = document.getElementById('average-error');

if (averageButton && averageOutput && averageError) {
  averageButton.addEventListener('click', async () => {
    averageButton.disabled = true;
    averageError.textContent = '';
    averageOutput.textContent = 'Loading...';
    try {
      const avg = await getAverageClicks();
      if (avg === null) {
        averageOutput.textContent = 'No data yet';
      } else {
        averageOutput.textContent = `${avg.toFixed(2)} clicks`;
      }
    } catch (err) {
      console.error('Failed to fetch average', err);
      averageError.textContent = 'Failed to fetch average clicks';
      averageOutput.textContent = '';
    } finally {
      averageButton.disabled = false;
      if (averageOutput.textContent === 'Loading...') {
        averageOutput.textContent = '';
      }
    }
  });
}
