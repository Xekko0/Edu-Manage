export default function Spinner({ size = 'md' }) {
  const map = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return (
    <div className={`${map[size]} border-2 border-brand border-t-transparent rounded-full animate-spin`} />
  );
}
