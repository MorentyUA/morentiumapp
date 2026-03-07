export const YOUTUBE_API_KEYS = [
    process.env.YOUTUBE_API_KEY || "AIzaSyCyKZ9GPZqfALXnHfJRZZZ3qOQzHSX51c4",
    "AIzaSyBjxnJ8k9BEq_swWGboAtaepgNIRlJoDM8",
    "AIzaSyA4jWPpuivAbx4lDPEjESDuVrrpld07G44"
];

// Simple in-memory tracker to start with the last known good key
let currentKeyIndex = 0;

/**
 * A robust fetch wrapper for YouTube Data API that automatically rotates through a pool of API keys if a quota error is encountered.
 * 
 * @param urlBuilder A function that takes an API key and returns the full URL to fetch
 * @returns The JSON response from the successful API request
 * @throws Error if all keys in the pool fail or a non-quota error occurs
 */
export async function fetchWithKeyRotation(urlBuilder: (apiKey: string) => string): Promise<any> {
    let attempts = 0;
    const maxAttempts = YOUTUBE_API_KEYS.length;
    let lastError: any = null;

    while (attempts < maxAttempts) {
        const apiKey = YOUTUBE_API_KEYS[currentKeyIndex];
        const url = urlBuilder(apiKey);

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Check if YouTube threw an error payload
            if (data.error) {
                const isQuotaError = data.error.errors?.some((e: any) => e.reason === 'quotaExceeded' || e.domain === 'youtube.quota');
                const isAuthError = response.status === 403 || response.status === 401; // Sometimes disabled API looks like auth error

                if (isQuotaError || (isAuthError && data.error.message.includes('has not been used'))) {
                    console.warn(`Key index ${currentKeyIndex} failed with quota/auth error. Rotating...`);
                    // Rotate to next key
                    currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
                    attempts++;
                    lastError = data.error;
                    continue; // Try next iteration
                } else {
                    // Non-quota error (e.g., bad request, invalid channel ID), throw immediately
                    return data; // Let the caller handle standard data.error payloads
                }
            }

            // Success, return the data
            return data;

        } catch (error) {
            console.error(`Network or parsing error with key index ${currentKeyIndex}:`, error);
            // On hard network errors, we might also want to rotate just in case
            currentKeyIndex = (currentKeyIndex + 1) % YOUTUBE_API_KEYS.length;
            attempts++;
            lastError = error;
        }
    }

    // If we exhausted all keys
    console.error("All YouTube API keys exhausted or failed.");
    return { error: { message: "Вичерпано ліміти запитів на всіх доступних серверах. Спробуйте пізніше." } };
}
