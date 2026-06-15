// Minimal QR Code encoder (ISO/IEC 18004), byte mode only, versions 1-10.
// Covers plain text, URLs, phone numbers and Wi-Fi config strings.
// Exposes QR.generate(text, ecLevel) -> { size, matrix, version }
const QR = (() => {
  const EXP = new Array(256);
  const LOG = new Array(256);
  for (let i = 0; i < 8; i++) EXP[i] = 1 << i;
  for (let i = 8; i < 256; i++) {
    EXP[i] = EXP[i - 4] ^ EXP[i - 5] ^ EXP[i - 6] ^ EXP[i - 8];
  }
  for (let i = 0; i < 255; i++) LOG[EXP[i]] = i;

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[(LOG[a] + LOG[b]) % 255];
  }

  function rsGenerator(degree) {
    let g = [1];
    for (let i = 0; i < degree; i++) {
      const e = [1, EXP[i]];
      const result = new Array(g.length + e.length - 1).fill(0);
      for (let a = 0; a < g.length; a++) {
        for (let b = 0; b < e.length; b++) {
          result[a + b] ^= gfMul(g[a], e[b]);
        }
      }
      g = result;
    }
    return g;
  }

  function rsEncode(dataCodewords, ecCount) {
    const generator = rsGenerator(ecCount);
    const message = dataCodewords.concat(new Array(ecCount).fill(0));
    for (let i = 0; i < dataCodewords.length; i++) {
      const coef = message[i];
      if (coef !== 0) {
        for (let j = 0; j < generator.length; j++) {
          message[i + j] ^= gfMul(generator[j], coef);
        }
      }
    }
    return message.slice(dataCodewords.length);
  }

  const RS_BLOCK_TABLE = {
    1: { L: [[1, 26, 19]], M: [[1, 26, 16]], Q: [[1, 26, 13]], H: [[1, 26, 9]] },
    2: { L: [[1, 44, 34]], M: [[1, 44, 28]], Q: [[1, 44, 22]], H: [[1, 44, 16]] },
    3: { L: [[1, 70, 55]], M: [[1, 70, 44]], Q: [[2, 35, 17]], H: [[2, 35, 13]] },
    4: { L: [[1, 100, 80]], M: [[2, 50, 32]], Q: [[2, 50, 24]], H: [[4, 25, 9]] },
    5: { L: [[1, 134, 108]], M: [[2, 67, 43]], Q: [[2, 33, 15], [2, 34, 16]], H: [[2, 33, 11], [2, 34, 12]] },
    6: { L: [[2, 86, 68]], M: [[4, 43, 27]], Q: [[4, 43, 19]], H: [[4, 43, 15]] },
    7: { L: [[2, 98, 78]], M: [[4, 49, 31]], Q: [[2, 32, 14], [4, 33, 15]], H: [[4, 39, 13], [1, 40, 14]] },
    8: { L: [[2, 121, 97]], M: [[2, 60, 38], [2, 61, 39]], Q: [[4, 40, 18], [2, 41, 19]], H: [[4, 40, 14], [2, 41, 15]] },
    9: { L: [[2, 146, 116]], M: [[3, 58, 36], [2, 59, 37]], Q: [[4, 36, 16], [4, 37, 17]], H: [[4, 36, 12], [4, 37, 13]] },
    10: { L: [[2, 86, 68], [2, 87, 69]], M: [[4, 69, 43], [1, 70, 44]], Q: [[6, 43, 19], [2, 44, 20]], H: [[6, 43, 15], [2, 44, 16]] }
  };

  function getBlocks(version, level) {
    const groups = RS_BLOCK_TABLE[version][level];
    const blocks = [];
    for (const [count, total, data] of groups) {
      for (let i = 0; i < count; i++) blocks.push({ total, data, ec: total - data });
    }
    return blocks;
  }

  function getDataCapacityCodewords(version, level) {
    return getBlocks(version, level).reduce((s, b) => s + b.data, 0);
  }

  function utf8Encode(str) {
    return Array.from(new TextEncoder().encode(str));
  }

  function pushBits(arr, num, length) {
    for (let i = length - 1; i >= 0; i--) arr.push((num >>> i) & 1);
  }

  function selectVersion(byteLength, level, maxVersion) {
    for (let v = 1; v <= maxVersion; v++) {
      const countBits = v <= 9 ? 8 : 16;
      const capBits = getDataCapacityCodewords(v, level) * 8;
      const neededBits = 4 + countBits + byteLength * 8;
      if (neededBits <= capBits) return v;
    }
    return null;
  }

  function encodeData(text, level, maxVersion) {
    const bytes = utf8Encode(text);
    const version = selectVersion(bytes.length, level, maxVersion || 10);
    if (!version) return null;

    const countBits = version <= 9 ? 8 : 16;
    const bits = [];
    pushBits(bits, 0b0100, 4);
    pushBits(bits, bytes.length, countBits);
    for (const b of bytes) pushBits(bits, b, 8);

    const capBits = getDataCapacityCodewords(version, level) * 8;
    if (bits.length + 4 <= capBits) pushBits(bits, 0, 4);
    while (bits.length % 8 !== 0) bits.push(0);
    const padBytes = [0xEC, 0x11];
    let pi = 0;
    while (bits.length < capBits) {
      pushBits(bits, padBytes[pi % 2], 8);
      pi++;
    }

    const dataCodewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | bits[i + j];
      dataCodewords.push(byte);
    }

    const blocks = getBlocks(version, level);
    let offset = 0;
    const dataBlocks = [];
    const ecBlocks = [];
    for (const b of blocks) {
      const slice = dataCodewords.slice(offset, offset + b.data);
      offset += b.data;
      dataBlocks.push(slice);
      ecBlocks.push(rsEncode(slice, b.ec));
    }

    const result = [];
    const maxData = Math.max(...blocks.map(b => b.data));
    for (let i = 0; i < maxData; i++) {
      for (const db of dataBlocks) if (i < db.length) result.push(db[i]);
    }
    const maxEc = Math.max(...blocks.map(b => b.ec));
    for (let i = 0; i < maxEc; i++) {
      for (const eb of ecBlocks) if (i < eb.length) result.push(eb[i]);
    }

    const finalBits = [];
    for (const cw of result) for (let i = 7; i >= 0; i--) finalBits.push((cw >> i) & 1);

    return { version, finalBits };
  }

  const ALIGNMENT_POSITIONS = {
    1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30],
    6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]
  };

  function bitLength(num) {
    let len = 0;
    while (num !== 0) { num = num >>> 1; len++; }
    return len;
  }

  function bchEncode(data, gen) {
    let d = data;
    const genLen = bitLength(gen);
    while (bitLength(d) >= genLen) {
      d ^= gen << (bitLength(d) - genLen);
    }
    return d;
  }

  function getFormatBits(level, mask) {
    const ecIndicator = { L: 1, M: 0, Q: 3, H: 2 }[level];
    const data = (ecIndicator << 3) | mask;
    const ecc = bchEncode(data << 10, 0x537);
    const combined = (data << 10) | ecc;
    return combined ^ 0x5412;
  }

  function getVersionBits(version) {
    const ecc = bchEncode(version << 12, 0x1F25);
    return (version << 12) | ecc;
  }

  function placeFinder(modules, reserved, N, r0, c0) {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const rr = r0 + dr, cc = c0 + dc;
        if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
        reserved[rr][cc] = true;
        if (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) {
          const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
          const isCenter = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
          modules[rr][cc] = isBorder || isCenter;
        } else {
          modules[rr][cc] = false;
        }
      }
    }
  }

  function placeAlignment(modules, reserved, r0, c0) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const rr = r0 + dr, cc = c0 + dc;
        const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
        const isCenter = dr === 0 && dc === 0;
        modules[rr][cc] = isBorder || isCenter;
        reserved[rr][cc] = true;
      }
    }
  }

  function placeData(modules, reserved, N, dataBits) {
    let bitIndex = 0;
    let direction = -1;
    let row = N - 1;
    // Zigzag from the bottom-right in two-column strips, moving up then down.
    // Columns at or left of the timing column (6) shift one position left.
    for (let col = N - 1; col > 0; col -= 2) {
      let adjCol = col;
      if (adjCol <= 6) adjCol--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          const cc = adjCol - c;
          if (!reserved[row][cc]) {
            const bit = bitIndex < dataBits.length ? dataBits[bitIndex] : 0;
            modules[row][cc] = bit === 1;
            bitIndex++;
          }
        }
        row += direction;
        if (row < 0 || row >= N) {
          row -= direction;
          direction = -direction;
          break;
        }
      }
    }
  }

  const MASK_FUNCS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
    (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
    (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
  ];

  function applyMask(modules, reserved, N, maskIndex) {
    const fn = MASK_FUNCS[maskIndex];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (!reserved[r][c] && fn(r, c)) {
          modules[r][c] = !modules[r][c];
        }
      }
    }
  }

  function setFormatInfo(modules, N, level, mask) {
    const bits = getFormatBits(level, mask);
    for (let i = 0; i < 15; i++) {
      const bit = ((bits >> i) & 1) === 1;
      if (i < 6) modules[i][8] = bit;
      else if (i < 8) modules[i + 1][8] = bit;
      else modules[N - 15 + i][8] = bit;

      if (i < 8) modules[8][N - i - 1] = bit;
      else if (i < 9) modules[8][15 - i] = bit;
      else modules[8][15 - i - 1] = bit;
    }
  }

  function setVersionInfo(modules, N, version) {
    const bits = getVersionBits(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((bits >> i) & 1) === 1;
      const row = Math.floor(i / 3);
      const col = i % 3;
      modules[N - 11 + col][row] = bit;
      modules[row][N - 11 + col] = bit;
    }
  }

  function computeScore(modules, N) {
    let score = 0;
    for (let r = 0; r < N; r++) {
      let runColor = modules[r][0], runLen = 1;
      for (let c = 1; c < N; c++) {
        if (modules[r][c] === runColor) runLen++;
        else { if (runLen >= 5) score += 3 + (runLen - 5); runColor = modules[r][c]; runLen = 1; }
      }
      if (runLen >= 5) score += 3 + (runLen - 5);
    }
    for (let c = 0; c < N; c++) {
      let runColor = modules[0][c], runLen = 1;
      for (let r = 1; r < N; r++) {
        if (modules[r][c] === runColor) runLen++;
        else { if (runLen >= 5) score += 3 + (runLen - 5); runColor = modules[r][c]; runLen = 1; }
      }
      if (runLen >= 5) score += 3 + (runLen - 5);
    }
    for (let r = 0; r < N - 1; r++) {
      for (let c = 0; c < N - 1; c++) {
        const v = modules[r][c];
        if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
      }
    }
    const pattern1 = [true, false, true, true, true, false, true, false, false, false, false];
    const pattern2 = [false, false, false, false, true, false, true, true, true, false, true];
    for (let r = 0; r < N; r++) {
      for (let c = 0; c <= N - 11; c++) {
        let m1 = true, m2 = true;
        for (let k = 0; k < 11; k++) {
          if (modules[r][c + k] !== pattern1[k]) m1 = false;
          if (modules[r][c + k] !== pattern2[k]) m2 = false;
        }
        if (m1 || m2) score += 40;
      }
    }
    for (let c = 0; c < N; c++) {
      for (let r = 0; r <= N - 11; r++) {
        let m1 = true, m2 = true;
        for (let k = 0; k < 11; k++) {
          if (modules[r + k][c] !== pattern1[k]) m1 = false;
          if (modules[r + k][c] !== pattern2[k]) m2 = false;
        }
        if (m1 || m2) score += 40;
      }
    }
    let dark = 0;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (modules[r][c]) dark++;
    const percent = (dark * 100) / (N * N);
    const k = Math.floor(Math.abs(percent - 50) / 5);
    score += k * 10;
    return score;
  }

  function generate(text, level, maxVersion) {
    level = level || 'M';
    const enc = encodeData(text, level, maxVersion);
    if (!enc) return null;
    const { version, finalBits } = enc;
    const N = version * 4 + 17;

    const modules = Array.from({ length: N }, () => new Array(N).fill(null));
    const reserved = Array.from({ length: N }, () => new Array(N).fill(false));

    placeFinder(modules, reserved, N, 0, 0);
    placeFinder(modules, reserved, N, 0, N - 7);
    placeFinder(modules, reserved, N, N - 7, 0);

    for (let i = 8; i < N - 8; i++) {
      if (!reserved[6][i]) { modules[6][i] = i % 2 === 0; reserved[6][i] = true; }
      if (!reserved[i][6]) { modules[i][6] = i % 2 === 0; reserved[i][6] = true; }
    }

    const pos = ALIGNMENT_POSITIONS[version];
    if (pos.length) {
      const first = pos[0], last = pos[pos.length - 1];
      for (const r of pos) {
        for (const c of pos) {
          if ((r === first && c === first) || (r === first && c === last) || (r === last && c === first)) continue;
          placeAlignment(modules, reserved, r, c);
        }
      }
    }

    for (let i = 0; i <= 5; i++) {
      reserved[i][8] = true;
      reserved[8][i] = true;
    }
    reserved[7][8] = true;
    reserved[8][7] = true;
    reserved[8][8] = true;
    for (let i = N - 8; i <= N - 1; i++) reserved[8][i] = true;
    for (let i = N - 7; i <= N - 1; i++) reserved[i][8] = true;

    modules[N - 8][8] = true;
    reserved[N - 8][8] = true;

    if (version >= 7) {
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 3; j++) {
          reserved[i][N - 11 + j] = true;
          reserved[N - 11 + j][i] = true;
        }
      }
    }

    placeData(modules, reserved, N, finalBits);

    let bestScore = Infinity, bestMatrix = null;
    for (let mask = 0; mask < 8; mask++) {
      const trial = modules.map(row => row.slice());
      applyMask(trial, reserved, N, mask);
      setFormatInfo(trial, N, level, mask);
      if (version >= 7) setVersionInfo(trial, N, version);
      const score = computeScore(trial, N);
      if (score < bestScore) { bestScore = score; bestMatrix = trial; }
    }

    return { size: N, matrix: bestMatrix, version };
  }

  return { generate };
})();

if (typeof module !== 'undefined') module.exports = QR;
