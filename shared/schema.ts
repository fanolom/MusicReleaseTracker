import { pgTable, text, serial, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"), // "user" or "admin"
});

export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image"),
  userId: integer("user_id").references(() => users.id),
});

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  artistId: integer("artist_id").notNull().references(() => artists.id),
  coverImage: text("cover_image"),
  releaseDate: timestamp("release_date").notNull(),
  genreId: integer("genre_id").notNull().references(() => genres.id),
  totalDuration: integer("total_duration"),
  isNew: integer("is_new").default(0),
});

export const tracks = pgTable("tracks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  albumId: integer("album_id").notNull().references(() => albums.id),
  trackNumber: integer("track_number").notNull(),
  duration: integer("duration").notNull(), // duration in seconds
  audioFile: text("audio_file"),
});

export const relatedAlbums = pgTable("related_albums", {
  albumId: integer("album_id").notNull().references(() => albums.id),
  relatedAlbumId: integer("related_album_id").notNull().references(() => albums.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.albumId, t.relatedAlbumId] })
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export const insertArtistSchema = createInsertSchema(artists);
export const insertGenreSchema = createInsertSchema(genres);
export const insertAlbumSchema = createInsertSchema(albums).omit({ id: true });
export const insertTrackSchema = createInsertSchema(tracks).omit({ id: true });

// Form schemas with file upload validation
export const registerArtistSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  image: z.any().optional(),
});

export const uploadAlbumSchema = z.object({
  title: z.string().min(1, "Album title is required"),
  artistId: z.coerce.number().min(1, "Artist is required"),
  genreId: z.coerce.number().min(1, "Genre is required"),
  releaseDate: z.coerce.date(),
  coverImage: z.any().optional(),
  password: z.string().min(1, "Password is required for verification"),
});

export const uploadTrackSchema = z.object({
  title: z.string().min(1, "Track title is required"),
  albumId: z.coerce.number().min(1, "Album is required"),
  trackNumber: z.coerce.number().min(1, "Track number is required"),
  audioFile: z.any().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;
export type RegisterArtistForm = z.infer<typeof registerArtistSchema>;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albums.$inferSelect;
export type UploadAlbumForm = z.infer<typeof uploadAlbumSchema>;

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;
export type UploadTrackForm = z.infer<typeof uploadTrackSchema>;

// Extended types for frontend
export type AlbumWithDetails = Album & {
  artist: Artist;
  genre: Genre;
  tracks?: Track[];
  relatedAlbums?: AlbumWithDetails[];
};
