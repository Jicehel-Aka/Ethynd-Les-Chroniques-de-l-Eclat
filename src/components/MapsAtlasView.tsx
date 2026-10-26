import { ChangeEvent, MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { exportGamebuinoAkaPackZip } from '../game/akaExporter';
import {
  AUTOTILE_BRUSHES,
  AutotileZoneId,
  applyAutotileRectToLayers,
  repairMapAutotiling,
} from '../game/autotile';
import {
  BESTIARY_CATALOG,
  EQUIPMENT_CATALOG,
  ITEM_CATALOG,
  LORE_CODEX,
  isFlagUnlocked,
  isNpcPresent,
  resolveDoorDenyDialogue,
  resolveNpcDialogue,
} from '../game/content';
import {
  EDITOR_THEMES,
  EditorThemeId,
  PREFAB_STAMPS,
  THEMATIC_TILES,
  UnifiedCatalogSelection,
  renderShapePreviewCanvas,
} from '../game/editorCatalog';
import { exportStandaloneEditorHtml } from '../game/editorHtmlExporter';
import { exportStandaloneSimulationHtml } from '../game/htmlExporter';
import { SpriteBank } from '../game/spriteBank';
import {
  ChestDef,
  Direction,
  DoorDef,
  LangCode,
  MapData,
  MapItemDef,
  NpcDef,
  PlayerProgress,
  SpawnDef,
  SteleDef,
  WorldBundle,
} from '../game/types';

interface MapsAtlasViewProps {
  lang: LangCode;
  world: WorldBundle;
  defaultWorld: WorldBundle;
  sprites: SpriteBank;
  progress: PlayerProgress;
  selectedMapName: string;
  onSelectMapName: (name: string) => void;
  onUpdateWorld: (next: WorldBundle) => void;
  onTeleportToMap: (mapName: string, wx: number, wy: number) => void;
  onBackToPlay: () => void;
}

type ZoomMode = 'fit' | '50' | '100' | '150';
type AtlasMode = 'inspect' | 'edit';
type EditorTool = 'autotile' | 'autotile_rect' | 'stamp' | 'brush' | 'eyedropper' | 'eraser';

type InspectedTarget =
  | { kind: 'door'; door: DoorDef; idx: number }
  | { kind: 'npc'; npc: NpcDef }
  | { kind: 'spawn'; spawn: SpawnDef; idx: number }
  | { kind: 'chest'; chest: ChestDef }
  | { kind: 'stele'; stele: SteleDef }
  | { kind: 'item'; item: MapItemDef; idx: number }
  | {
      kind: 'tile';
      tx: number;
      ty: number;
      wx: number;
      wy: number;
      tiles: number[];
      blocked: boolean;
    };

function decodeMask(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function findSafeArrivalPoint(map: MapData, world: WorldBundle): { wx: number; wy: number } {
  if (map.name === 'maison') {
    return { wx: 306, wy: 160 };
  }
  for (const other of world.maps) {
    for (const d of other.doors) {
      if (d.map === map.name) {
        return { wx: d.dx, wy: d.dy };
      }
    }
  }
  return { wx: Math.floor((map.w * 32) / 2), wy: Math.floor((map.h * 32) / 2) };
}

function triggerBlobDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ShapeThumb({
  selection,
  sprites,
  tileCols,
  maxBoxPx = 52,
}: {
  selection: UnifiedCatalogSelection | { kind: 'raw_tile'; tid: number };
  sprites: SpriteBank;
  tileCols: number;
  maxBoxPx?: number;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!ref.current) return;
    renderShapePreviewCanvas(ref.current, selection, sprites, tileCols, maxBoxPx);
  }, [selection, sprites, tileCols, maxBoxPx]);
  return <canvas ref={ref} className="pixel-canvas block rounded border border-slate-800/80" />;
}

export function MapsAtlasView({
  lang,
  world,
  defaultWorld,
  sprites,
  progress,
  selectedMapName,
  onSelectMapName,
  onUpdateWorld,
  onTeleportToMap,
  onBackToPlay,
}: MapsAtlasViewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paletteCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isPaintingRef = useRef(false);
  const lastPaintedCellRef = useRef<string | null>(null);

  const [mode, setMode] = useState<AtlasMode>('inspect');
  const [zoom, setZoom] = useState<ZoomMode>('fit');
  const [showDoors, setShowDoors] = useState(true);
  const [showNpcs, setShowNpcs] = useState(true);
  const [showMonsters, setShowMonsters] = useState(true);
  const [showLoot, setShowLoot] = useState(true);
  const [showCanopy, setShowCanopy] = useState(true);
  const [showCollisions, setShowCollisions] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [inspected, setInspected] = useState<InspectedTarget | null>(null);

  // Level Editor State (Autotiling + Visual Shape Preview + Thematic Palette + Dropdown by Name)
  const [tool, setTool] = useState<EditorTool>('autotile');
  const [activeTheme, setActiveTheme] = useState<EditorThemeId>('autotile');
  const [activeAutotileZone, setActiveAutotileZone] = useState<AutotileZoneId>('forest');
  const [autotileErase, setAutotileErase] = useState<boolean>(false);
  const [rectDragStart, setRectDragStart] = useState<{ tx: number; ty: number } | null>(null);
  const [activeLayer, setActiveLayer] = useState<0 | 1 | 2 | 3>(2);
  const [selectedTileId, setSelectedTileId] = useState<number>(642);
  const [selectedStampId, setSelectedStampId] = useState<string>('tree_oak');
  const [eraseAllUpper, setEraseAllUpper] = useState<boolean>(false);
  const [hoverCell, setHoverCell] = useState<{ tx: number; ty: number } | null>(null);
  const [undoStack, setUndoStack] = useState<WorldBundle[]>([]);
  const [editorNotice, setEditorNotice] = useState<string | null>(null);

  const activeMap = useMemo(
    () => world.maps.find((m) => m.name === selectedMapName) || world.maps[0],
    [world.maps, selectedMapName]
  );

  const activeStamp = useMemo(
    () => PREFAB_STAMPS.find((s) => s.id === selectedStampId) || PREFAB_STAMPS[0],
    [selectedStampId]
  );

  const activeAutotileBrush = useMemo(
    () => AUTOTILE_BRUSHES.find((b) => b.id === activeAutotileZone) || AUTOTILE_BRUSHES[0],
    [activeAutotileZone]
  );

  const maxTileId = useMemo(() => {
    const rows = Math.floor((sprites.tileset.height || 3040) / 32);
    return rows * world.tileCols - 1;
  }, [sprites.tileset.height, world.tileCols]);

  // Unified dropdown value so choosing by name OR clicking in the thematic palette stay in sync
  const dropdownSelectValue = useMemo(() => {
    if (tool === 'autotile' || tool === 'autotile_rect') {
      return `auto:${activeAutotileZone}`;
    }
    if (tool === 'stamp') {
      return `stamp:${activeStamp.id}`;
    }
    const matchingThemeTile = THEMATIC_TILES.find((t) => t.tid === selectedTileId);
    if (matchingThemeTile) {
      return `tile:${matchingThemeTile.id}`;
    }
    return `auto:${activeAutotileZone}`;
  }, [tool, activeAutotileZone, activeStamp.id, selectedTileId]);

  const currentPreviewSelection = useMemo<
    UnifiedCatalogSelection | { kind: 'raw_tile'; tid: number }
  >(() => {
    if (tool === 'autotile' || tool === 'autotile_rect') {
      return { kind: 'autotile', zone: activeAutotileZone, brush: activeAutotileBrush };
    }
    if (tool === 'stamp') {
      return { kind: 'stamp', stamp: activeStamp };
    }
    return { kind: 'raw_tile', tid: selectedTileId };
  }, [tool, activeAutotileZone, activeAutotileBrush, activeStamp, selectedTileId]);

  // Prebuild 32x32 crimson collision overlay canvases for masked tiles
  const maskOverlays = useMemo(() => {
    const map = new Map<number, HTMLCanvasElement>();
    for (const [k, b64] of Object.entries(world.masks)) {
      const tid = Number(k);
      const bytes = decodeMask(b64);
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d')!;
      const img = ctx.getImageData(0, 0, 32, 32);
      for (let y = 0; y < 32; y++) {
        const rowOff = y * 4;
        for (let x = 0; x < 32; x++) {
          const bit = (bytes[rowOff + (x >> 3)] >> (7 - (x & 7))) & 1;
          if (bit) {
            const p = (y * 32 + x) * 4;
            img.data[p] = 244;
            img.data[p + 1] = 63;
            img.data[p + 2] = 94;
            img.data[p + 3] = 135;
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      map.set(tid, c);
    }
    return map;
  }, [world.masks]);

  const tilePx = useMemo(() => {
    if (zoom === '50') return 16;
    if (zoom === '100') return 32;
    if (zoom === '150') return 48;
    const maxW = Math.floor(780 / activeMap.w);
    const maxH = Math.floor(620 / activeMap.h);
    return Math.max(8, Math.min(36, Math.min(maxW, maxH)));
  }, [zoom, activeMap.w, activeMap.h]);

  useEffect(() => {
    setInspected(null);
    setHoverCell(null);
    setRectDragStart(null);
  }, [activeMap.name]);

  const showTimedNotice = useCallback((msg: string) => {
    setEditorNotice(msg);
    window.setTimeout(() => {
      setEditorNotice((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  // Render full 40-column Tileset Sheet Drawer when in Edit Mode + Brush tool
  useEffect(() => {
    if (mode !== 'edit' || tool !== 'brush') return;
    const pCanvas = paletteCanvasRef.current;
    if (!pCanvas) return;
    const cols = world.tileCols;
    const rows = Math.floor((sprites.tileset.height || 3040) / 32);
    pCanvas.width = cols * 16;
    pCanvas.height = rows * 16;
    const ctx = pCanvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#090d14';
    ctx.fillRect(0, 0, pCanvas.width, pCanvas.height);
    ctx.drawImage(sprites.tileset, 0, 0, cols * 32, rows * 32, 0, 0, cols * 16, rows * 16);

    if (selectedTileId >= 0) {
      const sx = (selectedTileId % cols) * 16;
      const sy = Math.floor(selectedTileId / cols) * 16;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, sy + 1, 14, 14);
    }
  }, [mode, tool, selectedTileId, sprites.tileset, world.tileCols]);

  // Render Main Map Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const wPx = activeMap.w * tilePx;
    const hPx = activeMap.h * tilePx;
    canvas.width = wPx;
    canvas.height = hPx;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const [br, bg, bb] = activeMap.bgColor;
    ctx.fillStyle = `rgb(${br},${bg},${bb})`;
    ctx.fillRect(0, 0, wPx, hPx);

    const scale = tilePx / 32;
    const drawTile = (tid: number, dx: number, dy: number) => {
      if (tid < 0) return;
      const sx = (tid % world.tileCols) * 32;
      const sy = Math.floor(tid / world.tileCols) * 32;
      ctx.drawImage(sprites.tileset, sx, sy, 32, 32, dx, dy, tilePx, tilePx);
    };

    const resolveNpcPos = (n: NpcDef) => {
      if (n.blockUntilFlag && isFlagUnlocked(progress, n.blockUntilFlag)) {
        return { x: n.openX ?? n.x, y: n.openY ?? n.y };
      }
      return { x: n.x, y: n.y };
    };

    for (let ty = 0; ty < activeMap.h; ty++) {
      const dy = ty * tilePx;
      for (let tx = 0; tx < activeMap.w; tx++) {
        const dx = tx * tilePx;
        for (let l = 0; l <= 2; l++) {
          const tid = activeMap.layers[l][ty][tx];
          if (tid < 0) continue;
          if (tid === 2576) {
            const torchSpr = sprites.torchStand[0];
            if (torchSpr) {
              ctx.drawImage(
                torchSpr,
                dx,
                dy - Math.round(tilePx * 0.25),
                tilePx,
                Math.round(tilePx * 1.25)
              );
            }
          } else {
            drawTile(tid, dx, dy);
            if (tid === 2573 && sprites.brazierFlame[0]) {
              ctx.drawImage(sprites.brazierFlame[0], dx, dy, tilePx, tilePx);
            }
          }
        }
      }
    }

    if (showLoot) {
      for (const c of activeMap.chests) {
        const opened = Boolean(progress.openedChests[c.id]);
        const chestSpr = opened ? sprites.chestOpen : sprites.chestClosed;
        const cw = Math.max(10, Math.round(40 * scale));
        const ch = Math.max(8, Math.round(32 * scale));
        const cx = Math.round((c.x - 4) * scale);
        const cy = Math.round(c.y * scale);
        ctx.drawImage(chestSpr, cx, cy, cw, ch);
        ctx.strokeStyle = opened ? '#64748b' : '#fbbf24';
        ctx.lineWidth = Math.max(1.5, scale * 1.5);
        ctx.strokeRect(cx, cy, cw, ch);
      }

      for (const st of activeMap.steles) {
        drawTile(st.tile, Math.round(st.x * scale), Math.round(st.y * scale));
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = Math.max(1.5, scale * 1.5);
        ctx.strokeRect(
          Math.round(st.x * scale),
          Math.round(st.y * scale),
          Math.max(8, tilePx),
          Math.max(8, tilePx)
        );
      }

      for (const it of activeMap.items) {
        const icon = sprites.items[it.id] || sprites.items.potion;
        const sz = Math.max(10, Math.round(26 * scale));
        const ix = Math.round((it.x + 3) * scale);
        const iy = Math.round((it.y + 3) * scale);
        ctx.drawImage(icon, ix, iy, sz, sz);
      }
    }

    if (activeMap.name === 'chateau' && sprites.throne) {
      ctx.drawImage(
        sprites.throne,
        Math.round(552 * scale),
        Math.round(80 * scale),
        Math.max(16, Math.round(48 * scale)),
        Math.max(16, Math.round(48 * scale))
      );
    }

    if (showNpcs) {
      for (const n of activeMap.npcs) {
        const present = isNpcPresent(progress, n);
        if (!present && mode !== 'edit') continue;
        const pos = resolveNpcPos(n);
        const set = sprites.npcs[n.type] || sprites.npcs.sage;
        const spr = set[n.dir] || set[Direction.Bas];
        const nw = Math.max(12, Math.round(32 * scale));
        const nh = Math.max(14, Math.round(36 * scale));
        const nx = Math.round(pos.x * scale);
        const ny = Math.round(pos.y * scale);
        ctx.save();
        if (!present) ctx.globalAlpha = 0.35;
        ctx.drawImage(spr, nx, ny - Math.round(4 * scale), nw, nh);
        ctx.strokeStyle = present ? '#34d399' : '#94a3b8';
        ctx.lineWidth = Math.max(1.5, scale * 1.3);
        ctx.strokeRect(nx, ny, nw, nw);
        ctx.restore();
      }
    }

    if (showMonsters) {
      for (const sp of activeMap.spawns) {
        const anim = sprites.monsters[sp.type];
        if (!anim) continue;
        const spr = anim.walk[Direction.Bas][0];
        const sz = Math.max(10, Math.round(anim.size * scale));
        const mx = Math.round(sp.x * scale);
        const my = Math.round(sp.y * scale);
        ctx.drawImage(spr, mx, my, sz, sz);
        if (sp.ai === 'boss') {
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = Math.max(2, scale * 2);
          ctx.strokeRect(mx - 2, my - 2, sz + 4, sz + 4);
        }
      }
    }

    if (showCanopy) {
      for (let ty = 0; ty < activeMap.h; ty++) {
        const dy = ty * tilePx;
        for (let tx = 0; tx < activeMap.w; tx++) {
          const tid = activeMap.layers[3][ty][tx];
          if (tid >= 0) drawTile(tid, tx * tilePx, dy);
        }
      }
    }

    if (showCollisions) {
      for (let ty = 0; ty < activeMap.h; ty++) {
        const dy = ty * tilePx;
        for (let tx = 0; tx < activeMap.w; tx++) {
          const dx = tx * tilePx;
          for (let l = 0; l < 3; l++) {
            const tid = activeMap.layers[l][ty][tx];
            if (tid < 0) continue;
            const ov = maskOverlays.get(tid);
            if (ov) ctx.drawImage(ov, 0, 0, 32, 32, dx, dy, tilePx, tilePx);
          }
        }
      }
    }

    if (showGrid || mode === 'edit') {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = 1;
      for (let tx = 0; tx <= activeMap.w; tx++) {
        const x = tx * tilePx + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, hPx);
        ctx.stroke();
      }
      for (let ty = 0; ty <= activeMap.h; ty++) {
        const y = ty * tilePx + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(wPx, y);
        ctx.stroke();
      }
    }

    if (showDoors) {
      activeMap.doors.forEach((d, idx) => {
        const locked = !isFlagUnlocked(progress, d.reqFlag);
        const dx = Math.round(d.x * scale);
        const dy = Math.round(d.y * scale);
        const dw = Math.max(10, Math.round(d.w * scale));
        const dh = Math.max(10, Math.round(d.h * scale));
        ctx.fillStyle = locked ? 'rgba(244, 63, 94, 0.28)' : 'rgba(56, 189, 248, 0.28)';
        ctx.fillRect(dx, dy, dw, dh);
        ctx.strokeStyle = locked ? '#fb7185' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(dx, dy, dw, dh);

        ctx.fillStyle = '#090d16';
        ctx.fillRect(dx, Math.max(0, dy - 16), 22, 15);
        ctx.fillStyle = locked ? '#fda4af' : '#7dd3fc';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(`P${idx + 1}`, dx + 3, Math.max(11, dy - 5));
      });
    }

    // Live Editor Footprint / Rectangle Zone Preview
    if (mode === 'edit' && hoverCell) {
      if (tool === 'autotile_rect' && rectDragStart) {
        const x0 = Math.min(rectDragStart.tx, hoverCell.tx);
        const y0 = Math.min(rectDragStart.ty, hoverCell.ty);
        const x1 = Math.max(rectDragStart.tx, hoverCell.tx);
        const y1 = Math.max(rectDragStart.ty, hoverCell.ty);
        ctx.fillStyle = autotileErase
          ? 'rgba(244, 63, 94, 0.22)'
          : 'rgba(251, 191, 36, 0.22)';
        ctx.fillRect(x0 * tilePx, y0 * tilePx, (x1 - x0 + 1) * tilePx, (y1 - y0 + 1) * tilePx);
        ctx.strokeStyle = autotileErase ? '#fb7185' : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x0 * tilePx + 1,
          y0 * tilePx + 1,
          (x1 - x0 + 1) * tilePx - 2,
          (y1 - y0 + 1) * tilePx - 2
        );
      } else {
        const footW = tool === 'stamp' ? activeStamp.w : 1;
        const footH = tool === 'stamp' ? activeStamp.h : 1;
        if (tool === 'stamp') {
          ctx.save();
          ctx.globalAlpha = 0.72;
          for (const c of activeStamp.cells) {
            const tx = hoverCell.tx + c.dx;
            const ty = hoverCell.ty + c.dy;
            if (tx < 0 || ty < 0 || tx >= activeMap.w || ty >= activeMap.h) continue;
            if (c.tid >= 0) drawTile(c.tid, tx * tilePx, ty * tilePx);
          }
          ctx.restore();
        } else if (tool === 'brush' && selectedTileId >= 0) {
          ctx.save();
          ctx.globalAlpha = 0.72;
          drawTile(selectedTileId, hoverCell.tx * tilePx, hoverCell.ty * tilePx);
          ctx.restore();
        } else if (tool === 'autotile' && !autotileErase) {
          ctx.save();
          ctx.globalAlpha = 0.72;
          drawTile(activeAutotileBrush.preview3x3[1][1], hoverCell.tx * tilePx, hoverCell.ty * tilePx);
          ctx.restore();
        }

        ctx.strokeStyle =
          tool === 'eraser' || ((tool === 'autotile' || tool === 'autotile_rect') && autotileErase)
            ? '#fb7185'
            : '#fbbf24';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          hoverCell.tx * tilePx + 1,
          hoverCell.ty * tilePx + 1,
          footW * tilePx - 2,
          footH * tilePx - 2
        );
      }
    }

    if (progress.currentMap === activeMap.name) {
      const px = Math.round(progress.wx * scale);
      const py = Math.round(progress.wy * scale);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(px, py, Math.max(5, Math.round(8 * scale)), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [
    activeMap,
    tilePx,
    world.tileCols,
    sprites,
    progress,
    mode,
    tool,
    activeStamp,
    activeAutotileBrush,
    autotileErase,
    rectDragStart,
    selectedTileId,
    hoverCell,
    showDoors,
    showNpcs,
    showMonsters,
    showLoot,
    showCanopy,
    showCollisions,
    showGrid,
    maskOverlays,
  ]);

  const coordsFromMouse = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    const wx = Math.round((cx / tilePx) * 32);
    const wy = Math.round((cy / tilePx) * 32);
    const tx = Math.max(0, Math.min(activeMap.w - 1, Math.floor(cx / tilePx)));
    const ty = Math.max(0, Math.min(activeMap.h - 1, Math.floor(cy / tilePx)));
    return { wx, wy, tx, ty };
  };

  const applyEditAt = useCallback(
    (tx: number, ty: number, recordUndo: boolean) => {
      if (tool === 'eyedropper') {
        for (const l of [3, 2, 1, 0] as const) {
          const tid = activeMap.layers[l][ty][tx];
          if (tid >= 0) {
            setSelectedTileId(tid);
            setActiveLayer(l);
            setTool('brush');
            showTimedNotice(
              lang === 'fr'
                ? `Tuile #${tid} échantillonnée sur la couche L${l}.`
                : `Sampled tile #${tid} on layer L${l}.`
            );
            return;
          }
        }
        return;
      }

      if (recordUndo) {
        setUndoStack((prev) => [...prev.slice(-29), structuredClone(world)]);
      }

      const nextWorld: WorldBundle = {
        ...world,
        maps: world.maps.map((m) => {
          if (m.name !== activeMap.name) return m;
          if (tool === 'autotile') {
            const nextLayers = applyAutotileRectToLayers(
              m.layers,
              m.w,
              m.h,
              activeAutotileZone,
              tx,
              ty,
              tx,
              ty,
              autotileErase
            );
            return { ...m, layers: nextLayers };
          }
          const nextLayers = m.layers.map((layer) => layer.map((row) => [...row]));
          if (tool === 'stamp') {
            for (const c of activeStamp.cells) {
              const cx = tx + c.dx;
              const cy = ty + c.dy;
              if (cx >= 0 && cy >= 0 && cx < m.w && cy < m.h) {
                nextLayers[c.layer][cy][cx] = c.tid;
              }
            }
          } else if (tool === 'brush') {
            nextLayers[activeLayer][ty][tx] = selectedTileId;
          } else if (tool === 'eraser') {
            if (eraseAllUpper) {
              nextLayers[1][ty][tx] = -1;
              nextLayers[2][ty][tx] = -1;
              nextLayers[3][ty][tx] = -1;
            } else {
              nextLayers[activeLayer][ty][tx] = -1;
            }
          }
          return { ...m, layers: nextLayers };
        }),
      };

      onUpdateWorld(nextWorld);
    },
    [
      tool,
      activeMap,
      world,
      activeAutotileZone,
      autotileErase,
      activeStamp,
      activeLayer,
      selectedTileId,
      eraseAllUpper,
      onUpdateWorld,
      showTimedNotice,
      lang,
    ]
  );

  const inspectAt = (wx: number, wy: number, tx: number, ty: number) => {
    for (let i = 0; i < activeMap.doors.length; i++) {
      const d = activeMap.doors[i];
      if (wx >= d.x - 8 && wx <= d.x + d.w + 8 && wy >= d.y - 8 && wy <= d.y + d.h + 8) {
        setInspected({ kind: 'door', door: d, idx: i });
        return;
      }
    }
    for (const npc of activeMap.npcs) {
      if (!isNpcPresent(progress, npc)) continue;
      const unlocked = npc.blockUntilFlag && isFlagUnlocked(progress, npc.blockUntilFlag);
      const posX = unlocked ? npc.openX ?? npc.x : npc.x;
      const posY = unlocked ? npc.openY ?? npc.y : npc.y;
      if (wx >= posX - 6 && wx <= posX + 38 && wy >= posY - 6 && wy <= posY + 38) {
        setInspected({ kind: 'npc', npc });
        return;
      }
    }
    for (const chest of activeMap.chests) {
      if (wx >= chest.x - 8 && wx <= chest.x + 42 && wy >= chest.y - 6 && wy <= chest.y + 38) {
        setInspected({ kind: 'chest', chest });
        return;
      }
    }
    for (const stele of activeMap.steles) {
      if (wx >= stele.x - 6 && wx <= stele.x + 38 && wy >= stele.y - 6 && wy <= stele.y + 38) {
        setInspected({ kind: 'stele', stele });
        return;
      }
    }
    for (let i = 0; i < activeMap.items.length; i++) {
      const item = activeMap.items[i];
      if (wx >= item.x - 6 && wx <= item.x + 38 && wy >= item.y - 6 && wy <= item.y + 38) {
        setInspected({ kind: 'item', item, idx: i });
        return;
      }
    }
    for (let i = 0; i < activeMap.spawns.length; i++) {
      const sp = activeMap.spawns[i];
      const sz = sprites.monsters[sp.type]?.size || 32;
      if (wx >= sp.x - 4 && wx <= sp.x + sz + 4 && wy >= sp.y - 4 && wy <= sp.y + sz + 4) {
        setInspected({ kind: 'spawn', spawn: sp, idx: i });
        return;
      }
    }

    const tiles = [0, 1, 2, 3].map((l) => activeMap.layers[l][ty][tx]);
    const blocked = [0, 1, 2].some((l) => maskOverlays.has(activeMap.layers[l][ty][tx]));
    setInspected({ kind: 'tile', tx, ty, wx, wy, tiles, blocked });
  };

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = coordsFromMouse(e);
    if (!pos) return;
    if (mode === 'inspect') {
      inspectAt(pos.wx, pos.wy, pos.tx, pos.ty);
      return;
    }
    isPaintingRef.current = true;
    if (tool === 'autotile_rect') {
      setRectDragStart({ tx: pos.tx, ty: pos.ty });
      return;
    }
    lastPaintedCellRef.current = `${pos.tx},${pos.ty}`;
    applyEditAt(pos.tx, pos.ty, true);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const pos = coordsFromMouse(e);
    if (!pos) return;
    setHoverCell((prev) =>
      prev && prev.tx === pos.tx && prev.ty === pos.ty ? prev : { tx: pos.tx, ty: pos.ty }
    );
    if (
      mode === 'edit' &&
      isPaintingRef.current &&
      (tool === 'autotile' || tool === 'brush' || tool === 'eraser')
    ) {
      const key = `${pos.tx},${pos.ty}`;
      if (lastPaintedCellRef.current !== key) {
        lastPaintedCellRef.current = key;
        applyEditAt(pos.tx, pos.ty, false);
      }
    }
  };

  const handleMouseUp = () => {
    if (mode === 'edit' && isPaintingRef.current && tool === 'autotile_rect' && rectDragStart && hoverCell) {
      setUndoStack((prev) => [...prev.slice(-29), structuredClone(world)]);
      const nextWorld: WorldBundle = {
        ...world,
        maps: world.maps.map((m) => {
          if (m.name !== activeMap.name) return m;
          return {
            ...m,
            layers: applyAutotileRectToLayers(
              m.layers,
              m.w,
              m.h,
              activeAutotileZone,
              rectDragStart.tx,
              rectDragStart.ty,
              hoverCell.tx,
              hoverCell.ty,
              autotileErase
            ),
          };
        }),
      };
      onUpdateWorld(nextWorld);
    }
    isPaintingRef.current = false;
    lastPaintedCellRef.current = null;
    setRectDragStart(null);
  };

  const handlePaletteClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const pCanvas = paletteCanvasRef.current;
    if (!pCanvas) return;
    const rect = pCanvas.getBoundingClientRect();
    const scaleX = pCanvas.width / rect.width;
    const scaleY = pCanvas.height / rect.height;
    const col = Math.floor(((e.clientX - rect.left) * scaleX) / 16);
    const row = Math.floor(((e.clientY - rect.top) * scaleY) / 16);
    const tid = row * world.tileCols + col;
    if (tid >= 0 && tid <= maxTileId) {
      setSelectedTileId(tid);
    }
  };

  const handleDropdownCatalogChange = (val: string) => {
    const [kind, id] = val.split(':');
    if (kind === 'auto') {
      const z = id as AutotileZoneId;
      setActiveAutotileZone(z);
      setActiveTheme('autotile');
      if (tool !== 'autotile_rect') setTool('autotile');
    } else if (kind === 'stamp') {
      const st = PREFAB_STAMPS.find((s) => s.id === id);
      if (st) {
        setSelectedStampId(st.id);
        setActiveTheme(st.theme);
        setTool('stamp');
      }
    } else if (kind === 'tile') {
      const ti = THEMATIC_TILES.find((t) => t.id === id);
      if (ti) {
        setSelectedTileId(ti.tid);
        setActiveLayer(ti.recommendedLayer);
        setActiveTheme(ti.theme);
        setTool('brush');
      }
    }
  };

  const handleRepairMapAutotile = () => {
    setUndoStack((prev) => [...prev.slice(-29), structuredClone(world)]);
    let totalFixed = 0;
    const nextWorld: WorldBundle = {
      ...world,
      maps: world.maps.map((m) => {
        if (m.name !== activeMap.name) return m;
        const res = repairMapAutotiling(m);
        totalFixed = res.fixedCount;
        return res.map;
      }),
    };
    onUpdateWorld(nextWorld);
    showTimedNotice(
      lang === 'fr'
        ? `Auto-tiling recalculé sur « ${activeMap.titleFr} » (${totalFixed} raccords ajustés).`
        : `Recomputed autotiling on "${activeMap.titleEn}" (${totalFixed} transitions refined).`
    );
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    onUpdateWorld(prev);
    showTimedNotice(lang === 'fr' ? 'Dernière modification annulée.' : 'Undid last edit.');
  };

  const handleResetActiveMap = () => {
    const orig = defaultWorld.maps.find((m) => m.name === activeMap.name);
    if (!orig) return;
    setUndoStack((prev) => [...prev.slice(-29), structuredClone(world)]);
    const nextWorld: WorldBundle = {
      ...world,
      maps: world.maps.map((m) => (m.name === activeMap.name ? structuredClone(orig) : m)),
    };
    onUpdateWorld(nextWorld);
    showTimedNotice(
      lang === 'fr'
        ? `Carte « ${activeMap.titleFr} » restaurée à sa version d'origine.`
        : `Restored "${activeMap.titleEn}" to its default layout.`
    );
  };

  const handleExportWorldJson = () => {
    triggerBlobDownload(
      'world_expanded.json',
      new Blob([JSON.stringify(world)], { type: 'application/json' })
    );
    showTimedNotice(
      lang === 'fr'
        ? 'Fichier world_expanded.json exporté (à placer dans public/ethynd/world_expanded.json).'
        : 'Exported world_expanded.json (place inside public/ethynd/world_expanded.json).'
    );
  };

  const handleExportStandaloneEditorHtml = () => {
    const html = exportStandaloneEditorHtml(world, sprites, lang);
    triggerBlobDownload(
      'editeur_niveaux_ethynd.html',
      new Blob([html], { type: 'text/html;charset=utf-8' })
    );
    showTimedNotice(
      lang === 'fr'
        ? 'Éditeur de niveaux HTML autonome exporté (fichier unique .html avec tuiles, auto-tiling et palette thématique intégrés).'
        : 'Exported self-contained HTML Level Editor (.html with embedded tileset, autotiling, and thematic palette).'
    );
  };

  const handleExportStandaloneGameHtml = () => {
    const html = exportStandaloneSimulationHtml(world, sprites, progress, lang);
    triggerBlobDownload(
      'ethynd_chroniques_standalone.html',
      new Blob([html], { type: 'text/html;charset=utf-8' })
    );
    showTimedNotice(
      lang === 'fr'
        ? 'Jeu complet HTML autonome exporté avec vos 11 niveaux actuels.'
        : 'Exported self-contained standalone HTML game with all 11 current maps.'
    );
  };

  const handleExportAkaZip = () => {
    const zipBlob = exportGamebuinoAkaPackZip(world, sprites);
    triggerBlobDownload('ethynd_gamebuino_aka_pack.zip', zipBlob);
    showTimedNotice(
      lang === 'fr'
        ? 'Pack Gamebuino AKA exporté : Firmware C++ (.ino) + SD_CARD/ETHYND/ (WORLD.BIN, TILESET.565, SPRITES.565).'
        : 'Exported Gamebuino AKA Pack: C++ Firmware (.ino) + SD_CARD/ETHYND/ (WORLD.BIN, TILESET.565, SPRITES.565).'
    );
  };

  const handleImportWorldJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as WorldBundle;
      if (
        !parsed ||
        !Array.isArray(parsed.maps) ||
        parsed.maps.length === 0 ||
        typeof parsed.tileCols !== 'number'
      ) {
        throw new Error('Invalid format');
      }
      setUndoStack((prev) => [...prev.slice(-29), structuredClone(world)]);
      onUpdateWorld(parsed);
      showTimedNotice(
        lang === 'fr'
          ? `Bundle importé avec succès (${parsed.maps.length} cartes chargées en direct).`
          : `Successfully imported world bundle (${parsed.maps.length} live maps loaded).`
      );
    } catch {
      showTimedNotice(
        lang === 'fr'
          ? 'Fichier JSON invalide : structure WorldBundle attendue.'
          : 'Invalid JSON file: expected WorldBundle format.'
      );
    }
  };

  const arrival = findSafeArrivalPoint(activeMap, world);
  const totalChests = world.maps.reduce((acc, m) => acc + m.chests.length, 0);
  const totalSteles = world.maps.reduce((acc, m) => acc + m.steles.length, 0);
  const totalSpawns = world.maps.reduce((acc, m) => acc + m.spawns.length, 0);

  return (
    <main className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            {lang === 'fr'
              ? "Atlas & Éditeur de Niveaux d'Ethynd (Auto-Tiling · HTML · Gamebuino AKA)"
              : 'Cartographic Atlas & Level Editor of Ethynd'}
          </h1>
          <p className="text-sm text-slate-400 mt-1 tabular-nums">
            {world.maps.length} {lang === 'fr' ? 'cartes interconnectées' : 'interconnected maps'} ·{' '}
            {totalSpawns} {lang === 'fr' ? 'créatures placées' : 'spawn points'} · {totalChests}{' '}
            {lang === 'fr' ? 'coffres' : 'chests'} · {totalSteles}{' '}
            {lang === 'fr' ? 'stèles anciennes' : 'lore steles'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setMode('inspect')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'inspect'
                  ? 'bg-slate-800 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Mode Inspecteur' : 'Inspector Mode'}
            </button>
            <button
              type="button"
              onClick={() => setMode('edit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                mode === 'edit'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang === 'fr' ? 'Éditeur de Niveau' : 'Level Editor'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onTeleportToMap(activeMap.name, arrival.wx, arrival.wy)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'fr' ? 'Tester cette carte en jeu' : 'Test Map in Game'}
          </button>
          <button
            type="button"
            onClick={onBackToPlay}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'fr' ? 'Retour au jeu' : 'Return to Game'}
          </button>
        </div>
      </div>

      {editorNotice && (
        <div className="mb-5 px-4 py-2.5 rounded-lg bg-slate-900 border border-amber-500/40 text-xs text-amber-200 flex items-center justify-between gap-4">
          <span>{editorNotice}</span>
          <button
            type="button"
            onClick={() => setEditorNotice(null)}
            className="text-slate-400 hover:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'fr' ? 'Fermer' : 'Dismiss'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 11 Map Selector + HTML Editor / Gamebuino AKA / JSON Exports */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="p-4 rounded-xl bg-[#141a24] border border-slate-800/90 divide-y divide-slate-800/70">
            {world.maps.map((m, idx) => {
              const selected = m.name === activeMap.name;
              const hasBoss = m.spawns.some((s) => s.ai === 'boss');
              const activeNpcCount = m.npcs.filter((n) => isNpcPresent(progress, n)).length;
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => onSelectMapName(m.name)}
                  className={`w-full py-3 px-2 text-left transition-colors cursor-pointer ${
                    selected ? 'text-amber-300' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400 tabular-nums">
                    <span>
                      {String(idx + 1).padStart(2, '0')}. {m.region}
                    </span>
                    <span>
                      {m.w}×{m.h}
                    </span>
                  </div>
                  <p className="text-sm font-semibold mt-0.5 truncate">
                    {lang === 'fr' ? m.titleFr : m.titleEn}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    {m.doors.length} {lang === 'fr' ? 'portes' : 'doors'} · {activeNpcCount} PNJ ·{' '}
                    {m.spawns.length} {lang === 'fr' ? 'entités' : 'spawns'}
                    {hasBoss ? ' · Boss' : ''}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Export Suite: Standalone HTML Editor + Gamebuino AKA Pack + World JSON */}
          <div className="p-4 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-2.5">
            <h2 className="text-xs font-semibold text-slate-200">
              {lang === 'fr'
                ? 'Éditeur HTML Autonome, Gamebuino AKA & GitHub'
                : 'HTML Editor, Gamebuino AKA & GitHub Export'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {lang === 'fr'
                ? "L'éditeur reste disponible en fichier HTML pur (public/ethynd/editeur_niveaux.html) et exporte directement la cible matérielle Gamebuino AKA."
                : 'Keep the level editor as a pure standalone HTML file and export binary SD assets + C++ firmware for Gamebuino AKA.'}
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportStandaloneEditorHtml}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap cursor-pointer"
              >
                {lang === 'fr'
                  ? 'Exporter Éditeur HTML Autonome (.html)'
                  : 'Export Standalone HTML Editor (.html)'}
              </button>
              <button
                type="button"
                onClick={handleExportAkaZip}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-sky-500/20 text-sky-200 hover:bg-sky-500/30 border border-sky-400/50 transition-colors whitespace-nowrap cursor-pointer"
              >
                {lang === 'fr'
                  ? 'Exporter Pack Gamebuino AKA (.zip)'
                  : 'Export Gamebuino AKA Pack (.zip)'}
              </button>
              <button
                type="button"
                onClick={handleExportWorldJson}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                {lang === 'fr' ? 'Exporter world_expanded.json' : 'Export world_expanded.json'}
              </button>
              <button
                type="button"
                onClick={handleExportStandaloneGameHtml}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 text-slate-200 hover:text-white border border-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                {lang === 'fr' ? 'Exporter Jeu HTML Autonome' : 'Export Standalone HTML Game'}
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-colors whitespace-nowrap cursor-pointer"
              >
                {lang === 'fr' ? 'Importer un fichier JSON…' : 'Import World JSON…'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportWorldJson}
                className="hidden"
              />
            </div>
          </div>
        </aside>

        {/* Center/Right Column: Interactive Pixel-Art Map Viewer & Level Editor */}
        <section className="lg:col-span-9 space-y-5">
          <div className="p-5 rounded-xl bg-[#141a24] border border-slate-800/90">
            {/* Toolbar: Overlays & Zoom */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { active: showDoors, toggle: () => setShowDoors((v) => !v), fr: 'Passages', en: 'Doors' },
                  { active: showNpcs, toggle: () => setShowNpcs((v) => !v), fr: 'PNJ', en: 'NPCs' },
                  { active: showMonsters, toggle: () => setShowMonsters((v) => !v), fr: 'Bestiaire', en: 'Monsters' },
                  { active: showLoot, toggle: () => setShowLoot((v) => !v), fr: 'Coffres & Stèles', en: 'Chests & Steles' },
                  { active: showCanopy, toggle: () => setShowCanopy((v) => !v), fr: 'Canopée (L3)', en: 'Canopy (L3)' },
                  { active: showCollisions, toggle: () => setShowCollisions((v) => !v), fr: 'Collisions 1-bit', en: 'Collision Masks' },
                  { active: showGrid || mode === 'edit', toggle: () => setShowGrid((v) => !v), fr: 'Grille', en: 'Grid' },
                ].map((ctrl) => (
                  <button
                    key={ctrl.fr}
                    type="button"
                    onClick={ctrl.toggle}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      ctrl.active
                        ? 'bg-slate-800 border-amber-500/60 text-amber-300'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'fr' ? ctrl.fr : ctrl.en}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                {(
                  [
                    { id: 'fit', fr: 'Ajuster', en: 'Fit' },
                    { id: '50', fr: '50%', en: '50%' },
                    { id: '100', fr: '100%', en: '100%' },
                    { id: '150', fr: '150%', en: '150%' },
                  ] as const
                ).map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    onClick={() => setZoom(z.id)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      zoom === z.id
                        ? 'bg-slate-800 text-amber-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'fr' ? z.fr : z.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Editor Controls Bar (Autotiling + Visual Shape Preview + Thematic Palette) */}
            {mode === 'edit' && (
              <div className="pb-4 mb-4 border-b border-slate-800/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'autotile', fr: 'Auto-Tiling (Pinceau)', en: 'Auto-Tile Brush' },
                        { id: 'autotile_rect', fr: 'Auto-Tiling (Rectangle)', en: 'Auto-Tile Zone Rect' },
                        { id: 'stamp', fr: 'Préfabriqué', en: 'Prefab Stamp' },
                        { id: 'brush', fr: 'Tuile Unique', en: 'Single Tile' },
                        { id: 'eyedropper', fr: 'Pipette', en: 'Eyedropper' },
                        { id: 'eraser', fr: 'Gomme', en: 'Eraser' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTool(t.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          tool === t.id
                            ? 'bg-amber-500 border-amber-400 text-slate-950'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        {lang === 'fr' ? t.fr : t.en}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRepairMapAutotile}
                      className="px-3 py-1.5 text-xs font-medium rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {lang === 'fr' ? 'Réparer Auto-Tiling Carte' : 'Repair Map Autotiling'}
                    </button>
                    <button
                      type="button"
                      disabled={undoStack.length === 0}
                      onClick={handleUndo}
                      className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
                    >
                      {lang === 'fr' ? `Annuler (${undoStack.length})` : `Undo (${undoStack.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetActiveMap}
                      className="px-3 py-1.5 text-xs font-medium rounded-md border border-rose-500/40 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {lang === 'fr' ? 'Réinitialiser' : 'Reset Map'}
                    </button>
                  </div>
                </div>

                {/* Row 2: Dropdown Choice by Name + Live Shape Preview Box */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-center p-3 rounded-lg bg-[#0d121b] border border-slate-800">
                  <div className="xl:col-span-6 space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      {lang === 'fr'
                        ? 'Choix rapide par le nom (Zones Auto-Tilées, Préfabriqués & Tuiles) :'
                        : 'Quick Select by Name (Auto-Tiled Zones, Prefabs & Tiles):'}
                    </label>
                    <select
                      value={dropdownSelectValue}
                      onChange={(e) => handleDropdownCatalogChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-md bg-slate-900 border border-slate-700 text-slate-100 focus:outline-none focus:border-amber-400"
                    >
                      <optgroup
                        label={
                          lang === 'fr'
                            ? 'Zones Auto-Tilées (Angles & Raccords Automatiques)'
                            : 'Auto-Tiled Zones (Automatic Corners & Transitions)'
                        }
                      >
                        {AUTOTILE_BRUSHES.map((b) => (
                          <option key={b.id} value={`auto:${b.id}`}>
                            {lang === 'fr' ? b.nameFr : b.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup
                        label={
                          lang === 'fr'
                            ? 'Préfabriqués Multi-Tuiles (Ponts, Arbres, Statues, Tapis)'
                            : 'Multi-Tile Prefabs (Bridges, Trees, Statues, Carpets)'
                        }
                      >
                        {PREFAB_STAMPS.map((st) => (
                          <option key={st.id} value={`stamp:${st.id}`}>
                            {lang === 'fr' ? st.nameFr : st.nameEn}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup
                        label={
                          lang === 'fr'
                            ? 'Tuiles Individuelles par Thème'
                            : 'Individual Thematic Tiles'
                        }
                      >
                        {THEMATIC_TILES.map((ti) => (
                          <option key={ti.id} value={`tile:${ti.id}`}>
                            {lang === 'fr' ? ti.nameFr : ti.nameEn}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Visual Shape Preview of Active Selection */}
                  <div className="xl:col-span-6 flex items-center gap-3.5">
                    <div className="shrink-0">
                      <ShapeThumb
                        selection={currentPreviewSelection}
                        sprites={sprites}
                        tileCols={world.tileCols}
                        maxBoxPx={64}
                      />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-semibold text-amber-300 truncate">
                        {tool === 'autotile' || tool === 'autotile_rect'
                          ? lang === 'fr'
                            ? activeAutotileBrush.nameFr
                            : activeAutotileBrush.nameEn
                          : tool === 'stamp'
                          ? lang === 'fr'
                            ? activeStamp.nameFr
                            : activeStamp.nameEn
                          : lang === 'fr'
                          ? `Tuile #${selectedTileId} (Couche L${activeLayer})`
                          : `Tile #${selectedTileId} (Layer L${activeLayer})`}
                      </p>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {tool === 'autotile' || tool === 'autotile_rect'
                          ? lang === 'fr'
                            ? activeAutotileBrush.descFr
                            : activeAutotileBrush.descEn
                          : tool === 'stamp'
                          ? lang === 'fr'
                            ? `Aperçu exact ${activeStamp.w}×${activeStamp.h} tuiles · Placement multi-couches automatique`
                            : `Exact ${activeStamp.w}×${activeStamp.h} shape preview · Automatic multi-layer placement`
                          : maskOverlays.has(selectedTileId)
                          ? lang === 'fr'
                            ? 'Forme 32×32 px · Collision 1-bit active'
                            : '32×32 px shape · Solid 1-bit collision'
                          : lang === 'fr'
                          ? 'Forme 32×32 px · Tuile praticable'
                          : '32×32 px shape · Walkable tile'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contextual Controls for Autotile Erase / Layer / Single Tile ID */}
                {(tool === 'autotile' || tool === 'autotile_rect') && (
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autotileErase}
                        onChange={(e) => setAutotileErase(e.target.checked)}
                        className="accent-rose-500"
                      />
                      <span>
                        {lang === 'fr'
                          ? 'Mode Gomme Auto-Tilée (creuse une clairière ou coupe une route en refermant proprement tous les angles voisins !)'
                          : 'Auto-Tiled Eraser Mode (carves clearings while automatically healing all surrounding corners!)'}
                      </span>
                    </label>
                  </div>
                )}

                {(tool === 'brush' || tool === 'eraser') && (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {lang === 'fr' ? 'Couche cible :' : 'Target Layer:'}
                      </span>
                      {(
                        [
                          { l: 0, fr: 'L0 Sol', en: 'L0 Ground' },
                          { l: 1, fr: 'L1 Tapis / Ponts', en: 'L1 Floor / Deck' },
                          { l: 2, fr: 'L2 Murs / Forêt', en: 'L2 Walls / Forest' },
                          { l: 3, fr: 'L3 Canopée / Hauts', en: 'L3 Canopy / Tops' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.l}
                          type="button"
                          onClick={() => setActiveLayer(item.l)}
                          className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            activeLayer === item.l
                              ? 'bg-slate-800 border-amber-400 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lang === 'fr' ? item.fr : item.en}
                        </button>
                      ))}
                    </div>

                    {tool === 'brush' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400 whitespace-nowrap">
                          {lang === 'fr' ? 'ID Tuile :' : 'Tile ID:'}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={maxTileId}
                          value={selectedTileId}
                          onChange={(e) =>
                            setSelectedTileId(
                              Math.max(0, Math.min(maxTileId, Number(e.target.value) || 0))
                            )
                          }
                          className="w-20 px-2.5 py-1 text-xs font-mono tabular-nums rounded bg-slate-900 border border-slate-700 text-amber-300"
                        />
                      </div>
                    )}

                    {tool === 'eraser' && (
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={eraseAllUpper}
                          onChange={(e) => setEraseAllUpper(e.target.checked)}
                          className="accent-amber-500"
                        />
                        <span>
                          {lang === 'fr'
                            ? 'Effacer simultanément L1 + L2 + L3 (conserver L0 Sol)'
                            : 'Erase L1 + L2 + L3 together (keep L0 Ground)'}
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {/* Row 3: VISUAL PALETTE CLASSIFIED BY THEME (showing exact shape of every item!) */}
                <div className="p-3.5 rounded-lg bg-[#0d121b] border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-white">
                      {lang === 'fr'
                        ? 'Palette visuelle classée par thème (cliquez sur une forme pour la sélectionner) :'
                        : 'Thematic Visual Shape Palette (click any tile or prefab shape):'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {EDITOR_THEMES.map((th) => (
                        <button
                          key={th.id}
                          type="button"
                          onClick={() => setActiveTheme(th.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            activeTheme === th.id
                              ? 'bg-slate-800 border-amber-400 text-amber-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {lang === 'fr' ? th.nameFr : th.nameEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-[230px] overflow-y-auto pr-1">
                    {activeTheme === 'autotile' &&
                      AUTOTILE_BRUSHES.map((b) => {
                        const selected =
                          (tool === 'autotile' || tool === 'autotile_rect') &&
                          activeAutotileZone === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setActiveAutotileZone(b.id);
                              if (tool !== 'autotile_rect') setTool('autotile');
                            }}
                            className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer ${
                              selected
                                ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <ShapeThumb
                              selection={{ kind: 'autotile', zone: b.id, brush: b }}
                              sprites={sprites}
                              tileCols={world.tileCols}
                              maxBoxPx={54}
                            />
                            <span className="text-[11px] leading-tight line-clamp-2">
                              {lang === 'fr' ? b.nameFr : b.nameEn}
                            </span>
                          </button>
                        );
                      })}

                    {PREFAB_STAMPS.filter((s) => s.theme === activeTheme).map((st) => {
                      const selected = tool === 'stamp' && activeStamp.id === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => {
                            setSelectedStampId(st.id);
                            setTool('stamp');
                          }}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer ${
                            selected
                              ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <ShapeThumb
                            selection={{ kind: 'stamp', stamp: st }}
                            sprites={sprites}
                            tileCols={world.tileCols}
                            maxBoxPx={54}
                          />
                          <span className="text-[11px] leading-tight line-clamp-2">
                            {lang === 'fr' ? st.nameFr : st.nameEn}
                          </span>
                        </button>
                      );
                    })}

                    {THEMATIC_TILES.filter((t) => t.theme === activeTheme).map((ti) => {
                      const selected = tool === 'brush' && selectedTileId === ti.tid;
                      return (
                        <button
                          key={ti.id}
                          type="button"
                          onClick={() => {
                            setSelectedTileId(ti.tid);
                            setActiveLayer(ti.recommendedLayer);
                            setTool('brush');
                          }}
                          className={`p-2 rounded-lg border flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer ${
                            selected
                              ? 'bg-amber-500/15 border-amber-400 text-amber-200'
                              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <ShapeThumb
                            selection={{ kind: 'tile', item: ti }}
                            sprites={sprites}
                            tileCols={world.tileCols}
                            maxBoxPx={44}
                          />
                          <span className="text-[11px] leading-tight line-clamp-2">
                            {lang === 'fr' ? ti.nameFr : ti.nameEn}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Map Canvas Frame */}
            <div className="overflow-auto max-h-[640px] rounded-lg border border-slate-800 bg-[#090d14] flex justify-center p-3">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => {
                  handleMouseUp();
                  setHoverCell(null);
                }}
                className="pixel-canvas cursor-crosshair select-none"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>
                {mode === 'edit'
                  ? lang === 'fr'
                    ? 'Auto-Tiling actif : tracez librement une forêt, une route, un lac ou un tapis — tous les angles externes et rentrants se raccordent automatiquement.'
                    : 'Auto-Tiling active: paint forests, roads, water, or carpets freely — all outer and inner corners resolve automatically.'
                  : lang === 'fr'
                  ? 'Cliquez sur un passage (P1…), un PNJ, un monstre, un coffre, une stèle ou une tuile pour inspecter ses données.'
                  : 'Click any portal (P1…), NPC, monster, chest, stele, or tile to inspect its parameters.'}
              </span>
              <span className="font-mono tabular-nums">
                {hoverCell ? `(${hoverCell.tx}, ${hoverCell.ty}) · ` : ''}
                {activeMap.name} · {activeMap.w * 32}×{activeMap.h * 32} px · ♪ {activeMap.music}
              </span>
            </div>
          </div>

          {/* Full 40-column Tileset Sheet Drawer when Single-Tile Brush is Active */}
          {mode === 'edit' && tool === 'brush' && (
            <div className="p-5 rounded-xl bg-[#141a24] border border-slate-800/90 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-white">
                  {lang === 'fr'
                    ? 'Planche complète tileset.png (40 colonnes — cliquez pour choisir n’importe quelle tuile)'
                    : 'Full tileset.png Sheet (40 columns — click to pick any raw tile)'}
                </h2>
                <span className="text-xs font-mono text-amber-300 tabular-nums">
                  #{selectedTileId} (col {selectedTileId % world.tileCols}, row{' '}
                  {Math.floor(selectedTileId / world.tileCols)})
                </span>
              </div>
              <div className="overflow-auto max-h-[280px] rounded-lg border border-slate-800 bg-[#090d14] p-2">
                <canvas
                  ref={paletteCanvasRef}
                  onClick={handlePaletteClick}
                  className="pixel-canvas cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Bottom Inspector + Map Connections Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-[#141a24] border border-slate-800/90">
              <h2 className="text-sm font-semibold text-white mb-3">
                {lang === 'fr' ? 'Inspecteur de sélection' : 'Selection Inspector'}
              </h2>

              {!inspected ? (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {lang === 'fr'
                    ? 'Aucune entité sélectionnée. En Mode Inspecteur, cliquez directement sur la carte ci-dessus pour voir les dialogues PNJ, le butin des coffres, les verrous de portes ou téléporter le héros.'
                    : 'No entity selected. In Inspector Mode, click anywhere on the map above to inspect NPC dialogues, chest loot, door locks, or teleport.'}
                </p>
              ) : inspected.kind === 'door' ? (
                <div className="space-y-2 text-xs">
                  <p className="text-sm font-semibold text-sky-300">
                    Passage P{inspected.idx + 1} → {inspected.door.map}
                  </p>
                  <p className="font-mono text-slate-300 tabular-nums">
                    Source ({inspected.door.x}, {inspected.door.y}) · Arrivée ({inspected.door.dx},{' '}
                    {inspected.door.dy})
                  </p>
                  <p className="text-slate-300">
                    {lang === 'fr' ? 'Condition requise : ' : 'Required flag: '}
                    <span className="font-mono text-amber-300">
                      {inspected.door.reqFlag || (lang === 'fr' ? 'Aucune (ouvert)' : 'None (open)')}
                    </span>
                  </p>
                  {inspected.door.denyDlg && (
                    <p className="text-slate-400 italic">
                      «{' '}
                      {
                        (lang === 'fr'
                          ? resolveDoorDenyDialogue(inspected.door.denyDlg).linesFr
                          : resolveDoorDenyDialogue(inspected.door.denyDlg).linesEn)[0]
                      }{' '}
                      »
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onTeleportToMap(inspected.door.map, inspected.door.dx, inspected.door.dy)
                    }
                    className="mt-2 px-3 py-1.5 rounded-md bg-sky-500/20 border border-sky-400/50 text-sky-200 hover:bg-sky-500/30 font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {lang === 'fr'
                      ? `Suivre ce passage vers ${inspected.door.map}`
                      : `Follow portal to ${inspected.door.map}`}
                  </button>
                </div>
              ) : inspected.kind === 'npc' ? (
                (() => {
                  const dlg = resolveNpcDialogue(inspected.npc.id, progress).dialogue;
                  return (
                    <div className="space-y-2 text-xs">
                      <p className="text-sm font-semibold text-emerald-300">
                        {lang === 'fr' ? dlg.speakerFr : dlg.speakerEn}
                      </p>
                      <p className="font-mono text-slate-400 tabular-nums">
                        ID: {inspected.npc.id} · ({inspected.npc.x}, {inspected.npc.y})
                        {inspected.npc.shop ? ` · Boutique: ${inspected.npc.shop}` : ''}
                      </p>
                      <div className="space-y-1 text-slate-200 leading-relaxed">
                        {(lang === 'fr' ? dlg.linesFr : dlg.linesEn).map((l, idx) => (
                          <p key={idx}>« {l} »</p>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : inspected.kind === 'spawn' ? (
                (() => {
                  const b = BESTIARY_CATALOG.find((x) => x.id === inspected.spawn.type);
                  return (
                    <div className="space-y-2 text-xs">
                      <p className="text-sm font-semibold text-rose-300">
                        {b ? (lang === 'fr' ? b.nameFr : b.nameEn) : inspected.spawn.type}
                      </p>
                      <p className="font-mono text-slate-300 tabular-nums">
                        PV {inspected.spawn.hp} · ATQ {inspected.spawn.atk} · +{inspected.spawn.xp} XP ·
                        +{inspected.spawn.gold} Or
                      </p>
                      <p className="text-slate-400">
                        IA: {inspected.spawn.ai}
                        {inspected.spawn.ranged ? ` · Tir: ${inspected.spawn.ranged}` : ''}
                        {inspected.spawn.bossId ? ` · Boss ID: ${inspected.spawn.bossId}` : ''}
                      </p>
                    </div>
                  );
                })()
              ) : inspected.kind === 'chest' ? (
                <div className="space-y-2 text-xs">
                  <p className="text-sm font-semibold text-amber-300">
                    {lang === 'fr' ? 'Coffre au trésor' : 'Treasure Chest'} ({inspected.chest.id})
                  </p>
                  <p className="text-slate-300 tabular-nums">
                    +{inspected.chest.gold} {lang === 'fr' ? 'Or' : 'Gold'}
                    {inspected.chest.equip
                      ? ` · ${
                          EQUIPMENT_CATALOG.find((e) => e.id === inspected.chest.equip)?.nameFr ||
                          inspected.chest.equip
                        }`
                      : ''}
                    {inspected.chest.item
                      ? ` · ${
                          ITEM_CATALOG.find((i) => i.id === inspected.chest.item)?.nameFr ||
                          inspected.chest.item
                        }`
                      : ''}
                  </p>
                </div>
              ) : inspected.kind === 'stele' ? (
                (() => {
                  const lore = LORE_CODEX.find((l) => l.id === inspected.stele.id);
                  return (
                    <div className="space-y-2 text-xs">
                      <p className="text-sm font-semibold text-purple-300">
                        {lore ? (lang === 'fr' ? lore.titleFr : lore.titleEn) : inspected.stele.id}
                      </p>
                      {lore && (
                        <p className="text-slate-300 leading-relaxed">
                          {(lang === 'fr' ? lore.textFr : lore.textEn)[0]}
                        </p>
                      )}
                    </div>
                  );
                })()
              ) : inspected.kind === 'item' ? (
                (() => {
                  const it = ITEM_CATALOG.find((i) => i.id === inspected.item.id);
                  return (
                    <div className="space-y-2 text-xs">
                      <p className="text-sm font-semibold text-amber-200">
                        {it ? (lang === 'fr' ? it.nameFr : it.nameEn) : inspected.item.id}
                      </p>
                      <p className="font-mono text-slate-400">
                        ({inspected.item.x}, {inspected.item.y}) ·{' '}
                        {inspected.item.afterFlag
                          ? `Apparaît après: ${inspected.item.afterFlag}`
                          : 'Présent dès le départ'}
                      </p>
                    </div>
                  );
                })()
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-sm font-semibold text-slate-100 tabular-nums">
                    Tuile ({inspected.tx}, {inspected.ty}) · Monde ({inspected.wx}, {inspected.wy})
                  </p>
                  <p className="font-mono text-slate-400 tabular-nums">
                    Couches [0..3]: [{inspected.tiles.join(', ')}] ·{' '}
                    {inspected.blocked
                      ? lang === 'fr'
                        ? 'Collision active'
                        : 'Blocked'
                      : lang === 'fr'
                      ? 'Praticable'
                      : 'Walkable'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {!inspected.blocked && (
                      <button
                        type="button"
                        onClick={() => onTeleportToMap(activeMap.name, inspected.wx, inspected.wy)}
                        className="px-3 py-1.5 rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {lang === 'fr' ? 'Téléporter à ces coordonnées' : 'Teleport to Coordinates'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const topLayer = ([3, 2, 1, 0] as const).find(
                          (l) => inspected.tiles[l] >= 0
                        );
                        if (topLayer !== undefined) {
                          setSelectedTileId(inspected.tiles[topLayer]);
                          setActiveLayer(topLayer);
                        }
                        setTool('brush');
                        setMode('edit');
                      }}
                      className="px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 font-medium cursor-pointer whitespace-nowrap"
                    >
                      {lang === 'fr' ? 'Modifier cette tuile dans l’Éditeur' : 'Edit Tile in Editor'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-[#141a24] border border-slate-800/90">
              <h2 className="text-sm font-semibold text-white mb-3">
                {lang === 'fr'
                  ? `Passages & Entités de « ${activeMap.titleFr} »`
                  : `Portals & Entities in "${activeMap.titleEn}"`}
              </h2>
              <div className="space-y-2 text-xs text-slate-300 divide-y divide-slate-800/70">
                {activeMap.doors.map((d, i) => {
                  const unlocked = isFlagUnlocked(progress, d.reqFlag);
                  return (
                    <div key={i} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
                      <span>
                        <strong className="font-mono text-sky-300">P{i + 1}</strong> → {d.map}
                        {d.reqFlag
                          ? ` (${d.reqFlag} · ${
                              unlocked
                                ? lang === 'fr'
                                  ? 'ouvert'
                                  : 'open'
                                : lang === 'fr'
                                ? 'scellé'
                                : 'locked'
                            })`
                          : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectMapName(d.map)}
                        className="text-amber-300 hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {lang === 'fr' ? 'Voir carte' : 'View map'}
                      </button>
                    </div>
                  );
                })}
                {activeMap.npcs.length > 0 && (
                  <div className="pt-2 text-slate-400">
                    PNJ :{' '}
                    {activeMap.npcs
                      .map((n) =>
                        isNpcPresent(progress, n)
                          ? n.id
                          : `${n.id} (${lang === 'fr' ? 'parti' : 'departed'})`
                      )
                      .join(', ')}
                  </div>
                )}
                {activeMap.chests.length > 0 && (
                  <div className="pt-2 text-slate-400">
                    {lang === 'fr' ? 'Coffres' : 'Chests'} :{' '}
                    {activeMap.chests
                      .map((c) => c.equip || c.item || `${c.gold} Or`)
                      .join(' · ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
