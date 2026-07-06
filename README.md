# Schulbestellung / Ingold-Biwa Archiv

Diese App war die Ingold/Biwa Sammelbestellung 2026 der Oberstufenschule Steffisburg.

Status: **archiviert**.

Die aktive Next-App besteht nur noch aus einer statischen Archiv-Hinweisseite. Interaktive Lehrpersonen-Links, Admin-Bereich, API-Routen und Supabase-Zugriff wurden entfernt.

## Daten

Die Bestelldaten wurden vor der Archivierung exportiert:

- `/home/nathanael_romano/documents/schule/finanzen/bestellungen/schulbestellung-ingold-biwa-archive/supabase-schulbestellung-pre-archive-2026-07-07_0006.tar.gz`
- SHA256: `b041385c2545aa6db800467e04fa9f5dfec0487588924d1ecb4df509cf668de7`
- SQL `documents`: IDs 1664/1665

## Entwicklung

```bash
npm run build
npm run lint
npm start
```

## Nach Deploy

Nach erfolgreichem Deploy der Archivseite können die Supabase-Tabellen `bestell_*` separat gelöscht werden.
