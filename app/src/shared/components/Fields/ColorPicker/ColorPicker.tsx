// File : /TeamSamsara.Workflow/app/src/shared/components/Fields/ColorPicker/ColorPicker.tsx
// Version : 1.1.0
// Latest commit: feature/task-setup
// Author : Gerrah
// Purpose : Picks a colour (roles, task kinds, event types): the preset
// swatches as a radio group, plus a Custom swatch that opens the browser's
// colour picker and shows the picked colour when it isn't one of the presets.

import { useId, type CSSProperties, type ReactNode } from "react";
import { ColorPresets } from "@/shared/constants/colorPresets";
import { ColorPickerText } from "./colorPickerContent";
import styles from "./ColorPicker.module.css";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  /** Defaults to "Colour". */
  label?: string;
  /** Help under the swatches (what the colour is used for). */
  hint?: ReactNode;
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

export function ColorPicker({
  value,
  onChange,
  label = ColorPickerText.label,
  hint,
  disabled = false,
}: ColorPickerProps) {
  const name = useId();
  const hintId = useId();
  const isPreset = ColorPresets.some(
    (preset) => preset.value.toLowerCase() === value.toLowerCase(),
  );

  return (
    <fieldset
      className={styles.picker}
      disabled={disabled}
      aria-describedby={hint ? hintId : undefined}
    >
      <legend className={styles.legend}>{label}</legend>
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
              aria-label={ColorPickerText.swatch(preset.name)}
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
            aria-label={ColorPickerText.customLabel}
          />
          <span className={styles.customDot} aria-hidden="true" />
          {ColorPickerText.custom}
        </label>
      </div>
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}
