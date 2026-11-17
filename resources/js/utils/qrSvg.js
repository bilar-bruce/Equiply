/**
 * Zero-dependency ISO/IEC 18004 QR Code matrix generator (Byte mode, ECC Level L, Mask 0).
 * Supports Version 2-L (25x25, up to 32 bytes) and Version 3-L (29x29, up to 53 bytes).
 */

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
    let x = 1;
    for (let i = 0; i < 255; i++) {
        GF_EXP[i] = x;
        GF_LOG[x] = i;
        x <<= 1;
        if (x & 0x100) x ^= 0x11d;
    }
    for (let i = 255; i < 512; i++) {
        GF_EXP[i] = GF_EXP[i - 255];
    }
})();

function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree) {
    let poly = [1];
    for (let i = 0; i < degree; i++) {
        const next = new Array(poly.length + 1).fill(0);
        const factor = GF_EXP[i];
        for (let j = 0; j < poly.length; j++) {
            next[j] ^= poly[j];
            next[j + 1] ^= gfMul(poly[j], factor);
        }
        poly = next;
    }
    return poly;
}

function rsEncode(data, ecCount) {
    const gen = rsGeneratorPoly(ecCount);
    const res = new Uint8Array(data.length + ecCount);
    res.set(data);
    for (let i = 0; i < data.length; i++) {
        const coef = res[i];
        if (coef !== 0) {
            for (let j = 0; j < gen.length; j++) {
                res[i + j] ^= gfMul(gen[j], coef);
            }
        }
    }
    return res.slice(data.length);
}

function placeFinder(grid, reserved, row, col) {
    for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
            const rr = row + r;
            const cc = col + c;
            if (rr < 0 || cc < 0 || rr >= grid.length || cc >= grid.length) continue;
            const isSeparator = r === -1 || r === 7 || c === -1 || c === 7;
            const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            grid[rr][cc] = !isSeparator && (isOuter || isInner) ? 1 : 0;
            reserved[rr][cc] = true;
        }
    }
}

function placeAlignment(grid, reserved, centerRow, centerCol) {
    for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
            const rr = centerRow + r;
            const cc = centerCol + c;
            if (reserved[rr][cc]) continue;
            const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
            const isCenter = r === 0 && c === 0;
            grid[rr][cc] = isBorder || isCenter ? 1 : 0;
            reserved[rr][cc] = true;
        }
    }
}

export function generateQrMatrix(text) {
    const bytes = new TextEncoder().encode(String(text || ''));
    const useV3 = bytes.length > 32;
    const size = useV3 ? 29 : 25;
    const dataCodewords = useV3 ? 55 : 34;
    const ecCodewords = useV3 ? 15 : 10;
    const alignCenter = useV3 ? 22 : 18;

    const payload = bytes.slice(0, useV3 ? 53 : 32);

    // Build bit stream: Mode (0100) + Length (8 bits) + Payload + Terminator (0000)
    const bits = [];
    const pushBits = (val, len) => {
        for (let i = len - 1; i >= 0; i--) {
            bits.push((val >> i) & 1);
        }
    };

    pushBits(0b0100, 4);
    pushBits(payload.length, 8);
    for (const b of payload) pushBits(b, 8);
    pushBits(0, Math.min(4, dataCodewords * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const data = new Uint8Array(dataCodewords);
    for (let i = 0; i < bits.length / 8; i++) {
        let byte = 0;
        for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i * 8 + b];
        data[i] = byte;
    }

    const padBytes = [0xec, 0x11];
    for (let i = bits.length / 8, p = 0; i < dataCodewords; i++, p++) {
        data[i] = padBytes[p % 2];
    }

    const ec = rsEncode(data, ecCodewords);
    const fullBits = [];
    for (const b of data) for (let i = 7; i >= 0; i--) fullBits.push((b >> i) & 1);
    for (const b of ec) for (let i = 7; i >= 0; i--) fullBits.push((b >> i) & 1);

    const grid = Array.from({ length: size }, () => new Uint8Array(size));
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));

    // Finder patterns
    placeFinder(grid, reserved, 0, 0);
    placeFinder(grid, reserved, 0, size - 7);
    placeFinder(grid, reserved, size - 7, 0);

    // Alignment pattern
    placeAlignment(grid, reserved, alignCenter, alignCenter);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
        const bit = i % 2 === 0 ? 1 : 0;
        if (!reserved[6][i]) {
            grid[6][i] = bit;
            reserved[6][i] = true;
        }
        if (!reserved[i][6]) {
            grid[i][6] = bit;
            reserved[i][6] = true;
        }
    }

    // Dark module
    grid[size - 8][8] = 1;
    reserved[size - 8][8] = true;

    // Reserve format info cells
    for (let i = 0; i < 9; i++) {
        if (i !== 6) {
            reserved[8][i] = true;
            reserved[i][8] = true;
        }
    }
    for (let i = size - 8; i < size; i++) {
        reserved[8][i] = true;
        reserved[i][8] = true;
    }

    // Place data bits in zig-zag with Mask 0: (r + c) % 2 === 0
    let bitIdx = 0;
    let up = true;
    for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        for (let step = 0; step < size; step++) {
            const row = up ? size - 1 - step : step;
            for (let dc = 0; dc < 2; dc++) {
                const c = col - dc;
                if (reserved[row][c]) continue;
                const rawBit = bitIdx < fullBits.length ? fullBits[bitIdx++] : 0;
                const maskedBit = (row + c) % 2 === 0 ? rawBit ^ 1 : rawBit;
                grid[row][c] = maskedBit;
            }
        }
        up = !up;
    }

    // Format info for ECC Level L (01) + Mask 0 (000): 111011111000100
    const formatBits = '111011111000100';
    for (let i = 0; i < 15; i++) {
        const bit = formatBits[i] === '1' ? 1 : 0;
        // Top-left horizontal & vertical
        if (i < 6) grid[8][i] = bit;
        else if (i < 8) grid[8][i + 1] = bit;
        else grid[14 - i][8] = bit;

        // Bottom-left & top-right
        if (i < 8) grid[size - 1 - i][8] = bit;
        else grid[8][size - 15 + i] = bit;
    }

    return grid;
}
