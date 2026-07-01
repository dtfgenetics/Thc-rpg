import Link from "next/link";

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero-card">
        <p className="eyebrow">THC / DTF Game Hub Prototype</p>
        <h1>THC: Pheno Quest</h1>
        <p>
          Turn-based strain-companion RPG vertical slice. Battle first, overworld second.
        </p>
        <Link className="primary-link" href="/games/pheno-quest">
          Play Battle Slice
        </Link>
      </section>
    </main>
  );
}
