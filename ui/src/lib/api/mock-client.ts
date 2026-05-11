import { ApplicationPacket, AppSettings, DashboardStats, JobListing, UserProfile } from '../../types';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase (replace with your actual console config values)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

class JobBotAPI {
  private get uid() {
    const user = auth.currentUser;
    if (!user) throw new Error("User must be logged in.");
    return user.uid;
  }

  async getProfile(): Promise<UserProfile | null> {
    const snap = await getDoc(doc(db, 'users', this.uid));
    return snap.exists() ? (snap.data().profile as UserProfile) : null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    await setDoc(doc(db, 'users', this.uid), { profile }, { merge: true });
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const packets = await this.getPackets();
    const userDoc = await getDoc(doc(db, 'users', this.uid));
    const credits = userDoc.exists() ? userDoc.data().credits : 0;

    return {
      profileCompletion: 100,
      activeSearches: packets.filter((p) => p.status !== 'submitted').length,
      topMatchCount: credits, // Temporarily showing credits here
      recentPackets: packets.slice(0, 5),
      momentumScore: packets.length * 10,
    };
  }

  async searchJobs(query?: string): Promise<JobListing[]> {
    const snap = await getDocs(collection(db, 'users', this.uid, 'jobs'));
    return snap.docs.map(d => d.data() as JobListing);
  }

  async getJob(id: string): Promise<JobListing | undefined> {
    const snap = await getDoc(doc(db, 'users', this.uid, 'jobs', id));
    return snap.exists() ? (snap.data() as JobListing) : undefined;
  }

  async getPackets(): Promise<ApplicationPacket[]> {
    const q = query(collection(db, 'users', this.uid, 'packets'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ApplicationPacket);
  }

  async getPacket(id: string): Promise<ApplicationPacket | undefined> {
    const snap = await getDoc(doc(db, 'users', this.uid, 'packets', id));
    return snap.exists() ? (snap.data() as ApplicationPacket) : undefined;
  }

  async generatePacket(jobId: string): Promise<ApplicationPacket> {
    const job = await this.getJob(jobId);
    if (!job) throw new Error("Job not found");

    const generateApplicationPacket = httpsCallable(functions, 'generateApplicationPacket');
    const response = await generateApplicationPacket({ 
      jobId, 
      jobTitle: job.title,
      companyName: job.company,
      description: job.description
    });
    return response.data as ApplicationPacket;
  }

  async updateApplication(id: string, patch: Partial<ApplicationPacket>): Promise<ApplicationPacket> {
    const ref = doc(db, 'users', this.uid, 'packets', id);
    await updateDoc(ref, patch);
    const snap = await getDoc(ref);
    return snap.data() as ApplicationPacket;
  }

  async getSettings(): Promise<AppSettings> {
    const snap = await getDoc(doc(db, 'users', this.uid));
    return snap.exists() && snap.data().settings 
      ? snap.data().settings 
      : { theme: 'dark', aiProvider: 'openai', modelName: 'gpt-4', apiUrl: '', demoMode: false } as AppSettings;
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    await setDoc(doc(db, 'users', this.uid), { settings }, { merge: true });
    return settings;
  }

  async resetWorkspace(): Promise<void> {
    // For SaaS, instead of deleting local data, we just sign the user out.
    await auth.signOut();
  }
}

export const api = new JobBotAPI();
