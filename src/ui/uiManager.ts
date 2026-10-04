import { GameState } from '../game/gameState';
import { BuildingManager } from '../game/buildingManager';
import { CatManager } from '../game/catManager';
import { BUILDING_CONFIGS, CAT_ROLE_DATA } from '../game/constants';
import { BuildingType, CatRole } from '../game/types';
import confetti from 'canvas-confetti';

export class UIManager {
  private container: HTMLElement;
  private gameState: GameState;
  private buildingManager: BuildingManager;
  private catManager: CatManager;

  constructor(
    container: HTMLElement,
    gameState: GameState,
    buildingManager: BuildingManager,
    catManager: CatManager
  ) {
    this.container = container;
    this.gameState = gameState;
    this.buildingManager = buildingManager;
    this.catManager = catManager;

    this.renderBaseLayout();
    this.attachEvents();
    this.gameState.subscribe(() => this.updateUI());
    this.updateUI();
  }

  private renderBaseLayout(): void {
    this.container.innerHTML = `
      <div id="game-ui-overlay" class="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 overflow-hidden font-sans">
        
        <!-- TOP HEADER: Resources & Kingdom Stats -->
        <header class="pointer-events-auto flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/85 backdrop-blur-md px-6 py-3 rounded-2xl shadow-xl border border-white/40 dark:border-slate-800 transition-all">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-2xl shadow-md shadow-orange-500/20">
              👑
            </div>
            <div>
              <h1 class="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none flex items-center gap-1.5">
                Cat Kingdom <span class="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-bold dark:bg-orange-950/70 dark:text-orange-400">Vương Quốc Mèo</span>
              </h1>
              <div class="flex items-center gap-2 mt-1">
                <span id="day-phase-text" class="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  ☀️ Day 1 (Morning)
                </span>
                <span class="text-slate-300 dark:text-slate-600">•</span>
                <span id="ui-time" class="text-xs font-mono text-slate-400">00:00</span>
              </div>
            </div>
          </div>

          <!-- Resources Strip -->
          <div class="flex items-center gap-2 sm:gap-4 overflow-x-auto py-1">
            <!-- Food -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 rounded-xl">
              <span class="text-xl">🐟</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-amber-700/80 dark:text-amber-400/80 tracking-wider">Cá & Cỏ</div>
                <div id="res-food" class="text-sm font-extrabold text-amber-900 dark:text-amber-200">100</div>
              </div>
            </div>

            <!-- Wood -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 dark:bg-amber-950/30 border border-amber-300/40 rounded-xl">
              <span class="text-xl">🪵</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-yellow-800/80 dark:text-yellow-400/80 tracking-wider">Gỗ</div>
                <div id="res-wood" class="text-sm font-extrabold text-yellow-950 dark:text-yellow-200">120</div>
              </div>
            </div>

            <!-- Stone -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
              <span class="text-xl">🪨</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Đá</div>
                <div id="res-stone" class="text-sm font-extrabold text-slate-800 dark:text-slate-200">80</div>
              </div>
            </div>

            <!-- Metal -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200/60 dark:border-cyan-900/40 rounded-xl">
              <span class="text-xl">⚙️</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-400 tracking-wider">Kim Loại</div>
                <div id="res-metal" class="text-sm font-extrabold text-cyan-950 dark:text-cyan-200">40</div>
              </div>
            </div>

            <!-- Population -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 rounded-xl">
              <span class="text-xl">🐾</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 tracking-wider">Dân Số</div>
                <div id="res-pop" class="text-sm font-extrabold text-rose-950 dark:text-rose-200">3 / 5</div>
              </div>
            </div>

            <!-- Happiness -->
            <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40 rounded-xl">
              <span class="text-xl">😺</span>
              <div>
                <div class="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">Hạnh Phúc</div>
                <div id="res-happiness" class="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">85%</div>
              </div>
            </div>
          </div>

          <!-- Controls: Speed, Save, Load -->
          <div class="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <button id="btn-speed-0" class="speed-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-all" title="Tạm dừng">⏸️</button>
            <button id="btn-speed-1" class="speed-btn px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400 transition-all" title="Tốc độ 1x">1x</button>
            <button id="btn-speed-2" class="speed-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-all" title="Tốc độ 2x">2x</button>
            <button id="btn-speed-3" class="speed-btn px-2.5 py-1 text-xs font-bold rounded-lg transition-all" title="Tốc độ 3x">3x</button>
            <div class="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
            <button id="btn-save" class="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all" title="Lưu game">💾 Lưu</button>
            <button id="btn-load" class="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all" title="Tải game">📂 Tải</button>
            <button id="btn-reset" class="px-2.5 py-1 text-xs font-bold rounded-lg hover:bg-rose-100 text-rose-600 dark:hover:bg-rose-950/60 dark:text-rose-400 transition-all" title="Chơi mới">🔄 Làm lại</button>
          </div>
        </header>

        <!-- MIDDLE AREA: Notifications & Inspector Detail Flyout -->
        <div class="flex-1 flex justify-between items-start my-4 pointer-events-none">
          <!-- Notification Toasts (Left) -->
          <div id="notification-container" class="flex flex-col gap-2 max-w-sm pointer-events-auto">
            <!-- Dynamically populated -->
          </div>

          <!-- Inspector Details Card (Right) -->
          <div id="inspector-card" class="pointer-events-auto hidden w-80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-white/50 dark:border-slate-800 transition-all">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- BOTTOM TOOLBAR: Building Construction Palette -->
        <footer class="pointer-events-auto flex flex-col items-center gap-2">
          <!-- Build instruction banner -->
          <div id="build-guide-banner" class="hidden px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur text-white text-xs font-medium shadow-lg animate-pulse flex items-center gap-2">
            <span>🖱️ Click on the terrain to place building • Press <kbd class="px-1.5 py-0.5 bg-slate-700 rounded text-[10px]">ESC</kbd> to cancel</span>
            <button id="btn-cancel-placement" class="hover:text-rose-400 font-bold ml-1">✕ Hủy</button>
          </div>

          <!-- Catalog Card -->
          <div class="flex items-center gap-2 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-white/40 dark:border-slate-800 max-w-full overflow-x-auto">
            <div class="px-3 py-1 font-bold text-xs uppercase text-slate-400 dark:text-slate-500 tracking-wider hidden sm:block">
              Xây dựng
            </div>

            <!-- Building Buttons -->
            <button data-btype="cat_house" class="build-option-btn group relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 hover:border-amber-300 transition-all">
              <span class="text-2xl group-hover:scale-110 transition-transform">🏡</span>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Nhà Mèo</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">30🪵 10🪨</div>
              </div>
            </button>

            <button data-btype="farm" class="build-option-btn group relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 transition-all">
              <span class="text-2xl group-hover:scale-110 transition-transform">🐟</span>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Nông Trại Cá</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">20🪵</div>
              </div>
            </button>

            <button data-btype="sawmill" class="build-option-btn group relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-yellow-50 dark:bg-slate-800 dark:hover:bg-yellow-950/40 border border-slate-200 dark:border-slate-700 hover:border-yellow-300 transition-all">
              <span class="text-2xl group-hover:scale-110 transition-transform">🪓</span>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Xưởng Gỗ</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">10🪵 15🐟</div>
              </div>
            </button>

            <button data-btype="quarry" class="build-option-btn group relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-slate-400 transition-all">
              <span class="text-2xl group-hover:scale-110 transition-transform">⛏️</span>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Mỏ Khai Thác Đá</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">35🪵 20🐟</div>
              </div>
            </button>

            <button data-btype="workshop" class="build-option-btn group relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-cyan-50 dark:bg-slate-800 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-700 hover:border-cyan-300 transition-all">
              <span class="text-2xl group-hover:scale-110 transition-transform">⚙️</span>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Xưởng Kim Loại</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">45🪵 40🪨</div>
              </div>
            </button>

            <button data-btype="barracks" class="build-option-btn group relative flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-300 transition-all">
              <span class="text-2xl group-hover:scale-110 transition-transform">⚔️</span>
              <div class="text-left">
                <div class="text-xs font-bold text-slate-800 dark:text-slate-100">Doanh Trại Mèo</div>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">60🪵 50🪨 20⚙️</div>
              </div>
            </button>
          </div>
        </footer>

      </div>
    `;
  }

  private attachEvents(): void {
    // Speed buttons
    const speedBtns = [0, 1, 2, 3];
    speedBtns.forEach((speed) => {
      const btn = document.getElementById(`btn-speed-${speed}`);
      btn?.addEventListener('click', () => {
        this.gameState.settings.gameSpeed = speed;
        speedBtns.forEach((s) => {
          const b = document.getElementById(`btn-speed-${s}`);
          if (b) {
            if (s === speed) {
              b.className = 'speed-btn px-2.5 py-1 text-xs font-bold rounded-lg bg-white dark:bg-slate-700 shadow-sm text-amber-600 dark:text-amber-400 transition-all';
            } else {
              b.className = 'speed-btn px-2.5 py-1 text-xs font-bold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all';
            }
          }
        });
      });
    });

    // Save & Load & Reset
    document.getElementById('btn-save')?.addEventListener('click', () => {
      this.gameState.saveToLocalStorage();
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.1 } });
    });

    document.getElementById('btn-load')?.addEventListener('click', () => {
      this.gameState.loadFromLocalStorage();
    });

    document.getElementById('btn-reset')?.addEventListener('click', () => {
      if (confirm('Bắt đầu vương quốc mới từ đầu?')) {
        this.gameState.resetGame();
      }
    });

    // Building palette clicks
    document.querySelectorAll('.build-option-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).getAttribute('data-btype') as BuildingType;
        if (target) {
          this.gameState.activePlacementType = target;
          this.gameState.selectedEntity = null;
          this.updateBuildBanner();
        }
      });
    });

    // Cancel placement
    document.getElementById('btn-cancel-placement')?.addEventListener('click', () => {
      this.gameState.activePlacementType = null;
      this.buildingManager.setGhostPreview(null, 0, 0);
      this.updateBuildBanner();
    });

    // Keyboard ESC to cancel
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.gameState.activePlacementType = null;
        this.gameState.selectedEntity = null;
        this.buildingManager.setGhostPreview(null, 0, 0);
        this.updateBuildBanner();
        this.updateInspector();
      }
    });
  }

  public updateUI(): void {
    const res = this.gameState.resources;

    // Update resources counters
    const foodEl = document.getElementById('res-food');
    const woodEl = document.getElementById('res-wood');
    const stoneEl = document.getElementById('res-stone');
    const metalEl = document.getElementById('res-metal');
    const popEl = document.getElementById('res-pop');
    const happyEl = document.getElementById('res-happiness');

    if (foodEl) foodEl.innerText = Math.floor(res.food).toString();
    if (woodEl) woodEl.innerText = Math.floor(res.wood).toString();
    if (stoneEl) stoneEl.innerText = Math.floor(res.stone).toString();
    if (metalEl) metalEl.innerText = Math.floor(res.metal).toString();
    if (popEl) popEl.innerText = `${this.gameState.cats.size} / ${this.gameState.populationMax}`;
    if (happyEl) happyEl.innerText = `${Math.floor(this.gameState.happiness)}%`;

    // Time & Day cycle
    const dayPhaseEl = document.getElementById('day-phase-text');
    const timeEl = document.getElementById('ui-time');

    const dt = this.gameState.dayTime;
    let phase = 'Buổi Sáng ☀️';
    if (dt > 0.4 && dt < 0.65) phase = 'Buổi Trưa 🌤️';
    else if (dt >= 0.65 && dt < 0.8) phase = 'Hoàng Hôn 🌇';
    else if (dt >= 0.8 || dt < 0.25) phase = 'Ban Đêm 🌙';

    if (dayPhaseEl) dayPhaseEl.innerText = `${phase}`;

    const totalMinutes = Math.floor(this.gameState.gameTime / 60);
    const secs = Math.floor(this.gameState.gameTime % 60);
    if (timeEl) timeEl.innerText = `${String(totalMinutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    this.updateNotifications();
    this.updateInspector();
    this.updateBuildBanner();
  }

  private updateNotifications(): void {
    const container = document.getElementById('notification-container');
    if (!container) return;

    container.innerHTML = this.gameState.notifications
      .map((item) => {
        let border = 'border-amber-400 bg-white/95 dark:bg-slate-900/95';
        if (item.type === 'success') border = 'border-emerald-500 bg-emerald-50/95 dark:bg-emerald-950/90 text-emerald-900 dark:text-emerald-100';
        if (item.type === 'warning') border = 'border-amber-500 bg-amber-50/95 dark:bg-amber-950/90 text-amber-900 dark:text-amber-100';
        if (item.type === 'alert') border = 'border-rose-500 bg-rose-50/95 dark:bg-rose-950/90 text-rose-900 dark:text-rose-100';

        return `
          <div class="px-4 py-2.5 rounded-xl border-l-4 shadow-lg backdrop-blur-md text-xs font-semibold ${border} transition-all transform animate-slide-in">
            ${item.text}
          </div>
        `;
      })
      .join('');
  }

  private updateBuildBanner(): void {
    const banner = document.getElementById('build-guide-banner');
    if (!banner) return;
    if (this.gameState.activePlacementType) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  public updateInspector(): void {
    const card = document.getElementById('inspector-card');
    if (!card) return;

    const sel = this.gameState.selectedEntity;
    if (!sel) {
      card.classList.add('hidden');
      return;
    }

    card.classList.remove('hidden');

    if (sel.type === 'building') {
      const bld = this.gameState.buildings.get(sel.id);
      if (!bld) {
        card.classList.add('hidden');
        return;
      }
      const config = BUILDING_CONFIGS[bld.type];

      // Format workers list
      const workers = bld.assignedWorkerIds
        .map((id) => this.gameState.cats.get(id))
        .filter((c) => !!c);

      card.innerHTML = `
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="text-3xl">${config.icon}</span>
            <div>
              <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100">${config.nameVi}</h3>
              <p class="text-[11px] text-slate-500 dark:text-slate-400">${config.name}</p>
            </div>
          </div>
          <button id="btn-close-inspector" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">✕</button>
        </div>

        <div class="py-3 text-xs text-slate-600 dark:text-slate-300">
          <p class="mb-2 leading-relaxed">${config.description}</p>
          
          <div class="grid grid-cols-2 gap-2 my-2 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase">Trạng Thái:</span>
              <div class="font-bold ${bld.isConstructed ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}">
                ${bld.isConstructed ? 'Hoạt Động' : `Đang xây (${Math.floor(bld.buildProgress * 100)}%)`}
              </div>
            </div>
            <div>
              <span class="text-[10px] text-slate-400 font-bold uppercase">Nhân Lực:</span>
              <div class="font-bold text-slate-700 dark:text-slate-200">
                ${workers.length} / ${config.maxWorkers} Mèo
              </div>
            </div>
          </div>

          ${
            config.maxWorkers > 0
              ? `
            <div class="mt-3">
              <div class="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                <span>Mèo Đang Làm Việc:</span>
                <button id="btn-assign-worker" class="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition-all">
                  + Thêm thợ
                </button>
              </div>
              <div class="space-y-1 max-h-24 overflow-y-auto pr-1">
                ${
                  workers.length === 0
                    ? `<div class="text-slate-400 italic text-[11px]">Chưa có chú mèo nào làm việc ở đây.</div>`
                    : workers
                        .map(
                          (w) => `
                    <div class="flex items-center justify-between bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">
                      <span class="font-medium text-slate-700 dark:text-slate-200 text-xs">🐱 ${w!.name} (${(CAT_ROLE_DATA as any)[w!.role]?.nameVi})</span>
                      <button data-unassign-cat="${w!.id}" class="btn-unassign text-rose-500 hover:text-rose-700 text-xs">✕</button>
                    </div>
                  `
                        )
                        .join('')
                }
              </div>
            </div>
          `
              : ''
          }
        </div>

        <div class="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button id="btn-demolish-building" class="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition-all flex items-center gap-1.5">
            <span>🗑️</span> Phá bỏ công trình
          </button>
        </div>
      `;

      // Event bindings
      document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
        this.gameState.selectedEntity = null;
        this.updateInspector();
      });

      document.getElementById('btn-demolish-building')?.addEventListener('click', () => {
        if (confirm(`Bạn có chắc chắn muốn phá hủy công trình này không?`)) {
          this.buildingManager.demolishBuilding(bld.id);
          this.gameState.selectedEntity = null;
          this.updateInspector();
        }
      });

      document.getElementById('btn-assign-worker')?.addEventListener('click', () => {
        this.assignAvailableCatToBuilding(bld.id);
      });

      card.querySelectorAll('.btn-unassign').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const catId = (e.currentTarget as HTMLElement).getAttribute('data-unassign-cat');
          if (catId) {
            this.unassignCat(catId, bld.id);
          }
        });
      });
    } else if (sel.type === 'cat') {
      const cat = this.gameState.cats.get(sel.id);
      if (!cat) {
        card.classList.add('hidden');
        return;
      }
      const roleInfo = (CAT_ROLE_DATA as any)[cat.role] || CAT_ROLE_DATA.civilian;
      const workplace = cat.workBuildingId ? this.gameState.buildings.get(cat.workBuildingId) : null;
      const wpConfig = workplace ? BUILDING_CONFIGS[workplace.type] : null;

      card.innerHTML = `
        <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="text-3xl">${roleInfo.icon}</span>
            <div>
              <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100">${cat.name}</h3>
              <p class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">${roleInfo.nameVi}</p>
            </div>
          </div>
          <button id="btn-close-inspector" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg">✕</button>
        </div>

        <div class="py-3 text-xs space-y-2.5">
          <p class="text-slate-500 dark:text-slate-400 leading-tight">${roleInfo.description}</p>
          <div class="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg text-amber-800 dark:text-amber-300 font-medium text-[11px]">
            ⚡ <strong>Đặc quyền:</strong> ${roleInfo.bonuses}
          </div>

          <!-- Energy & Happiness Bars -->
          <div>
            <div class="flex justify-between text-[11px] font-semibold mb-1">
              <span>Năng Lượng:</span>
              <span>${Math.floor(cat.energy)}%</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div class="bg-emerald-500 h-full rounded-full transition-all" style="width: ${cat.energy}%"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-[11px] font-semibold mb-1">
              <span>Hạnh Phúc:</span>
              <span>${Math.floor(cat.happiness)}%</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div class="bg-rose-500 h-full rounded-full transition-all" style="width: ${cat.happiness}%"></div>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
            <div class="flex justify-between">
              <span class="text-slate-400">Trạng Thái:</span>
              <span class="font-bold text-slate-700 dark:text-slate-200 capitalize">${this.translateState(cat.state)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Nơi Làm Việc:</span>
              <span class="font-bold text-slate-700 dark:text-slate-200">${wpConfig ? wpConfig.nameVi : 'Chưa phân công'}</span>
            </div>
          </div>

          <!-- Role training option -->
          <div class="mt-3">
            <label class="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">Đổi Chuyên Môn Nghề Nghiệp:</label>
            <select id="select-cat-role" class="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400">
              <option value="civilian" ${cat.role === 'civilian' ? 'selected' : ''}>🐱 Mèo Dân Thường</option>
              <option value="farmer" ${cat.role === 'farmer' ? 'selected' : ''}>🌾 Mèo Nông Dân (+100% Cá)</option>
              <option value="worker" ${cat.role === 'worker' ? 'selected' : ''}>🔨 Mèo Thợ (+75% Khai khoáng)</option>
              <option value="admin" ${cat.role === 'admin' ? 'selected' : ''}>📜 Mèo Quan (-30% Thời gian xây)</option>
              <option value="soldier" ${cat.role === 'soldier' ? 'selected' : ''}>🛡️ Mèo Binh (Bảo vệ bờ cõi)</option>
            </select>
          </div>
        </div>
      `;

      document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
        this.gameState.selectedEntity = null;
        this.updateInspector();
      });

      document.getElementById('select-cat-role')?.addEventListener('change', (e) => {
        const newRole = (e.target as HTMLSelectElement).value as CatRole;
        cat.role = newRole;
        this.gameState.addNotification(`🎓 ${cat.name} đã được thăng chức thành ${(CAT_ROLE_DATA as any)[newRole].nameVi}!`, 'success');
        this.gameState.notifyListeners();
      });
    }
  }

  private translateState(state: string): string {
    switch (state) {
      case 'idle': return 'Thảnh thơi dạo chơi';
      case 'walking': return 'Đang di chuyển';
      case 'working': return 'Đang chăm chỉ làm việc 🔨';
      case 'returning_home': return 'Đang đi về nhà 🏡';
      case 'sleeping': return 'Đang ngủ say zZz';
      default: return state;
    }
  }

  private assignAvailableCatToBuilding(buildingId: string): void {
    const building = this.gameState.buildings.get(buildingId);
    if (!building) return;
    const config = BUILDING_CONFIGS[building.type];

    if (building.assignedWorkerIds.length >= config.maxWorkers) {
      this.gameState.addNotification('⚠️ Nơi này đã đủ số lượng mèo làm việc!', 'warning');
      return;
    }

    // Find cat without work
    let candidate = Array.from(this.gameState.cats.values()).find((c) => !c.workBuildingId);

    // If none, pick any cat from another workplace
    if (!candidate) {
      candidate = Array.from(this.gameState.cats.values()).find((c) => c.workBuildingId !== buildingId);
    }

    if (!candidate) {
      this.gameState.addNotification('⚠️ Không có chú mèo nào sẵn sàng!', 'warning');
      return;
    }

    // Unassign previous if any
    if (candidate.workBuildingId) {
      const prev = this.gameState.buildings.get(candidate.workBuildingId);
      if (prev) {
        prev.assignedWorkerIds = prev.assignedWorkerIds.filter((id) => id !== candidate!.id);
      }
    }

    candidate.workBuildingId = buildingId;
    building.assignedWorkerIds.push(candidate.id);
    this.gameState.addNotification(`😺 Đã phân công chú mèo ${candidate.name} vào ${config.nameVi}!`, 'success');
    this.gameState.notifyListeners();
  }

  private unassignCat(catId: string, buildingId: string): void {
    const cat = this.gameState.cats.get(catId);
    if (cat) cat.workBuildingId = null;

    const building = this.gameState.buildings.get(buildingId);
    if (building) {
      building.assignedWorkerIds = building.assignedWorkerIds.filter((id) => id !== catId);
    }

    this.gameState.notifyListeners();
  }
}
