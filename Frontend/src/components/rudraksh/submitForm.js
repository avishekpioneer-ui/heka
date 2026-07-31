import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BACKEND_URI;

/**
 * Posts a landing-site form to the HekaOS backend.
 *
 * Replaces the Next.js `/api/submit` route from the design reference. Resolves
 * with the server payload for both success and validation failures — matching
 * the original `fetch` semantics — and only throws on a genuine network error
 * so callers can keep their two distinct error messages.
 */
export async function submitForm(payload) {
  try {
    const { data } = await axios.post(`${API_BASE_URL}/api/public/submissions`, payload);
    return data;
  } catch (error) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw error;
  }
}
