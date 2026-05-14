import type { ApplicationPacket, AppSettings, DashboardStats, JobListing, UserProfile } from '../../types';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, updateDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const WORKSPACE_API_URL =
  import.meta.env.VITE_JOBBOT_API_URL ??
  import.meta.env.VITE_JOB_BOT_API_URL ??
  'http://localhost:8787/api';

console.log("[DEBUG] Deployed Firebase Config:", firebaseConfig);

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
    return snap.exists() && snap.data().profile ? (snap.data().profile as UserProfile) : null;
  }

  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    await setDoc(doc(db, 'users', this.uid), { profile }, { merge: true });
    return profile;
  }

  async getSettings(): Promise<AppSettings> {
    const snap = await getDoc(doc(db, 'users', this.uid));
    return snap.exists() && snap.data().settings
      ? (snap.data().settings as AppSettings)
      : {
          theme: 'dark',
          aiProvider: 'OpenAI-compatible',
          modelName: 'gpt-5-mini',
          apiUrl: WORKSPACE_API_URL,
          demoMode: false,
        };
  }

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    await setDoc(doc(db, 'users', this.uid), { settings }, { merge: true });
    return settings;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const packets = await this.getApplications();
    const userDoc = await getDoc(doc(db, 'users', this.uid));
    const credits = userDoc.exists() ? userDoc.data().credits : 0;

    return {
      profileCompletion: 100,
      activeSearches: packets.filter((p) => p.status !== 'submitted').length,
      topMatchCount: packets.length, 
      recentPackets: packets.slice(0, 5),
      momentumScore: packets.length * 10,
      credits, // Added explicitly for the Dashboard
    };
  }

  async searchJobs(searchQuery?: string, resultLimit = 20, remoteOnly = false): Promise<JobListing[]> {
    try {
      // Fetch from a free remote jobs API to populate the feed
      const response = await fetch('https://www.arbeitnow.com/api/job-board-api');
      const data = await response.json();
      
      const jobs: JobListing[] = data.data.slice(0, resultLimit).map((job: any) => ({
        id: job.slug,
        title: job.title,
        company: job.company_name,
        location: job.location,
        postedAt: new Date(job.created_at * 1000).toISOString(),
        source: 'Arbeitnow',
        url: job.url,
        type: job.job_types?.join(', ') || 'Full-time',
        remote: job.remote ? 'remote' : 'onsite',
        description: job.description.replace(/<[^>]*>?/gm, ''), // Strip HTML
        score: {
          overall: Math.floor(Math.random() * 20) + 75, // Simulated score
          matchReasons: ['Profile keyword overlap detected'],
          missingKeywords: []
        }
      }));

      // Cache fetched jobs into Firestore so getJob() can access them later
      const batch = writeBatch(db);
      jobs.forEach(job => {
        const ref = doc(db, 'users', this.uid, 'jobs', job.id);
        batch.set(ref, job, { merge: true });
      });
      await batch.commit();

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
      }
      return jobs;
    } catch (err) {
      console.error("Job fetch failed, falling back to local Firestore cache", err);
      const snap = await getDocs(collection(db, 'users', this.uid, 'jobs'));
      return snap.docs.map(d => d.data() as JobListing);
    }
  }

  async getJob(id: string): Promise<JobListing | null> {
    const snap = await getDoc(doc(db, 'users', this.uid, 'jobs', id));
    return snap.exists() ? (snap.data() as JobListing) : null;
  }

  async getPackets(): Promise<ApplicationPacket[]> {
    const q = query(collection(db, 'users', this.uid, 'packets'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as ApplicationPacket);
  }

  async getPacket(id: string): Promise<ApplicationPacket | null> {
    const snap = await getDoc(doc(db, 'users', this.uid, 'packets', id));
    return snap.exists() ? (snap.data() as ApplicationPacket) : null;
  }

  // Aliases for compatibility with different parts of the UI
  async getApplications(): Promise<ApplicationPacket[]> {
    return this.getPackets();
  }

  async getApplication(id: string): Promise<ApplicationPacket | null> {
    return this.getPacket(id);
  }

  async createApplication(jobId: string): Promise<ApplicationPacket> {
    return this.generatePacket(jobId);
  }

  async generatePacket(jobId: string): Promise<ApplicationPacket> {
    const job = await this.getJob(jobId);
    if (!job) throw new Error("Job not found");

    try {
      const generateApplicationPacket = httpsCallable(functions, 'generateApplicationPacket');
      const response = await generateApplicationPacket({ 
        jobId, 
        jobTitle: job.title,
        companyName: job.company,
        description: job.description
      });
      return response.data as ApplicationPacket;
    } catch (error: any) {
      // Expose Cloud Function errors (like insufficient credits) cleanly
      throw new Error(error.message || "Failed to connect to AI generation service.");
    }
  }

  async updateApplication(id: string, updates: Partial<ApplicationPacket>): Promise<ApplicationPacket> {
    const ref = doc(db, 'users', this.uid, 'packets', id);
    await updateDoc(ref, updates);
    const snap = await getDoc(ref);
    return snap.data() as ApplicationPacket;
  }

  async deleteApplicationData(): Promise<void> {
    // Disabled for SaaS
  }

  async resetWorkspace(): Promise<void> {
    await auth.signOut();
  }

  async createCheckoutSession(priceId: string): Promise<string> {
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');
    const response = await createCheckout({ priceId, returnUrl: window.location.origin });
    return (response.data as any).url;
  }
}

export const api = new JobBotAPI();
