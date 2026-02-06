import getCepConfig from "../../cep.config";
const config = getCepConfig();
export const ns = config.id;
export const company = config.zxp.org;
export const displayName = config.displayName;
export const version = config.version;
export const isDevBuild = config.id === "com.compdown-dev.cep";
