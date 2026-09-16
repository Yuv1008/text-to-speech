import './ControlSliders.css';

const DEFAULTS = { rate: 1, pitch: 0 };

function Slider({ id, label, value, min, max, step, format, onChange }) {
  return (
    <div className="control-slider">
      <div className="control-slider__head">
        <label htmlFor={id}>{label}</label>
        <span className="control-slider__value">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function ControlSliders({ rate, pitch, onRateChange, onPitchChange }) {
  const isDefault = rate === DEFAULTS.rate && pitch === DEFAULTS.pitch;

  return (
    <div className="control-sliders">
      <div className="control-sliders__head">
        <span className="control-sliders__label">Delivery</span>
        <button
          type="button"
          className="control-sliders__reset"
          disabled={isDefault}
          onClick={() => {
            onRateChange(DEFAULTS.rate);
            onPitchChange(DEFAULTS.pitch);
          }}
        >
          Reset
        </button>
      </div>

      <Slider
        id="tts-rate"
        label="Speed"
        value={rate}
        min={0.5}
        max={2}
        step={0.05}
        format={(v) => `${v.toFixed(2)}×`}
        onChange={onRateChange}
      />
      <Slider
        id="tts-pitch"
        label="Pitch"
        value={pitch}
        min={-10}
        max={10}
        step={1}
        format={(v) => (v > 0 ? `+${v}` : `${v}`)}
        onChange={onPitchChange}
      />
    </div>
  );
}
