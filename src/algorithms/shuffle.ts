import { SeededPRNG, keyToSeed } from './prng'
import type { AlgorithmInfo } from '../types'

export const SHUFFLE_ALGORITHM: AlgorithmInfo = {
  id: 'pixel-shuffle',
  name: '像素洗牌',
  description: '基于密码种子的像素位置重排，混淆后图片呈随机噪点状',
}

export const CHANNEL_ALGORITHM: AlgorithmInfo = {
  id: 'channel-shuffle',
  name: '通道洗牌',
  description: '基于密码种子的通道值重排，混淆后图片呈色彩错乱状',
}

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

function invertPermutation(perm: Uint32Array): Uint32Array {
  const inv = new Uint32Array(perm.length)
  for (let i = 0; i < perm.length; i++) {
    inv[perm[i]] = i
  }
  return inv
}

const PROGRESS_STEPS = 100

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
  const reportInterval = Math.max(1, Math.floor(pixelCount / PROGRESS_STEPS))
  let nextReport = reportInterval

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i << 2
    const dstIdx = permutation[i] << 2
    dstData[dstIdx] = srcData[srcIdx]
    dstData[dstIdx + 1] = srcData[srcIdx + 1]
    dstData[dstIdx + 2] = srcData[srcIdx + 2]
    dstData[dstIdx + 3] = srcData[srcIdx + 3]

    if (onProgress && i >= nextReport) {
      onProgress(Math.floor((i / pixelCount) * 100))
      nextReport += reportInterval
    }
  }

  if (onProgress) onProgress(100)
  return dstData
}

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
  const reportInterval = Math.max(1, Math.floor(pixelCount / PROGRESS_STEPS))
  let nextReport = reportInterval

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i << 2
    const dstIdx = inversePerm[i] << 2
    dstData[dstIdx] = srcData[srcIdx]
    dstData[dstIdx + 1] = srcData[srcIdx + 1]
    dstData[dstIdx + 2] = srcData[srcIdx + 2]
    dstData[dstIdx + 3] = srcData[srcIdx + 3]

    if (onProgress && i >= nextReport) {
      onProgress(Math.floor((i / pixelCount) * 100))
      nextReport += reportInterval
    }
  }

  if (onProgress) onProgress(100)
  return dstData
}

export function obfuscateChannels(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  key: string,
  onProgress?: (percent: number) => void
): Uint8ClampedArray {
  const pixelCount = width * height
  const seed = keyToSeed(key)
  const prng = new SeededPRNG(seed)

  const rPerm = generatePermutation(pixelCount, prng)
  const gPerm = generatePermutation(pixelCount, prng)
  const bPerm = generatePermutation(pixelCount, prng)

  const dstData = new Uint8ClampedArray(srcData.length)
  const reportInterval = Math.max(1, Math.floor(pixelCount / PROGRESS_STEPS))
  let nextReport = reportInterval

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i << 2
    dstData[rPerm[i] << 2] = srcData[srcIdx]
    dstData[(gPerm[i] << 2) + 1] = srcData[srcIdx + 1]
    dstData[(bPerm[i] << 2) + 2] = srcData[srcIdx + 2]
    dstData[i * 4 + 3] = srcData[srcIdx + 3]

    if (onProgress && i >= nextReport) {
      onProgress(Math.floor((i / pixelCount) * 100))
      nextReport += reportInterval
    }
  }

  if (onProgress) onProgress(100)
  return dstData
}

export function restoreChannels(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  key: string,
  onProgress?: (percent: number) => void
): Uint8ClampedArray {
  const pixelCount = width * height
  const seed = keyToSeed(key)
  const prng = new SeededPRNG(seed)

  const rPerm = generatePermutation(pixelCount, prng)
  const gPerm = generatePermutation(pixelCount, prng)
  const bPerm = generatePermutation(pixelCount, prng)

  const rInv = invertPermutation(rPerm)
  const gInv = invertPermutation(gPerm)
  const bInv = invertPermutation(bPerm)

  const dstData = new Uint8ClampedArray(srcData.length)
  const reportInterval = Math.max(1, Math.floor(pixelCount / PROGRESS_STEPS))
  let nextReport = reportInterval

  for (let i = 0; i < pixelCount; i++) {
    const srcIdx = i << 2
    dstData[rInv[i] << 2] = srcData[srcIdx]
    dstData[(gInv[i] << 2) + 1] = srcData[srcIdx + 1]
    dstData[(bInv[i] << 2) + 2] = srcData[srcIdx + 2]
    dstData[i * 4 + 3] = srcData[srcIdx + 3]

    if (onProgress && i >= nextReport) {
      onProgress(Math.floor((i / pixelCount) * 100))
      nextReport += reportInterval
    }
  }

  if (onProgress) onProgress(100)
  return dstData
}

export const algorithms: AlgorithmInfo[] = [SHUFFLE_ALGORITHM, CHANNEL_ALGORITHM]
