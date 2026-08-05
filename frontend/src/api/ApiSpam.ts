import { getCSRFToken } from "./ApiAuth";
import { EMAIL_URL } from "./config";

export async function getEmailsSpam(offset: number) {
  try {
    const response = await fetch(
      `${EMAIL_URL}/emails/spam?limit=50&offset=${offset}`,
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

export async function sendSpam(IDs: number[]) {
  try {
    const response = await fetch(`${EMAIL_URL}/emails/spam`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRFToken(),
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

export async function unSpam(IDs: number[]) {
  try {
    const response = await fetch(`${EMAIL_URL}/emails/unspam`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCSRFToken(),
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
