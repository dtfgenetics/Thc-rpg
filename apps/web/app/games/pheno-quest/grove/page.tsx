import GrowersGroveGame from "../../../components/GrowersGroveGame";

export default function GrowersGrovePage() {
  return (
    <main className="game-shell">
      <header className="top-bar">
        <div>
          <p className="eyebrow">Cannabis Parody Overworld Prototype</p>
          <h1>Grower’s Grove</h1>
          <p>Control Seed Man, pick up tools, clear obstacles, and trigger the first rival battle.</p>
        </div>
      </header>
      <GrowersGroveGame />
    </main>
  );
}
