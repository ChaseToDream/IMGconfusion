import { SeededPRNG, keyToSeed } from './prng'
import type { AlgorithmInfo } from '../types'

export const SHUFFLE_ALGORITHM: AlgorithmInfo = {
  id: 'pixel-shuffle',
  name: '像素洗牌',
  description: '基于密码种子的像素位置重排，混淆后图片呈随机噪点状',
}

/**
 * 生成 Fisher-Yates 洗牌排列
 */
function generatePermutation(length: number, prng: SeededPRNG): Uint32Array {
  const perm = new Uint32Array(length)
  for (let i = 0; i < length; i++) {
    perm[i] = i
  }
  for (let i = length - 1; i > 0; i--) {
    const j = prng.nextInRange(i + 1)
    const tmp = perm[i]
    perm[i] = perm[j]
    perm[j] = tmp
  }
  return perm
}

/**
 * 生成逆排列（用于还原）
 */
function invertPermutation(perm: Uint32Array): Uint32Array {
  const inv = new Uint32Array(perm.length)
  for (let i = 0; i < perm.length; i++) {
    inv[perm[i]] = i
  }
  return inv
}

/**
 * 混淆图片：根据密码对像素位置进行洗牌
 */
export function obfuscatePixels(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  key: string,
  onProgress?: (percent: number) => void
): Uint8ClampedArray {
  const pixelCount = width * height
  const seed = keyToSeed(key)
  const prng = new SeededPRNG(seed)
  const permutation = generatePermutation(pixelCount, prng)

  const dstData = new Uint8ClampedArray(srcData.length)
  const reportInterval = Math.max(1, Math.floor(pixelCount / 100))

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i * 4
    const dstIdx = permutation[i] * 4
    dstData[dstIdx] = srcData[srcIdx]
    dstData[dstIdx + 1] = srcData[srcIdx + 1]
    dstData[dstIdx + 2] = srcData[srcIdx + 2]
    dstData[dstIdx + 3] = srcData[srcIdx + 3]

    if (onProgress && i % reportInterval === 0) {
      onProgress(Math.floor((i / pixelCount) * 100))
    }
  }

  if (onProgress) onProgress(100)
  return dstData
}

/**
 * 还原图片：根据密码逆向恢复像素位置
 */
export function restorePixels(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  key: string,
  onProgress?: (percent: number) => void
): Uint8ClampedArray {
  const pixelCount = width * height
  const seed = keyToSeed(key)
  const prng = new SeededPRNG(seed)
  const permutation = generatePermutation(pixelCount, prng)
  const inversePerm = invertPermutation(permutation)

  const dstData = new Uint8ClampedArray(srcData.length)
  const reportInterval = Math.max(1, Math.floor(pixelCount / 100))

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i * 4
    const dstIdx = inversePerm[i] * 4
    dstData[dstIdx] = srcData[srcIdx]
    dstData[dstIdx + 1] = srcData[srcIdx + 1]
    dstData[dstIdx + 2] = srcData[srcIdx + 2]
    dstData[dstIdx + 3] = srcData[srcIdx + 3]

    if (onProgress && i % reportInterval === 0) {
      onProgress(Math.floor((i / pixelCount) * 100))
    }
  }

  if (onProgress) onProgress(100)
  return dstData
}

export const algorithms: AlgorithmInfo[] = [SHUFFLE_ALGORITHM]
