import { Pool } from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_G4EzBcyub0nX@ep-morning-mud-ateojs9y-pooler.c-9.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const practicesData = [
  {
    image_url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=80',
    text: 'A breathtaking valley stretches toward towering alpine peaks beneath a tranquil sunset. The turquoise glacial river weaves gently through pine forests, reflecting golden light from the horizon while mist rises quietly above the water.',
    rate: 'excellent',
    feedback: 'Exceptional vocabulary and vivid imagery. Strong sentence variety and precise adjectives like "turquoise glacial river" and "alpine peaks".',
    daysAgo: 0,
    hoursAgo: 2
  },
  {
    image_url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=1000&q=80',
    text: 'Modern skyscrapers pierce the twilight sky with glowing amber office lights. Below, streaks of red and yellow traffic weave through the multi-lane highway, creating a dynamic contrast between urban motion and architectural stillness.',
    rate: 'excellent',
    feedback: 'Superb spatial organization and rhythmic clause flow. The juxtaposition between urban motion and architectural stillness demonstrates advanced descriptive mastery.',
    daysAgo: 0,
    hoursAgo: 6
  },
  {
    image_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80',
    text: 'Morning sunbeams filter through a dense canopy of ancient redwood trees. Ferns blanket the damp forest floor, and dew drops glisten on green moss along the winding wooden trail path.',
    rate: 'high',
    feedback: 'Rich sensory details and strong visual grounding. Great use of atmospheric vocabulary like "canopy", "glisten", and "dense".',
    daysAgo: 1,
    hoursAgo: 3
  },
  {
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    text: 'Golden sands curve along a turquoise ocean with white foam lapping gently against the shoreline. Palm trees lean outward toward the sea, framed by distant clouds on a warm summer afternoon.',
    rate: 'good',
    feedback: 'Clear, consistent scene description with good adjectives. To reach an excellent score, incorporate more complex subordinate clauses.',
    daysAgo: 1,
    hoursAgo: 8
  },
  {
    image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1000&q=80',
    text: 'Rows of classic leather-bound books fill towering mahogany shelves in a historic university library. Students sit at polished wooden tables illuminated by brass reading lamps in quiet concentration.',
    rate: 'excellent',
    feedback: 'Outstanding thematic coherence and atmospheric detail. "Leather-bound books", "towering mahogany shelves", and "brass reading lamps" create a vivid visual scene.',
    daysAgo: 2,
    hoursAgo: 1
  },
  {
    image_url: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1000&q=80',
    text: 'A calm mountain lake mirrors surrounding pine forests and snow-dusted crags. A single wooden canoe rests near the gravel shore as soft clouds drift over the tranquil alpine backdrop.',
    rate: 'high',
    feedback: 'Clear structure and serene tone. Effective use of spatial markers and descriptive noun phrases.',
    daysAgo: 2,
    hoursAgo: 5
  },
  {
    image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80',
    text: 'A clean minimalist wooden desk holds an open laptop displaying lines of clean code, a ceramic mug of steaming coffee, and a small potted succulent near a sunlit window.',
    rate: 'good',
    feedback: 'Accurate and well-proportioned focal point coverage. Good use of concise, orderly descriptive elements.',
    daysAgo: 3,
    hoursAgo: 2
  },
  {
    image_url: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1000&q=80',
    text: 'Looking upward from the forest floor, slender birch trees reach toward a crisp blue sky. Sunlight breaks through the branches, casting geometric shadows across the crisp fallen autumn leaves.',
    rate: 'high',
    feedback: 'Creative perspective choice focusing on vertical dimension. Expressive vocabulary and natural cadence throughout.',
    daysAgo: 3,
    hoursAgo: 7
  },
  {
    image_url: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1000&q=80',
    text: 'Rolling emerald hills surround a quiet wooden cottage by the water. Wisps of morning fog linger over the grass while the gentle ripples of the lake catch the early morning light.',
    rate: 'high',
    feedback: 'Strong environmental grounding with great evocative imagery. Excellent pacing and natural clause flow.',
    daysAgo: 4,
    hoursAgo: 4
  },
  {
    image_url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80',
    text: 'A lone hiker stands atop a rugged mountain ridge gazing across a vast sea of clouds illuminated in radiant amber and pink shades by the rising morning sun.',
    rate: 'good',
    feedback: 'Captures the grand scale of the landscape and emotional resonance. Consider adding a few more detail sentences on foreground textures.',
    daysAgo: 4,
    hoursAgo: 9
  },
  {
    image_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    text: 'A young professional works intently on a laptop in a vibrant open-concept cafe. Soft afternoon sunlight highlights the warm wooden textures and surrounding urban greenery.',
    rate: 'medium',
    feedback: 'Clear topic sentence and relevant subject identification. Try adding richer vocabulary and more specific modifiers for higher scores.',
    daysAgo: 5,
    hoursAgo: 2
  },
  {
    image_url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1000&q=80',
    text: 'Expansive green fields roll under a dramatic sky filled with billowy white clouds. A solitary oak tree stands proudly in the middle ground, casting a wide shadow over wildflowers.',
    rate: 'high',
    feedback: 'Well-balanced spatial progression from foreground wildflowers to the horizon. Great adjective precision.',
    daysAgo: 5,
    hoursAgo: 6
  },
  {
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80',
    text: 'Glass facades of commercial towers reflect geometric patterns of passing clouds. The sharp structural angles draw the viewer eye upward into the clear blue sky above the financial district.',
    rate: 'excellent',
    feedback: 'Sophisticated architectural vocabulary and thoughtful composition analysis. Fluent grammatical variety throughout.',
    daysAgo: 6,
    hoursAgo: 1
  },
  {
    image_url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1000&q=80',
    text: 'Golden sunlight penetrates through a canopy of green leaves, illuminating vibrant wildflowers and ferns on the forest floor in a warm, peaceful glow.',
    rate: 'good',
    feedback: 'Good descriptive flow and strong sensory focus. Adding contrast or background depth will enhance future responses.',
    daysAgo: 6,
    hoursAgo: 5
  },
  {
    image_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1000&q=80',
    text: 'A dramatic stormy sky looms over craggy seaside cliffs. Powerful ocean waves crash against weathered dark rocks, sending plumes of white sea spray into the salty air.',
    rate: 'high',
    feedback: 'Vivid sensory verb choices like "looms", "crash", and "sending plumes". High dynamic energy in the phrasing.',
    daysAgo: 7,
    hoursAgo: 3
  },
  {
    image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1000&q=80',
    text: 'Under a starry midnight sky, snow-covered mountain peaks stand illuminated by the glow of the Milky Way galaxy stretching overhead across the deep cosmic expanse.',
    rate: 'excellent',
    feedback: 'Captivating atmospheric prose with ambitious lexical choices. Excellent sentence transitions and rhythm.',
    daysAgo: 7,
    hoursAgo: 8
  },
  {
    image_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=1000&q=80',
    text: 'A quiet mountain trail leads through a grove of golden aspen trees. Yellow leaves carpet the path, crunching softly underfoot in the crisp autumn air.',
    rate: 'good',
    feedback: 'Pleasing sensory details and clear seasonal mood. Try varying sentence lengths to create even stronger cadence.',
    daysAgo: 8,
    hoursAgo: 4
  },
  {
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
    text: 'Intricate circuit board pathways glow with neon blue traces and miniature semiconductor chips, showcasing modern microelectronic engineering and computational precision.',
    rate: 'high',
    feedback: 'Accurate technical terminology and crisp analytical focus. Strong vocabulary precision throughout.',
    daysAgo: 9,
    hoursAgo: 2
  },
  {
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
    text: 'Colleagues collaborate enthusiastically around a whiteboard filled with strategic diagrams and brainstorming notes inside a bright, modern glass-walled office.',
    rate: 'good',
    feedback: 'Clear description of human interaction and workplace atmosphere. Good grammatical precision.',
    daysAgo: 10,
    hoursAgo: 5
  },
  {
    image_url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=80',
    text: 'A solitary road stretches into the distant desert horizon under an open expansive sky. Distant canyon mesas frame the vast and quiet landscape.',
    rate: 'medium',
    feedback: 'Good fundamental setting identification. Expand descriptive clauses to add texture to the foreground and road surface.',
    daysAgo: 11,
    hoursAgo: 3
  },
  {
    image_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80',
    text: 'Sleek architectural lines define a contemporary corporate headquarters with high glass ceilings, polished terrazzo floors, and integrated indoor botanical gardens.',
    rate: 'excellent',
    feedback: 'Superb architectural nuance and high-level vocabulary including "terrazzo floors" and "botanical gardens".',
    daysAgo: 12,
    hoursAgo: 6
  },
  {
    image_url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1000&q=80',
    text: 'A photographer adjusts a camera tripod on a cliff edge at dawn. The camera lens catches the first amber rays of sun bursting over a misty mountain ridge.',
    rate: 'high',
    feedback: 'Dynamic narrative focus with strong descriptive imagery. Great connection between subject action and natural backdrop.',
    daysAgo: 13,
    hoursAgo: 2
  }
];

async function seed() {
  try {
    console.log('Connecting to Neon PostgreSQL to seed 22+ writing practices...');
    const userRes = await pool.query("SELECT id FROM users WHERE LOWER(username) = 'muhammad ahmad' OR role = 'admin' LIMIT 1");
    const adminId = userRes.rows[0]?.id || 1;
    console.log(`Using admin user ID: ${adminId}`);

    let insertedCount = 0;
    for (const p of practicesData) {
      const createdAt = new Date(Date.now() - (p.daysAgo * 24 * 60 * 60 * 1000) - (p.hoursAgo * 60 * 60 * 1000));
      await pool.query(
        'INSERT INTO practices (image_url, text, rate, feedback, user_id, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
        [p.image_url, p.text, p.rate, p.feedback, adminId, createdAt]
      );
      insertedCount++;
    }

    console.log(`Successfully seeded ${insertedCount} writing practices for user ID ${adminId}!`);
    const totalRes = await pool.query('SELECT COUNT(*) as count FROM practices WHERE user_id = $1', [adminId]);
    console.log(`Total practices now in database for user ${adminId}: ${totalRes.rows[0].count}`);
    await pool.end();
  } catch (err) {
    console.error('Error seeding practices:', err);
    process.exit(1);
  }
}

seed();
