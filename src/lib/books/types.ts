export interface EpubIdentifier {
  value: string;
  scheme: string | null;
  isPrimary: boolean;
}

export interface EpubPerson {
  name: string;
  role: string | null;
  kind: "creator" | "contributor";
  sortName: string | null;
  position: number;
}

export interface EpubSubject {
  name: string;
  scheme: string | null;
}

export interface EpubMetadata {
  title: string;
  subtitle: string | null;
  description: string | null;
  publisher: string | null;
  publishedAt: string | null;
  language: string | null;
  rights: string | null;
  source: string | null;
  publicationType: string | null;
  modifiedAt: string | null;
  packagePath: string;
  navigationPath: string | null;
  coverPath: string | null;
  renditionLayout: "reflowable" | "pre-paginated";
  renditionFlow: string | null;
  renditionOrientation: string | null;
  renditionSpread: string | null;
  identifiers: EpubIdentifier[];
  people: EpubPerson[];
  subjects: EpubSubject[];
}

export interface EpubParseResult {
  metadata: EpubMetadata;
  cover: { path: string; data: Buffer; mediaType: string | null } | null;
}
