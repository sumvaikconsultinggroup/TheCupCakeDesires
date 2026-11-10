/**
 * Pure SHA-1 hex digest. Bundle-safe: no Node built-ins.
 * Byte-identical to `createHash('sha1').update(value).digest('hex')` for UTF-8 strings.
 */

function rotl(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0
}

function toHex8(value: number): string {
  return (value >>> 0).toString(16).padStart(8, '0')
}

function utf8Bytes(message: string): Uint8Array {
  return new TextEncoder().encode(message)
}

function paddedWords(bytes: Uint8Array): Uint32Array {
  const bitLen = bytes.length * 8
  let padded = bytes.length + 1
  while (padded % 64 !== 56) padded += 1
  const total = padded + 8
  const block = new Uint8Array(total)
  block.set(bytes)
  block[bytes.length] = 0x80
  const view = new DataView(block.buffer)
  view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false)
  view.setUint32(total - 4, bitLen >>> 0, false)
  const words = new Uint32Array(total / 4)
  for (let i = 0; i < words.length; i++) words[i] = view.getUint32(i * 4, false)
  return words
}

export function sha1Hex(message: string): string {
  const words = paddedWords(utf8Bytes(message))
  let h0 = 0x67452301
  let h1 = 0xefcdab89
  let h2 = 0x98badcfe
  let h3 = 0x10325476
  let h4 = 0xc3d2e1f0
  const w = new Uint32Array(80)

  for (let i = 0; i < words.length; i += 16) {
    for (let t = 0; t < 16; t++) w[t] = words[i + t]
    for (let t = 16; t < 80; t++) {
      w[t] = rotl(w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16], 1)
    }

    let a = h0
    let b = h1
    let c = h2
    let d = h3
    let e = h4

    for (let t = 0; t < 80; t++) {
      let f: number
      let k: number
      if (t < 20) {
        f = (b & c) | (~b & d)
        k = 0x5a827999
      } else if (t < 40) {
        f = b ^ c ^ d
        k = 0x6ed9eba1
      } else if (t < 60) {
        f = (b & c) | (b & d) | (c & d)
        k = 0x8f1bbcdc
      } else {
        f = b ^ c ^ d
        k = 0xca62c1d6
      }
      const temp = (rotl(a, 5) + f + e + k + w[t]) >>> 0
      e = d
      d = c
      c = rotl(b, 30)
      b = a
      a = temp
    }

    h0 = (h0 + a) >>> 0
    h1 = (h1 + b) >>> 0
    h2 = (h2 + c) >>> 0
    h3 = (h3 + d) >>> 0
    h4 = (h4 + e) >>> 0
  }

  return toHex8(h0) + toHex8(h1) + toHex8(h2) + toHex8(h3) + toHex8(h4)
}
