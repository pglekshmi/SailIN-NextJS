"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";

export type Profile = {
  name: string;
  age: string | number;
  level: string;
  interests: string[];
};

export type Questions = {
  questions: {
    question: string;
    options: string[];
    selectedOption: string;
    selectedText: string;
  }[];
};

type ProfileContextType = {
  profile: Profile;
  setProfile: Dispatch<SetStateAction<Profile>>;

  questions: Questions;
  setQuestions: Dispatch<SetStateAction<Questions>>;
};

const ProfileContext = createContext<ProfileContextType | null>(null);

const initialProfile: Profile = {
  name: "",
  age: "",
  level: "",
  interests: [],
};

const initialQuestions: Questions={
  questions:[
    {
      question: "",
      options: [],
      selectedOption:"",
      selectedText:"",
    }
  ]
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(initialProfile);

  const [questions, setQuestions] = useState<Questions>(initialQuestions);

  return (
    <ProfileContext.Provider value={{ profile, setProfile, questions, setQuestions }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error("useProfile must be used inside Provider");
  return context;
}