import './DownloadButton.css';

function slugify(text) {
  const words = text.trim().toLowerCase().split(/\s+/).slice(0, 6).join('-');
  const cleaned = words.replace(/[^a-z0-9-]/g, '').slice(0, 50);
  return cleaned || 'speech';
}

export default function DownloadButton({ src, text }) {
  if (!src) return null;

  const ext = src.split('.').pop().split('?')[0];
  const filename = `${slugify(text)}.${ext}`;
  const href = `${src}${src.includes('?') ? '&' : '?'}download=${encodeURIComponent(filename)}`;

  return (
    <a className="download-button" href={href} download={filename}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M8 2v8m0 0L4.5 6.5M8 10l3.5-3.5M2.5 12.5h11"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Download {ext.toUpperCase()}
    </a>
  );
}
