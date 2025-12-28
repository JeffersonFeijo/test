
export interface AddonMetadata {
  name: string;
  description: string;
  version: [number, number, number];
  author: string;
  namespace: string;
}

export interface ManifestUUIDs {
  header: string;
  module: string;
}

export interface AddonFile {
  name: string;
  content: string;
  path: string;
}

export interface AddonProject {
  metadata: AddonMetadata;
  uuids: ManifestUUIDs;
  scriptContent: string;
}
