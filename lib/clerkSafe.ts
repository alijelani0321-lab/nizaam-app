import {
  useAuth as clerkUseAuth,
  useUser as clerkUseUser,
  useClerk as clerkUseClerk,
} from "@clerk/expo";

const key = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const CLERK_ENABLED = !!key && !key.startsWith("REPLACE_WITH");

const OFFLINE_AUTH = {
  isLoaded: true, isSignedIn: true, userId: "offline_ali",
  sessionId: "offline_session", getToken: async () => null as string | null,
  signOut: async () => {},
};

const OFFLINE_USER = {
  isLoaded: true, isSignedIn: true,
  user: {
    id: "offline_ali", firstName: "Dukandar", lastName: "", fullName: "Dukandar",
    emailAddresses: [] as { emailAddress: string }[],
    primaryEmailAddress: null as { emailAddress: string } | null, imageUrl: "",
  },
};

export function useAuth(): any {
  try { if (!CLERK_ENABLED) return OFFLINE_AUTH; return clerkUseAuth(); }
  catch { return OFFLINE_AUTH; }
}

export function useUser(): any {
  try { if (!CLERK_ENABLED) return OFFLINE_USER; return clerkUseUser(); }
  catch { return OFFLINE_USER; }
}

export function useClerk(): any {
  try {
    if (!CLERK_ENABLED) return { signOut: async () => {}, openSignIn: () => {} };
    return clerkUseClerk();
  } catch { return { signOut: async () => {}, openSignIn: () => {} }; }
}
