import { supabase } from "../supabase";
import { getCurrentUser } from "./auth";
import { nanoid } from "nanoid";

export interface SharedListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  notes?: string;
  checked: boolean;
}

export interface SharedList {
  id: string;
  userId: string;
  name: string;
  items: SharedListItem[];
  shareId?: string;
  createdAt: string;
  updatedAt: string;
}

// Create a new shared list
export async function createSharedList(
  name: string,
  items: SharedListItem[],
): Promise<SharedList> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    const shareId = nanoid(10); // Generate a short, unique ID for sharing

    const { data, error } = await supabase
      .from("shared_lists")
      .insert([
        {
          name,
          items,
          share_id: shareId,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      throw new Error(`Failed to create shared list: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      items: data.items,
      shareId: data.share_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in createSharedList:", error);
    throw error;
  }
}

// Get a shared list by its share ID (public access)
export async function getSharedListByShareId(
  shareId: string,
): Promise<SharedList | null> {
  try {
    const { data, error } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("share_id", shareId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No list found with this share ID
        return null;
      }
      console.error("Supabase fetch error:", error);
      throw new Error(`Failed to fetch shared list: ${error.message}`);
    }

    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      items: data.items,
      shareId: data.share_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    console.error("Error in getSharedListByShareId:", error);
    throw error;
  }
}

// Update a shared list (only the items array)
export async function updateSharedList(
  shareId: string,
  items: SharedListItem[],
): Promise<void> {
  try {
    // Sanitize input to prevent XSS
    const sanitizedItems = items.map((item) => ({
      ...item,
      name: sanitizeInput(item.name),
      notes: item.notes ? sanitizeInput(item.notes) : undefined,
    }));

    const { error } = await supabase
      .from("shared_lists")
      .update({
        items: sanitizedItems,
        updated_at: new Date().toISOString(),
      })
      .eq("share_id", shareId);

    if (error) {
      console.error("Supabase update error:", error);
      throw new Error(`Failed to update shared list: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in updateSharedList:", error);
    throw error;
  }
}

// Delete a shared list
export async function deleteSharedList(id: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    const { error } = await supabase
      .from("shared_lists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase delete error:", error);
      throw new Error(`Failed to delete shared list: ${error.message}`);
    }
  } catch (error) {
    console.error("Error in deleteSharedList:", error);
    throw error;
  }
}

// Get all shared lists for the current user
export async function getUserSharedLists(): Promise<SharedList[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("User not authenticated");

  try {
    const { data, error } = await supabase
      .from("shared_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch error:", error);
      throw new Error(`Failed to fetch shared lists: ${error.message}`);
    }

    return data.map((item) => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      items: item.items,
      shareId: item.share_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (error) {
    console.error("Error in getUserSharedLists:", error);
    throw error;
  }
}

// Helper function to sanitize input and prevent XSS
function sanitizeInput(input: string): string {
  // Basic sanitization - replace HTML special characters
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
