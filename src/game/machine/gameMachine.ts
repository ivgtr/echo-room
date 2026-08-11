import { assign, setup } from 'xstate';

import type { HotspotId, LocationId } from '../domain/ids';
import {
  isPuzzleAnswerCorrect,
  puzzleIds,
  type PuzzleId,
} from '../puzzles/storyPuzzles';
import type { SavedProgress } from '../save/saveManager';
import { EMERGENCY_POWER_DURATION_MS } from '../time/emergencyPower';

export type TerminalMenuId = 'system' | 'log' | 'audio' | 'security';
export type StoryStage =
  | 'puzzle_carrier_sync'
  | 'puzzle_maintenance_lock'
  | 'puzzle_log_pairing'
  | 'puzzle_signal_route'
  | 'puzzle_packet_repair'
  | 'puzzle_temporal_anomaly'
  | 'puzzle_voiceprint_calibration'
  | 'puzzle_causal_script'
  | 'puzzle_transmission_window'
  | 'transmission_ready'
  | 'ending'
  | 'completed';
export type ItemId = 'item_screwdriver' | 'item_staff_card' | 'item_floor_map';

export const stagePuzzle: Partial<Record<StoryStage, PuzzleId>> = {
  puzzle_carrier_sync: 'puzzle_carrier_sync',
  puzzle_maintenance_lock: 'puzzle_maintenance_lock',
  puzzle_log_pairing: 'puzzle_log_pairing',
  puzzle_signal_route: 'puzzle_signal_route',
  puzzle_packet_repair: 'puzzle_packet_repair',
  puzzle_temporal_anomaly: 'puzzle_temporal_anomaly',
  puzzle_voiceprint_calibration: 'puzzle_voiceprint_calibration',
  puzzle_causal_script: 'puzzle_causal_script',
  puzzle_transmission_window: 'puzzle_transmission_window',
};

const nextStage: Record<PuzzleId, StoryStage> = {
  puzzle_power_route: 'puzzle_carrier_sync',
  puzzle_carrier_sync: 'puzzle_maintenance_lock',
  puzzle_maintenance_lock: 'puzzle_log_pairing',
  puzzle_log_pairing: 'puzzle_signal_route',
  puzzle_signal_route: 'puzzle_packet_repair',
  puzzle_packet_repair: 'puzzle_temporal_anomaly',
  puzzle_temporal_anomaly: 'puzzle_voiceprint_calibration',
  puzzle_voiceprint_calibration: 'puzzle_causal_script',
  puzzle_causal_script: 'puzzle_transmission_window',
  puzzle_transmission_window: 'transmission_ready',
};

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'PROGRESS_RESTORED'; progress: SavedProgress }
  | { type: 'ACTIVE_TIME_ELAPSED'; deltaMs: number }
  | { type: 'DIALOGUE_ADVANCED' }
  | { type: 'DIALOGUE_SKIPPED' }
  | { type: 'VIEW_CHANGED'; locationId: LocationId }
  | { type: 'HOTSPOT_SELECTED'; hotspotId: HotspotId }
  | {
      type: 'PUZZLE_SUBMITTED';
      puzzleId: PuzzleId;
      answer: string[];
    }
  | { type: 'PUZZLE_CLOSED' }
  | { type: 'TERMINAL_MENU_SELECTED'; menuId: TerminalMenuId }
  | { type: 'TRANSMISSION_CONFIRMED' }
  | { type: 'ENDING_ADVANCED' }
  | { type: 'HINT_REQUESTED' }
  | { type: 'RETURNED_TO_TITLE' };

export type GameContext = {
  locationId: LocationId;
  selectedHotspotId: HotspotId | null;
  introLineIndex: number;
  powerRestored: boolean;
  terminalMenuId: TerminalMenuId;
  storyStage: StoryStage;
  inventory: ItemId[];
  completedPuzzleIds: PuzzleId[];
  puzzleFailures: Record<PuzzleId, number>;
  endingLineIndex: number;
  hintLevel: number;
  activeElapsedMs: number;
  reservePower: boolean;
};

const emptyFailures = () =>
  Object.fromEntries(puzzleIds.map((id) => [id, 0])) as Record<
    PuzzleId,
    number
  >;

const initialContext: GameContext = {
  locationId: 'location_north_wall',
  selectedHotspotId: null,
  introLineIndex: 0,
  powerRestored: false,
  terminalMenuId: 'system',
  storyStage: 'puzzle_carrier_sync',
  inventory: [],
  completedPuzzleIds: [],
  puzzleFailures: emptyFailures(),
  endingLineIndex: 0,
  hintLevel: 0,
  activeElapsedMs: 0,
  reservePower: false,
};

export const gameMachine = setup({
  types: { context: {} as GameContext, events: {} as GameEvent },
  guards: {
    hasMoreIntro: ({ context }) => context.introLineIndex < 6,
    selectedBreaker: ({ event }) =>
      event.type === 'HOTSPOT_SELECTED' &&
      event.hotspotId === 'hotspot_breaker',
    correctPowerRoute: ({ event }) =>
      event.type === 'PUZZLE_SUBMITTED' &&
      event.puzzleId === 'puzzle_power_route' &&
      isPuzzleAnswerCorrect(event.puzzleId, event.answer),
    correctCurrentPuzzle: ({ context, event }) =>
      event.type === 'PUZZLE_SUBMITTED' &&
      stagePuzzle[context.storyStage] === event.puzzleId &&
      isPuzzleAnswerCorrect(event.puzzleId, event.answer),
    transmissionReady: ({ context }) =>
      context.storyStage === 'transmission_ready',
    endingHasMoreLines: ({ context }) => context.endingLineIndex < 5,
  },
  actions: {
    advanceIntro: assign({
      introLineIndex: ({ context }) => context.introLineIndex + 1,
    }),
    skipIntro: assign({ introLineIndex: 7 }),
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
    restorePower: assign({
      powerRestored: true,
      completedPuzzleIds: ['puzzle_power_route'],
      selectedHotspotId: null,
      locationId: 'location_east_wall',
      storyStage: 'puzzle_carrier_sync',
      terminalMenuId: 'system',
      hintLevel: 0,
    }),
    restoreProgress: assign({
      introLineIndex: 7,
      powerRestored: true,
      selectedHotspotId: null,
      locationId: ({ event }) =>
        event.type === 'PROGRESS_RESTORED'
          ? event.progress.locationId
          : 'location_east_wall',
      storyStage: ({ event }) =>
        event.type === 'PROGRESS_RESTORED'
          ? event.progress.storyStage
          : 'puzzle_carrier_sync',
      inventory: ({ event }) =>
        event.type === 'PROGRESS_RESTORED' ? event.progress.inventory : [],
      completedPuzzleIds: ({ event }) =>
        event.type === 'PROGRESS_RESTORED'
          ? event.progress.completedPuzzleIds
          : ['puzzle_power_route'],
      puzzleFailures: ({ event }) =>
        event.type === 'PROGRESS_RESTORED'
          ? event.progress.puzzleFailures
          : emptyFailures(),
      endingLineIndex: ({ event }) =>
        event.type === 'PROGRESS_RESTORED' ? event.progress.endingLineIndex : 0,
      hintLevel: ({ event }) =>
        event.type === 'PROGRESS_RESTORED' ? event.progress.hintLevel : 0,
      terminalMenuId: 'system',
      activeElapsedMs: ({ event }) =>
        event.type === 'PROGRESS_RESTORED' ? event.progress.activeElapsedMs : 0,
      reservePower: ({ event }) =>
        event.type === 'PROGRESS_RESTORED'
          ? event.progress.reservePower ||
            event.progress.activeElapsedMs >= EMERGENCY_POWER_DURATION_MS
          : false,
    }),
    advanceActiveTime: assign({
      activeElapsedMs: ({ context, event }) =>
        event.type === 'ACTIVE_TIME_ELAPSED'
          ? context.activeElapsedMs + Math.max(0, event.deltaMs)
          : context.activeElapsedMs,
      reservePower: ({ context, event }) =>
        event.type === 'ACTIVE_TIME_ELAPSED'
          ? context.reservePower ||
            context.activeElapsedMs + Math.max(0, event.deltaMs) >=
              EMERGENCY_POWER_DURATION_MS
          : context.reservePower,
    }),
    resetSession: assign(() => ({
      ...initialContext,
      puzzleFailures: emptyFailures(),
    })),
    selectTerminalMenu: assign({
      terminalMenuId: ({ event }) =>
        event.type === 'TERMINAL_MENU_SELECTED' ? event.menuId : 'system',
    }),
    closeInspection: assign({ selectedHotspotId: null }),
    failPuzzle: assign({
      puzzleFailures: ({ context, event }) => {
        if (event.type !== 'PUZZLE_SUBMITTED') return context.puzzleFailures;
        return {
          ...context.puzzleFailures,
          [event.puzzleId]: context.puzzleFailures[event.puzzleId] + 1,
        };
      },
    }),
    completePuzzle: assign({
      storyStage: ({ event }) =>
        event.type === 'PUZZLE_SUBMITTED'
          ? nextStage[event.puzzleId]
          : 'puzzle_carrier_sync',
      completedPuzzleIds: ({ context, event }) =>
        event.type === 'PUZZLE_SUBMITTED' &&
        !context.completedPuzzleIds.includes(event.puzzleId)
          ? [...context.completedPuzzleIds, event.puzzleId]
          : context.completedPuzzleIds,
      inventory: ({ context, event }) =>
        event.type === 'PUZZLE_SUBMITTED' &&
        event.puzzleId === 'puzzle_maintenance_lock'
          ? ['item_screwdriver', 'item_staff_card', 'item_floor_map']
          : context.inventory,
      selectedHotspotId: null,
      terminalMenuId: 'system',
      hintLevel: 0,
    }),
    beginEnding: assign({
      storyStage: 'ending',
      endingLineIndex: 0,
      selectedHotspotId: null,
      locationId: 'location_north_wall',
    }),
    advanceEnding: assign({
      endingLineIndex: ({ context }) => context.endingLineIndex + 1,
    }),
    completeEnding: assign({ storyStage: 'completed' }),
    revealHint: assign({
      hintLevel: ({ context }) => Math.min(3, context.hintLevel + 1),
    }),
  },
}).createMachine({
  id: 'echoRoom',
  initial: 'title',
  context: initialContext,
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
      on: {
        ACTIVE_TIME_ELAPSED: { actions: 'advanceActiveTime' },
        RETURNED_TO_TITLE: { target: 'title', actions: 'resetSession' },
      },
      initial: 'intro',
      states: {
        intro: {
          on: {
            DIALOGUE_SKIPPED: {
              target: 'exploring',
              actions: 'skipIntro',
            },
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
            PUZZLE_CLOSED: { actions: 'closeInspection' },
          },
        },
        breakerPuzzle: {
          on: {
            PUZZLE_SUBMITTED: [
              {
                guard: 'correctPowerRoute',
                target: 'powered',
                actions: 'restorePower',
              },
              { actions: 'failPuzzle' },
            ],
            PUZZLE_CLOSED: 'exploring',
          },
        },
        powered: {
          on: {
            VIEW_CHANGED: { actions: 'changeView' },
            HOTSPOT_SELECTED: { actions: 'selectHotspot' },
            TERMINAL_MENU_SELECTED: { actions: 'selectTerminalMenu' },
            PUZZLE_CLOSED: { actions: 'closeInspection' },
            PUZZLE_SUBMITTED: [
              { guard: 'correctCurrentPuzzle', actions: 'completePuzzle' },
              { actions: 'failPuzzle' },
            ],
            TRANSMISSION_CONFIRMED: {
              guard: 'transmissionReady',
              actions: 'beginEnding',
            },
            ENDING_ADVANCED: [
              { guard: 'endingHasMoreLines', actions: 'advanceEnding' },
              { actions: 'completeEnding' },
            ],
            HINT_REQUESTED: { actions: 'revealHint' },
          },
        },
      },
    },
  },
});
