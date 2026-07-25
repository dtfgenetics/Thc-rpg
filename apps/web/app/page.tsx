import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">THC / DTF Game Hub Prototype</p>
        <h1>THC: Pheno Quest</h1>
        <p>
          Seed Man leads recruitable strain companions through cannabis-fantasy regions, timed battles, quests, and grower-themed progression.
        </p>
        <div className="top-actions">
          <Link className="primary-link" href="/games/pheno-quest/grove">
            Explore Grower’s Grove
          </Link>
          <Link className="primary-link" href="/games/pheno-quest">
            Play Battle Slice
          </Link>
          <Link className="primary-link" href="/games/pheno-quest/party">
            Manage Party
          </Link>
        </div>
      </section>
    </main>
  );
}
