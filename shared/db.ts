import { Grid } from "./types.ts";
import { HEIGHT, WIDTH } from "./constants.ts";

const db = await Deno.openKv();

export async function updateGrid( index: number, color: string ): Promise<string> {
  const res = await db.set(["tiles", index], color); // Update the tile
  const bc = new BroadcastChannel("tiles"); // Open a broadcast channel
  bc.postMessage({ index, color, versionstamp: res.versionstamp }); // Send the updated tile to all clients
  setTimeout(() => bc.close(), 5); // Close the broadcast channel after 5ms
  return res.versionstamp; // Return the versionstamp of the updated tile
}

export async function getGrid(): Promise<Grid> {
  const tiles = new Array(WIDTH * HEIGHT).fill("#FFFFFF"); // Initialize the tiles array with white color
  const versionstamps = new Array(WIDTH * HEIGHT).fill(""); // Initialize the versionstamps array with empty strings
  for await (const entry of db.list<string>({ prefix: ["tiles"] })) { // Grab all the tiles from the database
    const index = entry.key[1] as number;
    tiles[index] = entry.value;
    versionstamps[index] = entry.versionstamp;
  }
  return { tiles, versionstamps }; // Return the tiles and versionstamps arrays
}
