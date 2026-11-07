"use client";

import { useSyncExternalStore } from "react";
import { getOwnerTokens } from "@/lib/ownerTokens";

// Per-device lists kept in localStorage (no accounts): bookmarked dishes and
// the reviewer name used last. A custom event keeps every component on the
// page in sync; the native "storage" event covers other tabs.
const SAVED_KEY = "savedRecommendations";
const NAME_KEY = "lastReviewerName";
const CHANGE_EVENT = "local-lists-change";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

// useSyncExternalStore needs a stable snapshot, so snapshots are the raw
// strings and parsing happens in the hooks.
const getSavedRaw = () => read(SAVED_KEY) ?? "[]";
const getNameRaw = () => read(NAME_KEY) ?? "";
const getOwnedRaw = () => Object.keys(getOwnerTokens()).join(",");

function parseIds(raw: string): number[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

export function useSavedIds(): number[] {
  const raw = useSyncExternalStore(subscribe, getSavedRaw, () => "[]");
  return parseIds(raw);
}

export function useOwnedIds(): number[] {
  const raw = useSyncExternalStore(subscribe, getOwnedRaw, () => "");
  return raw ? raw.split(",").map(Number).filter(Number.isInteger) : [];
}

export function useLastReviewerName(): string {
  return useSyncExternalStore(subscribe, getNameRaw, () => "");
}

export function toggleSaved(id: number) {
  const ids = parseIds(getSavedRaw());
  const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
  write(SAVED_KEY, JSON.stringify(next));
}

export function removeSaved(ids: number[]) {
  if (ids.length === 0) return;
  write(SAVED_KEY, JSON.stringify(parseIds(getSavedRaw()).filter((x) => !ids.includes(x))));
}

export function rememberReviewerName(name: string) {
  if (name.trim()) write(NAME_KEY, name.trim());
}
