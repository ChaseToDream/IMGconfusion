const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeChunk(type: string, data: Uint8Array): Uint8Array {
  const length = data.length
  const chunk = new Uint8Array(12 + length)
  const view = new DataView(chunk.buffer)
  view.setUint32(0, length)
  for (let i = 0; i < 4; i++) {
    chunk[4 + i] = type.charCodeAt(i)
  }
  chunk.set(data, 8)
  const typeAndData = chunk.slice(4, 8 + length)
  view.setUint32(8 + length, crc32(typeAndData))
  return chunk
}

function readChunk(data: Uint8Array, offset: number): { type: string; data: Uint8Array; nextOffset: number } | null {
  if (offset + 8 > data.length) return null
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const length = view.getUint32(offset)
  const type = String.fromCharCode(data[offset + 4], data[offset + 5], data[offset + 6], data[offset + 7])
  if (offset + 12 + length > data.length) return null
  const chunkData = data.slice(offset + 8, offset + 8 + length)
  return { type, data: chunkData, nextOffset: offset + 12 + length }
}

/**
 * 向 PNG 文件中插入自定义 tEXt 块
 */
export function insertPngTextChunk(pngData: Uint8Array, keyword: string, text: string): Uint8Array {
  const keywordBytes = new TextEncoder().encode(keyword)
  const textBytes = new TextEncoder().encode(text)
  const chunkData = new Uint8Array(keywordBytes.length + 1 + textBytes.length)
  chunkData.set(keywordBytes, 0)
  chunkData[keywordBytes.length] = 0
  chunkData.set(textBytes, keywordBytes.length + 1)

  const textChunk = writeChunk('tEXt', chunkData)

  const parts: Uint8Array[] = [PNG_SIGNATURE]
  let offset = 8
  let iendFound = false

  while (offset < pngData.length) {
    const chunk = readChunk(pngData, offset)
    if (!chunk) break

    if (chunk.type === 'IEND' && !iendFound) {
      parts.push(textChunk)
      iendFound = true
    }
    parts.push(pngData.slice(offset, chunk.nextOffset))
    offset = chunk.nextOffset
  }

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalLength)
  let pos = 0
  for (const part of parts) {
    result.set(part, pos)
    pos += part.length
  }
  return result
}

/**
 * 从 PNG 文件中读取自定义 tEXt 块
 */
export function readPngTextChunk(pngData: Uint8Array, keyword: string): string | null {
  let offset = 8
  while (offset < pngData.length) {
    const chunk = readChunk(pngData, offset)
    if (!chunk) break
    if (chunk.type === 'tEXt') {
      const nullIndex = chunk.data.indexOf(0)
      if (nullIndex !== -1) {
        const kw = new TextDecoder().decode(chunk.data.slice(0, nullIndex))
        if (kw === keyword) {
          return new TextDecoder().decode(chunk.data.slice(nullIndex + 1))
        }
      }
    }
    offset = chunk.nextOffset
  }
  return null
}

/**
 * 从 JPEG 文件中提取 EXIF 数据
 */
export function extractJpegExif(fileData: Uint8Array): Uint8Array | null {
  if (fileData[0] !== 0xff || fileData[1] !== 0xd8) return null
  let offset = 2
  while (offset < fileData.length - 1) {
    if (fileData[offset] !== 0xff) break
    const marker = fileData[offset + 1]
    if (marker === 0xe1) {
      const length = (fileData[offset + 2] << 8) | fileData[offset + 3]
      return fileData.slice(offset, offset + 2 + length)
    }
    if (marker === 0xda || marker === 0xd9) break
    const segLen = (fileData[offset + 2] << 8) | fileData[offset + 3]
    offset += 2 + segLen
  }
  return null
}

/**
 * 将 Uint8Array 编码为 base64
 */
export function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i])
  }
  return btoa(binary)
}

/**
 * 将 base64 解码为 Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64)
  const data = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    data[i] = binary.charCodeAt(i)
  }
  return data
}

export function insertJpegExifIntoPng(pngData: Uint8Array, exifData: Uint8Array): Uint8Array | null {
  if (exifData.length < 4) return null
  const exifMarker = exifData.slice(0, 2)
  if (exifMarker[0] !== 0xff || exifMarker[1] !== 0xe1) return null

  const exifPayload = exifData.slice(4)
  const keywordBytes = new TextEncoder().encode('Raw profile type exif')
  const nullSep = new Uint8Array([0])
  const headerLine = new TextEncoder().encode('\nexif\n' + exifPayload.length.toString(16) + '\n')

  const hexChars = '0123456789abcdef'
  const hexData = new Uint8Array(exifPayload.length * 2)
  for (let i = 0; i < exifPayload.length; i++) {
    hexData[i * 2] = hexChars.charCodeAt((exifPayload[i] >> 4) & 0x0f)
    hexData[i * 2 + 1] = hexChars.charCodeAt(exifPayload[i] & 0x0f)
  }

  const totalChunkDataLen = keywordBytes.length + nullSep.length + headerLine.length + hexData.length
  const chunkData = new Uint8Array(totalChunkDataLen)
  let pos = 0
  chunkData.set(keywordBytes, pos); pos += keywordBytes.length
  chunkData.set(nullSep, pos); pos += nullSep.length
  chunkData.set(headerLine, pos); pos += headerLine.length
  chunkData.set(hexData, pos)

  const exifChunk = writeChunk('tEXt', chunkData)

  const parts: Uint8Array[] = [PNG_SIGNATURE]
  let offset = 8
  let ihdrSeen = false

  while (offset < pngData.length) {
    const chunk = readChunk(pngData, offset)
    if (!chunk) break

    parts.push(pngData.slice(offset, chunk.nextOffset))

    if (chunk.type === 'IHDR' && !ihdrSeen) {
      parts.push(exifChunk)
      ihdrSeen = true
    }
    offset = chunk.nextOffset
  }

  const totalLength = parts.reduce((sum, p) => sum + p.length, 0)
  const result = new Uint8Array(totalLength)
  pos = 0
  for (const part of parts) {
    result.set(part, pos)
    pos += part.length
  }
  return result
}
