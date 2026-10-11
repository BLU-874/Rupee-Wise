import { useState, useCallback } from "react";
import type { UserProfile } from "../types/finance";
import { loadProfile, saveProfile as persistProfile, clearProfile } from "../utils/storage";

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  userDisplayName: string;
  userInitials: string;
  handleSaveProfile: (updated: UserProfile) => void;
  handleResetProfile: () => void;
  handleCompleteOnboarding: (newProfile: UserProfile) => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    return loadProfile();
  });

  const handleSaveProfile = useCallback((updated: UserProfile) => {
    persistProfile(updated);
    setProfile(updated);
  }, []);

  const handleResetProfile = useCallback(() => {
    clearProfile();
    setProfile(null);
  }, []);

  const handleCompleteOnboarding = useCallback((newProfile: UserProfile) => {
    persistProfile(newProfile);
    setProfile(newProfile);
  }, []);

  const userDisplayName = profile?.fullName ? profile.fullName.trim() : "Member";

  const userInitials = profile?.fullName
    ? profile.fullName
        .trim()
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "RW";

  return {
    profile,
    userDisplayName,
    userInitials,
    handleSaveProfile,
    handleResetProfile,
    handleCompleteOnboarding,
  };
}
