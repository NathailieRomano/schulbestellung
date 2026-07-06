export default function Home() {
  return (
    <main className="archive-shell">
      <section className="archive-card" aria-labelledby="archive-title">
        <div className="archive-badge">Archiviert</div>
        <p className="archive-kicker">Oberstufenschule Steffisburg</p>
        <h1 id="archive-title">Schulbestellung Ingold/Biwa 2026 ist abgeschlossen</h1>
        <p className="archive-lead">
          Die Sammelbestellung wurde am 7. Mai 2026 geschlossen und ist jetzt
          archiviert. Es können keine neuen Bestellungen mehr erfasst, geändert
          oder administriert werden.
        </p>

        <div className="archive-grid" aria-label="Archivstatus">
          <div>
            <h2>Daten gesichert</h2>
            <p>
              Die ursprünglichen Bestelldaten wurden vor der Archivierung
              exportiert und lokal gesichert.
            </p>
          </div>
          <div>
            <h2>App deaktiviert</h2>
            <p>
              Lehrpersonen-Links, Admin-Bereich und API-Endpunkte wurden durch
              diese statische Archivseite ersetzt.
            </p>
          </div>
        </div>

        <p className="archive-note">
          Bei Rückfragen zu alten Bestellungen bitte intern auf das gesicherte
          Bestellarchiv zurückgreifen.
        </p>
      </section>
    </main>
  )
}
