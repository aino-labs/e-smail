import { useAuthStore } from "../store/useAuthStore";
import { EMAIL_URL } from "./config";

const getCSRF = () => useAuthStore.getState().csrfToken;

export async function getEmailsTrash(offset: number) {
  try {
    const response = await fetch(
      `${EMAIL_URL}/emails/trash?limit=50&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch {
    return null;
  }
}

export async function trash(IDs: number[]) {
  try {
    const response = await fetch(`${EMAIL_URL}/emails/trash`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRF(),
      },
      credentials: "include",
      body: JSON.stringify({ ids: IDs }),
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function untrash(IDs: number[]) {
  try {
    const response = await fetch(`${EMAIL_URL}/emails/untrash`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRF(),
      },
      credentials: "include",
      body: JSON.stringify({ ids: IDs }),
    });

    if (response.ok) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
