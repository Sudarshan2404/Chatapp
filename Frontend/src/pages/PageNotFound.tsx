import { Link } from "react-router-dom";

export default function PageNotFound() {
	return (
		<main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 py-12 text-white">
			<div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
			<div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />

			<section className="relative w-full max-w-2xl text-center">
				<div className="mx-auto mb-8 flex h-28 w-28 rotate-3 items-center justify-center rounded-[2rem] border border-white/10 bg-white/10 shadow-2xl shadow-violet-950/50 backdrop-blur-sm">
					<svg viewBox="0 0 100 100" className="h-20 w-20" aria-hidden="true">
						<path d="M26 42c0-13 10-23 24-23s24 10 24 23v30H26V42Z" fill="#8b5cf6" />
						<path d="M20 45h60v27H20z" fill="#06b6d4" opacity=".9" />
						<circle cx="39" cy="55" r="4" fill="white" />
						<circle cx="61" cy="55" r="4" fill="white" />
						<path d="M40 65c6 5 14 5 20 0" fill="none" stroke="white" strokeLinecap="round" strokeWidth="3" />
						<path d="M50 19V9M27 25l-7-7M73 25l7-7" stroke="#fbbf24" strokeLinecap="round" strokeWidth="4" />
					</svg>
				</div>

				<p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-cyan-300">Signal lost</p>
				<h1 className="text-7xl font-black tracking-tight sm:text-9xl">404</h1>
				<h2 className="mt-4 text-2xl font-bold sm:text-3xl">This chat wandered off.</h2>
				<p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-400">
					The page you&apos;re looking for isn&apos;t in this conversation. Let&apos;s get you back somewhere useful.
				</p>

				<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
					<Link
						to="/"
						className="rounded-xl bg-violet-500 px-6 py-3 font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-300"
					>
						Back to home
					</Link>
					<button
						type="button"
						onClick={() => window.history.back()}
						className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-slate-200 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300"
					>
						Go back
					</button>
				</div>

				<div className="mx-auto mt-12 flex max-w-xs items-center justify-center gap-2 text-xs text-slate-500">
					<span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
					Everyone else is online
				</div>
			</section>
		</main>
	);
}
