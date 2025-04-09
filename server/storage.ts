import {
  users, type User, type InsertUser,
  artists, type Artist, type InsertArtist,
  genres, type Genre, type InsertGenre,
  albums, type Album, type InsertAlbum,
  tracks, type Track, type InsertTrack,
  relatedAlbums, type AlbumWithDetails
} from "@shared/schema";
import { db } from "./db";
import { and, eq, like, desc, asc, gte, SQL, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Delete operations for admin
  deleteArtist(id: number): Promise<void>;
  deleteAlbum(id: number): Promise<void>;

  // Artist operations
  getArtist(id: number): Promise<Artist | undefined>;
  getArtists(): Promise<Artist[]>;
  getArtistsByUser(userId: number): Promise<Artist[]>;
  createArtist(artist: InsertArtist): Promise<Artist>;

  // Genre operations
  getGenre(id: number): Promise<Genre | undefined>;
  getGenres(): Promise<Genre[]>;
  createGenre(genre: InsertGenre): Promise<Genre>;

  // Album operations
  getAlbum(id: number): Promise<Album | undefined>;
  getAlbums(options?: {
    genreId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    timeframe?: 'week' | 'month' | 'year';
  }): Promise<Album[]>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  getAlbumWithDetails(id: number): Promise<AlbumWithDetails | undefined>;
  getAlbumCount(options?: {
    genreId?: number;
    search?: string;
    timeframe?: 'week' | 'month' | 'year';
  }): Promise<number>;
  updateAlbumDuration(albumId: number, totalDuration: number): Promise<void>;

  // Track operations
  getTrack(id: number): Promise<Track | undefined>;
  getTracksByAlbum(albumId: number): Promise<Track[]>;
  createTrack(track: InsertTrack): Promise<Track>;

  // Related albums
  getRelatedAlbums(albumId: number): Promise<Album[]>;
  addRelatedAlbum(albumId: number, relatedAlbumId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private artists: Map<number, Artist>;
  private genres: Map<number, Genre>;
  private albums: Map<number, Album>;
  private tracks: Map<number, Track>;
  private albumRelations: Map<number, Set<number>>;
  
  private currentUserId: number;
  private currentArtistId: number;
  private currentGenreId: number;
  private currentAlbumId: number;
  private currentTrackId: number;

  constructor() {
    this.users = new Map();
    this.artists = new Map();
    this.genres = new Map();
    this.albums = new Map();
    this.tracks = new Map();
    this.albumRelations = new Map();
    
    this.currentUserId = 1;
    this.currentArtistId = 1;
    this.currentGenreId = 1;
    this.currentAlbumId = 1;
    this.currentTrackId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create genres
    const electronic = this.createGenre({ name: "Electronic" });
    const hiphop = this.createGenre({ name: "Hip Hop" });
    const jazz = this.createGenre({ name: "Jazz" });
    const rock = this.createGenre({ name: "Rock" });
    const indie = this.createGenre({ name: "Indie" });

    // Create artists
    const electronPulse = this.createArtist({ name: "Electron Pulse", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const lunaEcho = this.createArtist({ name: "Luna Echo", image: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const rhythmCollective = this.createArtist({ name: "Rhythm Collective", image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const saxotoneQuartet = this.createArtist({ name: "Saxotone Quartet", image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const amplifiedYouth = this.createArtist({ name: "Amplified Youth", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const synthwaveCollective = this.createArtist({ name: "Synthwave Collective", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const electricDreams = this.createArtist({ name: "Electric Dreams", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });
    const mountainFolk = this.createArtist({ name: "Mountain Folk", image: "https://images.unsplash.com/photo-1458560871784-56d23406c091?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400" });

    // Create albums
    const chromaticOdyssey = this.createAlbum({
      title: "Chromatic Odyssey",
      artistId: electronPulse.id,
      coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-05-15"),
      genreId: electronic.id,
      totalDuration: 2520, // 42 minutes
      isNew: 1
    });

    const midnightRain = this.createAlbum({
      title: "Midnight Rain",
      artistId: lunaEcho.id,
      coverImage: "https://images.unsplash.com/photo-1557672172-298e090bd0f1?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-04-28"),
      genreId: indie.id,
      totalDuration: 2220, // 37 minutes
      isNew: 0
    });

    const urbanEchoes = this.createAlbum({
      title: "Urban Echoes",
      artistId: rhythmCollective.id,
      coverImage: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-05-08"),
      genreId: hiphop.id,
      totalDuration: 2700, // 45 minutes
      isNew: 1
    });

    const harmonicConvergence = this.createAlbum({
      title: "Harmonic Convergence",
      artistId: saxotoneQuartet.id,
      coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-03-15"),
      genreId: jazz.id,
      totalDuration: 3000, // 50 minutes
      isNew: 0
    });

    const sonicRevolution = this.createAlbum({
      title: "Sonic Revolution",
      artistId: amplifiedYouth.id,
      coverImage: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-04-02"),
      genreId: rock.id,
      totalDuration: 2640, // 44 minutes
      isNew: 0
    });

    const digitalDreams = this.createAlbum({
      title: "Digital Dreams",
      artistId: synthwaveCollective.id,
      coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-05-01"),
      genreId: electronic.id,
      totalDuration: 2760, // 46 minutes
      isNew: 0
    });

    const neonNights = this.createAlbum({
      title: "Neon Nights",
      artistId: electricDreams.id,
      coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-04-12"),
      genreId: electronic.id,
      totalDuration: 2460, // 41 minutes
      isNew: 0
    });

    const acousticSessions = this.createAlbum({
      title: "Acoustic Sessions",
      artistId: mountainFolk.id,
      coverImage: "https://images.unsplash.com/photo-1458560871784-56d23406c091?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=400",
      releaseDate: new Date("2023-03-24"),
      genreId: indie.id,
      totalDuration: 2340, // 39 minutes
      isNew: 0
    });

    // Create tracks for Chromatic Odyssey
    this.createTrack({ title: "Digital Dawn", albumId: chromaticOdyssey.id, trackNumber: 1, duration: 225 }); // 3:45
    this.createTrack({ title: "Neon Cascade", albumId: chromaticOdyssey.id, trackNumber: 2, duration: 252 }); // 4:12
    this.createTrack({ title: "Quantum Pulse", albumId: chromaticOdyssey.id, trackNumber: 3, duration: 318 }); // 5:18
    this.createTrack({ title: "Synth Symphony", albumId: chromaticOdyssey.id, trackNumber: 4, duration: 362 }); // 6:02
    this.createTrack({ title: "Chromatic Revolution", albumId: chromaticOdyssey.id, trackNumber: 5, duration: 295 }); // 4:55
    this.createTrack({ title: "Electric Dreams", albumId: chromaticOdyssey.id, trackNumber: 6, duration: 336 }); // 5:36
    this.createTrack({ title: "Binary Sunset", albumId: chromaticOdyssey.id, trackNumber: 7, duration: 261 }); // 4:21
    this.createTrack({ title: "Digital Afterglow", albumId: chromaticOdyssey.id, trackNumber: 8, duration: 432 }); // 7:12
    
    // Create related albums
    this.addRelatedAlbum(chromaticOdyssey.id, digitalDreams.id);
    this.addRelatedAlbum(chromaticOdyssey.id, neonNights.id);
    this.addRelatedAlbum(midnightRain.id, acousticSessions.id);
    this.addRelatedAlbum(digitalDreams.id, neonNights.id);
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Artist operations
  async getArtist(id: number): Promise<Artist | undefined> {
    return this.artists.get(id);
  }

  async getArtists(): Promise<Artist[]> {
    return Array.from(this.artists.values());
  }
  
  async getArtistsByUser(userId: number): Promise<Artist[]> {
    return Array.from(this.artists.values()).filter(artist => artist.userId === userId);
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const id = this.currentArtistId++;
    const newArtist: Artist = { ...artist, id };
    this.artists.set(id, newArtist);
    return newArtist;
  }

  // Genre operations
  async getGenre(id: number): Promise<Genre | undefined> {
    return this.genres.get(id);
  }

  async getGenres(): Promise<Genre[]> {
    return Array.from(this.genres.values());
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    const id = this.currentGenreId++;
    const newGenre: Genre = { ...genre, id };
    this.genres.set(id, newGenre);
    return newGenre;
  }

  // Album operations
  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }

  async getAlbums(options: {
    genreId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    timeframe?: 'week' | 'month' | 'year';
  } = {}): Promise<Album[]> {
    let filteredAlbums = Array.from(this.albums.values());
    
    // Filter by genre
    if (options.genreId) {
      filteredAlbums = filteredAlbums.filter(album => album.genreId === options.genreId);
    }
    
    // Filter by search term
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filteredAlbums = filteredAlbums.filter(album => {
        const albumTitle = album.title.toLowerCase();
        const artist = this.artists.get(album.artistId);
        const artistName = artist ? artist.name.toLowerCase() : '';
        
        return albumTitle.includes(searchLower) || artistName.includes(searchLower);
      });
    }
    
    // Filter by timeframe
    if (options.timeframe) {
      const now = new Date();
      let startDate: Date;
      
      switch (options.timeframe) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filteredAlbums = filteredAlbums.filter(album => 
        album.releaseDate >= startDate && album.releaseDate <= now
      );
    }
    
    // Sort albums
    if (options.sortBy) {
      filteredAlbums.sort((a, b) => {
        let valueA: any;
        let valueB: any;
        
        switch (options.sortBy) {
          case 'title':
            valueA = a.title;
            valueB = b.title;
            break;
          case 'releaseDate':
            valueA = a.releaseDate;
            valueB = b.releaseDate;
            break;
          case 'artist':
            const artistA = this.artists.get(a.artistId);
            const artistB = this.artists.get(b.artistId);
            valueA = artistA ? artistA.name : '';
            valueB = artistB ? artistB.name : '';
            break;
          default:
            valueA = a.releaseDate;
            valueB = b.releaseDate;
        }
        
        if (options.sortOrder === 'asc') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    } else {
      // Default sort by release date (newest first)
      filteredAlbums.sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime());
    }
    
    // Apply pagination
    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      filteredAlbums = filteredAlbums.slice(offset, offset + options.limit);
    }
    
    return filteredAlbums;
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const id = this.currentAlbumId++;
    const newAlbum: Album = { ...album, id };
    this.albums.set(id, newAlbum);
    return newAlbum;
  }

  async getAlbumWithDetails(id: number): Promise<AlbumWithDetails | undefined> {
    const album = this.albums.get(id);
    if (!album) return undefined;
    
    const artist = this.artists.get(album.artistId);
    const genre = this.genres.get(album.genreId);
    
    if (!artist || !genre) return undefined;
    
    const tracks = await this.getTracksByAlbum(id);
    const relatedAlbumIds = this.albumRelations.get(id) || new Set();
    const relatedAlbums: AlbumWithDetails[] = [];
    
    for (const relatedId of relatedAlbumIds) {
      const relatedAlbum = this.albums.get(relatedId);
      if (relatedAlbum) {
        const relatedArtist = this.artists.get(relatedAlbum.artistId);
        const relatedGenre = this.genres.get(relatedAlbum.genreId);
        
        if (relatedArtist && relatedGenre) {
          relatedAlbums.push({
            ...relatedAlbum,
            artist: relatedArtist,
            genre: relatedGenre
          });
        }
      }
    }
    
    return {
      ...album,
      artist,
      genre,
      tracks,
      relatedAlbums
    };
  }

  async getAlbumCount(options: {
    genreId?: number;
    search?: string;
    timeframe?: 'week' | 'month' | 'year';
  } = {}): Promise<number> {
    const albums = await this.getAlbums(options);
    return albums.length;
  }

  // Track operations
  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async getTracksByAlbum(albumId: number): Promise<Track[]> {
    return Array.from(this.tracks.values())
      .filter(track => track.albumId === albumId)
      .sort((a, b) => a.trackNumber - b.trackNumber);
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const id = this.currentTrackId++;
    const newTrack: Track = { ...track, id };
    this.tracks.set(id, newTrack);
    return newTrack;
  }

  // Related albums
  async getRelatedAlbums(albumId: number): Promise<Album[]> {
    const relatedIds = this.albumRelations.get(albumId) || new Set();
    return Array.from(relatedIds)
      .map(id => this.albums.get(id))
      .filter((album): album is Album => album !== undefined);
  }

  async addRelatedAlbum(albumId: number, relatedAlbumId: number): Promise<void> {
    if (!this.albumRelations.has(albumId)) {
      this.albumRelations.set(albumId, new Set());
    }
    this.albumRelations.get(albumId)?.add(relatedAlbumId);
  }

  async updateAlbumDuration(albumId: number, totalDuration: number): Promise<void> {
    const album = this.albums.get(albumId);
    if (album) {
      this.albums.set(albumId, { ...album, totalDuration });
    }
  }
  
  // Delete operations for admin
  async deleteArtist(id: number): Promise<void> {
    // Get all albums by this artist
    const artistAlbums = Array.from(this.albums.values())
      .filter(album => album.artistId === id);
    
    // Delete all tracks from these albums
    for (const album of artistAlbums) {
      const tracks = Array.from(this.tracks.values())
        .filter(track => track.albumId === album.id);
      
      for (const track of tracks) {
        this.tracks.delete(track.id);
      }
      
      // Remove related album references
      if (this.albumRelations.has(album.id)) {
        this.albumRelations.delete(album.id);
      }
      
      // Remove this album from other album's relations
      for (const [relatedAlbumId, relatedSet] of this.albumRelations.entries()) {
        if (relatedSet.has(album.id)) {
          relatedSet.delete(album.id);
        }
      }
      
      // Delete the album
      this.albums.delete(album.id);
    }
    
    // Delete the artist
    this.artists.delete(id);
  }

  async deleteAlbum(id: number): Promise<void> {
    // Delete all tracks of this album
    const tracks = Array.from(this.tracks.values())
      .filter(track => track.albumId === id);
    
    for (const track of tracks) {
      this.tracks.delete(track.id);
    }
    
    // Remove album from relations
    if (this.albumRelations.has(id)) {
      this.albumRelations.delete(id);
    }
    
    // Remove this album from other album's relations
    for (const [relatedAlbumId, relatedSet] of this.albumRelations.entries()) {
      if (relatedSet.has(id)) {
        relatedSet.delete(id);
      }
    }
    
    // Delete the album
    this.albums.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Artist operations
  async getArtist(id: number): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist || undefined;
  }

  async getArtists(): Promise<Artist[]> {
    return db.select().from(artists);
  }
  
  async getArtistsByUser(userId: number): Promise<Artist[]> {
    return db.select().from(artists).where(eq(artists.userId, userId));
  }

  async createArtist(artist: InsertArtist): Promise<Artist> {
    const [newArtist] = await db
      .insert(artists)
      .values(artist)
      .returning();
    return newArtist;
  }

  // Genre operations
  async getGenre(id: number): Promise<Genre | undefined> {
    const [genre] = await db.select().from(genres).where(eq(genres.id, id));
    return genre || undefined;
  }

  async getGenres(): Promise<Genre[]> {
    return db.select().from(genres);
  }

  async createGenre(genre: InsertGenre): Promise<Genre> {
    const [newGenre] = await db
      .insert(genres)
      .values(genre)
      .returning();
    return newGenre;
  }

  // Album operations
  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album || undefined;
  }

  async getAlbums(options: {
    genreId?: number;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    timeframe?: 'week' | 'month' | 'year';
  } = {}): Promise<Album[]> {
    let query = db.select().from(albums);
    
    // Filter by genre
    if (options.genreId) {
      query = query.where(eq(albums.genreId, options.genreId));
    }
    
    // Filter by search term
    if (options.search) {
      query = query.where(
        sql`lower(${albums.title}) like ${`%${options.search.toLowerCase()}%`}`
      );
    }
    
    // Filter by timeframe
    if (options.timeframe) {
      const now = new Date();
      let startDate: Date;
      
      switch (options.timeframe) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default: // year
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      query = query.where(
        and(
          gte(albums.releaseDate, startDate),
          sql`${albums.releaseDate} <= ${now}`
        )
      );
    }
    
    // Sort albums
    if (options.sortBy && options.sortOrder) {
      const order = options.sortOrder === 'asc' ? asc : desc;
      
      switch (options.sortBy) {
        case 'title':
          query = query.orderBy(order(albums.title));
          break;
        case 'releaseDate':
          query = query.orderBy(order(albums.releaseDate));
          break;
        // For 'artist', we'd need a join, will handle separately
        default:
          query = query.orderBy(order(albums.releaseDate));
      }
    } else {
      // Default sort by release date (newest first)
      query = query.orderBy(desc(albums.releaseDate));
    }
    
    // Apply pagination
    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      query = query.limit(options.limit).offset(offset);
    }
    
    return await query;
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db
      .insert(albums)
      .values(album)
      .returning();
    return newAlbum;
  }

  async getAlbumWithDetails(id: number): Promise<AlbumWithDetails | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    if (!album) return undefined;
    
    const [artist] = await db.select().from(artists).where(eq(artists.id, album.artistId));
    const [genre] = await db.select().from(genres).where(eq(genres.id, album.genreId));
    
    if (!artist || !genre) return undefined;
    
    const albumTracks = await this.getTracksByAlbum(id);
    
    // Get related albums
    const relatedAlbumsResult = await db
      .select({
        albumId: relatedAlbums.relatedAlbumId,
      })
      .from(relatedAlbums)
      .where(eq(relatedAlbums.albumId, id));
    
    const relatedAlbumsDetails: AlbumWithDetails[] = [];
    
    for (const { albumId } of relatedAlbumsResult) {
      const [relatedAlbum] = await db.select().from(albums).where(eq(albums.id, albumId));
      if (relatedAlbum) {
        const [relatedArtist] = await db.select().from(artists).where(eq(artists.id, relatedAlbum.artistId));
        const [relatedGenre] = await db.select().from(genres).where(eq(genres.id, relatedAlbum.genreId));
        
        if (relatedArtist && relatedGenre) {
          relatedAlbumsDetails.push({
            ...relatedAlbum,
            artist: relatedArtist,
            genre: relatedGenre,
          });
        }
      }
    }
    
    return {
      ...album,
      artist,
      genre,
      tracks: albumTracks,
      relatedAlbums: relatedAlbumsDetails,
    };
  }

  async getAlbumCount(options: {
    genreId?: number;
    search?: string;
    timeframe?: 'week' | 'month' | 'year';
  } = {}): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(albums);
    
    // Filter by genre
    if (options.genreId) {
      query = query.where(eq(albums.genreId, options.genreId));
    }
    
    // Filter by search term
    if (options.search) {
      query = query.where(
        sql`lower(${albums.title}) like ${`%${options.search.toLowerCase()}%`}`
      );
    }
    
    // Filter by timeframe
    if (options.timeframe) {
      const now = new Date();
      let startDate: Date;
      
      switch (options.timeframe) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default: // year
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      query = query.where(
        and(
          gte(albums.releaseDate, startDate),
          sql`${albums.releaseDate} <= ${now}`
        )
      );
    }
    
    const result = await query;
    return result[0].count;
  }

  // Track operations
  async getTrack(id: number): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async getTracksByAlbum(albumId: number): Promise<Track[]> {
    return await db
      .select()
      .from(tracks)
      .where(eq(tracks.albumId, albumId))
      .orderBy(asc(tracks.trackNumber));
  }

  async createTrack(track: InsertTrack): Promise<Track> {
    const [newTrack] = await db
      .insert(tracks)
      .values(track)
      .returning();
    return newTrack;
  }

  // Related albums
  async getRelatedAlbums(albumId: number): Promise<Album[]> {
    const relatedIds = await db
      .select({
        relatedId: relatedAlbums.relatedAlbumId,
      })
      .from(relatedAlbums)
      .where(eq(relatedAlbums.albumId, albumId));
    
    if (relatedIds.length === 0) return [];
    
    const relatedAlbumsList: Album[] = [];
    
    for (const { relatedId } of relatedIds) {
      const [album] = await db.select().from(albums).where(eq(albums.id, relatedId));
      if (album) {
        relatedAlbumsList.push(album);
      }
    }
    
    return relatedAlbumsList;
  }

  async addRelatedAlbum(albumId: number, relatedAlbumId: number): Promise<void> {
    await db
      .insert(relatedAlbums)
      .values({
        albumId,
        relatedAlbumId,
      })
      .onConflictDoNothing();
  }

  async updateAlbumDuration(albumId: number, totalDuration: number): Promise<void> {
    await db
      .update(albums)
      .set({ totalDuration })
      .where(eq(albums.id, albumId));
  }
  
  // Delete operations for admin
  async deleteArtist(id: number): Promise<void> {
    // First, find all albums by this artist
    const artistAlbums = await db
      .select({ id: albums.id })
      .from(albums)
      .where(eq(albums.artistId, id));
    
    // Delete all albums by this artist
    for (const album of artistAlbums) {
      await this.deleteAlbum(album.id);
    }
    
    // Delete the artist
    await db
      .delete(artists)
      .where(eq(artists.id, id));
  }

  async deleteAlbum(id: number): Promise<void> {
    // Delete all tracks in this album
    await db
      .delete(tracks)
      .where(eq(tracks.albumId, id));
    
    // Delete all related album entries
    await db
      .delete(relatedAlbums)
      .where(eq(relatedAlbums.albumId, id));
    
    await db
      .delete(relatedAlbums)
      .where(eq(relatedAlbums.relatedAlbumId, id));
    
    // Delete the album
    await db
      .delete(albums)
      .where(eq(albums.id, id));
  }
}

// Use the DatabaseStorage instead of MemStorage now that we have a database
export const storage = new DatabaseStorage();
