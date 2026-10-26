#!/usr/bin/env python3
"""
Convertisseur CLI des niveaux et tuiles d'Ethynd vers le format binaire MicroSD
de la console portable Gamebuino AKA (320x240 RGB565).

Usage :
  python3 gamebuino_aka/tools/pack_aka_sd.py
Produit :
  gamebuino_aka/SD_CARD/ETHYND/WORLD.BIN
  gamebuino_aka/SD_CARD/ETHYND/TILESET.565
"""

import base64
import json
import os
import struct
import zlib

FLAG_BITS = {
    "met_sage": 1 << 0,
    "boss_grotte_defeated": 1 << 1,
    "spoke_king": 1 << 2,
    "boss_chateau_defeated": 1 << 3,
    "boss_temple_defeated": 1 << 4,
    "boss_crypte_defeated": 1 << 5,
    "boss_citadelle_defeated": 1 << 6,
}

BOSS_BIT_IDX = {
    "boss_grotte_defeated": 1,
    "boss_chateau_defeated": 3,
    "boss_temple_defeated": 4,
    "boss_crypte_defeated": 5,
    "boss_citadelle_defeated": 6,
}

AI_MAP = {"passive": 0, "wander": 1, "chase": 2, "ranged": 3, "boss": 4}
DIR_MAP = {"bas": 0, "gauche": 1, "droite": 2, "haut": 3}


def build_world_bin(world: dict) -> bytes:
    out = bytearray()
    masks_sorted = sorted((int(k), base64.b64decode(v)) for k, v in world["masks"].items())
    maps = world["maps"]
    map_idx_by_name = {m["name"]: i for i, m in enumerate(maps)}

    out += struct.pack("<4sHHHH", b"ETHW", 1, len(maps), world["tileCols"], len(masks_sorted))
    for tid, raw in masks_sorted:
        padded = (raw + b"\x00" * 128)[:128]
        out += struct.pack("<H128s", tid, padded)

    chest_seq = 0
    for m in maps:
        name_b = m["name"].encode("ascii", "ignore")[:23]
        name_padded = name_b + b"\x00" * (24 - len(name_b))
        bg = m["bgColor"]
        out += struct.pack("<24sHHBBBB", name_padded, m["w"], m["h"], bg[0], bg[1], bg[2], 0)

        for layer in range(4):
            for y in range(m["h"]):
                for x in range(m["w"]):
                    out += struct.pack("<h", int(m["layers"][layer][y][x]))

        doors = m.get("doors", [])
        out += struct.pack("<H", len(doors))
        for d in doors:
            t_idx = map_idx_by_name.get(d["map"], 0)
            req_mask = FLAG_BITS.get(d.get("reqFlag", ""), 0)
            out += struct.pack(
                "<hhhhHhhHHH",
                int(d["x"]), int(d["y"]), int(d["w"]), int(d["h"]),
                t_idx, int(d["dx"]), int(d["dy"]), req_mask, 0, 0
            )

        chests = m.get("chests", [])
        out += struct.pack("<H", len(chests))
        for c in chests:
            bit_i = min(63, chest_seq)
            chest_seq += 1
            item_id = 1 if c.get("item") else 0
            equip_id = 1 if c.get("equip") else 0
            out += struct.pack("<HhhHBB", bit_i, int(c["x"]), int(c["y"]), int(c.get("gold", 0)), item_id, equip_id)

        npcs = m.get("npcs", [])
        out += struct.pack("<H", len(npcs))
        for n in npcs:
            blk = FLAG_BITS.get(n.get("blockUntilFlag", ""), 0)
            out += struct.pack(
                "<BBhhHBB",
                0, DIR_MAP.get(n.get("dir", "bas"), 0),
                int(n["x"]), int(n["y"]), blk, 0, 0
            )

        spawns = m.get("spawns", [])
        out += struct.pack("<H", len(spawns))
        for sp in spawns:
            ai_k = AI_MAP.get(sp.get("ai", "chase"), 2)
            sz = 48 if ai_k == 4 else 32
            b_bit = BOSS_BIT_IDX.get(sp.get("bossId", ""), 0)
            out += struct.pack(
                "<BBhhHHHHBB",
                0, ai_k, int(sp["x"]), int(sp["y"]),
                int(sp["hp"]), int(sp["atk"]), int(sp["xp"]), int(sp["gold"]),
                sz, b_bit
            )

    return bytes(out)


TRANSPARENT_565 = 0xF81F


def decode_png_rgba(png_bytes: bytes) -> tuple[int, int, bytearray]:
    """Décode un PNG 8-bit RGBA/RGB uniquement avec la bibliothèque standard Python."""
    assert png_bytes[:8] == b"\x89PNG\r\n\x1a\n", "Signature PNG invalide"
    pos = 8
    width = height = color_type = 0
    idat_chunks = []
    while pos < len(png_bytes):
        length = struct.unpack(">I", png_bytes[pos : pos + 4])[0]
        ctype = png_bytes[pos + 4 : pos + 8]
        cdata = png_bytes[pos + 8 : pos + 8 + length]
        pos += 12 + length
        if ctype == b"IHDR":
            width, height, bit_depth, color_type, _, _, _ = struct.unpack(">IIBBBBB", cdata)
            if bit_depth != 8 or color_type not in (2, 6):
                raise ValueError(f"Format PNG non supporté: depth={bit_depth}, type={color_type}")
        elif ctype == b"IDAT":
            idat_chunks.append(cdata)
        elif ctype == b"IEND":
            break

    bpp = 4 if color_type == 6 else 3
    stride = width * bpp
    raw = zlib.decompress(b"".join(idat_chunks))
    recon = bytearray(height * stride)
    in_off = 0

    for y in range(height):
        ftype = raw[in_off]
        in_off += 1
        row_start = y * stride
        prev_start = (y - 1) * stride
        for x in range(stride):
            filt = raw[in_off + x]
            a = recon[row_start + x - bpp] if x >= bpp else 0
            b = recon[prev_start + x] if y > 0 else 0
            c = recon[prev_start + x - bpp] if (y > 0 and x >= bpp) else 0
            if ftype == 0:
                val = filt
            elif ftype == 1:
                val = (filt + a) & 0xFF
            elif ftype == 2:
                val = (filt + b) & 0xFF
            elif ftype == 3:
                val = (filt + ((a + b) >> 1)) & 0xFF
            else:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                val = (filt + pr) & 0xFF
            recon[row_start + x] = val
        in_off += stride

    if bpp == 4:
        return width, height, recon
    rgba = bytearray(width * height * 4)
    for i in range(width * height):
        rgba[i * 4 : i * 4 + 3] = recon[i * 3 : i * 3 + 3]
        rgba[i * 4 + 3] = 255
    return width, height, rgba


def build_tileset_565(png_path: str, tile_cols: int) -> bytes:
    with open(png_path, "rb") as f:
        w, h, rgba = decode_png_rgba(f.read())
    rows = h // 32
    total_tiles = rows * tile_cols
    out = bytearray(8 + total_tiles * 32 * 32 * 2)
    struct.pack_into("<4sHH", out, 0, b"ET56", total_tiles, 32)
    off = 8
    for tid in range(total_tiles):
        sx = (tid % tile_cols) * 32
        sy = (tid // tile_cols) * 32
        for ty in range(32):
            row_base = (sy + ty) * w + sx
            for tx in range(32):
                p = (row_base + tx) * 4
                a = rgba[p + 3]
                if a < 96:
                    c565 = TRANSPARENT_565
                else:
                    r, g, b = rgba[p], rgba[p + 1], rgba[p + 2]
                    c565 = ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)
                    if c565 == TRANSPARENT_565:
                        c565 = 0xF81E
                out[off] = c565 & 0xFF
                out[off + 1] = (c565 >> 8) & 0xFF
                off += 2
    return bytes(out)


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    world_path = os.path.join(root, "public", "ethynd", "world_expanded.json")
    tileset_path = os.path.join(root, "public", "ethynd", "tileset.png")
    out_dir = os.path.join(root, "gamebuino_aka", "SD_CARD", "ETHYND")
    os.makedirs(out_dir, exist_ok=True)

    with open(world_path, "r", encoding="utf-8") as f:
        world = json.load(f)

    world_bin = build_world_bin(world)
    out_world = os.path.join(out_dir, "WORLD.BIN")
    with open(out_world, "wb") as f:
        f.write(world_bin)
    print(f"[OK] Écrit {out_world} ({len(world_bin)} octets, {len(world['maps'])} cartes)")

    tileset_565 = build_tileset_565(tileset_path, int(world["tileCols"]))
    out_tileset = os.path.join(out_dir, "TILESET.565")
    with open(out_tileset, "wb") as f:
        f.write(tileset_565)
    print(f"[OK] Écrit {out_tileset} ({len(tileset_565)} octets RGB565)")


if __name__ == "__main__":
    main()
