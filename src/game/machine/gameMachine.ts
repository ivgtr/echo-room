import { assign, setup } from 'xstate';

import type { HotspotId, LocationId } from '../domain/ids';

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'HOTSPOT_SELECTED'; hotspotId: HotspotId }
  | { type: 'RETURNED_TO_TITLE' };

export type GameContext = {
  locationId: LocationId;
  selectedHotspotId: HotspotId | null;
};

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  actions: {
    selectHotspot: assign({
      selectedHotspotId: ({ event }) =>
        event.type === 'HOTSPOT_SELECTED' ? event.hotspotId : null,
    }),
    clearSelection: assign({ selectedHotspotId: null }),
  },
}).createMachine({
  id: 'echoRoom',
  initial: 'title',
  context: {
    locationId: 'location_north_wall',
    selectedHotspotId: null,
  },
  states: {
    title: {
      on: { GAME_STARTED: 'playing' },
    },
    playing: {
      initial: 'exploring',
      states: {
        exploring: {
          on: {
            HOTSPOT_SELECTED: { actions: 'selectHotspot' },
          },
        },
      },
      on: {
        RETURNED_TO_TITLE: { target: 'title', actions: 'clearSelection' },
      },
    },
  },
});
