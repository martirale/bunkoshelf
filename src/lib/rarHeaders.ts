import crc from "crc";

function readVint(data: Buffer, cursor: { offset: number }): number {
  let value = 0;
  let shift = 0;
  while (cursor.offset < data.length && shift <= 49) {
    const byte = data[cursor.offset++];
    value += (byte & 0x7f) * 2 ** shift;
    if (!(byte & 0x80) && Number.isSafeInteger(value)) return value;
    shift += 7;
  }
  throw new Error("saveError");
}

interface RarMemberHeader {
  directory: boolean;
  modifiedAt?: Date;
}

export function restoreRarHeaders(data: Buffer, members: RarMemberHeader[]): Buffer {
  // The bundled writer omits directory flags and encodes RAR5 timestamps as DOS time.
  let offset = data[6] === 0 ? 7 : 8;
  let index = 0;
  while (offset < data.length) {
    let next: number;
    if (data[6] === 0) {
      const flags = data.readUInt16LE(offset + 3);
      const size = data.readUInt16LE(offset + 5);
      const end = offset + size;
      const packed = flags & 0x8000 ? data.readUInt32LE(offset + 7) : 0;
      if (data[offset + 2] === 0x74) {
        if (members[index++]?.directory) {
          data.writeUInt16LE(flags | 0xe0, offset + 3);
          data.writeUInt16LE(crc.crc32(data.subarray(offset + 2, end)) & 0xffff, offset);
        }
      }
      next = end + packed;
    } else {
      const cursor = { offset: offset + 4 };
      const size = readVint(data, cursor);
      const end = cursor.offset + size;
      const type = readVint(data, cursor);
      const flags = readVint(data, cursor);
      if (flags & 1) readVint(data, cursor);
      const packed = flags & 2 ? readVint(data, cursor) : 0;
      if (type === 2) {
        const member = members[index++];
        const fileFlagsOffset = cursor.offset;
        const fileFlags = readVint(data, cursor);
        readVint(data, cursor);
        readVint(data, cursor);
        if (member?.directory) data[fileFlagsOffset] |= 1;
        if (fileFlags & 2 && member?.modifiedAt) {
          const seconds = Math.floor(member.modifiedAt.valueOf() / 1000);
          if (seconds < 0 || seconds > 0xffffffff) throw new Error("saveError");
          data.writeUInt32LE(seconds, cursor.offset);
        }
        data.writeUInt32LE(crc.crc32(data.subarray(offset + 4, end)) >>> 0, offset);
      }
      next = end + packed;
    }
    if (next <= offset || next > data.length) throw new Error("saveError");
    offset = next;
  }
  if (index !== members.length) throw new Error("saveError");
  return data;
}
