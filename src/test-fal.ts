import { fal } from "@fal-ai/client";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.FAL_API_KEY;
console.log("=== FAL API Connection Test ===");
console.log("API Key:", API_KEY ? `${API_KEY.slice(0, 4)}...${API_KEY.slice(-4)}` : 'Missing');

if (!API_KEY) {
  console.error("Error: FAL_API_KEY is not set in environment");
  process.exit(1);
}

// Configure fal client with timeout
fal.config({
  credentials: API_KEY,
  requestTimeout: 30000 // 30 second timeout
});

async function testFal() {
  try {
    console.log("\nStarting image generation...");
    console.log("Using model: fal-ai/flux-lora");
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out after 30 seconds')), 30000);
    });

    // Create the FAL request promise
    const falPromise = fal.subscribe("fal-ai/flux-lora", {
      input: {
        prompt: "APU penguin, coding on a laptop",
        loras: [
          {
            path: "linkmarine007/nootnoot-apu-v1",
            scale: 1
          }
        ],
        image_size: "square_hd",
        num_images: 1,
        output_format: "jpeg",
        guidance_scale: 3.5,
        num_inference_steps: 28,
        enable_safety_checker: true
      },
      pollInterval: 1000, // Poll every second
      logs: true
    });
    
    // Race between the timeout and the actual request
    const result = await Promise.race([falPromise, timeoutPromise]);
    console.log("\nResult received:", JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("\nError occurred:");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    console.error("Full error:", error);
    process.exit(1);
  }
}

// Add process termination handler
process.on('SIGINT', () => {
  console.log('\nDetected Ctrl+C - Exiting...');
  process.exit(0);
});

testFal(); 