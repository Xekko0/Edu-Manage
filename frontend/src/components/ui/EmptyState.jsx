export default function EmptyState({ message = 'Chưa có dữ liệu.', children }) {
  return (
    <div className="bg-white rounded-lg border px-6 py-12 text-center text-slate-500">
      <p>{message}</p>
      {children}
    </div>
  );
}
