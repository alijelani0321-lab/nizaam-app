import AsyncStorage from "@react-native-async-storage/async-storage";

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

const headers = {
  "Content-Type": "application/json",
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
};

export async function getBusinessId(): Promise<number> {
  const raw = await AsyncStorage.getItem("nizaam.businessId");
  return raw ? Number(raw) : 1;
}

export async function sbSelect<T = any>(pathQuery: string): Promise<T[]> {
  try {
    const res = await fetch(`${URL}/rest/v1/${pathQuery}`, { headers });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

export async function sbInsert(table: string, row: Record<string, unknown>): Promise<any | null> {
  try {
    const res = await fetch(`${URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=representation" },
      body: JSON.stringify(row),
    });
    if (!res.ok) return null;
    const arr = await res.json();
    return Array.isArray(arr) ? arr[0] : arr;
  } catch {
    return null;
  }
}

export async function sbUpdate(table: string, match: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${URL}/rest/v1/${table}?${match}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const rupees = (n: number | string | null | undefined): string =>
  "Rs " + Number(n || 0).toLocaleString("en-PK");
