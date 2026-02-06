import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";

function getCepConfig(): CEP_Config {
  const isDevBuild =
    typeof process !== "undefined" &&
    typeof process.env !== "undefined" &&
    process.env.CEP_DEV_BUILD === "true";

  const baseId = "com.compdown.cep";
  const devId = "com.compdown-dev.cep";
  const baseName = "Compdown";
  const devName = "Compdown Dev";

  const baseParameters = ["--v=0", "--enable-nodejs", "--mixed-context"] as any;

  const createConfig = (id: string, displayName: string): CEP_Config => ({
    version,
    id,
    displayName,
    symlink: "local",
    port: 3000,
    servePort: 5000,
    startingDebugPort: 8860,
    extensionManifestVersion: 6.0,
    requiredRuntimeVersion: 9.0,
    hosts: [{ name: "AEFT", version: "[0.0,99.9]" }],

    type: "Panel",
    iconDarkNormal: "./src/assets/light-icon.png",
    iconNormal: "./src/assets/dark-icon.png",
    iconDarkNormalRollOver: "./src/assets/light-icon.png",
    iconNormalRollOver: "./src/assets/dark-icon.png",
    parameters: baseParameters,
    width: 500,
    height: 550,

    panels: [
      {
        mainPath: "./main/index.html",
        name: "main",
        panelDisplayName: displayName,
        autoVisible: true,
        width: 600,
        height: 650,
      },
    ],
    build: {
      jsxBin: "off",
      sourceMap: true,
    },
    zxp: {
      country: "US",
      province: "CA",
      org: "Compdown",
      password: "password",
      tsa: [
        "http://timestamp.digicert.com/",
        "http://timestamp.apple.com/ts01",
      ],
      allowSkipTSA: false,
      sourceMap: false,
      jsxBin: "off",
    },
    installModules: [],
    copyAssets: [],
    copyZipAssets: [],
  });

  return isDevBuild ? createConfig(devId, devName) : createConfig(baseId, baseName);
}

export default getCepConfig;
