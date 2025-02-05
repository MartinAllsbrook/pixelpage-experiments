import { Signal, useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

import { Grid, GridUpdate } from "../shared/types.ts";

import ColorPicker from "../components/ColorPicker.tsx";
import PixelGrid from "../components/PixelGrid.tsx";

// Apply game updates to the grid
function applyGameUpdates(signal: Signal<Grid>, updates: GridUpdate[]) {
  const grid = signal.value; // Get the current grid state from the signal

  for (const update of updates) { // Iterate over the updated tiles
    if (grid.versionstamps[update.index] >= update.versionstamp) continue; // If the update is outdated, skip it
    grid.tiles[update.index] = update.color; // Update the tile color
    grid.versionstamps[update.index] = update.versionstamp; // Update the versionstamp
  }

  signal.value = { ...grid }; // Update the signal with the new grid state
}

// Pixels component that renders the PixelGrid and ColorPicker components
export default function Pixels(props: { grid: Grid }) {
  const selected = useSignal(0); // Initialize the selected color to 0
  const grid = useSignal(props.grid); // ### Initialize the grid signal with a page prop coming from index.tsx - TODO - this needs some investigation ###

  useEffect(() => { // When the component is mounted
    const eventSource = new EventSource("/api/listen"); // Create a new EventSource to listen for updates
    eventSource.onmessage = (e) => { // When a message is received
      const updates: GridUpdate[] = JSON.parse(e.data); // Parse the updates
      applyGameUpdates(grid, updates); // Apply the updates to the grid
    };
    return () => eventSource.close(); // Close the EventSource when the component is unmounted
  }, []); // Run this effect only once

  async function updateGrid(index: number, color: string) { 
    const resp = await fetch("/api/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([index, color]),
    });
    if (!resp.ok) {
      console.error("Failed to update grid");
    }
    const versionstamp: string = await resp.json();
    const update = { index, color, versionstamp };
    applyGameUpdates(grid, [update]);
  }

  return (
    <div class="flex flex-col gap-4">
      <PixelGrid grid={grid} selected={selected} updateGrid={updateGrid} />
      <ColorPicker selected={selected} />
    </div>
  );
}
