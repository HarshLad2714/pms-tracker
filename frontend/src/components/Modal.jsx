export default function Modal({ title, children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-950/70 p-4 backdrop-blur-sm">
      <div className={`panel w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} shadow-stamp`}>
        <div className="flex items-center justify-between border-b border-ink-600 px-5 py-4">
          <h3 className="font-display text-xl">{title}</h3>
          <button onClick={onClose} className="text-paper-200/70 hover:text-paper-50">
            Close
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
