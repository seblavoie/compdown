import { defineConfig, loadEnv } from "vite";

import react from "@vitejs/plugin-react";

import { cep, CepOptions, runAction } from "vite-cep-plugin";
import getCepConfig from "./cep.config";
import path from "path";
import { extendscriptConfig } from "./vite.es.config";

const extensions = [".js", ".ts", ".tsx"];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  const cepConfig = getCepConfig();

  const devDist = "dist";
  const isDevExtension = process.env.CEP_DEV_BUILD === "true";
  const cepDist = isDevExtension ? "cep-dev" : "cep";

  const src = path.resolve(__dirname, "src");
  const root = path.resolve(src, "js");
  const outDir = path.resolve(__dirname, "dist", cepDist);

  const debugReact = process.env.DEBUG_REACT === "true";
  const isProduction = process.env.NODE_ENV === "production";
  const isMetaPackage = process.env.ZIP_PACKAGE === "true";
  const isPackage = process.env.ZXP_PACKAGE === "true" || isMetaPackage;
  const isServe = process.env.SERVE_PANEL === "true";
  const action = process.env.BOLT_ACTION;

  let input: { [key: string]: string } = {};
  cepConfig.panels.map((panel) => {
    input[panel.name] = path.resolve(root, panel.mainPath);
  });

  const config: CepOptions = {
    cepConfig,
    isProduction,
    isPackage,
    isMetaPackage,
    isServe,
    debugReact,
    dir: `${__dirname}/${devDist}`,
    cepDist: cepDist,
    zxpOutput: `${__dirname}/${devDist}/zxp/${cepConfig.id}`,
    zipOutput: `${__dirname}/${devDist}/zip/${cepConfig.displayName}_${cepConfig.version}`,
    packages: cepConfig.installModules || [],
  };

  if (action) runAction(config, action);

  // rollup es3 build
  const outPathExtendscript = path.join("dist", cepDist, "jsx", "index.js");
  extendscriptConfig(
    `src/jsx/index.ts`,
    outPathExtendscript,
    cepConfig,
    extensions,
    isProduction,
    isPackage
  );

  // https://vitejs.dev/config/
  return {
    plugins: [react(), cep(config)],
    define: {
      __COMPDOWN_DEV_BUILD__: JSON.stringify(isDevExtension),
      __COMPDOWN_NS__: JSON.stringify(cepConfig.id),
      __COMPDOWN_DISPLAY_NAME__: JSON.stringify(cepConfig.displayName),
      __COMPDOWN_VERSION__: JSON.stringify(cepConfig.version),
      __COMPDOWN_COMPANY__: JSON.stringify(cepConfig.zxp.org),
    },
    resolve: {
      alias: [{ find: "@esTypes", replacement: path.resolve(__dirname, "src") }],
    },
    root,
    clearScreen: false,
    server: {
      port: cepConfig.port,
    },
    preview: {
      port: cepConfig.servePort,
    },

    build: {
      sourcemap: isPackage ? cepConfig.zxp.sourceMap : cepConfig.build?.sourceMap,
      watch: {
        include: "src/jsx/**",
      },
      rollupOptions: {
        input,
        output: {
          manualChunks: {},
          preserveModules: false,
          format: "cjs",
          entryFileNames: "assets/[name]-[hash].cjs",
          chunkFileNames: "assets/[name]-[hash].cjs",
        },
      },
      target: "chrome74",
      outDir,
    },
  };
});
