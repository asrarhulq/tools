import type { ModelFormat } from "../types";

/**
 * Infer a model format from a filename. STL is fully supported today; the
 * others are recognized so the UI can message "coming soon" and the
 * architecture is ready to route them to loaders/converters later.
 */
export function inferFormat(filename: string): ModelFormat | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "stl":
    case "obj":
    case "gltf":
    case "glb":
    case "step":
      return ext;
    case "stp":
      return "step";
    default:
      return null;
  }
}
