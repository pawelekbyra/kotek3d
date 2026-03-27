export default function Page() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-zinc-900 ring-1 ring-white/10 rounded-2xl px-12 py-8 flex items-center justify-center">
          <h1 className="text-7xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/50 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Hallo
          </h1>
        </div>
      </div>
    </div>
  );
}
