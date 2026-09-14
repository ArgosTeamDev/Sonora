// Migrates album/artist storage from local JSON records to iTunes-backed
// "overlay" records: { id: <iTunes collectionId>, isAlbumOfTheMonth,
// editorialNote, createdAt }. Every Review.albumId gets remapped from the
// old locally-generated id to the resolved iTunes collectionId.
//
// Dry run by default — prints the resolution table and does not write
// anything. Pass --apply to actually rewrite data/db.seed.json and
// data/db.json (a timestamped backup of both is written first).
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.join(root, "..", "data", "db.seed.json");
const dbPath = path.join(root, "..", "data", "db.json");

const APPLY = process.argv.includes("--apply");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  return res.json();
}

// The automated search-based match below fails for a couple of massively
// covered/remixed albums — the real canonical release doesn't rank in the
// top search results at all (crowded out by tributes, live sets, deluxe
// reissues with different collection names). Verified by hand once.
const MANUAL_OVERRIDES = {
  "nirvana|nevermind": "1440783617",
  "tame impala|currents": "1440838039",
  // Neither album's plain original master is independently listed on iTunes
  // anymore — only reissues are. These are the closest-to-original editions
  // (correct 20/12-track lengths, not the 84/72-track box sets that win the
  // automated match by raw track count).
  "fleetwood mac|tusk": "1055803853",
  "nirvana|in utero": "1440858699",
};

async function findCollectionId(artistName, albumTitle) {
  const overrideKey = `${normalize(artistName)}|${normalize(albumTitle)}`;
  if (MANUAL_OVERRIDES[overrideKey]) return MANUAL_OVERRIDES[overrideKey];

  const term = encodeURIComponent(`${artistName} ${albumTitle}`);
  const data = await fetchJson(
    `https://itunes.apple.com/search?term=${term}&media=music&entity=album&limit=25`,
  );
  const wantArtist = normalize(artistName);
  const wantTitle = normalize(albumTitle);
  const artistMatches = data.results.filter((r) => normalize(r.artistName).includes(wantArtist));
  const exactMatches = artistMatches.filter((r) => normalize(r.collectionName) === wantTitle);
  const pool = exactMatches.length > 0 ? exactMatches : artistMatches;
  const best = [...pool].sort((a, b) => (b.trackCount ?? 0) - (a.trackCount ?? 0))[0];
  return best?.collectionId ?? null;
}

async function resolveIdMap(seed) {
  const artistsById = new Map(seed.artists.map((a) => [a.id, a]));
  const idMap = new Map(); // old album id -> { collectionId, title, artistName }
  const unresolved = [];

  for (const album of seed.albums) {
    const artist = artistsById.get(album.artistId);
    const collectionId = await findCollectionId(artist.name, album.title);
    if (!collectionId) {
      unresolved.push({ title: album.title, artist: artist.name });
    } else {
      idMap.set(album.id, {
        collectionId: String(collectionId),
        title: album.title,
        artistName: artist.name,
      });
    }
    await sleep(400); // stay under iTunes' unauthenticated rate limit
  }

  return { idMap, unresolved };
}

function remapFile(filePath, idMap, apply) {
  const data = JSON.parse(readFileSync(filePath, "utf8"));

  const albumOverlays = [];
  const missingFromMap = [];
  for (const album of data.albums) {
    const resolved = idMap.get(album.id);
    if (!resolved) {
      missingFromMap.push(album.title);
      continue;
    }
    albumOverlays.push({
      id: resolved.collectionId,
      isAlbumOfTheMonth: album.isAlbumOfTheMonth ?? false,
      editorialNote: album.editorialNote ?? null,
      createdAt: album.createdAt,
    });
  }

  const orphanedReviews = [];
  const remappedReviews = data.reviews.map((review) => {
    const resolved = idMap.get(review.albumId);
    if (!resolved) {
      orphanedReviews.push({ id: review.id, albumId: review.albumId });
      return review;
    }
    return { ...review, albumId: resolved.collectionId };
  });

  console.log(`\n${path.basename(filePath)}:`);
  console.log(`  albums -> overlays: ${albumOverlays.length}/${data.albums.length}`);
  if (missingFromMap.length > 0) {
    console.log(`  UNRESOLVED albums (kept out of the overlay list):`, missingFromMap);
  }
  console.log(`  reviews remapped: ${data.reviews.length - orphanedReviews.length}/${data.reviews.length}`);
  if (orphanedReviews.length > 0) {
    console.log(`  ORPHANED reviews (left untouched, already pointed at a missing album):`, orphanedReviews);
  }

  if (apply) {
    const next = {
      users: data.users,
      albumOverlays,
      reviews: remappedReviews,
      follows: data.follows,
    };
    writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf8");
    console.log(`  written.`);
  }
}

async function main() {
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));

  console.log(`Resolving iTunes collectionId for ${seed.albums.length} albums (from db.seed.json)...`);
  const { idMap, unresolved } = await resolveIdMap(seed);

  console.log(`\nResolution table:`);
  for (const [oldId, r] of idMap) {
    console.log(`  ${oldId}  ->  ${r.collectionId}   (${r.artistName} — ${r.title})`);
  }
  if (unresolved.length > 0) {
    console.log(`\nCould not resolve (would be dropped from the catalog):`, unresolved);
  }

  if (!APPLY) {
    console.log(`\nDry run only — nothing written. Re-run with --apply to write the migration.`);
    remapFile(seedPath, idMap, false);
    remapFile(dbPath, idMap, false);
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  copyFileSync(seedPath, `${seedPath}.${stamp}.bak`);
  copyFileSync(dbPath, `${dbPath}.${stamp}.bak`);
  console.log(`\nBacked up both files with suffix .${stamp}.bak`);

  remapFile(seedPath, idMap, true);
  remapFile(dbPath, idMap, true);
}

main();
