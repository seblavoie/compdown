import { evalTS } from "../../lib/utils/bolt";
import type { CompdownDocument } from "../schema/types";

/**
 * Send a validated Compdown document to ExtendScript for creation in AE.
 */
export async function createInAE(doc: CompdownDocument) {
  return evalTS("createFromDocument", doc as any);
}

/**
 * Read the active composition (or selection) from AE and return as JSON.
 */
export async function generateFromAE(selectionOnly: boolean) {
  return evalTS("generateFromComp", selectionOnly);
}
