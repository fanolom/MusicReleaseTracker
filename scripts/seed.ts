import { db } from "../server/db";
import {
  artists, genres, albums, tracks, relatedAlbums,
  type InsertArtist, type InsertGenre, type InsertAlbum, type InsertTrack,
} from "../shared/schema";

async function main() {
  console.log("Seeding database...");

  // Create genres
  console.log("Creating genres...");
  const [electronic] = await db.insert(genres).values({ name: "Electronic" }).returning();
  const [hiphop] = await db.insert(genres).values({ name: "Hip Hop" }).returning();
  const [jazz] = await db.insert(genres).values({ name: "Jazz" }).returning();
  const [rock] = await db.insert(genres).values({ name: "Rock" }).returning();
  const [indie] = await db.insert(genres).values({ name: "Indie" }).returning();

  // Create artists
  console.log("Creating artists...");
  const [electronPulse] = await db.insert(artists).values({ 
    name: "Electron Pulse", 
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [lunaEcho] = await db.insert(artists).values({ 
    name: "Luna Echo", 
    image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [rhythmCollective] = await db.insert(artists).values({ 
    name: "Rhythm Collective", 
    image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [saxotoneQuartet] = await db.insert(artists).values({ 
    name: "Saxotone Quartet", 
    image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [amplifiedYouth] = await db.insert(artists).values({ 
    name: "Amplified Youth", 
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [synthwaveCollective] = await db.insert(artists).values({ 
    name: "Synthwave Collective", 
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [electricDreams] = await db.insert(artists).values({ 
    name: "Electric Dreams", 
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  const [mountainFolk] = await db.insert(artists).values({ 
    name: "Mountain Folk", 
    image: "https://images.unsplash.com/photo-1458560871784-56d23406c091?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" 
  }).returning();

  // Create albums
  console.log("Creating albums...");
  const [chromaticOdyssey] = await db.insert(albums).values({
    title: "Chromatic Odyssey",
    artistId: electronPulse.id,
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-05-15"),
    genreId: electronic.id,
    totalDuration: 2520, // 42 minutes
    isNew: 1
  }).returning();

  const [midnightRain] = await db.insert(albums).values({
    title: "Midnight Rain",
    artistId: lunaEcho.id,
    coverImage: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-04-28"),
    genreId: indie.id,
    totalDuration: 2220, // 37 minutes
    isNew: 0
  }).returning();

  const [urbanEchoes] = await db.insert(albums).values({
    title: "Urban Echoes",
    artistId: rhythmCollective.id,
    coverImage: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-05-08"),
    genreId: hiphop.id,
    totalDuration: 2700, // 45 minutes
    isNew: 1
  }).returning();

  const [harmonicConvergence] = await db.insert(albums).values({
    title: "Harmonic Convergence",
    artistId: saxotoneQuartet.id,
    coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-03-15"),
    genreId: jazz.id,
    totalDuration: 3000, // 50 minutes
    isNew: 0
  }).returning();

  const [sonicRevolution] = await db.insert(albums).values({
    title: "Sonic Revolution",
    artistId: amplifiedYouth.id,
    coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-04-02"),
    genreId: rock.id,
    totalDuration: 2640, // 44 minutes
    isNew: 0
  }).returning();

  const [digitalDreams] = await db.insert(albums).values({
    title: "Digital Dreams",
    artistId: synthwaveCollective.id,
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-05-01"),
    genreId: electronic.id,
    totalDuration: 2760, // 46 minutes
    isNew: 0
  }).returning();

  const [neonNights] = await db.insert(albums).values({
    title: "Neon Nights",
    artistId: electricDreams.id,
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-04-12"),
    genreId: electronic.id,
    totalDuration: 2460, // 41 minutes
    isNew: 0
  }).returning();

  const [acousticSessions] = await db.insert(albums).values({
    title: "Acoustic Sessions",
    artistId: mountainFolk.id,
    coverImage: "https://images.unsplash.com/photo-1458560871784-56d23406c091?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
    releaseDate: new Date("2023-03-24"),
    genreId: indie.id,
    totalDuration: 2340, // 39 minutes
    isNew: 0
  }).returning();

  // Create tracks for Chromatic Odyssey
  console.log("Creating tracks...");
  await db.insert(tracks).values([
    { title: "Digital Dawn", albumId: chromaticOdyssey.id, trackNumber: 1, duration: 225 }, // 3:45
    { title: "Neon Cascade", albumId: chromaticOdyssey.id, trackNumber: 2, duration: 252 }, // 4:12
    { title: "Quantum Pulse", albumId: chromaticOdyssey.id, trackNumber: 3, duration: 318 }, // 5:18
    { title: "Synth Symphony", albumId: chromaticOdyssey.id, trackNumber: 4, duration: 362 }, // 6:02
    { title: "Chromatic Revolution", albumId: chromaticOdyssey.id, trackNumber: 5, duration: 295 }, // 4:55
    { title: "Electric Dreams", albumId: chromaticOdyssey.id, trackNumber: 6, duration: 336 }, // 5:36
    { title: "Binary Sunset", albumId: chromaticOdyssey.id, trackNumber: 7, duration: 261 }, // 4:21
    { title: "Digital Afterglow", albumId: chromaticOdyssey.id, trackNumber: 8, duration: 432 } // 7:12
  ]);

  // Create related albums
  console.log("Creating related albums...");
  await db.insert(relatedAlbums).values([
    { albumId: chromaticOdyssey.id, relatedAlbumId: digitalDreams.id },
    { albumId: chromaticOdyssey.id, relatedAlbumId: neonNights.id },
    { albumId: midnightRain.id, relatedAlbumId: acousticSessions.id },
    { albumId: digitalDreams.id, relatedAlbumId: neonNights.id }
  ]);

  console.log("Seeding complete!");
}

main().catch(e => {
  console.error("Error seeding database:", e);
  process.exit(1);
});