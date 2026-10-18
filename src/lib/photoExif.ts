import { File } from 'expo-file-system';

/**
 * Reads GPS coordinates and capture time from a photo's EXIF metadata.
 *
 * Pure JS on purpose: `expo-file-system` can hand over the raw bytes, and the
 * EXIF block is a documented binary layout. That avoids pulling in a native
 * module for something this small, and it keeps the parser testable off-device.
 *
 * Returns null whenever the photo has no usable GPS — which is the common case,
 * not the exception. Re-shares strip metadata, screenshots never have it, and a
 * re-encode can drop it. Nothing here may be treated as a guarantee.
 */

export interface PhotoLocation {
  lat: number;
  lng: number;
  /** EXIF DateTimeOriginal, when present. `null` if absent or unparseable. */
  takenAt: Date | null;
}

/** Tag ids we care about. Everything else in the EXIF block is ignored. */
const TAG_GPS_IFD = 0x8825;
const TAG_EXIF_IFD = 0x8769;
const TAG_GPS_LAT_REF = 0x0001;
const TAG_GPS_LAT = 0x0002;
const TAG_GPS_LNG_REF = 0x0003;
const TAG_GPS_LNG = 0x0004;
const TAG_DATETIME_ORIGINAL = 0x9003;

/** TIFF value types we need to interpret. */
const TYPE_ASCII = 2;
const TYPE_LONG = 4;
const TYPE_RATIONAL = 5;

/**
 * Upper bound on an ASCII value we will read. Must comfortably exceed
 * `DateTimeOriginal`, which is 19 characters — capping at 10 silently truncated
 * it to "2026:03:14" and every timestamp failed to parse. Also guards against a
 * corrupt count sending the reader off into the rest of the block.
 */
const ASCII_LIMIT = 32;

/**
 * Byte-level view over the TIFF block. TIFF is little- or big-endian and most
 * camera JPEGs are little-endian, but both occur, so the order is read from the
 * header rather than assumed.
 */
type Tiff = {
  view: DataView;
  bytes: Uint8Array;
  /** Byte offset of the TIFF block within the whole file. */
  base: number;
  little: boolean;
  u16: (offset: number) => number;
  u32: (offset: number) => number;
};

function readTiff(bytes: Uint8Array, base: number): Tiff | null {
  if (bytes.length < base + 8) return null;

  const order = String.fromCharCode(bytes[base], bytes[base + 1]);
  if (order !== 'II' && order !== 'MM') return null;

  const little = order === 'II';
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = (o: number) => view.getUint16(base + o, little);
  const u32 = (o: number) => view.getUint32(base + o, little);

  // 42 is the TIFF magic number. Its absence means this is not a TIFF block.
  if (u16(2) !== 42) return null;

  return { view, bytes, base, little, u16, u32 };
}

/** One IFD entry: where its payload lives and how to read it. */
type Entry = { type: number; count: number; valueOffset: number };

function readIfd(tiff: Tiff, ifdOffset: number, tag: number): Entry | null {
  if (ifdOffset <= 0 || ifdOffset + 2 > tiff.bytes.length) return null;

  const count = tiff.u16(ifdOffset);
  for (let i = 0; i < count; i += 1) {
    const entry = ifdOffset + 2 + i * 12;
    if (entry + 12 > tiff.bytes.length) return null;
    if (tiff.u16(entry) !== tag) continue;

    const type = tiff.u16(entry + 2);
    const valueCount = tiff.u32(entry + 4);
    // A value of 4 bytes or fewer is stored inline in the entry itself; larger
    // ones are an offset relative to the start of the TIFF block.
    const size = typeSize(type) * valueCount;
    const valueOffset = size <= 4 ? entry + 8 : tiff.u32(entry + 8);

    if (valueOffset < 0 || valueOffset >= tiff.bytes.length) return null;
    return { type, count: valueCount, valueOffset };
  }
  return null;
}

/**
 * Reads a tag whose payload is a 4-byte offset to another IFD — the GPS IFD
 * pointer (0x8825) and the Exif IFD pointer (0x8769).
 *
 * `readIfd` returns where a value *lives*; a pointer tag needs the value
 * itself, so the stored offset is read out. For these tags the offset is small
 * enough to sit inline in the entry, which is exactly the case that is easy to
 * confuse with the entry's own position.
 */
function readPointer(tiff: Tiff, ifdOffset: number, tag: number): number | null {
  const entry = readIfd(tiff, ifdOffset, tag);
  if (!entry || entry.type !== TYPE_LONG || entry.count < 1) return null;

  const pointer = tiff.u32(entry.valueOffset);
  return pointer > 0 ? pointer : null;
}

function typeSize(type: number): number {
  switch (type) {
    case TYPE_ASCII:
    case 1: // BYTE
    case 6: // SBYTE
    case 7: // UNDEFINED
      return 1;
    case 3: // SHORT
      return 2;
    case TYPE_LONG:
    case 8: // SLONG
      return 4;
    case TYPE_RATIONAL:
    case 10: // SRATIONAL
      return 8;
    default:
      return 0;
  }
}

function readRationals(tiff: Tiff, entry: Entry): number[] {
  const out: number[] = [];
  for (let i = 0; i < entry.count; i += 1) {
    const at = entry.valueOffset + i * 8;
    if (at + 8 > tiff.bytes.length) break;
    const numerator = tiff.u32(at);
    const denominator = tiff.u32(at + 4);
    // A zero denominator is corrupt rather than merely absent; bail rather than
    // produce Infinity and put the pin at the equator.
    if (denominator === 0) break;
    out.push(numerator / denominator);
  }
  return out;
}

function readAscii(tiff: Tiff, entry: Entry): string | null {
  if (entry.type !== TYPE_ASCII) return null;

  // `entry.valueOffset` is relative to the TIFF block, so every read has to be
  // shifted by `base` — indexing the raw file array without that silently
  // returned the wrong byte, which made southern and western hemisphere photos
  // come out with positive coordinates.
  const start = tiff.base + entry.valueOffset;
  const end = Math.min(start + Math.min(entry.count, ASCII_LIMIT), tiff.bytes.length);

  let out = '';
  for (let i = start; i < end; i += 1) {
    const code = tiff.bytes[i];
    if (code === 0) break;
    out += String.fromCharCode(code);
  }
  return out || null;
}

/** EXIF timestamps are `YYYY:MM:DD HH:MM:SS`, which `Date` cannot parse. */
function parseExifDate(raw: string | null): Date | null {
  if (!raw) return null;
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw);
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Locates the EXIF payload inside a JPEG's APP1 segment. */
function findExif(bytes: Uint8Array): number | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;

  let offset = 2;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) return null;

    const marker = bytes[offset + 1];
    // Start of scan: image data begins, no metadata past this point.
    if (marker === 0xda || marker === 0xd9) return null;

    const length = view.getUint16(offset + 2, false);
    if (length < 2) return null;

    // APP1 body starts four bytes after the 0xFF marker; the first six of those
    // are the literal "Exif\0\0" header, and the TIFF block follows.
    if (marker === 0xe1) {
      const signature = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7]
      );
      if (signature === 'Exif') return offset + 10;
    }

    offset += 2 + length;
  }
  return null;
}

function parseExif(bytes: Uint8Array): PhotoLocation | null {
  const exifStart = findExif(bytes);
  if (exifStart === null) return null;

  const tiff = readTiff(bytes, exifStart);
  if (!tiff) return null;

  const ifd0 = tiff.u32(4);
  const gpsPointer = readPointer(tiff, ifd0, TAG_GPS_IFD);
  if (gpsPointer === null) return null;

  const latEntry = readIfd(tiff, gpsPointer, TAG_GPS_LAT);
  const lngEntry = readIfd(tiff, gpsPointer, TAG_GPS_LNG);
  if (!latEntry || !lngEntry) return null;

  const latParts = readRationals(tiff, latEntry);
  const lngParts = readRationals(tiff, lngEntry);
  if (latParts.length < 3 || lngParts.length < 3) return null;

  const latRef = readAscii(tiff, readIfd(tiff, gpsPointer, TAG_GPS_LAT_REF) as Entry);
  const lngRef = readAscii(tiff, readIfd(tiff, gpsPointer, TAG_GPS_LNG_REF) as Entry);

  // Degrees + minutes/60 + seconds/3600, the standard DMS conversion.
  const toDecimal = (parts: number[]) => parts[0] + parts[1] / 60 + parts[2] / 3600;

  const lat = toDecimal(latParts) * (latRef === 'S' ? -1 : 1);
  const lng = toDecimal(lngParts) * (lngRef === 'W' ? -1 : 1);

  // Out-of-range means the metadata is corrupt. A pin in the ocean is worse
  // than no pin at all.
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  let takenAt: Date | null = null;
  const exifPointer = readPointer(tiff, ifd0, TAG_EXIF_IFD);
  if (exifPointer !== null) {
    const dateEntry = readIfd(tiff, exifPointer, TAG_DATETIME_ORIGINAL);
    if (dateEntry) takenAt = parseExifDate(readAscii(tiff, dateEntry));
  }

  return { lat, lng, takenAt };
}

/**
 * Best-effort location from a photo. Never throws — a photo with no metadata, a
 * truncated file or an unsupported format all resolve to `null`, which the UI
 * treats as "no luck, use the map".
 */
export async function extractPhotoLocation(uri: string): Promise<PhotoLocation | null> {
  try {
    const buffer = await new File(uri).arrayBuffer();
    if (buffer.byteLength < 4) return null;
    return parseExif(new Uint8Array(buffer));
  } catch {
    return null;
  }
}
