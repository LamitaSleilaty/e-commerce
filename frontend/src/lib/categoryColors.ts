
const PALETTE = [
  { bg: "bg-pink", text: "text-paper" },
  { bg: "bg-grape", text: "text-paper" },
  { bg: "bg-yellow", text: "text-ink" },
  { bg: "bg-ink", text: "text-paper" },
];

export function categoryColor(index: number) {
  return PALETTE[index % PALETTE.length];
}
