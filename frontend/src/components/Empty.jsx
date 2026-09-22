export default function Empty({ title, copy }) {
  return (
    <div className="panel grid place-items-center px-6 py-16 text-center">
      <p className="font-display text-2xl">{title}</p>
      {copy && <p className="mt-2 max-w-md text-sm text-paper-200/60">{copy}</p>}
    </div>
  );
}
