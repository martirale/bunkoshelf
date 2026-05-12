declare module "@prisma/client" {
  export namespace Prisma {
    export type InputJsonValue = unknown;
  }

  export type User = Record<string, unknown>;
  export type MangaSeries = Record<string, unknown>;
  export type MangaVolume = Record<string, unknown>;
  export type VolumeMetadata = Record<string, unknown>;
  export type VolumeToGenre = Record<string, unknown>;
  export type VolumeToTag = Record<string, unknown>;
  export type Genre = Record<string, unknown>;
  export type Tag = Record<string, unknown>;
  export type ReadingChallenge = Record<string, unknown>;
}
