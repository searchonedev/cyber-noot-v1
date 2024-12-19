import dotenv from "dotenv";
import { Logger } from '../../utils/logger';

dotenv.config();

/**
 * Interface for GLIF API response
 */
interface GlifResponse {
  id: string;
  name: string;
  imageUrl: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  output: string;
  outputType: string;
  forkedFromId: string | null;
  featuredAt: string | null;
  userId: string;
  completedSpellRunCount: number;
  averageDuration: number;
  likeCount: number;
  commentCount: number;
  error?: string;
  user: {
    id: string;
    name: string;
    image: string;
    username: string;
  };
  spellTags: any[];
  spheres: any[];
  data: {
    nodes: Array<TextInputBlock | GPTBlock | ComfyBlock>;
  };
}

/**
 * Interface for TextInputBlock
 */
interface TextInputBlock {
  name: string;
  type: 'TextInputBlock';
  params: {
    label: string;
    value: string;
  };
}

/**
 * Interface for GPTBlock
 */
interface GPTBlock {
  name: string;
  type: 'GPTBlock';
  params: {
    model: string;
    prompt: string;
    jsonMode: boolean;
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
  };
}

/**
 * Interface for ComfyBlock
 */
interface ComfyBlock {
  name: string;
  type: 'ComfyBlock';
  params: {
    seed?: number | null;
    value: string;
  };
}

/**
 * Interface for MultipickBlock
 */
interface MultipickBlock {
  name: string;
  type: 'MultipickBlock';
  params: {
    label: string;
    value: string;
    options: string[];
    randomize: boolean;
  };
}

/**
 * Formats the prompt with the required trigger words and style
 * @param prompt - The base prompt (already validated to be 5-10 words)
 * @returns Formatted prompt with trigger words and style
 */
function formatPrompt(prompt: string): string {
  // Add essential style and trigger words
  return `$noot penguin, ${prompt}, $noot_blue_background`;
}

/**
 * Generates an image using GLIF API
 * @param prompt - The user's prompt for image generation
 * @returns Promise containing the generated image URL
 */
export async function generateWithGlif(prompt: string): Promise<string> {
  try {
    Logger.log("GLIF received raw prompt:", prompt);
    const formattedPrompt = formatPrompt(prompt);
    Logger.log("GLIF formatted prompt:", formattedPrompt);

    // Using the simple API endpoint with the model ID
    const response = await fetch('https://simple-api.glif.app', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GLIF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: "cm40lx0hk00498rzgt8xqkiqu",  // NOOTNOOT sandbox model ID
        inputs: {
          noot_style: "https://huggingface.co/linkmarine007/nootblue-v1/blob/main/nootblue-v1.safetensors",
          modelstr: "1",
          getting_noot_details: formattedPrompt,
          magicman_memetics: {
            model: "claude-3.5-sonnet",
            prompt: formattedPrompt,
            jsonMode: false,
            maxTokens: 200,
            temperature: 0.9,
            systemPrompt: `Your task is to enhance Prompt for a specific image generator that needs specific rules to be followed. You are given an input prompt for an image generator. And You are to process that input prompt into an improved version. Before enhancing the prompt, consider the principles of viral content creation, visual rhetoric, and memetic potential. Approach the task as if crafting a powerful visual meme (no cringe pls, just memes) that resonates with the target audience. Keep in mind concepts like cognitive ease, emotional contagion, and cultural touchstones to maximize the image's impact and shareability.

MAKE ME LAUGH!!

The lora you are enhancing prompts for is for an orange beaked penguin popularized by the claymation tv show Pingu. Add a short description of the penguin as "$noot_blue_background" at the very end of the prompt to reinforce the lora trigger.
The memes core ideas are centered around this cute character being contrasted (for example putting the penguin in situations in which we would not expect him to be), as well as playing on bitcoin and cryptocurrency themes and the messages always have a worplay on the word 'NOOT', or 'NOOT NOOT'.

This penguin meme is a direct memetic offspring of another meme in which a cute character is taken out of their normal environment and placed into an environment that they dont fit in in a way that exaggerates concepts into absurdity. This weirdness and dissociation is further enhanced by adding photocollage elements of different styles and noise / film grain. (add film grain or noise descriptions). the concepts communicated are often in stark contrast to the concepts the meme communicates secondarily. 

Themes featuring crypto, every day life and widely relatable experiences related to people in and adjescent to the crypto community.

The noot penguin meme is an analogue of the previously mentioned meme concept.
This is a crypto community meme so keep that in mind and make memes dank, deep fried, nostalgiacore, 4-chan degen autist adapted to the Noot Noot Pingu meme, 2024 humor, but no cringe unless the user really wants it.
Remember it is a cartoon style penguin and if not declared otherwise in the prompt shortly describe the penguin additionally at the end of the prompt as a "$noot_blue_background".

To not take the above things and integrate them verbatim into prompts. This just serves as context for the task. Ultimately the abstract concept of the user in the prompt itself is the focus and helping the user express his ideas.  

Rules for prompts for the image model you are writing prompts for:
1) The image generator prioritizes entities mentioned first in the prompt, so write the most important aspects of what you want to be seen in the image first.
2) The image generator has general text capabilities adding text onto objects or the image itself, but this requires the text prompt to be at the beginning of the prompt.
So write Text first, for example like this: At the top of image is the text "This is an example text" or On her coffee cup is the text "Latte", and at the end of the prompt describe the quality, color and font of the text mentioned above using a reference and by description.
3) Use literal descriptions. Imagine this is like you are describing an image to a blind person. Use concrete and concise descriptions, avoid too general abstractions. 
4) Use a maximum of 200 words in your prompt output.
5) The prompt you output has to match the emotional tone of what you want to convey with the image. For example talk like a pirate if you want to make a pirate themed image. Or talk aggressively if you want an image that is more aggressive.
6) Use Absolute spatial language. Example: Instead of "On the ride side of her" Use "On the right side of the image".
7) Write dynamic prompts. Do not make static images, always include atleast 2 weird things that are happening or interesting to look at.
8) Enhance the prompt by adding context relevant details about visual characteristics, composition, atmosphere, style, subject appearance, actions, facial expressions of characters, background, and perspective. 
9) Do not repeat specific content from the example prompts verbatim.
10) use supporting motifs to convey the message, enrich the context and environment with things that support the overall concept or emotion or message.

Workflow
1. Read the input prompt. Infer its intent and think of how to express that intent through an improved prompt. Focus on good aesthetic and artistic practices to create engaging and interesting images.
2. Pick the main emotions or concepts you want to highlight communicate from the original intent
3. Strategically use secondary image components like colors, objects, vibe, etc to communicate these concepts effectively.
5. Enhance this image with additional content that reinforces the commmunication (for example colors to enhance emotions, other expressions analog to the prior example, or more abstract reinforcement strategies)
6. Output the final prompt, as compact and concise as possible respecting all rules.
remember the rules above and keep the output under 200 words. Only output the enhanced prompt itself.
7.  remember "$noot" is the trigger token for the lora. use it mainly to trigger the penguin. if the input prompt doesnt change it indirectly or directly, add '$noot penguin' at the end of the prompt to make sure it doesnt anthropomorpize the character unnescesssarily unless the motif in the given input suggests otherwise`
          },
          width: "1024",
          height: "1024"
        }
      })
    });

    Logger.log("GLIF API request body:", {
      id: "cm40lx0hk00498rzgt8xqkiqu",
      inputs: {
        noot_style: "https://huggingface.co/linkmarine007/nootblue-v1/blob/main/nootblue-v1.safetensors",
        modelstr: "1",
        getting_noot_details: formattedPrompt,
        magicman_memetics: {
          model: "claude-3.5-sonnet",
          prompt: formattedPrompt,
          jsonMode: false,
          maxTokens: 200,
          temperature: 0.9
        },
        width: "1024",
        height: "1024"
      }
    });

    if (!response.ok) {
      throw new Error(`GLIF API error: ${response.statusText}`);
    }

    const data = await response.json() as GlifResponse;
    Logger.log("GLIF API response:", data);
    
    // The simple API returns the image URL directly in the output field
    if (data.error) {
      throw new Error(`GLIF API error: ${data.error}`);
    }
    
    return data.output;
  } catch (error) {
    Logger.log("Error generating image with GLIF:", error);
    throw error;
  }
} 