/**
 * Create compositions in the AE project.
 * Returns a map of comp name -> CompItem for layer creation.
 */
export const createComps = (
  compositions: Array<{
    name: string;
    width: number;
    height: number;
    duration: number;
    framerate: number;
    pixelAspect: number;
    color: string;
    folder?: string;
  }>,
  folderMap: { [name: string]: FolderItem }
): { [name: string]: CompItem } => {
  var compMap: { [name: string]: CompItem } = {};

  for (var i = 0; i < compositions.length; i++) {
    var compDef = compositions[i];
    var newComp = app.project.items.addComp(
      compDef.name,
      compDef.width,
      compDef.height,
      compDef.pixelAspect,
      compDef.duration,
      compDef.framerate
    );

    // Set background color from hex string
    if (compDef.color) {
      var r = parseInt(compDef.color.substring(0, 2), 16) / 255;
      var g = parseInt(compDef.color.substring(2, 4), 16) / 255;
      var b = parseInt(compDef.color.substring(4, 6), 16) / 255;
      newComp.bgColor = [r, g, b];
    }

    // Move to folder if specified
    if (compDef.folder && folderMap[compDef.folder]) {
      newComp.parentFolder = folderMap[compDef.folder];
    }

    compMap[compDef.name] = newComp;
  }

  return compMap;
};
