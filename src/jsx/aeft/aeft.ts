import { getActiveComp } from "./aeft-utils";
import { createFolders } from "./creators/folder";
import { importFiles } from "./creators/file";
import { createComps } from "./creators/comp";
import { createLayers } from "./creators/layer";
import { readComp, collectFiles } from "./readers/comp";

/**
 * Main entry point: create AE objects from a parsed Compdown document.
 * Called from the panel via evalTS with a JSON object.
 */
export const createFromDocument = (doc: {
  folders?: Array<{ name: string; parent?: string }>;
  files?: Array<{
    id: string | number;
    path: string;
    sequence?: boolean;
    folder?: string;
  }>;
  compositions?: Array<{
    name: string;
    width: number;
    height: number;
    duration: number;
    framerate: number;
    pixelAspect: number;
    color: string;
    folder?: string;
    layers?: any[];
  }>;
}): { created: { folders: number; files: number; compositions: number; layers: number } } => {
  app.beginUndoGroup("Compdown: Create");

  var folderMap: { [name: string]: FolderItem } = {};
  var fileMap: { [id: string]: FootageItem } = {};
  var compMap: { [name: string]: CompItem } = {};
  var stats = { folders: 0, files: 0, compositions: 0, layers: 0 };

  // 1. Folders
  if (doc.folders && doc.folders.length > 0) {
    folderMap = createFolders(doc.folders);
    stats.folders = doc.folders.length;
  }

  // 2. Files
  if (doc.files && doc.files.length > 0) {
    fileMap = importFiles(doc.files, folderMap);
    stats.files = doc.files.length;
  }

  // 3. Compositions
  if (doc.compositions && doc.compositions.length > 0) {
    compMap = createComps(doc.compositions, folderMap);
    stats.compositions = doc.compositions.length;

    // 4. Layers (per comp)
    for (var i = 0; i < doc.compositions.length; i++) {
      var compDef = doc.compositions[i];
      if (compDef.layers && compDef.layers.length > 0) {
        var comp = compMap[compDef.name];
        createLayers(comp, compDef.layers, fileMap, compMap);
        stats.layers += compDef.layers.length;
      }
    }
  }

  app.endUndoGroup();

  return { created: stats };
};

/**
 * Generate a Compdown document from the active composition.
 * selectionOnly: if true, only reads selected layers.
 */
export const generateFromComp = (
  selectionOnly: boolean
): { files: object[]; compositions: object[] } => {
  var comp = getActiveComp();
  if (!comp) {
    throw new Error("No active composition");
  }

  var files = collectFiles(comp);
  var compData = readComp(comp, selectionOnly);

  return {
    files: files,
    compositions: [compData],
  };
};
