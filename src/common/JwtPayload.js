import { storage } from "./Common";

export function getpayLoadFromToken() {
    try {
        // Retrieve the JWT token from MMKV storage
        const jwtToken = storage.getString("token");

        // If no token is found, return an empty object
        if (!jwtToken) {
            console.warn('No token found in storage.');
            return {};
        }

        // Split the JWT token into its components (header, payload, signature)
        const tokenParts = jwtToken.split('.');

        // Ensure the token has three parts: header, payload, signature
        if (tokenParts.length !== 3) {
            console.error('Invalid JWT token format.');
            return {}; // Return empty object if the token is invalid
        }

        const base64Url = tokenParts[1]; // Get the payload part of the token

        // Decode Base64Url to Base64
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

        // Decode the Base64 string to JSON string (payload)
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        // Parse the decoded string into a JavaScript object
        const payload = JSON.parse(jsonPayload);

        return payload;  // Return the decoded payload
    } catch (error) {
        // Log any errors encountered during the process
        console.error('Error decoding token payload:', error);
        return {};  // Return an empty object in case of error
    }
}