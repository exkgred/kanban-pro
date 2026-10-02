import { BrandMark } from '@/components/BrandMark';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="flex justify-center text-slate-900">
          <BrandMark size={40} />
        </div>
        {children}
      </div>
    </div>
  );
}
