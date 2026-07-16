export type ArrangementPassId = "a" | "b" | "c" | "d" | "e";

export type ArrangementPassMeta = {
  id: ArrangementPassId;
  name: string;
  pitch: string;
  voice: string;
};

export const arrangementPasses: ArrangementPassMeta[] = [
  {
    id: "a",
    name: "Soft ask",
    pitch: "Familiar site hero — warm, inviting, low pressure.",
    voice: "Friendly neighbor",
  },
  {
    id: "b",
    name: "Split editorial",
    pitch: "Magazine split: photo plane + quiet copy column.",
    voice: "Editorial",
  },
  {
    id: "c",
    name: "Letter",
    pitch: "Almost no marketing chrome — reads like a note from the farm.",
    voice: "Personal letter",
  },
  {
    id: "d",
    name: "Three doors",
    pitch: "Field band + three clear paths: home, business, event.",
    voice: "Direct / practical",
  },
  {
    id: "e",
    name: "Arrangement first",
    pitch: "The bouquet is the headline. Form sits close. Conversion-forward.",
    voice: "Quiet urgency",
  },
];

export function getArrangementPass(
  id: string,
): ArrangementPassMeta | undefined {
  return arrangementPasses.find((p) => p.id === id);
}
