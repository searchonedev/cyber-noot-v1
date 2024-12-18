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

// Configure fal client
fal.config({
  credentials: API_KEY
});

async function testFal() {
  try {
    console.log("\nStarting image generation...");
    console.log("Using model: fal-ai/flux-lora");
    
    const result = await fal.subscribe("fal-ai/flux-lora", {
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
      }
    });
    
    console.log("\nResult received:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\nError occurred:");
    console.error("Message:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
    console.error("Full error:", error);
  }
}

testFal(); 