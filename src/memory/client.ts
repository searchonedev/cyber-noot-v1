import { MemoryClient } from 'mem0ai';

// Throw error early if API key is missing
const apiKey = process.env.MEM0_API_KEY;
if (!apiKey) throw new Error('MEM0_API_KEY environment variable is required');

export const client = new MemoryClient({
    apiKey: apiKey,
});

// const msgTemplate = [{ role: "user", content: "CONTENT HERE" }, { role: "user", content: "CONTENT 2 HERE" }];
// const utcTimestamp = new Date().toISOString();

// // for mem0, we use "user_id" to categorize the type of knowledge we are adding.

// // THIS IS HOW WE ADD WORLD KNOWLEDGE TO NOOT'S MEMORY
// client.add(msgTemplate, { 
//     agent_id: "noot", 
//     user_id: "world_knowledge", 
//     metadata: { timestamp: utcTimestamp } 
// })
//     .then(response => console.log(response))
//     .catch(error => console.error(error));

// // THIS IS HOW WE ADD CRYPTO KNOWLEDGE TO NOOT'S MEMORY
// client.add(msgTemplate, { 
//     agent_id: "noot", 
//     user_id: "crypto_ecosystem_knowledge", 
//     metadata: { timestamp: utcTimestamp } 
// })
//     .then(response => console.log(response))
//     .catch(error => console.error(error));

// // THIS IS HOW WE ADD SELF KNOWLEDGE TO NOOT'S MEMORY
// client.add(msgTemplate, { 
//     agent_id: "noot", 
//     user_id: "noot_self", 
//     metadata: { timestamp: utcTimestamp } 
// })
//     .then(response => console.log(response))
//     .catch(error => console.error(error));

// /* User-specific knowledge storage strategy:
//  * - Stores memories about individual users while maintaining searchability
//  * - User ID from SUPABASE DB is stored in metadata for flexible querying:
//  *   1. Filter by specific user when needed
//  *   2. Search across all user interactions when no filter
//  */

// client.add(msgTemplate, { 
//     agent_id: "noot", 
//     user_id: "user_specific", 
//     metadata: { user_id: "user_id_from_supabase_db", timestamp: utcTimestamp } 
// })
//     .then(response => console.log(response))
//     .catch(error => console.error(error));

// // NOW FOR STORING MAIN TWEETS NOOT SENDS OUT
// client.add(msgTemplate, { 
//     agent_id: "noot", 
//     user_id: "main_tweets", 
//     metadata: { timestamp: utcTimestamp } 
// })

// // NOW FOR STORING IMAGE PROMPTS NOOT GENERATES
// client.add(msgTemplate, { 
//     agent_id: "noot", 
//     user_id: "image_prompts", 
//     metadata: { timestamp: utcTimestamp } 
// })