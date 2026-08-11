import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Channel, SportsEvent, Movie, Playlist } from '../types';
import {
  INITIAL_CHANNELS,
  INITIAL_EVENTS,
  INITIAL_MOVIES,
  INITIAL_PLAYLISTS
} from '../data/initialData';

// Initialize Firebase App
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

// Initialize Firestore with specific database ID if present
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Collection References
const channelsCol = collection(db, 'channels');
const eventsCol = collection(db, 'events');
const moviesCol = collection(db, 'movies');
const playlistsCol = collection(db, 'playlists');

// Realtime listeners
export function subscribeChannels(callback: (channels: Channel[]) => void) {
  return onSnapshot(
    channelsCol,
    (snapshot) => {
      const items: Channel[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || 'Channel',
          logo: data.logo || '',
          category: data.category || 'General',
          country: data.country || 'BD',
          url: data.url || '',
          servers: data.servers || []
        });
      });
      callback(items);
    },
    (err) => {
      console.warn('Firestore Channels snapshot error:', err);
    }
  );
}

export function subscribeEvents(callback: (events: SportsEvent[]) => void) {
  return onSnapshot(
    eventsCol,
    (snapshot) => {
      const items: SportsEvent[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          sport: data.sport || 'Cricket',
          status: data.status || 'Upcoming',
          tournament: data.tournament || 'Match',
          team1: data.team1 || { name: 'Team 1', logo: '' },
          team2: data.team2 || { name: 'Team 2', logo: '' },
          startTime: data.startTime || Date.now(),
          logo: data.logo || '',
          name: data.name || '',
          url: data.url || '',
          servers: data.servers || []
        });
      });
      callback(items);
    },
    (err) => {
      console.warn('Firestore Events snapshot error:', err);
    }
  );
}

export function subscribeMovies(callback: (movies: Movie[]) => void) {
  return onSnapshot(
    moviesCol,
    (snapshot) => {
      const items: Movie[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || 'Movie',
          category: data.category || 'Hollywood',
          poster: data.poster || '',
          rating: data.rating || '',
          year: data.year || '',
          quality: data.quality || 'HD',
          url: data.url || '',
          servers: data.servers || []
        });
      });
      callback(items);
    },
    (err) => {
      console.warn('Firestore Movies snapshot error:', err);
    }
  );
}

export function subscribePlaylists(callback: (playlists: Playlist[]) => void) {
  return onSnapshot(
    playlistsCol,
    (snapshot) => {
      const items: Playlist[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          name: data.name || 'Playlist',
          url: data.url || '',
          logo: data.logo || '',
          channelCount: data.channelCount || 0,
          description: data.description || ''
        });
      });
      callback(items);
    },
    (err) => {
      console.warn('Firestore Playlists snapshot error:', err);
    }
  );
}

// Add/Update/Delete Helpers

// Channels
export async function addFirestoreChannel(channel: Omit<Channel, 'id'>) {
  return await addDoc(channelsCol, channel);
}

export async function updateFirestoreChannel(id: string, channel: Partial<Channel>) {
  const docRef = doc(db, 'channels', id);
  return await updateDoc(docRef, channel);
}

export async function deleteFirestoreChannel(id: string) {
  const docRef = doc(db, 'channels', id);
  return await deleteDoc(docRef);
}

// Events
export async function addFirestoreEvent(event: Omit<SportsEvent, 'id'>) {
  return await addDoc(eventsCol, event);
}

export async function updateFirestoreEvent(id: string, event: Partial<SportsEvent>) {
  const docRef = doc(db, 'events', id);
  return await updateDoc(docRef, event);
}

export async function deleteFirestoreEvent(id: string) {
  const docRef = doc(db, 'events', id);
  return await deleteDoc(docRef);
}

// Movies
export async function addFirestoreMovie(movie: Omit<Movie, 'id'>) {
  return await addDoc(moviesCol, movie);
}

export async function deleteFirestoreMovie(id: string) {
  const docRef = doc(db, 'movies', id);
  return await deleteDoc(docRef);
}

// Playlists
export async function addFirestorePlaylist(playlist: Omit<Playlist, 'id'>) {
  return await addDoc(playlistsCol, playlist);
}

export async function deleteFirestorePlaylist(id: string) {
  const docRef = doc(db, 'playlists', id);
  return await deleteDoc(docRef);
}

// Seed initial default data into Firebase if database is empty
export async function seedInitialFirestoreData() {
  try {
    const channelsSnap = await getDocs(channelsCol);
    if (channelsSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_CHANNELS.forEach((ch) => {
        const newRef = doc(channelsCol);
        const { id, ...data } = ch;
        batch.set(newRef, data);
      });
      await batch.commit();
    }

    const eventsSnap = await getDocs(eventsCol);
    if (eventsSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_EVENTS.forEach((ev) => {
        const newRef = doc(eventsCol);
        const { id, ...data } = ev;
        batch.set(newRef, data);
      });
      await batch.commit();
    }

    const moviesSnap = await getDocs(moviesCol);
    if (moviesSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_MOVIES.forEach((mov) => {
        const newRef = doc(moviesCol);
        const { id, ...data } = mov;
        batch.set(newRef, data);
      });
      await batch.commit();
    }

    const playlistsSnap = await getDocs(playlistsCol);
    if (playlistsSnap.empty) {
      const batch = writeBatch(db);
      INITIAL_PLAYLISTS.forEach((pl) => {
        const newRef = doc(playlistsCol);
        const { id, ...data } = pl;
        batch.set(newRef, data);
      });
      await batch.commit();
    }

    return true;
  } catch (err) {
    console.error('Failed to seed initial Firestore data:', err);
    return false;
  }
}
