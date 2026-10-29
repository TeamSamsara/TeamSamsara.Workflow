// File : /TeamSamsara.Workflow/app/src/features/roles/ui/RoleColorPicker.tsx
// Version : 1.0.0
// Latest commit: feature/roles
// Author : Gerrah
// Purpose : Picks a role's colour: the preset swatches as a radio group, plus a
// Custom swatch that opens the browser's colour picker and shows the picked
// colour when it isn't one of the presets.

import { useId, type CSSProperties } from "react";
import { ColorPresets } from "@/shared/constants/colorPresets";
import {
  RoleColorPickerText,
  RoleDisplayFormText,
} from "./roleDisplayFormContent";
import styles from "./RoleColorPicker.module.css";

interface RoleColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  disabled?: boolean;
}

const swatchStyle = (color: string) =>
  ({ "--swatch-color": color }) as CSSProperties;

/** The Custom button's dot before a custom colour is picked: every preset in a wheel. */
const rainbowStyle = {
  "--swatch-rainbow": `conic-gradient(${[...ColorPresets, ColorPresets[0]]
    .map((preset) => preset.value)
    .join(", ")})`,
} as CSSProperties;

export function RoleColorPicker({
  value,
  onChange,
  disabled = false,
}: RoleColorPickerProps) {
  const name = useId();
  const hintId = useId();
  const isPreset = ColorPresets.some(
    (preset) => preset.value.toLowerCase() === value.toLowerCase(),
  );

  return (
    <fieldset
      className={styles.picker}
      disabled={disabled}
      aria-describedby={hintId}
    >
      <legend className={styles.legend}>{RoleDisplayFormText.color}</legend>
      <div className={styles.swatches}>
        {ColorPresets.map((preset) => (
          <label
            key={preset.value}
            className={styles.swatch}
            style={swatchStyle(preset.value)}
            title={preset.name}
          >
            <input
              type="radio"
              name={name}
              value={preset.value}
              checked={preset.value.toLowerCase() === value.toLowerCase()}
              onChange={() => onChange(preset.value)}
              className={styles.input}
              aria-label={RoleColorPickerText.swatch(preset.name)}
            />
          </label>
        ))}
        <label
          className={styles.custom}
          data-selected={!isPreset}
          style={isPreset ? rainbowStyle : swatchStyle(value)}
        >
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className={styles.colorInput}
            aria-label={RoleColorPickerText.customLabel}
          />
          <span className={styles.customDot} aria-hidden="true" />
          {RoleColorPickerText.custom}
        </label>
      </div>
      <p id={hintId} className={styles.hint}>
        {RoleDisplayFormText.colorHint}
      </p>
    </fieldset>
  );
}
