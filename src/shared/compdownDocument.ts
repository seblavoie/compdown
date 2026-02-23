export interface CompdownFolderDocumentItem {
  name: string;
  parent?: string;
}

export interface CompdownFileDocumentItem {
  id: string | number;
  path: string;
  sequence?: boolean;
  folder?: string;
}

export interface CompdownCompositionMarkerDocumentItem {
  time: number;
  comment?: string;
  duration?: number;
  chapter?: string;
  url?: string;
  label?: number;
}

export interface CompdownCompositionDocumentItem {
  name: string;
  width: number;
  height: number;
  duration: number;
  framerate: number;
  pixelAspect: number;
  color: string;
  folder?: string;
  layers?: any[];
  essentialGraphics?: Array<string | { property: string; name?: string; encodePathInName?: boolean }>;
  markers?: CompdownCompositionMarkerDocumentItem[];
}

export interface CompdownTimelineDocumentItem {
  layers?: any[];
  set?: {
    layers?: any[];
  };
  remove?: {
    layers?: Array<{
      name: string;
    }>;
  };
}

export interface CompdownSelectedDocumentItem {
  set?: any;
  remove?: boolean;
}

export interface CompdownCreateDocument {
  _timeline?: CompdownTimelineDocumentItem;
  _selected?: CompdownSelectedDocumentItem;
  folders?: CompdownFolderDocumentItem[];
  files?: CompdownFileDocumentItem[];
  compositions?: CompdownCompositionDocumentItem[];
}

export interface CreateFromDocumentResult {
  created: {
    folders: number;
    files: number;
    compositions: number;
    layers: number;
  };
}
