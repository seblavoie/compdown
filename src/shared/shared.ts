import getCepConfig from "../../cep.config";

declare const __COMPDOWN_DEV_BUILD__: boolean | undefined;
declare const __COMPDOWN_NS__: string | undefined;
declare const __COMPDOWN_COMPANY__: string | undefined;
declare const __COMPDOWN_DISPLAY_NAME__: string | undefined;
declare const __COMPDOWN_VERSION__: string | undefined;

const hasProcess =
  typeof process !== "undefined" && typeof process.env !== "undefined";
const config = hasProcess ? getCepConfig() : null;

export const ns =
  config?.id || (typeof __COMPDOWN_NS__ !== "undefined" ? __COMPDOWN_NS__ : "com.compdown.cep");
export const company =
  config?.zxp.org ||
  (typeof __COMPDOWN_COMPANY__ !== "undefined" ? __COMPDOWN_COMPANY__ : "Compdown");
export const displayName =
  config?.displayName ||
  (typeof __COMPDOWN_DISPLAY_NAME__ !== "undefined"
    ? __COMPDOWN_DISPLAY_NAME__
    : "Compdown");
export const version =
  config?.version ||
  (typeof __COMPDOWN_VERSION__ !== "undefined" ? __COMPDOWN_VERSION__ : "0.0.0");
export const isDevBuild = config
  ? config.id === "com.compdown-dev.cep"
  : typeof __COMPDOWN_DEV_BUILD__ !== "undefined" && __COMPDOWN_DEV_BUILD__;
