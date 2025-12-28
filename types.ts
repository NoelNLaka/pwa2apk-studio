
export enum BuildStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  MANIFEST = 'MANIFEST',
  BUILDING = 'BUILDING',
  SIGNING = 'SIGNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface PwaMetadata {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: string;
  orientation: string;
  version: string;
  packageName: string;
}

export interface BuildLog {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}
