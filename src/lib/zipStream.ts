import { Readable } from "node:stream";
import crc32 from "crc/crc32";

const DATA_DESCRIPTOR = 0x0808;
const MAX_UINT16 = 0xffff;
const MAX_UINT32 = 0xffffffff;

export interface ZipStreamFile {
  name: string;
  size: number;
  stream: () => Promise<AsyncIterable<Uint8Array>>;
}

interface ZipEntry {
  name: Buffer;
  checksum: number;
  size: number;
  offset: number;
}

function dosDateTime(date: Date): { date: number; time: number } {
  const year = Math.min(Math.max(date.getFullYear(), 1980), 2107);

  return {
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
  };
}

function localHeader(name: Buffer, date: number, time: number): Buffer {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(DATA_DESCRIPTOR, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(time, 10);
  header.writeUInt16LE(date, 12);
  header.writeUInt16LE(name.length, 26);

  return Buffer.concat([header, name]);
}

function dataDescriptor(checksum: number, size: number): Buffer {
  const descriptor = Buffer.alloc(16);
  descriptor.writeUInt32LE(0x08074b50, 0);
  descriptor.writeUInt32LE(checksum, 4);
  descriptor.writeUInt32LE(size, 8);
  descriptor.writeUInt32LE(size, 12);
  return descriptor;
}

function centralDirectoryEntry(entry: ZipEntry, date: number, time: number): Buffer {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(DATA_DESCRIPTOR, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(time, 12);
  header.writeUInt16LE(date, 14);
  header.writeUInt32LE(entry.checksum, 16);
  header.writeUInt32LE(entry.size, 20);
  header.writeUInt32LE(entry.size, 24);
  header.writeUInt16LE(entry.name.length, 28);
  header.writeUInt32LE(entry.offset, 42);

  return Buffer.concat([header, entry.name]);
}

function endOfCentralDirectory(entries: number, size: number, offset: number): Buffer {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(entries, 8);
  record.writeUInt16LE(entries, 10);
  record.writeUInt32LE(size, 12);
  record.writeUInt32LE(offset, 16);
  return record;
}

function validateFiles(files: ZipStreamFile[]): void {
  if (files.length === 0 || files.length > MAX_UINT16) {
    throw new Error("The series cannot be packaged as a ZIP archive");
  }

  let archiveSize = 22;
  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    if (!Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_UINT32 || name.length > MAX_UINT16) {
      throw new Error("The series cannot be packaged as a ZIP archive");
    }

    archiveSize += file.size + 92 + name.length * 2;
    if (archiveSize > MAX_UINT32) {
      throw new Error("The series is too large to download as a ZIP archive");
    }
  }
}

async function* zipEntries(files: ZipStreamFile[]): AsyncGenerator<Buffer> {
  validateFiles(files);

  const { date, time } = dosDateTime(new Date());
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const header = localHeader(name, date, time);
    yield header;

    let checksum: number | undefined;
    let size = 0;
    const stream = await file.stream();
    for await (const chunk of stream) {
      const bytes = Buffer.from(chunk);
      checksum = checksum === undefined
        ? crc32.unsigned(bytes)
        : crc32.unsigned(bytes, checksum);
      size += bytes.length;
      yield bytes;
    }

    if (size !== file.size) {
      throw new Error(`Unexpected size while downloading ${file.name}`);
    }

    const finalizedChecksum = checksum ?? 0;
    const descriptor = dataDescriptor(finalizedChecksum, size);
    yield descriptor;

    entries.push({ name, checksum: finalizedChecksum, size, offset });
    offset += header.length + size + descriptor.length;
  }

  const directoryOffset = offset;
  let directorySize = 0;
  for (const entry of entries) {
    const directoryEntry = centralDirectoryEntry(entry, date, time);
    directorySize += directoryEntry.length;
    yield directoryEntry;
  }

  yield endOfCentralDirectory(entries.length, directorySize, directoryOffset);
}

export function createZipStream(files: ZipStreamFile[]): Readable {
  return Readable.from(zipEntries(files), { objectMode: false });
}
