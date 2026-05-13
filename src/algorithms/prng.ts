export class SeededPRNG {
  private state0: number
  private state1: number

  constructor(seed: number) {
    this.state0 = this.hashSeed(seed)
    this.state1 = this.hashSeed(this.state0 ^ 0xdeadbeef)
    if (this.state0 === 0 && this.state1 === 0) {
      this.state0 = 1
    }
    for (let i = 0; i < 20; i++) {
      this.next()
    }
  }

  private hashSeed(seed: number): number {
    let h = seed | 0
    h = ((h >> 16) ^ h) * 0x45d9f3b
    h = ((h >> 16) ^ h) * 0x45d9f3b
    h = (h >> 16) ^ h
    return h >>> 0
  }

  next(): number {
    let s0 = this.state0
    let s1 = this.state1
    const result = (s0 + s1) >>> 0
    s1 ^= s0
    this.state0 = ((s0 << 23) | (s0 >>> 9)) ^ s1 ^ (s1 << 17)
    this.state1 = (s1 << 26) | (s1 >>> 6)
    return result >>> 0
  }

  nextInRange(max: number): number {
    const limit = Math.floor((0x100000000 / max) * max)
    let r: number
    do {
      r = this.next()
    } while (r >= limit)
    return r % max
  }
}

function fmix64(h: number): number {
  h ^= h >>> 16
  h = Math.imul(h, 0x85ebca6b)
  h ^= h >>> 13
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 16
  return h >>> 0
}

export function keyToSeed(key: string): number {
  if (!key) return 0x4d47434f

  let h1 = 0x811c9dc5
  let h2 = 0xc1a2d3e4

  for (let i = 0; i < key.length; i++) {
    const c = key.charCodeAt(i)
    h1 ^= c
    h1 = Math.imul(h1, 0x01000193)
    h2 ^= c << (i % 24)
    h2 = Math.imul(h2, 0x9e3779b9)
  }

  h1 = fmix64(h1)
  h2 = fmix64(h2 ^ h1)

  for (let round = 0; round < 8; round++) {
    h1 = fmix64(h1 ^ Math.imul(h2, 0x5bd1e995))
    h2 = fmix64(h2 ^ Math.imul(h1, 0x27d4eb2d))
  }

  return (h1 ^ h2) >>> 0
}
