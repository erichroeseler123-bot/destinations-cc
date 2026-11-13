/**
 * Privacy-safe, zero-dependency local SVG QR generator for Red Rocks Fast Pass.
 */

interface VersionSpec {
  version: number;
  totalCodewords: number;
  ecCodewordsPerBlock: number;
  group1Blocks: number;
  group1DataCodewords: number;
  group2Blocks: number;
  group2DataCodewords: number;
  alignmentCoords: readonly number[];
}

const SPECS_L: readonly VersionSpec[] = [
  { version: 1, totalCodewords: 26, ecCodewordsPerBlock: 7, group1Blocks: 1, group1DataCodewords: 19, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [] },
  { version: 2, totalCodewords: 44, ecCodewordsPerBlock: 10, group1Blocks: 1, group1DataCodewords: 34, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [6, 18] },
  { version: 3, totalCodewords: 70, ecCodewordsPerBlock: 15, group1Blocks: 1, group1DataCodewords: 55, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [6, 22] },
  { version: 4, totalCodewords: 100, ecCodewordsPerBlock: 20, group1Blocks: 1, group1DataCodewords: 80, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [6, 26] },
  { version: 5, totalCodewords: 134, ecCodewordsPerBlock: 26, group1Blocks: 1, group1DataCodewords: 108, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [6, 30] },
  { version: 6, totalCodewords: 172, ecCodewordsPerBlock: 18, group1Blocks: 2, group1DataCodewords: 68, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [6, 34] },
  { version: 7, totalCodewords: 196, ecCodewordsPerBlock: 20, group1Blocks: 2, group1DataCodewords: 78, group2Blocks: 0, group2DataCodewords: 0, alignmentCoords: [6, 22, 38] },
];

function gf256Mul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >> 7) * 0x11d);
    z ^= ((y >> i) & 1) * x;
  }
  return z & 0xff;
}

function rsDivisor(degree: number): Uint8Array {
  const result = new Uint8Array(degree);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < degree; j += 1) {
      result[j] = gf256Mul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gf256Mul(root, 0x02);
  }
  return result;
}

function rsRemainder(data: Uint8Array, divisor: Uint8Array): Uint8Array {
  const result = new Uint8Array(divisor.length);
  for (let i = 0; i < data.length; i += 1) {
    const factor = data[i] ^ result[0];
    result.copyWithin(0, 1);
    result[divisor.length - 1] = 0;
    for (let j = 0; j < divisor.length; j += 1) {
      result[j] ^= gf256Mul(divisor[j], factor);
    }
  }
  return result;
}

export function buildLocalQrSvgDataUri(text: string, pixelSize = 260): string {
  const bytes = new TextEncoder().encode(text);
  const spec =
    SPECS_L.find((s) => {
      const dataCw = s.group1Blocks * s.group1DataCodewords + s.group2Blocks * s.group2DataCodewords;
      return Math.floor((dataCw * 8 - 12) / 8) >= bytes.length;
    }) || SPECS_L[SPECS_L.length - 1];

  const dataCwTotal = spec.group1Blocks * spec.group1DataCodewords + spec.group2Blocks * spec.group2DataCodewords;
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i -= 1) bits.push((val >>> i) & 1);
  };

  pushBits(0b0100, 4);
  const trimmed = bytes.slice(0, dataCwTotal - 2);
  pushBits(trimmed.length, 8);
  for (const b of trimmed) pushBits(b, 8);
  const capacityBits = dataCwTotal * 8;
  pushBits(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);

  const dataCodewords = new Uint8Array(dataCwTotal);
  for (let i = 0; i < bits.length / 8; i += 1) {
    let v = 0;
    for (let j = 0; j < 8; j += 1) v = (v << 1) | bits[i * 8 + j];
    dataCodewords[i] = v;
  }
  for (let i = bits.length / 8, pad = 0; i < dataCwTotal; i += 1, pad ^= 1) {
    dataCodewords[i] = pad === 0 ? 0xec : 0x11;
  }

  const div = rsDivisor(spec.ecCodewordsPerBlock);
  const blocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];
  let offset = 0;
  for (let b = 0; b < spec.group1Blocks; b += 1) {
    const chunk = dataCodewords.slice(offset, offset + spec.group1DataCodewords);
    offset += spec.group1DataCodewords;
    blocks.push(chunk);
    ecBlocks.push(rsRemainder(chunk, div));
  }
  const interleaved: number[] = [];
  for (let i = 0; i < spec.group1DataCodewords; i += 1) {
    for (const blk of blocks) if (i < blk.length) interleaved.push(blk[i]);
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i += 1) {
    for (const ec of ecBlocks) interleaved.push(ec[i]);
  }

  const size = spec.version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const isFunc: boolean[][] = Array.from({ length: size }, () => Array<boolean>(size).fill(false));

  const setFunc = (x: number, y: number, dark: boolean) => {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      modules[y][x] = dark;
      isFunc[y][x] = true;
    }
  };

  const drawFinder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        setFunc(cx + dx, cy + dy, dist !== 2 && dist !== 4);
      }
    }
  };

  drawFinder(3, 3);
  drawFinder(size - 4, 3);
  drawFinder(3, size - 4);

  for (let i = 0; i < size; i += 1) {
    if (!isFunc[6][i]) setFunc(i, 6, i % 2 === 0);
    if (!isFunc[i][6]) setFunc(6, i, i % 2 === 0);
  }

  for (const cy of spec.alignmentCoords) {
    for (const cx of spec.alignmentCoords) {
      if ((cx === 6 && cy === 6) || (cx === 6 && cy === size - 7) || (cx === size - 7 && cy === 6)) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunc(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  for (let i = 0; i <= 8; i += 1) {
    if (i !== 6) {
      setFunc(8, i, false);
      setFunc(i, 8, false);
    }
  }
  for (let i = 0; i < 8; i += 1) {
    setFunc(size - 1 - i, 8, false);
    if (i < 7) setFunc(8, size - 1 - i, false);
  }
  setFunc(8, size - 8, true);

  let bitIdx = 0;
  const totalStreamBits = interleaved.length * 8;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vert : vert;
        if (!isFunc[y][x] && bitIdx < totalStreamBits) {
          const dark = ((interleaved[bitIdx >>> 3] >>> (7 - (bitIdx & 7))) & 1) !== 0;
          modules[y][x] = dark;
          bitIdx += 1;
        }
      }
    }
  }

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (!isFunc[y][x] && (x + y) % 2 === 0) {
        modules[y][x] = !modules[y][x];
      }
    }
  }
  const formatBits = 0x77c4;
  for (let i = 0; i <= 5; i += 1) setFunc(8, i, ((formatBits >>> i) & 1) !== 0);
  setFunc(8, 7, ((formatBits >>> 6) & 1) !== 0);
  setFunc(8, 8, ((formatBits >>> 7) & 1) !== 0);
  setFunc(7, 8, ((formatBits >>> 8) & 1) !== 0);
  for (let i = 9; i < 15; i += 1) setFunc(14 - i, 8, ((formatBits >>> i) & 1) !== 0);
  for (let i = 0; i < 8; i += 1) setFunc(size - 1 - i, 8, ((formatBits >>> i) & 1) !== 0);
  for (let i = 8; i < 15; i += 1) setFunc(8, size - 15 + i, ((formatBits >>> i) & 1) !== 0);
  setFunc(8, size - 8, true);

  const margin = 4;
  const viewSize = size + margin * 2;
  const parts: string[] = [];
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (modules[y][x]) parts.push(`M${x + margin},${y + margin}h1v1h-1z`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelSize}" height="${pixelSize}" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${parts.join("")}" fill="#0f172a"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
