import './ErrorMessage.css';

const KIND_LABEL = {
  network: 'Connection problem',
  server: 'Server error',
  client: 'Something went wrong',
};

function isRetryable(error) {
  if (!error) return false;
  if (error.kind === 'network') return true;
  if (error.code === 'RATE_LIMITED') return true;
  if (error.kind === 'server' && error.status >= 500) return true;
  return false;
}

/** Renders one error, distinguishing validation (400s) from network/server failures,
 *  with a retry action only where retrying could plausibly succeed. */
export default function ErrorMessage({ error, onRetry }) {
  if (!error) return null;

  const isValidation = error.kind === 'server' && error.status === 400;
  const label = isValidation ? 'Check your input' : KIND_LABEL[error.kind] || 'Error';
  const retryable = isRetryable(error);

  return (
    <div className="error-message" role="alert" aria-live="assertive">
      <div className="error-message__icon" aria-hidden="true">
        !
      </div>
      <div className="error-message__body">
        <p className="error-message__label">{label}</p>
        <p className="error-message__text">{error.message}</p>
      </div>
      {retryable && onRetry && (
        <button type="button" className="error-message__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
