import { db } from "../server/db";
import { albums, tracks } from "../shared/schema";
import { eq } from "drizzle-orm";

async function main() {
  try {
    console.log("Adding test album...");
    
    // Insert the new album
    const [newAlbum] = await db
      .insert(albums)
      .values({
        title: "Search Test",
        artistId: 1, // Using existing artist
        releaseDate: new Date(),
        genreId: 1, // Using existing genre
        coverImage: "https://images.unsplash.com/photo-1614149162883-504ce46d75a4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80",
        isNew: 1
      })
      .returning();
    
    console.log("Album created:", newAlbum);
    
    // Create 5 tracks with random numbers
    const trackValues = [];
    for (let i = 1; i <= 5; i++) {
      const randomDuration = Math.floor(Math.random() * 300) + 60; // Random duration between 60-360 seconds
      
      trackValues.push({
        title: `Track ${i} - ${Math.floor(Math.random() * 1000)}`,
        albumId: newAlbum.id,
        trackNumber: i,
        duration: randomDuration
      });
    }
    
    // Insert all tracks
    const createdTracks = await db
      .insert(tracks)
      .values(trackValues)
      .returning();
    
    console.log(`Created ${createdTracks.length} tracks`);
    
    // Update album total duration
    const totalDuration = createdTracks.reduce((sum, track) => sum + track.duration, 0);
    
    await db
      .update(albums)
      .set({ totalDuration })
      .where(eq(albums.id, newAlbum.id));
    
    console.log("Album total duration updated:", totalDuration);
    console.log("Done!");
    
  } catch (error) {
    console.error("Error adding test album:", error);
  } finally {
    process.exit(0);
  }
}

main();