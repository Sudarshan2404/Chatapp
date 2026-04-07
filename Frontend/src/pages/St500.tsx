const St500 = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-amber-200">
      <div className="m-2 flex min-h-[80vh] w-screen flex-col items-center justify-center gap-5 bg-amber-100 px-6 py-10 text-center shadow-2xl md:min-h-[96vh] md:w-[50%] md:rounded-2xl">
        <div className="g-font text-amber-300">
          <h1 className="text-6xl md:text-8xl">Simpl-Chat</h1>
          <p className="mt-3 text-lg md:text-2xl">Server Status</p>
        </div>

        <div className="g-font text-8xl font-bold text-amber-300 md:text-9xl">
          500
        </div>

        <div className="max-w-xl space-y-3 text-amber-900">
          <h2 className="text-2xl font-semibold md:text-3xl">
            The backend is not responding right now
          </h2>
          <p className="text-base leading-relaxed md:text-lg">
            Simpl-Chat could not reach the server, so this page could not load.
          </p>
          <p className="text-sm leading-relaxed text-amber-800 md:text-base">
            The backend is hosted on Render free tier, so it may take a minute
            or two to wake up. Thanks for your patience.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <a
            href="/"
            className="rounded-xl bg-amber-300 px-6 py-3 text-lg font-semibold text-white transition hover:bg-amber-400"
          >
            Go Home
          </a>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl border-2 border-amber-300 px-6 py-3 text-lg font-semibold text-amber-500 transition hover:bg-amber-200"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
};

export default St500;
