import { BaseVisualizer } from '../visualizers/base-visualizer';
import { VisualizerManager } from '../visualizers/manager';

export class VisualizerDialog {
  private dialog: HTMLElement | null = null;
  private manager: VisualizerManager | null = null;
  private onReorder: ((fromIndex: number, toIndex: number) => void) | null = null;
  private draggedItem: HTMLElement | null = null;
  private draggedIndex: number = -1;

  constructor() {
    this.createDialog();
  }

  private createDialog(): void {
    this.dialog = document.createElement('div');
    this.dialog.id = 'visualizer-dialog';
    this.dialog.className = 'visualizer-dialog hidden';
    this.dialog.innerHTML = `
      <div class="dialog-header">
        <h3>Visualizers</h3>
        <button class="close-btn" aria-label="Close">&times;</button>
      </div>
      <ul class="visualizer-list"></ul>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .visualizer-dialog {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 0;
        min-width: 280px;
        max-width: 400px;
        z-index: 2000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      }

      .visualizer-dialog.hidden {
        display: none;
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dialog-header h3 {
        margin: 0;
        font-size: 16px;
        color: #fff;
      }

      .close-btn {
        background: none;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        line-height: 1;
      }

      .close-btn:hover {
        opacity: 0.7;
      }

      .visualizer-list {
        list-style: none;
        margin: 0;
        padding: 8px 0;
        max-height: 300px;
        overflow-y: auto;
      }

      .visualizer-item {
        display: flex;
        align-items: center;
        padding: 8px 16px;
        cursor: grab;
        transition: background-color 0.2s;
        user-select: none;
      }

      .visualizer-item:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .visualizer-item.dragging {
        opacity: 0.5;
        background: rgba(255, 255, 255, 0.2);
      }

      .visualizer-item.drag-over {
        border-top: 2px solid #35c023;
      }

      .drag-handle {
        color: rgba(255, 255, 255, 0.4);
        margin-right: 12px;
        cursor: grab;
      }

      .visualizer-toggle {
        background: none;
        border: none;
        color: #35c023;
        font-size: 20px;
        cursor: pointer;
        padding: 0;
        margin-right: 12px;
        line-height: 1;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .visualizer-toggle:hover {
        opacity: 0.7;
      }

      .visualizer-item.disabled .visualizer-toggle {
        color: rgba(255, 255, 255, 0.3);
      }

      .visualizer-name {
        color: #fff;
        flex: 1;
        min-width: 0;
        margin-right: 8px;
      }

      .channel-select {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #fff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        min-width: 120px;
      }

      .channel-select:hover {
        background: rgba(255, 255, 255, 0.15);
      }

      .channel-select option {
        background: #1a1a1a;
        color: #fff;
      }

      .visualizer-item.disabled .visualizer-name {
        opacity: 0.5;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(this.dialog);

    const closeBtn = this.dialog.querySelector('.close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    this.dialog.addEventListener('click', (e) => {
      if (e.target === this.dialog) {
        this.hide();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.dialog?.classList.contains('hidden')) {
        this.hide();
      }
    });
  }

  setManager(manager: VisualizerManager): void {
    this.manager = manager;
    manager.onVisualizersChange(() => this.render());
    this.render();
  }

  setOnReorder(callback: (fromIndex: number, toIndex: number) => void): void {
    this.onReorder = callback;
  }

  show(): void {
    this.dialog?.classList.remove('hidden');
  }

  hide(): void {
    this.dialog?.classList.add('hidden');
  }

  toggle(): void {
    if (this.dialog?.classList.contains('hidden')) {
      this.show();
    } else {
      this.hide();
    }
  }

  render(): void {
    if (!this.dialog || !this.manager) return;

    const list = this.dialog.querySelector('.visualizer-list');
    if (!list) return;

    const visualizers = this.manager.getVisualizers();

    list.innerHTML = visualizers.map((viz, index) => {
      const channels = viz.getMidiChannels();
      const channelDisplay = channels.length === 0 ? 'All' : channels.map(c => c + 1).join(', ');
      return `
      <li class="visualizer-item ${viz.isEnabled() ? '' : 'disabled'}" 
          data-index="${index}" 
          draggable="true">
        <span class="drag-handle">&#9776;</span>
        <button class="visualizer-toggle" data-index="${index}" title="${viz.isEnabled() ? 'Disable' : 'Enable'}">
          ${viz.isEnabled() ? '●' : '○'}
        </button>
        <span class="visualizer-name">${viz.getName()}</span>
        <select class="channel-select" data-index="${index}">
          <option value="all" ${channels.length === 0 ? 'selected' : ''}>All Channels</option>
          ${Array.from({length: 16}, (_, i) => `
            <option value="${i}" ${channels.length === 1 && channels[0] === i ? 'selected' : ''}>Channel ${i + 1}</option>
          `).join('')}
        </select>
      </li>
    `}).join('');

    // Handle toggle button
    list.querySelectorAll('.visualizer-toggle').forEach((button) => {
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drag from starting
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        this.manager?.toggleVisualizer(index);
      });
    });

    // Handle channel selection
    list.querySelectorAll('.channel-select').forEach((select) => {
      select.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent drag from starting
      });
      
      select.addEventListener('change', (e) => {
        e.stopPropagation();
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        const selectEl = e.target as HTMLSelectElement;
        const value = selectEl.value;
        
        // Check if "All Channels" is selected
        if (value === 'all') {
          this.manager?.getVisualizers()[index]?.setMidiChannels([]);
        } else {
          const channel = parseInt(value);
          this.manager?.getVisualizers()[index]?.setMidiChannels([channel]);
        }
        
        // Re-render to update display
        this.render();
      });
    });

    list.querySelectorAll('.visualizer-item').forEach((item) => {
      item.addEventListener('dragstart', (e) => {
        this.draggedItem = item as HTMLElement;
        this.draggedIndex = parseInt(item.getAttribute('data-index') || '0');
        item.classList.add('dragging');
        e.preventDefault();
      });

      item.addEventListener('dragend', () => {
        this.draggedItem?.classList.remove('dragging');
        this.draggedItem = null;
        this.draggedIndex = -1;
        list.querySelectorAll('.visualizer-item').forEach(el => el.classList.remove('drag-over'));
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const target = item as HTMLElement;
        if (target !== this.draggedItem) {
          list.querySelectorAll('.visualizer-item').forEach(el => el.classList.remove('drag-over'));
          target.classList.add('drag-over');
        }
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const targetIndex = parseInt(item.getAttribute('data-index') || '0');
        if (this.draggedIndex !== -1 && this.draggedIndex !== targetIndex && this.onReorder) {
          this.onReorder(this.draggedIndex, targetIndex);
        }
      });
    });
  }
}