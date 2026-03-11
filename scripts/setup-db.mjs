import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ADMIN_HASH = '$2b$10$73E.aHB.K48q/Z56oKfXeeHVqILLiR01gGegFg/crKlW06uWuK9jS'

async function setup() {
  console.log('Setting up database...')

  // Create tables via SQL
  const { error: sqlError } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS bestell_teachers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        campus TEXT NOT NULL CHECK (campus IN ('schoenau', 'zulg')),
        token TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS bestell_orders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        teacher_id UUID REFERENCES bestell_teachers(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
        submitted_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT now(),
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS bestell_order_items (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        order_id UUID REFERENCES bestell_orders(id) ON DELETE CASCADE,
        article_number TEXT NOT NULL,
        article_name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS bestell_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `
  })

  if (sqlError) {
    console.log('Note: RPC exec_sql not available, tables must be created via SQL Editor')
    console.log('SQL Error:', sqlError.message)
  }

  // Try to insert settings (works if table exists)
  console.log('Inserting settings...')
  await supabase.from('bestell_settings').upsert([
    { key: 'admin_password_hash', value: ADMIN_HASH },
    { key: 'order_deadline', value: '2026-05-03' },
    { key: 'order_year', value: '2026' },
  ])

  // Insert teachers
  console.log('Inserting teachers...')

  const schoenau = [
    'Nathanael Romano', 'Paul Hess', 'Johannes Blatter', 'Annina Lisa Habegger-Oliveira',
    'Cornelia Cipolla', 'Regula Daepp-Schweizer', 'Lena Zumstein', 'Andreas Kunz',
    'Ueli Schweizer', 'Markus Hänni', 'Thomas Hofmänner', 'Cyrill Zumbrunn',
    'Corinne Gadient', 'Martina Schneider Kernen', 'Fabienne Siegrist', 'Rahel Freund',
    'Daniel Germann', 'Felix Gurtner', 'Jean-Michel Charmillot', 'Laurent Leutenegger',
    'Fabrice Wenger', 'Antigona Hamiti', 'Christa Frey', 'Samar Alyoussef',
    'Karin Lienhardt', 'Monya Calonder-Gadient', 'Lara Marti', 'Romana Ryser-Engimann',
    'Gerhard Löwl', 'Monika Sandu', 'Naya Zumstein', 'Michael Siegfried',
    'Louis Schumacher', 'Christian Nowak', 'Florentina Berisha', 'Till Holzäpfel',
    'Matilde Martins', 'Khadija Adib',
  ]

  const zulg = [
    'Madeleine Steiner', 'Johannes Blatter', 'Christine Brügger', 'Regula Daepp-Schweizer',
    'Vera Zühlke', 'Annelis Mürner', 'Karin Bühlmann', 'Marc Rothenbühler',
    'Carmela Sorrentino', 'Simone Rudin', 'Stefan Dänzer', 'Annemarie Stähli-Richard',
    'Thomas Hofmänner', 'Corinne Gadient', 'Martina Schneider Kernen', 'Simone Häberli',
    'Jacqueline Heinzmann-Streuli', 'Peter Röthlisberger', 'Larissa Felder', 'Dominic Schmid',
    'Megan Gloor', 'Felix Gurtner', 'Sasha Valerie Küpfer', 'Karin Hubacher',
    'Eleni Michailidou', 'Alexander Lampart', 'Muriel Bruder', 'Marina Stucki-Hari',
    'Lucas De Almeida', 'Christa Frey', 'Luisa Burn', 'Simon Studerus',
    'Gerhard Löwl', 'Oliver Inniger', 'Lynn Heinzmann', 'Noel Schaible',
    'Elina Josi', 'Gerhard Gloor', 'Ramon Bärtschi', 'Matilde Martins',
  ]

  // Check if teachers already exist
  const { data: existing } = await supabase.from('bestell_teachers').select('name, campus')
  const existingSet = new Set((existing || []).map(t => `${t.name}__${t.campus}`))

  const toInsert = []
  for (const name of schoenau) {
    if (!existingSet.has(`${name}__schoenau`)) {
      toInsert.push({ name, campus: 'schoenau' })
    }
  }
  for (const name of zulg) {
    if (!existingSet.has(`${name}__zulg`)) {
      toInsert.push({ name, campus: 'zulg' })
    }
  }

  if (toInsert.length > 0) {
    const { error } = await supabase.from('bestell_teachers').insert(toInsert)
    if (error) {
      console.error('Insert error:', error.message)
    } else {
      console.log(`Inserted ${toInsert.length} teachers`)
    }
  } else {
    console.log('Teachers already exist')
  }

  // Verify
  const { data: count } = await supabase.from('bestell_teachers').select('id', { count: 'exact' })
  console.log(`Total teachers in DB: ${count?.length}`)

  console.log('Done!')
}

setup().catch(console.error)
