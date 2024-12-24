import { client } from "./client";

export async function wipeMemories() {
    await client.deleteAll({ agent_id: "noot" });
    console.log("Memories wiped");
}

wipeMemories();