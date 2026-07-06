# Schulbestellung / Ingold-Biwa archiviert

Die Ingold/Biwa Schulbestellung 2026 wurde am 2026-07-07 lokal zur Archiv-Version umgebaut.

## Was geändert wurde

- Die Next-App wurde auf eine statische Archiv-Hinweisseite reduziert.
- Alte Pfade wie `/admin`, `/b/[token]`, `/api/...` werden nicht mehr als interaktive App/API betrieben.
- Alle API-Routen, Admin-/Lehrpersonen-Oberflächen, Supabase-Client, Katalogdaten und PDF-Anleitung wurden aus der aktiven App entfernt.
- Die App enthält keine Supabase-/Service-Role-Runtime mehr.

## Datenexporte

Frischer Pre-Archive-Export:

- `/home/nathanael_romano/documents/schule/finanzen/bestellungen/schulbestellung-ingold-biwa-archive/supabase-schulbestellung-pre-archive-2026-07-07_0006.tar.gz`
- SHA256: `b041385c2545aa6db800467e04fa9f5dfec0487588924d1ecb4df509cf668de7`
- SQL `documents`: IDs 1664/1665

Weitere Archive:

- `/home/nathanael_romano/documents/schule/finanzen/bestellungen/archiv-lehrmittel-ingold-biwa-2026-07-06_2119.tar.gz`
- `/home/nathanael_romano/documents/schule/finanzen/bestellungen/sammelbestellung-ingold-biwa-2026/abschluss/supabase-backup-2026-05-07_07-39-43.tar.gz`

## Nach Deploy

Nach erfolgreichem Push/Deploy der Archivseite können die Supabase-Tabellen `bestell_*` gelöscht werden:

1. `bestell_order_items`
2. `bestell_orders`
3. `bestell_ordered_articles`
4. `bestell_settings`
5. `bestell_teachers`
