import { assign, setup } from 'xstate';

import {
  BREAKER_ORDER,
  type BreakerId,
  type HotspotId,
  type LocationId,
} from '../domain/ids';

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'PROGRESS_RESTORED' }
  | { type: 'DIALOGUE_ADVANCED' }
  | { type: 'VIEW_CHANGED'; locationId: LocationId }
  | { type: 'HOTSPOT_SELECTED'; hotspotId: HotspotId }
  | { type: 'BREAKER_TOGGLED'; breakerId: BreakerId }
  | { type: 'PUZZLE_CLOSED' }
  | { type: 'RETURNED_TO_TITLE' };

export type GameContext = {
  locationId: LocationId;
  selectedHotspotId: HotspotId | null;
  introLineIndex: number;
  breakerSequence: BreakerId[];
  breakerFailures: number;
  powerRestored: boolean;
};

const isCorrectFinalInput = ({
  context,
  event,
}: {
  context: GameContext;
  event: GameEvent;
}) =>
  event.type === 'BREAKER_TOGGLED' &&
  [...context.breakerSequence, event.breakerId].every(
    (breakerId, index) => breakerId === BREAKER_ORDER[index],
  ) &&
  context.breakerSequence.length + 1 === BREAKER_ORDER.length;

const isIncorrectInput = ({
  context,
  event,
}: {
  context: GameContext;
  event: GameEvent;
}) =>
  event.type === 'BREAKER_TOGGLED' &&
  event.breakerId !== BREAKER_ORDER[context.breakerSequence.length];

export const gameMachine = setup({
  types: {
    context: {} as GameContext,
    events: {} as GameEvent,
  },
  guards: {
    hasMoreIntro: ({ context }) => context.introLineIndex < 6,
    selectedBreaker: ({ event }) =>
      event.type === 'HOTSPOT_SELECTED' &&
      event.hotspotId === 'hotspot_breaker',
    correctFinalInput: isCorrectFinalInput,
    incorrectInput: isIncorrectInput,
  },
  actions: {
    advanceIntro: assign({
      introLineIndex: ({ context }) => context.introLineIndex + 1,
    }),
    changeView: assign({
      locationId: ({ event }) =>
        event.type === 'VIEW_CHANGED'
          ? event.locationId
          : 'location_north_wall',
      selectedHotspotId: null,
    }),
    selectHotspot: assign({
      selectedHotspotId: ({ event }) =>
        event.type === 'HOTSPOT_SELECTED' ? event.hotspotId : null,
    }),
    appendBreaker: assign({
      breakerSequence: ({ context, event }) =>
        event.type === 'BREAKER_TOGGLED'
          ? [...context.breakerSequence, event.breakerId]
          : context.breakerSequence,
    }),
    resetBreaker: assign({
      breakerSequence: [],
      breakerFailures: ({ context }) => context.breakerFailures + 1,
    }),
    restorePower: assign({
      breakerSequence: () => [...BREAKER_ORDER],
      powerRestored: true,
      selectedHotspotId: null,
      locationId: 'location_east_wall',
    }),
    restoreProgress: assign({
      introLineIndex: 7,
      breakerSequence: () => [...BREAKER_ORDER],
      powerRestored: true,
      selectedHotspotId: null,
      locationId: 'location_east_wall',
    }),
    resetSession: assign({
      locationId: 'location_north_wall',
      selectedHotspotId: null,
      introLineIndex: 0,
      breakerSequence: [],
      breakerFailures: 0,
      powerRestored: false,
    }),
  },
}).createMachine({
  id: 'echoRoom',
  initial: 'title',
  context: {
    locationId: 'location_north_wall',
    selectedHotspotId: null,
    introLineIndex: 0,
    breakerSequence: [],
    breakerFailures: 0,
    powerRestored: false,
  },
  states: {
    title: {
      on: {
        GAME_STARTED: 'playing.intro',
        PROGRESS_RESTORED: {
          target: 'playing.powered',
          actions: 'restoreProgress',
        },
      },
    },
    playing: {
      initial: 'intro',
      states: {
        intro: {
          on: {
            DIALOGUE_ADVANCED: [
              { guard: 'hasMoreIntro', actions: 'advanceIntro' },
              { target: 'exploring', actions: 'advanceIntro' },
            ],
          },
        },
        exploring: {
          on: {
            VIEW_CHANGED: { actions: 'changeView' },
            HOTSPOT_SELECTED: [
              { guard: 'selectedBreaker', target: 'breakerPuzzle' },
              { actions: 'selectHotspot' },
            ],
          },
        },
        breakerPuzzle: {
          on: {
            BREAKER_TOGGLED: [
              {
                guard: 'correctFinalInput',
                target: 'powered',
                actions: 'restorePower',
              },
              { guard: 'incorrectInput', actions: 'resetBreaker' },
              { actions: 'appendBreaker' },
            ],
            PUZZLE_CLOSED: 'exploring',
          },
        },
        powered: {
          on: {
            VIEW_CHANGED: { actions: 'changeView' },
            HOTSPOT_SELECTED: { actions: 'selectHotspot' },
          },
        },
      },
      on: {
        RETURNED_TO_TITLE: { target: 'title', actions: 'resetSession' },
      },
    },
  },
});
