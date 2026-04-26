/**
 * 基于 xorshift128+ 的种子伪随机数生成器
 * 确保相同种子产生相同随机序列，用于可逆的像素洗牌
 */
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

/**
 * 将密码字符串转换为数值种子（使用 FNV-1a 哈希算法）
 */
export function keyToSeed(key: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
