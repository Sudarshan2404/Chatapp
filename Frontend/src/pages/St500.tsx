const st500 = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[radial-gradient(circle_at_top,_#1e293b,_#020617)]">
      <div className="w-[90%] max-w-130 rounded-2xl bg-white/5 backdrop-blur-xl px-8 py-10 text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-fadeIn">
        {/* Logo */}
        <div className="mb-5 font-['Pixelify_Sans'] text-xl tracking-widest text-sky-400">
          SIMPLECHAT
        </div>

        {/* Error Code */}
        <div className="mb-2 font-['Pixelify_Sans'] text-[96px] font-bold text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.6)]">
          500
        </div>

        {/* Title */}
        <h2 className="mb-3 text-2xl font-semibold text-slate-100">
          Server crashed unexpectedly
        </h2>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-slate-300">
          Oops. Something went wrong on our end.
          <br />
          The server hit a critical error and couldn’t complete your request.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="/"
            className="rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 hover:bg-blue-600"
          >
            Go Home
          </a>

          <button
            onClick={() => window.location.reload()}
            className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            Retry
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-[11px] text-slate-400">
          SimpleChat • Real-time, pixel-perfect
        </div>
      </div>
    </div>
  );
};

export default st500;
