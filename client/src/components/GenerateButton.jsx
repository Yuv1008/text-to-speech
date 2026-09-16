import './GenerateButton.css';

export default function GenerateButton({ disabled, loading, onClick }) {
  return (
    <button
      type="button"
      className="generate-button"
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
    >
      {loading && <span className="generate-button__spinner" aria-hidden="true" />}
      {loading ? 'Generating…' : 'Generate speech'}
    </button>
  );
}
