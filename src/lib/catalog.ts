import rawCatalog from '@/data/katalog.json'

export interface Article {
  name: string
  articleNumber: string
  url: string
}

export interface Subcategory {
  name: string
  articles: Article[]
}

export interface DisplayGroup {
  name: string
  icon: string
  subcategories: Subcategory[]
}

// Mapping from raw category names to display groups
const groupMapping: Record<string, { group: string; icon: string }> = {
  // Schulmaterial
  'Schulhefte': { group: 'Schulhefte & Papier', icon: '📓' },
  'Papiere, Karton, Folien': { group: 'Schulhefte & Papier', icon: '📓' },
  'Schreiben': { group: 'Schreiben & Zeichnen', icon: '✏️' },
  'Zeichengeraete': { group: 'Schreiben & Zeichnen', icon: '✏️' },
  'Ordnen': { group: 'Ordnen & Büro', icon: '📁' },
  'Bueromaterial': { group: 'Ordnen & Büro', icon: '📁' },
  'Klassenmaterial': { group: 'Klassenmaterial', icon: '🏫' },
  'Visuelle Kommunikation': { group: 'Klassenmaterial', icon: '🏫' },
  'Werkzeuge Maschinen': { group: 'Werkzeuge', icon: '🔧' },
  'Kleben': { group: 'Kleben & Werkzeuge', icon: '🔧' },
  'Musik': { group: 'Musik', icon: '🎵' },
  // Werken & Gestalten
  'Werkmaterial': { group: 'Werken & Gestalten', icon: '🎭' },
  'Literatur': { group: 'Werken & Gestalten', icon: '🎭' },
  // Lernmedien
  'Deutsch': { group: 'Lernmedien', icon: '📚' },
  'Deutsch Als Zweitsprache': { group: 'Lernmedien', icon: '📚' },
  'Englisch': { group: 'Lernmedien', icon: '📚' },
  'Franzoesisch': { group: 'Lernmedien', icon: '📚' },
  'Italienisch': { group: 'Lernmedien', icon: '📚' },
  'Spanisch': { group: 'Lernmedien', icon: '📚' },
  'Mathematik': { group: 'Lernmedien', icon: '📚' },
  'Geografie': { group: 'Lernmedien', icon: '📚' },
  'Geschichte': { group: 'Lernmedien', icon: '📚' },
  'Natur Und Technik': { group: 'Lernmedien', icon: '📚' },
  'Medien Und Informatik': { group: 'Lernmedien', icon: '📚' },
  'Lebenskunde': { group: 'Lernmedien', icon: '📚' },
  'Gestalten': { group: 'Lernmedien', icon: '📚' },
  'Bildung Fuer Nachhaltige Entwicklung': { group: 'Lernmedien', icon: '📚' },
  'Verschiedenes': { group: 'Lernmedien', icon: '📚' },
  'Lernmedien': { group: 'Lernmedien', icon: '📚' },
  // Sport
  'Baelle': { group: 'Bewegung & Sport', icon: '🏃' },
  'Sportarten': { group: 'Bewegung & Sport', icon: '🏃' },
  'Sportausstattung , Einrichtung': { group: 'Bewegung & Sport', icon: '🏃' },
  'Spiele': { group: 'Bewegung & Sport', icon: '🏃' },
  // Organisieren
  'Planen Und Kontrollieren': { group: 'Organisieren', icon: '📋' },
  'Verstauen': { group: 'Organisieren', icon: '📋' },
  // Sonstiges
  'Einrichtung, Rollenspiel': { group: 'Sonstiges', icon: '🧩' },
  'Essen Und Trinken': { group: 'Sonstiges', icon: '🧩' },
  'Sand  Und Wasserspiele': { group: 'Sonstiges', icon: '🧩' },
  'Sensorik, Sinnesfoerderung': { group: 'Sonstiges', icon: '🧩' },
  'Spielwaren': { group: 'Sonstiges', icon: '🧩' },
}

// Some categories appear twice (Schulmaterial + Werken), differentiate by index
const werkCategories = new Set([
  17, // Farben (Werken) - index 17
  18, // Kleben (Werken) - index 18
  19, // Literatur
  20, // Papiere, Karton, Folien (Werken) - index 20
  21, // Werkmaterial
  22, // Werkzeuge Maschinen (Werken) - index 22
])

export function getGroupedCatalog(): DisplayGroup[] {
  const groups = new Map<string, DisplayGroup>()
  const categories = rawCatalog.categories

  categories.forEach((cat, index) => {
    let mapping: { group: string; icon: string }

    // Handle duplicate category names (Werken vs Schulmaterial)
    if (werkCategories.has(index)) {
      if (cat.name === 'Farben' || cat.name === 'Kleben' || cat.name === 'Papiere, Karton, Folien' || cat.name === 'Werkzeuge Maschinen') {
        mapping = { group: 'Werken & Gestalten', icon: '🎭' }
      } else {
        mapping = groupMapping[cat.name] || { group: 'Sonstiges', icon: '🧩' }
      }
    } else if (cat.name === 'Farben') {
      mapping = { group: 'Farben & Malen', icon: '🎨' }
    } else {
      mapping = groupMapping[cat.name] || { group: 'Sonstiges', icon: '🧩' }
    }

    if (!groups.has(mapping.group)) {
      groups.set(mapping.group, {
        name: mapping.group,
        icon: mapping.icon,
        subcategories: [],
      })
    }

    const group = groups.get(mapping.group)!
    for (const sub of cat.subcategories) {
      // Prefix subcategory with parent category for clarity if in a merged group
      const subName = `${cat.name} › ${sub.name}`
      group.subcategories.push({
        name: subName,
        articles: sub.articles.map((a) => ({
          name: a.name,
          articleNumber: a.articleNumber,
          url: a.url,
        })),
      })
    }
  })

  // Sort groups in a defined order
  const order = [
    'Schulhefte & Papier', 'Schreiben & Zeichnen', 'Farben & Malen',
    'Ordnen & Büro', 'Kleben & Werkzeuge', 'Klassenmaterial', 'Werkzeuge',
    'Werken & Gestalten', 'Lernmedien', 'Bewegung & Sport',
    'Organisieren', 'Musik', 'Sonstiges',
  ]

  return order
    .filter((name) => groups.has(name))
    .map((name) => groups.get(name)!)
}

export function searchCatalog(query: string): { group: string; subcategory: string; article: Article }[] {
  const q = query.toLowerCase()
  const results: { group: string; subcategory: string; article: Article }[] = []
  const groups = getGroupedCatalog()

  for (const group of groups) {
    for (const sub of group.subcategories) {
      for (const article of sub.articles) {
        if (
          article.name.toLowerCase().includes(q) ||
          article.articleNumber.includes(q)
        ) {
          results.push({
            group: `${group.icon} ${group.name}`,
            subcategory: sub.name,
            article,
          })
        }
      }
    }
  }

  return results.slice(0, 50)
}

// Lookup map: articleNumber → shop URL
let _urlMap: Record<string, string> | null = null
export function getArticleUrlMap(): Record<string, string> {
  if (_urlMap) return _urlMap
  _urlMap = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const cat of (rawCatalog as any).categories) {
    for (const sub of cat.subcategories) {
      for (const a of sub.articles) {
        _urlMap[a.articleNumber] = a.url
      }
    }
  }
  return _urlMap
}
