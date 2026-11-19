import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5] dark:bg-[#141317]">
      <h2 className="text-2xl font-bold text-[#201E1D] dark:text-[#FAF8F5] mb-2">Page Not Found</h2>
      <p className="text-sm text-[#75706B] dark:text-[#9E9892] mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700">
        Return Home
      </Link>
    </div>
  );
}
