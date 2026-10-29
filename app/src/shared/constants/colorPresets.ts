// File : /TeamSamsara.Workflow/app/src/shared/constants/colorPresets.ts
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : The ready-made colour swatches offered wherever people pick a colour
// (roles now; task kinds and event types later). Anyone can still pick a custom
// colour; these are only the quick choices.

export interface ColorPreset {
  value: string;
  /** Read out by screen readers ("Colour: Red"). */
  name: string;
}

export const ColorPresets: readonly ColorPreset[] = [
  { value: "#E5484D", name: "Red" },
  { value: "#F5A524", name: "Amber" },
  { value: "#95EC5D", name: "Lime" },
  { value: "#30A46C", name: "Green" },
  { value: "#12A594", name: "Teal" },
  { value: "#3E8EF7", name: "Blue" },
  { value: "#A970FF", name: "Purple" },
  { value: "#E54D9E", name: "Pink" },
  { value: "#8A8F94", name: "Grey" },
];

/** What a new item gets before anyone picks. */
export const DefaultColor = ColorPresets[ColorPresets.length - 1].value;

const hexColorPattern = /^#[0-9a-f]{6}$/i;

/** A six-digit hex colour like #3E8EF7, which is what the colour input gives. */
export function isHexColor(value: string): boolean {
  return hexColorPattern.test(value);
}
