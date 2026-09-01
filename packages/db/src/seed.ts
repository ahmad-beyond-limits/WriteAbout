import { db, pool, wordSets, words } from './index';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Ensure .env is loaded
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const standardWords = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "world", "life", "great", "tell", "small", "every", "hand", "large", "place", "hold",
  "turn", "real", "leave", "point", "nation", "build", "stand", "system", "keep", "follow",
  "number", "water", "call", "long", "sound", "side", "line", "right", "change", "off",
  "play", "air", "away", "animal", "house", "picture", "try", "kind", "again", "mother",
  "answer", "found", "study", "still", "learn", "should", "america", "cross", "grow", "open",
  "walk", "listen", "letter", "river", "night", "carry", "state", "city", "tree", "plant",
  "story", "press", "close", "country", "between", "school", "never", "start", "earth"
];

const extendedWords = [
  "achieve", "adventure", "aesthetic", "algorithm", "ambition", "ancient", "apparent", "approach", "attitude", "audience",
  "authentic", "balance", "beautiful", "beginning", "boundary", "brilliant", "broadcast", "business", "calculate", "candidate",
  "capacity", "celebrate", "challenge", "character", "chemistry", "childhood", "chronicle", "citizen", "cognitive", "collapse",
  "colleague", "commander", "companion", "component", "condition", "confident", "consensus", "construct", "continent", "courage",
  "creative", "cultivate", "curiosity", "dangerous", "decision", "defensive", "deliberate", "democracy", "departure", "dependent",
  "describe", "desperate", "determine", "different", "difficult", "dimension", "discovery", "diversity", "effective", "efficient",
  "elaborate", "elevation", "eloquent", "emergency", "emotional", "emphasize", "encounter", "endeavor", "energy", "engineer",
  "enormous", "enthusiasm", "epidemic", "equality", "essential", "establish", "evaluate", "evolution", "excellent", "exclusive",
  "executive", "exhausted", "existence", "expansion", "expensive", "experience", "experiment", "expression", "extraordinary", "fantastic",
  "fascinate", "flourish", "forecast", "formation", "fortunate", "framework", "frequency", "frustration", "fundamental", "generation",
  "gratitude", "guarantee", "guidance", "happiness", "harmony", "headline", "historical", "horizon", "humanity", "hypothesis",
  "identical", "illuminate", "imagination", "immediate", "importance", "impression", "incentive", "independent", "individual", "inevitable",
  "influence", "infrastructure", "initiative", "innovation", "inspiration", "instrument", "integrity", "intelligent", "intensity", "interaction",
  "landscape", "leadership", "lifestyle", "magnitude", "masterpiece", "meaningful", "measurement", "mechanism", "melancholy", "memorable",
  "milestone", "miniature", "miraculous", "moderation", "motivation", "mysterious", "narrative", "navigation", "necessity", "negotiate"
];

const techWords = [
  "async", "await", "boolean", "callback", "compiler", "component", "database", "debugging", "docker", "endpoint",
  "framework", "function", "garbage", "generic", "graphql", "handler", "immutable", "indexer", "instance", "interface",
  "javascript", "kubernetes", "lambda", "middleware", "mutation", "namespace", "node", "object", "operator", "optimizer",
  "package", "parameter", "payload", "pipeline", "pointer", "polymorphism", "postgres", "promise", "protocol", "prototype",
  "query", "recursion", "reducer", "registry", "repository", "request", "response", "runtime", "schema", "serverless",
  "session", "singleton", "socket", "state", "stream", "structure", "subscriber", "syntax", "template", "terminal",
  "thread", "token", "transaction", "transpiler", "typescript", "variable", "virtual", "webhook", "worker", "workspace"
];

export async function seed() {
  console.log('Seeding word sets and words into Neon PostgreSQL via batch inserts...');

  try {
    // 1. Seed Word Sets
    const sets = [
      { name: 'English Standard', language: 'english', description: 'Top 150 most common English words for rapid typing flow.' },
      { name: 'English 1k', language: 'english', description: 'Advanced multisyllabic vocabulary for descriptive accuracy.' },
      { name: 'Tech & Code', language: 'english', description: 'Programming, cloud, and engineering keywords.' }
    ];

    const setRecords: Record<string, number> = {};

    for (const s of sets) {
      const existing = await db.select().from(wordSets).where(eq(wordSets.name, s.name)).limit(1);
      if (existing.length > 0) {
        setRecords[s.name] = existing[0].id;
      } else {
        const inserted = await db.insert(wordSets).values(s).returning({ id: wordSets.id });
        setRecords[s.name] = inserted[0].id;
      }
    }

    // 2. Clear existing words to prevent duplicate accumulation
    await pool.query('DELETE FROM words;');

    // 3. Batch insert words per set
    const prepareValues = (list: string[], setId: number, diff: number) => {
      const uniqueList = Array.from(new Set(list.map(w => w.toLowerCase().trim()))).filter(Boolean);
      return uniqueList.map(w => ({
        wordSetId: setId,
        word: w,
        difficulty: diff,
        frequency: 100,
        isActive: true
      }));
    };

    const stdValues = prepareValues(standardWords, setRecords['English Standard'], 1);
    const extValues = prepareValues(extendedWords, setRecords['English 1k'], 2);
    const techValues = prepareValues(techWords, setRecords['Tech & Code'], 2);

    await db.insert(words).values(stdValues);
    await db.insert(words).values(extValues);
    await db.insert(words).values(techValues);

    console.log(`Successfully batch-inserted ${stdValues.length + extValues.length + techValues.length} words across 3 word sets!`);

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('Database seed completed successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database seed failed:', err);
      process.exit(1);
    });
}
