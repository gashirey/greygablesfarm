export type MediaOrientation = "landscape" | "portrait" | "square";

export function mediaOrientation(
  width: number | null | undefined,
  height: number | null | undefined,
): MediaOrientation | null {
  if (width == null || height == null || width <= 0 || height <= 0) {
    return null;
  }
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

export const MEDIA_ORIENTATION_LABELS: Record<MediaOrientation, string> = {
  landscape: "Landscape",
  portrait: "Portrait",
  square: "Square",
};
