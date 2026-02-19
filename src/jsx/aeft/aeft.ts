import { getActiveComp } from "./aeft-utils";
import { createFolders } from "./creators/folder";
import { importFiles } from "./creators/file";
import { createComps } from "./creators/comp";
import { createLayers, setLayers, removeLayers, setSelectedLayers, removeSelectedLayers } from "./creators/layer";
import { addEssentialGraphics } from "./creators/essentialGraphics";
import { addMarkers } from "./creators/markers";
import { readComp, collectFiles } from "./readers/comp";
import type {
  CompdownCreateDocument,
  CreateFromDocumentResult,
} from "../../shared/compdownDocument";

/**
 * Main entry point: create AE objects from a parsed Compdown document.
 * Called from the panel via evalTS with a JSON object.
 */
export const createFromDocument = (
  doc: CompdownCreateDocument
): CreateFromDocumentResult => {
  app.beginUndoGroup("Compdown: Create");

  try {
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
        var comp = compMap[compDef.name];

        if (compDef.layers && compDef.layers.length > 0) {
          createLayers(comp, compDef.layers, fileMap, compMap);
          stats.layers += compDef.layers.length;
        }

        // 5. Essential Graphics (after layers are created)
        if (compDef.essentialGraphics && compDef.essentialGraphics.length > 0) {
          addEssentialGraphics(comp, compDef.essentialGraphics);
        }

        // 6. Markers
        if (compDef.markers && compDef.markers.length > 0) {
          addMarkers(comp, compDef.markers);
        }
      }
    }

    // 7. Top-level _timeline layers (implicit create/add)
    if (doc._timeline && doc._timeline.layers && doc._timeline.layers.length > 0) {
      var targetComp = getActiveComp();
      if (!(targetComp && targetComp instanceof CompItem)) {
        throw new Error("_timeline.layers requires an active composition timeline");
      }

      createLayers(targetComp, doc._timeline.layers, fileMap, compMap);
      stats.layers += doc._timeline.layers.length;
    }

    // 8. Top-level _timeline.set.layers (explicit update)
    if (
      doc._timeline &&
      doc._timeline.set &&
      doc._timeline.set.layers &&
      doc._timeline.set.layers.length > 0
    ) {
      var targetCompForSet = getActiveComp();
      if (!(targetCompForSet && targetCompForSet instanceof CompItem)) {
        throw new Error("_timeline.set.layers requires an active composition timeline");
      }
      setLayers(targetCompForSet, doc._timeline.set.layers as any[]);
    }

    // 9. Top-level _timeline.remove.layers (explicit delete)
    if (
      doc._timeline &&
      doc._timeline.remove &&
      doc._timeline.remove.layers &&
      doc._timeline.remove.layers.length > 0
    ) {
      var targetCompForRemove = getActiveComp();
      if (!(targetCompForRemove && targetCompForRemove instanceof CompItem)) {
        throw new Error("_timeline.remove.layers requires an active composition timeline");
      }
      removeLayers(targetCompForRemove, doc._timeline.remove.layers);
    }

    // 10. _selected.set (patch all selected layers)
    if (doc._selected && doc._selected.set) {
      var targetCompForSelectedSet = getActiveComp();
      if (!(targetCompForSelectedSet && targetCompForSelectedSet instanceof CompItem)) {
        throw new Error("_selected.set requires an active composition timeline");
      }
      setSelectedLayers(targetCompForSelectedSet, doc._selected.set as any);
    }

    // 11. _selected.remove (delete all selected layers)
    if (doc._selected && doc._selected.remove === true) {
      var targetCompForSelectedRemove = getActiveComp();
      if (!(targetCompForSelectedRemove && targetCompForSelectedRemove instanceof CompItem)) {
        throw new Error("_selected.remove requires an active composition timeline");
      }
      removeSelectedLayers(targetCompForSelectedRemove);
    }

    return { created: stats };
  } finally {
    app.endUndoGroup();
  }
};

/**
 * Generate a Compdown document from the active composition.
 * selectionOnly: if true, only reads selected layers.
 */
export const generateFromComp = (
  selectionOnly: boolean
): { files?: object[]; compositions: object[] } => {
  var comp = getActiveComp();
  if (!comp) {
    throw new Error("No active composition");
  }

  var files = collectFiles(comp);
  var compData = readComp(comp, selectionOnly);

  var result: { files?: object[]; compositions: object[] } = {
    compositions: [compData],
  };

  if (files.length > 0) {
    result.files = files;
  }

  return result;
};
