import {
  buildAkaSprites565,
  buildAkaTileset565,
  buildAkaWorldBinary,
  buildZipArchive,
  buildZipBytes,
} from './akaBinaryCore';
import { SpriteBank } from './spriteBank';
import { WorldBundle } from './types';
import akaConfigRaw from '../../gamebuino_aka/config_aka.h?raw';
import akaDataRaw from '../../gamebuino_aka/aka_data.h?raw';
import akaInoRaw from '../../gamebuino_aka/ethynd_aka.ino?raw';
import akaPioRaw from '../../gamebuino_aka/platformio.ini?raw';
import akaReadmeRaw from '../../gamebuino_aka/README_AKA.md?raw';

export {
  buildAkaSprites565,
  buildAkaTileset565,
  buildAkaWorldBinary,
  buildZipArchive,
  buildZipBytes,
};

export function exportGamebuinoAkaPackZip(world: WorldBundle, sprites: SpriteBank): Blob {
  const enc = new TextEncoder();
  const worldBin = buildAkaWorldBinary(world);
  const tileset565 = buildAkaTileset565(sprites.tileset, world.tileCols);
  const sprites565 = buildAkaSprites565(sprites);

  return buildZipArchive([
    { path: 'SD_CARD/ETHYND/WORLD.BIN', data: worldBin },
    { path: 'SD_CARD/ETHYND/TILESET.565', data: tileset565 },
    { path: 'SD_CARD/ETHYND/SPRITES.565', data: sprites565 },
    { path: 'firmware/ethynd_aka/ethynd_aka.ino', data: enc.encode(akaInoRaw) },
    { path: 'firmware/ethynd_aka/config_aka.h', data: enc.encode(akaConfigRaw) },
    { path: 'firmware/ethynd_aka/aka_data.h', data: enc.encode(akaDataRaw) },
    { path: 'firmware/ethynd_aka/platformio.ini', data: enc.encode(akaPioRaw) },
    { path: 'README_AKA.md', data: enc.encode(akaReadmeRaw) },
  ]);
}

