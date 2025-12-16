import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68e82e0380ac6e4a26051c6f", 
  requiresAuth: true // Ensure authentication is required for all operations
});
