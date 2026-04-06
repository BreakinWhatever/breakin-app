"use client";
import { createContext, useContext } from "react";
export type Lang = "en" | "fr";
export const LangContext = createContext<Lang>("en");
export const useLang = () => useContext(LangContext);
