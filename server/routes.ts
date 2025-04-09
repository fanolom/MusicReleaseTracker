import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { audioUpload, getAudioDuration, getFilePath, imageUpload } from "./uploads";
import { uploadAlbumSchema, uploadTrackSchema, registerArtistSchema } from "../shared/schema";
import path from "path";
import fs from "fs";
import { setupAuth, isAuthenticated, isAdmin, comparePasswords } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  
  // put application routes here
  // prefix all routes with /api

  // Get all genres
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });
  
  // Get all albums with filtering, sorting, and pagination
  app.get("/api/albums", async (req, res) => {
    try {
      const querySchema = z.object({
        genreId: z.coerce.number().optional(),
        search: z.string().optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
        sortBy: z.enum(['title', 'releaseDate', 'artist']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
        timeframe: z.enum(['week', 'month', 'year']).optional()
      });
      
      const query = querySchema.parse(req.query);
      
      const [albums, count] = await Promise.all([
        storage.getAlbums(query),
        storage.getAlbumCount({
          genreId: query.genreId,
          search: query.search,
          timeframe: query.timeframe
        })
      ]);
      
      // Get artist and genre info for each album
      const albumsWithDetails = await Promise.all(
        albums.map(async (album) => {
          const artist = await storage.getArtist(album.artistId);
          const genre = await storage.getGenre(album.genreId);
          
          return {
            ...album,
            artist,
            genre
          };
        })
      );
      
      res.json({
        data: albumsWithDetails,
        meta: {
          total: count,
          limit: query.limit,
          offset: query.offset || 0
        }
      });
    } catch (error) {
      console.error("Error fetching albums:", error);
      res.status(500).json({ message: "Failed to fetch albums" });
    }
  });
  
  // Get a single album with all details
  app.get("/api/albums/:id", async (req, res) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number()
      });
      
      const { id } = idSchema.parse(req.params);
      const album = await storage.getAlbumWithDetails(id);
      
      if (!album) {
        return res.status(404).json({ message: "Album not found" });
      }
      
      res.json(album);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch album details" });
    }
  });
  
  // Get tracks for an album
  app.get("/api/albums/:id/tracks", async (req, res) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number()
      });
      
      const { id } = idSchema.parse(req.params);
      const tracks = await storage.getTracksByAlbum(id);
      
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracks" });
    }
  });
  
  // Get related albums
  app.get("/api/albums/:id/related", async (req, res) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number()
      });
      
      const { id } = idSchema.parse(req.params);
      const relatedAlbums = await storage.getRelatedAlbums(id);
      
      // Get artist and genre info for each album
      const albumsWithDetails = await Promise.all(
        relatedAlbums.map(async (album) => {
          const artist = await storage.getArtist(album.artistId);
          const genre = await storage.getGenre(album.genreId);
          
          return {
            ...album,
            artist,
            genre
          };
        })
      );
      
      res.json(albumsWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch related albums" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    // Security check - limit to only audio and images folders
    const requestPath = req.url;
    if (!requestPath.startsWith("/audio/") && !requestPath.startsWith("/images/") && !requestPath.startsWith("/audio") && !requestPath.startsWith("/images")) {
      return res.status(404).send("Not found");
    }
    
    const filePath = path.join(process.cwd(), "uploads", req.url);
    console.log("Serving file:", filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error("File not found:", filePath);
      return res.status(404).send("File not found");
    }
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error serving file:", err);
        next();
      }
    });
  });
  
  // Protection middleware for upload endpoints and admin operations
  app.use(["/api/albums/upload", "/api/tracks/upload"], isAuthenticated);
  
  // Admin-only routes for deletion
  app.use(["/api/artists/:id/delete", "/api/albums/:id/delete"], isAuthenticated, isAdmin);

  // Upload a new album with cover image
  app.post("/api/albums/upload", imageUpload.single("coverImage"), async (req: Request, res: Response) => {
    try {
      const formData = req.body;
      const validatedData = uploadAlbumSchema.parse(formData);
      
      // Get artist and verify ownership
      const artist = await storage.getArtist(validatedData.artistId);
      
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
      
      // If the user is not authenticated, we need to verify with password
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if the artist belongs to the authenticated user or verify password
      const isOwner = artist.userId === req.user!.id;
      
      if (!isOwner) {
        return res.status(403).json({ message: "You do not own this artist profile" });
      }
      
      // Verify password
      const password = validatedData.password;
      const user = await storage.getUser(req.user!.id);
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Process cover image if uploaded
      let coverImage = null;
      if (req.file) {
        // Make sure the file exists
        const filePath = path.join(process.cwd(), "uploads", "images", req.file.filename);
        if (fs.existsSync(filePath)) {
          coverImage = getFilePath(path.join("uploads", "images", req.file.filename));
          console.log("File saved at:", filePath);
          console.log("Cover image path:", coverImage);
        } else {
          console.error("File was not saved properly:", filePath);
        }
      }
      
      // Create the album (omit password from stored data)
      const { password: _, ...albumData } = validatedData;
      const newAlbum = await storage.createAlbum({
        ...albumData,
        coverImage,
        isNew: 1,
      });
      
      res.status(201).json({
        message: "Album created successfully",
        album: newAlbum
      });
    } catch (error) {
      console.error("Album upload error:", error);
      res.status(400).json({ 
        message: "Failed to create album",
        error: error instanceof z.ZodError ? error.errors : String(error)
      });
    }
  });

  // Upload a track with audio file
  app.post("/api/tracks/upload", audioUpload.single("audioFile"), async (req: Request, res: Response) => {
    try {
      const formData = req.body;
      const validatedData = uploadTrackSchema.parse(formData);
      
      // Process audio file if uploaded
      let audioFile = null;
      let duration = 0;
      
      if (req.file) {
        // Make sure the file exists
        const filePath = path.join(process.cwd(), "uploads", "audio", req.file.filename);
        if (fs.existsSync(filePath)) {
          audioFile = getFilePath(path.join("uploads", "audio", req.file.filename));
          console.log("Audio file saved at:", filePath);
          console.log("Audio file path:", audioFile);
          
          // Get audio duration
          duration = await getAudioDuration(filePath);
        } else {
          console.error("Audio file was not saved properly:", filePath);
          // If file upload failed, use default duration
          duration = Math.floor(Math.random() * 180) + 120; // Random 2-5 min
        }
      } else {
        // If no file was uploaded, we need some duration
        duration = Math.floor(Math.random() * 180) + 120; // Random 2-5 min
      }
      
      // Create the track
      const newTrack = await storage.createTrack({
        ...validatedData,
        duration,
        audioFile,
      });
      
      // Update album total duration
      const tracks = await storage.getTracksByAlbum(validatedData.albumId);
      const totalDuration = tracks.reduce((sum, track) => sum + track.duration, 0);
      
      await storage.updateAlbumDuration(validatedData.albumId, totalDuration);
      
      res.status(201).json({
        message: "Track uploaded successfully",
        track: newTrack
      });
    } catch (error) {
      console.error("Track upload error:", error);
      res.status(400).json({ 
        message: "Failed to upload track",
        error: error instanceof z.ZodError ? error.errors : String(error)
      });
    }
  });

  // Register as artist (requires authentication)
  app.post("/api/artists/register", isAuthenticated, imageUpload.single("image"), async (req: Request, res: Response) => {
    try {
      console.log("Artist registration body:", req.body);
      
      const formData = req.body;
      const validatedData = registerArtistSchema.parse(formData);
      
      // Process image if uploaded
      let image = null;
      if (req.file) {
        // Make sure the file exists
        const filePath = path.join(process.cwd(), "uploads", "images", req.file.filename);
        if (fs.existsSync(filePath)) {
          image = getFilePath(path.join("uploads", "images", req.file.filename));
          console.log("Artist image saved at:", filePath);
        } else {
          console.error("Artist image was not saved properly:", filePath);
        }
      }
      
      // Create the artist with user ID
      const userId = req.user!.id;
      const newArtist = await storage.createArtist({
        ...validatedData,
        image,
        userId,
      });
      
      res.status(201).json({
        message: "Artist registered successfully",
        artist: newArtist
      });
    } catch (error) {
      console.error("Artist registration error:", error);
      res.status(400).json({ 
        message: "Failed to register artist",
        error: error instanceof z.ZodError ? error.errors : String(error)
      });
    }
  });

  // Get user's artists
  app.get("/api/user/artists", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const artists = await storage.getArtistsByUser(userId);
      res.json(artists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user's artists" });
    }
  });

  // Get artists for dropdown lists
  app.get("/api/artists", async (req, res) => {
    try {
      const artists = await storage.getArtists();
      res.json(artists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  // Delete artist (admin only)
  app.delete("/api/artists/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number()
      });
      
      const { id } = idSchema.parse(req.params);
      await storage.deleteArtist(id);
      
      res.status(200).json({ message: "Artist deleted successfully" });
    } catch (error) {
      console.error("Error deleting artist:", error);
      res.status(500).json({ message: "Failed to delete artist" });
    }
  });

  // Delete album (admin only)
  app.delete("/api/albums/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const idSchema = z.object({
        id: z.coerce.number()
      });
      
      const { id } = idSchema.parse(req.params);
      await storage.deleteAlbum(id);
      
      res.status(200).json({ message: "Album deleted successfully" });
    } catch (error) {
      console.error("Error deleting album:", error);
      res.status(500).json({ message: "Failed to delete album" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
