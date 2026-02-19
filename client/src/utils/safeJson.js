/**
 * Safely parse JSON from fetch response
 * @param {Response} response - Fetch response object
 * @returns {Promise<{data: any}>} Object with parsed data
 */
export async function safeJson(response) {
  try {
    const text = await response.text();
    if (!text) {
      return { data: null };
    }
    const data = JSON.parse(text);
    return { data };
  } catch (err) {
    console.error('Error parsing JSON response:', err);
    return { data: null };
  }
}
