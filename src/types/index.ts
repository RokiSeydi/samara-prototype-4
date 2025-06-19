export interface OfficeDocument {
  id: string;
  name: string;
  type: 'excel' | 'word' | 'powerpoint' | 'onenote' | 'teams';
  lastModified: string;
  size: number;
  webUrl: string;
  thumbnailUrl?: string;
  summary?: string;
}

export interface User {
  displayName: string;
  mail: string;
  userPrincipalName: string;
  id: string;
}

export interface ZoomState {
  scale: number;
  focusedItem: string | null;
}