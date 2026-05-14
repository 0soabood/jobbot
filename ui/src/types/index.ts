export type RoleType = 'Full-time' | 'Contract' | 'Part-time' | 'Freelance';
export type RemotePreference = 'remote' | 'hybrid' | 'onsite';
export type ApplicationStatus = 'draft' | 'reviewing' | 'submitted';

export interface JobScore {
  overall: number;
  matchReasons: string[];
  missingKeywords: string[];
}

export interface UserProfile {
  fullName: string;
  email: string;
  targetRoles: string[];
  skills: string[];
  bio: string;
  links: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  preferences: {
    remote: RemotePreference;
    locations: string[];
    minSalary?: number;
  };
  resumeText?: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  postedAt: string;
  source: string;
  url: string;
  type: RoleType;
  remote: RemotePreference;
  description: string;
  salary?: string;
  score: JobScore;
}

export interface ApplicationPacket {
  id: string;
  jobId: string;
  jobTitle: string;
  companyId: string;
  companyName: string;
  sourceUrl: string;
  status: ApplicationStatus;
  createdAt: string;
  lastEditedAt: string;
  content: {
    tailoredResumeNotes: string;
    coverLetter: string;
    applicationAnswers: { question: string; answer: string }[];
  };
  checklist: { id: string; label: string; completed: boolean }[];
}

export interface DashboardStats {
  profileCompletion: number;
  activeSearches: number;
  topMatchCount: number;
  recentPackets: ApplicationPacket[];
  momentumScore: number;
  credits?: number;
}

export interface AppSettings {
  aiProvider: string;
  modelName: string;
  apiUrl: string;
  demoMode: boolean;
  theme: 'dark' | 'light' | 'system';
}
