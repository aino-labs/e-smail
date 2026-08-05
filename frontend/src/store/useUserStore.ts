import { create } from "zustand";
import { persist } from "zustand/middleware";
import { URLMINIO } from "../api/config";

interface UserState {
  name: string;
  surname: string;
  email: string;
  is_male: boolean;
  birthDay: string;
  birthMonth: string;
  birthYear: string;
  image_path: string;
  updatedAt: number | null;
  isProfileLoaded: boolean;

  setProfileData: (
    profileData: Partial<UserState> & { birthdate?: string },
  ) => void;
  setImagePath: (path: string) => void;
  clearProfile: () => void;
}

const initialState = {
  name: "",
  surname: "",
  email: "",
  is_male: true,
  birthDay: "",
  birthMonth: "",
  birthYear: "",
  image_path: "",
  updatedAt: null as number | null,
  isProfileLoaded: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfileData: (profileData) =>
        set((state) => {
          let { birthDay, birthMonth, birthYear } = state;

          // Handle ISO format ("2020-10-06T00:00:00Z")
          if (profileData.birthdate) {
            const [datePart] = profileData.birthdate.split("T"); // "2020-10-06"
            if (datePart) {
              const [year, month, day] = datePart.split("-");
              if (year && month && day) {
                birthYear = year;
                birthMonth = month;
                birthDay = day; // Use day.replace(/^0/, "") if you need unpadded numbers ("6" instead of "06")
              }
            }
          }

          // Omit raw `birthdate` from state payload
          const { birthdate, ...restProfileData } = profileData;

          return {
            ...state,
            ...restProfileData,
            birthDay: profileData.birthDay ?? birthDay,
            birthMonth: profileData.birthMonth ?? birthMonth,
            birthYear: profileData.birthYear ?? birthYear,
            isProfileLoaded: true,
          };
        }),
      setImagePath: (path) => set({ image_path: path, updatedAt: Date.now() }),
      clearProfile: () => set({ ...initialState }),
    }),
    {
      name: "user-profile",
    },
  ),
);

export const selectAvatarUrl = (state: UserState): string => {
  const { image_path, updatedAt } = state;

  if (image_path) {
    if (/^(https?:|data:|\/\/)/i.test(image_path)) {
      return image_path;
    }

    const cleanBase = (URLMINIO || "").replace(/\/$/, "");
    const cleanPath = image_path.replace(/^\//, "");
    const baseUrl = `${cleanBase}/${cleanPath}`;

    return updatedAt ? `${baseUrl}?t=${updatedAt}` : baseUrl;
  }

  return "/assets/svg/Avatar.svg";
};
