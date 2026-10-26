/**
 * Pure-TypeScript Headless HTML5 Canvas 2D + PNG Decoder/Encoder for Node.js CLI/CI builds.
 * Enables running `loadSpriteBank()`, `exportStandaloneSimulationHtml()`,
 * `exportStandaloneEditorHtml()`, `buildAkaSprites565()`, and `runFullAutomatedSuite()`
 * directly in Node.js (`tsx`) with zero native binary dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC32_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function decodePngRgba(pngBuf: Buffer): {
  width: number;
  height: number;
  data: Uint8ClampedArray;
} {
  if (pngBuf.subarray(0, 8).compare(PNG_SIG) !== 0) {
    throw new Error('Invalid PNG signature');
  }
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 6;
  const idatParts: Buffer[] = [];

  while (pos < pngBuf.length) {
    const len = pngBuf.readUInt32BE(pos);
    const type = pngBuf.subarray(pos + 4, pos + 8).toString('ascii');
    const chunkData = pngBuf.subarray(pos + 8, pos + 8 + len);
    pos += 12 + len;

    if (type === 'IHDR') {
      width = chunkData.readUInt32BE(0);
      height = chunkData.readUInt32BE(4);
      const bitDepth = chunkData[8];
      colorType = chunkData[9];
      if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, colorType=${colorType}`);
      }
    } else if (type === 'IDAT') {
      idatParts.push(chunkData);
    } else if (type === 'IEND') {
      break;
    }
  }

  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const raw = zlib.inflateSync(Buffer.concat(idatParts));
  const recon = new Uint8Array(height * stride);
  let inOff = 0;

  for (let y = 0; y < height; y++) {
    const filterType = raw[inOff++];
    const rowStart = y * stride;
    const prevStart = (y - 1) * stride;

    for (let x = 0; x < stride; x++) {
      const filt = raw[inOff + x];
      const a = x >= bpp ? recon[rowStart + x - bpp] : 0;
      const b = y > 0 ? recon[prevStart + x] : 0;
      const c = y > 0 && x >= bpp ? recon[prevStart + x - bpp] : 0;
      let val = 0;

      if (filterType === 0) {
        val = filt;
      } else if (filterType === 1) {
        val = (filt + a) & 0xff;
      } else if (filterType === 2) {
        val = (filt + b) & 0xff;
      } else if (filterType === 3) {
        val = (filt + ((a + b) >> 1)) & 0xff;
      } else {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        val = (filt + pr) & 0xff;
      }
      recon[rowStart + x] = val;
    }
    inOff += stride;
  }

  if (bpp === 4) {
    return { width, height, data: new Uint8ClampedArray(recon) };
  }

  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba[i * 4] = recon[i * 3];
    rgba[i * 4 + 1] = recon[i * 3 + 1];
    rgba[i * 4 + 2] = recon[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }
  return { width, height, data: rgba };
}

function makePngChunk(type: string, payload: Buffer): Buffer {
  const out = Buffer.alloc(12 + payload.length);
  out.writeUInt32BE(payload.length, 0);
  out.write(type, 4, 4, 'ascii');
  payload.copy(out, 8);
  const crc = crc32(out.subarray(4, 8 + payload.length));
  out.writeUInt32BE(crc >>> 0, 8 + payload.length);
  return out;
}

export function encodePngRgba(width: number, height: number, data: Uint8ClampedArray): Buffer {
  const w = Math.max(1, width | 0);
  const h = Math.max(1, height | 0);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // 8-bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = w * 4;
  const scanlines = Buffer.alloc(h * (1 + stride));
  for (let y = 0; y < h; y++) {
    const outRow = y * (1 + stride);
    scanlines[outRow] = 0; // Filter 0 (None)
    const srcStart = y * stride;
    for (let i = 0; i < stride; i++) {
      scanlines[outRow + 1 + i] = data[srcStart + i] ?? 0;
    }
  }

  const compressed = zlib.deflateSync(scanlines, { level: 6 });
  return Buffer.concat([
    PNG_SIG,
    makePngChunk('IHDR', ihdr),
    makePngChunk('IDAT', compressed),
    makePngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function parseCssColor(color: string): [number, number, number, number] {
  const s = String(color).trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3) {
      return [
        parseInt(hex[0] + hex[0], 16),
        parseInt(hex[1] + hex[1], 16),
        parseInt(hex[2] + hex[2], 16),
        255,
      ];
    }
    if (hex.length >= 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        hex.length >= 8 ? parseInt(hex.slice(6, 8), 16) : 255,
      ];
    }
  }
  const rgbaMatch = s.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbaMatch) {
    const a = rgbaMatch[4] !== undefined ? Math.round(parseFloat(rgbaMatch[4]) * 255) : 255;
    return [Number(rgbaMatch[1]) | 0, Number(rgbaMatch[2]) | 0, Number(rgbaMatch[3]) | 0, a];
  }
  return [0, 0, 0, 255];
}

interface PixelSource {
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
  _data: Uint8ClampedArray;
}

class HeadlessContext2D {
  public imageSmoothingEnabled = false;
  public fillStyle: string | object = '#000000';
  public strokeStyle: string | object = '#000000';
  public globalAlpha = 1;
  public lineWidth = 1;
  public font = '12px sans-serif';
  public textAlign = 'left';
  public textBaseline = 'alphabetic';
  private canvas: HeadlessCanvas;

  constructor(canvas: HeadlessCanvas) {
    this.canvas = canvas;
  }

  public save() {}
  public restore() {}
  public beginPath() {}
  public closePath() {}
  public moveTo() {}
  public lineTo() {}
  public arc() {}
  public ellipse() {}
  public fill() {}
  public stroke() {}
  public strokeRect() {}
  public fillText() {}
  public setTransform() {}
  public translate() {}
  public scale() {}
  public rotate() {}
  public createRadialGradient() {
    return { addColorStop() {} };
  }
  public createLinearGradient() {
    return { addColorStop() {} };
  }

  public clearRect(x: number, y: number, w: number, h: number) {
    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.canvas.width, Math.round(x + w));
    const y1 = Math.min(this.canvas.height, Math.round(y + h));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const idx = (py * this.canvas.width + px) * 4;
        this.canvas._data[idx] = 0;
        this.canvas._data[idx + 1] = 0;
        this.canvas._data[idx + 2] = 0;
        this.canvas._data[idx + 3] = 0;
      }
    }
  }

  public fillRect(x: number, y: number, w: number, h: number) {
    if (typeof this.fillStyle !== 'string') return;
    const [r, g, b, a] = parseCssColor(this.fillStyle);
    const effA = Math.round(a * this.globalAlpha);
    if (effA <= 0) return;

    const x0 = Math.max(0, Math.round(x));
    const y0 = Math.max(0, Math.round(y));
    const x1 = Math.min(this.canvas.width, Math.round(x + w));
    const y1 = Math.min(this.canvas.height, Math.round(y + h));

    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const idx = (py * this.canvas.width + px) * 4;
        if (effA >= 255 || this.canvas._data[idx + 3] === 0) {
          this.canvas._data[idx] = r;
          this.canvas._data[idx + 1] = g;
          this.canvas._data[idx + 2] = b;
          this.canvas._data[idx + 3] = effA;
        } else {
          const alpha = effA / 255;
          this.canvas._data[idx] = Math.round(this.canvas._data[idx] * (1 - alpha) + r * alpha);
          this.canvas._data[idx + 1] = Math.round(this.canvas._data[idx + 1] * (1 - alpha) + g * alpha);
          this.canvas._data[idx + 2] = Math.round(this.canvas._data[idx + 2] * (1 - alpha) + b * alpha);
          this.canvas._data[idx + 3] = Math.min(255, this.canvas._data[idx + 3] + effA);
        }
      }
    }
  }

  public createImageData(w: number, h: number) {
    const iw = Math.max(1, Math.round(w));
    const ih = Math.max(1, Math.round(h));
    return {
      width: iw,
      height: ih,
      data: new Uint8ClampedArray(iw * ih * 4),
    };
  }

  public getImageData(sx: number, sy: number, sw: number, sh: number) {
    const iw = Math.max(1, Math.round(sw));
    const ih = Math.max(1, Math.round(sh));
    const out = new Uint8ClampedArray(iw * ih * 4);
    const x0 = Math.round(sx);
    const y0 = Math.round(sy);
    for (let y = 0; y < ih; y++) {
      const py = y0 + y;
      if (py < 0 || py >= this.canvas.height) continue;
      for (let x = 0; x < iw; x++) {
        const px = x0 + x;
        if (px < 0 || px >= this.canvas.width) continue;
        const srcIdx = (py * this.canvas.width + px) * 4;
        const dstIdx = (y * iw + x) * 4;
        out[dstIdx] = this.canvas._data[srcIdx];
        out[dstIdx + 1] = this.canvas._data[srcIdx + 1];
        out[dstIdx + 2] = this.canvas._data[srcIdx + 2];
        out[dstIdx + 3] = this.canvas._data[srcIdx + 3];
      }
    }
    return { width: iw, height: ih, data: out };
  }

  public putImageData(imgData: { width: number; height: number; data: Uint8ClampedArray }, dx: number, dy: number) {
    const x0 = Math.round(dx);
    const y0 = Math.round(dy);
    for (let y = 0; y < imgData.height; y++) {
      const py = y0 + y;
      if (py < 0 || py >= this.canvas.height) continue;
      for (let x = 0; x < imgData.width; x++) {
        const px = x0 + x;
        if (px < 0 || px >= this.canvas.width) continue;
        const srcIdx = (y * imgData.width + x) * 4;
        const dstIdx = (py * this.canvas.width + px) * 4;
        this.canvas._data[dstIdx] = imgData.data[srcIdx];
        this.canvas._data[dstIdx + 1] = imgData.data[srcIdx + 1];
        this.canvas._data[dstIdx + 2] = imgData.data[srcIdx + 2];
        this.canvas._data[dstIdx + 3] = imgData.data[srcIdx + 3];
      }
    }
  }

  public drawImage(src: PixelSource, ...args: number[]) {
    if (!src || !src._data) return;
    const srcW = src.naturalWidth || src.width;
    const srcH = src.naturalHeight || src.height;
    if (srcW <= 0 || srcH <= 0) return;

    let sx = 0;
    let sy = 0;
    let sw = srcW;
    let sh = srcH;
    let dx = 0;
    let dy = 0;
    let dw = srcW;
    let dh = srcH;

    if (args.length === 2) {
      [dx, dy] = args;
    } else if (args.length === 4) {
      [dx, dy, dw, dh] = args;
    } else if (args.length >= 8) {
      [sx, sy, sw, sh, dx, dy, dw, dh] = args;
    }

    const rdw = Math.round(dw);
    const rdh = Math.round(dh);
    if (rdw <= 0 || rdh <= 0 || sw <= 0 || sh <= 0) return;

    const rdx = Math.round(dx);
    const rdy = Math.round(dy);

    for (let y = 0; y < rdh; y++) {
      const dstY = rdy + y;
      if (dstY < 0 || dstY >= this.canvas.height) continue;
      const srcY = Math.min(srcH - 1, Math.max(0, Math.floor(sy + (y * sh) / rdh)));

      for (let x = 0; x < rdw; x++) {
        const dstX = rdx + x;
        if (dstX < 0 || dstX >= this.canvas.width) continue;
        const srcX = Math.min(srcW - 1, Math.max(0, Math.floor(sx + (x * sw) / rdw)));

        const sIdx = (srcY * srcW + srcX) * 4;
        const sa = Math.round(src._data[sIdx + 3] * this.globalAlpha);
        if (sa === 0) continue;

        const dIdx = (dstY * this.canvas.width + dstX) * 4;
        const da = this.canvas._data[dIdx + 3];
        if (sa === 255 || da === 0) {
          this.canvas._data[dIdx] = src._data[sIdx];
          this.canvas._data[dIdx + 1] = src._data[sIdx + 1];
          this.canvas._data[dIdx + 2] = src._data[sIdx + 2];
          this.canvas._data[dIdx + 3] = sa;
        } else {
          const alpha = sa / 255;
          this.canvas._data[dIdx] = Math.round(this.canvas._data[dIdx] * (1 - alpha) + src._data[sIdx] * alpha);
          this.canvas._data[dIdx + 1] = Math.round(this.canvas._data[dIdx + 1] * (1 - alpha) + src._data[sIdx + 1] * alpha);
          this.canvas._data[dIdx + 2] = Math.round(this.canvas._data[dIdx + 2] * (1 - alpha) + src._data[sIdx + 2] * alpha);
          this.canvas._data[dIdx + 3] = Math.min(255, da + sa);
        }
      }
    }
  }
}

export class HeadlessCanvas implements PixelSource {
  private _w = 300;
  private _h = 150;
  public _data: Uint8ClampedArray = new Uint8ClampedArray(300 * 150 * 4);
  private _ctx: HeadlessContext2D | null = null;

  public get width(): number {
    return this._w;
  }

  public set width(val: number) {
    this._w = Math.max(1, val | 0);
    this._data = new Uint8ClampedArray(this._w * this._h * 4);
  }

  public get height(): number {
    return this._h;
  }

  public set height(val: number) {
    this._h = Math.max(1, val | 0);
    this._data = new Uint8ClampedArray(this._w * this._h * 4);
  }

  public getContext(kind: string): HeadlessContext2D | null {
    if (kind !== '2d') return null;
    if (!this._ctx) this._ctx = new HeadlessContext2D(this);
    return this._ctx;
  }

  public toDataURL(mime = 'image/png'): string {
    if (mime !== 'image/png') {
      throw new Error(`Unsupported toDataURL mime: ${mime}`);
    }
    const png = encodePngRgba(this._w, this._h, this._data);
    return `data:image/png;base64,${png.toString('base64')}`;
  }
}

export function installHeadlessBrowserEnv(repoRoot: string): void {
  const publicDir = path.join(repoRoot, 'public');

  class HeadlessImage implements PixelSource {
    public width = 0;
    public height = 0;
    public naturalWidth = 0;
    public naturalHeight = 0;
    public _data: Uint8ClampedArray = new Uint8ClampedArray(0);
    public onload: (() => void) | null = null;
    public onerror: ((err: unknown) => void) | null = null;
    private _src = '';

    public get src(): string {
      return this._src;
    }

    public set src(url: string) {
      this._src = url;
      queueMicrotask(() => {
        try {
          if (url.startsWith('data:image/png;base64,')) {
            const raw = Buffer.from(url.slice('data:image/png;base64,'.length), 'base64');
            const decoded = decodePngRgba(raw);
            this.width = this.naturalWidth = decoded.width;
            this.height = this.naturalHeight = decoded.height;
            this._data = decoded.data;
            this.onload?.();
            return;
          }
          const rel = url.replace(/^\.?\//, '');
          const diskPath = path.join(publicDir, rel);
          const raw = fs.readFileSync(diskPath);
          const decoded = decodePngRgba(raw);
          this.width = this.naturalWidth = decoded.width;
          this.height = this.naturalHeight = decoded.height;
          this._data = decoded.data;
          this.onload?.();
        } catch (err) {
          this.onerror?.(err);
        }
      });
    }
  }

  const memStorage = new Map<string, string>();
  const localStorageShim = {
    getItem: (k: string) => (memStorage.has(k) ? memStorage.get(k)! : null),
    setItem: (k: string, v: string) => {
      memStorage.set(k, String(v));
    },
    removeItem: (k: string) => {
      memStorage.delete(k);
    },
    clear: () => {
      memStorage.clear();
    },
    key: (i: number) => Array.from(memStorage.keys())[i] ?? null,
    get length() {
      return memStorage.size;
    },
  };

  const g = globalThis as Record<string, unknown>;
  g.HTMLCanvasElement = HeadlessCanvas;
  g.HTMLImageElement = HeadlessImage;
  g.Image = HeadlessImage;
  g.localStorage = localStorageShim;
  g.document = {
    createElement(tag: string) {
      if (tag.toLowerCase() === 'canvas') {
        return new HeadlessCanvas();
      }
      return {};
    },
    addEventListener() {},
    removeEventListener() {},
  };
  g.addEventListener = () => {};
  g.removeEventListener = () => {};
  g.window = g;
}
