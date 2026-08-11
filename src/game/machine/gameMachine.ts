import { assign, setup } from 'xstate';

import {
  BREAKER_ORDER,
  type BreakerId,
  type HotspotId,
  type LocationId,
} from '../domain/ids';
import {
  isFinalPacketOrderCorrect,
  isLockerCodeCorrect,
  type PacketId,
} from '../puzzles/storyPuzzles';

export type TerminalMenuId = 'system' | 'log' | 'audio' | 'security';
export type StoryStage =
  | 'inspect_logs'
  | 'unlock_locker'
  | 'reveal_no_adjacent_room'
  | 'inspect_audio'
  | 'analyze_voice'
  | 'transmit_packets'
  | 'ending'
  | 'completed';
export type ItemId = 'item_screwdriver' | 'item_staff_card' | 'item_floor_map';

export type GameEvent =
  | { type: 'GAME_STARTED' }
  | { type: 'PROGRESS_RESTORED' }
  | { type: 'DIALOGUE_ADVANCED' }
  | { type: 'VIEW_CHANGED'; locationId: LocationId }
  | { type: 'HOTSPOT_SELECTED'; hotspotId: HotspotId }
  | { type: 'BREAKER_TOGGLED'; breakerId: BreakerId }
  | { type: 'PUZZLE_CLOSED' }
  | { type: 'TERMINAL_MENU_SELECTED'; menuId: TerminalMenuId }
  | { type: 'LOGS_CONFIRMED' }
  | { type: 'LOCKER_SUBMITTED'; answer: string }
  | { type: 'FLOOR_MAP_INSPECTED'; source: 'inventory' | 'security' }
  | { type: 'PACKET_PLAYED'; packetId: PacketId }
  | { type: 'VOICE_ANALYSIS_STARTED' }
  | { type: 'FINAL_ORDER_SUBMITTED'; packetIds: string[] }
  | { type: 'TRANSMISSION_CONFIRMED' }
  | { type: 'ENDING_ADVANCED' }
  | { type: 'HINT_REQUESTED' }
  | { type: 'RETURNED_TO_TITLE' };

export type GameContext = {
  locationId: LocationId;
  selectedHotspotId: HotspotId | null;
  introLineIndex: number;
  breakerSequence: BreakerId[];
  breakerFailures: number;
  powerRestored: boolean;
  terminalMenuId: TerminalMenuId;
  storyStage: StoryStage;
  inventory: ItemId[];
  lockerFailures: number;
  inspectedMaps: ('inventory' | 'security')[];
  heardPackets: PacketId[];
  finalOrderReady: boolean;
  endingLineIndex: number;
  hintLevel: number;
};

const initialContext: GameContext = {
  locationId: 'location_north_wall',
  selectedHotspotId: null,
  introLineIndex: 0,
  breakerSequence: [],
  breakerFailures: 0,
  powerRestored: false,
  terminalMenuId: 'system',
  storyStage: 'inspect_logs',
  inventory: [],
  lockerFailures: 0,
  inspectedMaps: [],
  heardPackets: [],
  finalOrderReady: false,
  endingLineIndex: 0,
  hintLevel: 0,
};

export const gameMachine = setup({
  types: { context: {} as GameContext, events: {} as GameEvent },
  guards: {
    hasMoreIntro: ({ context }) => context.introLineIndex < 6,
    selectedBreaker: ({ event }) =>
      event.type === 'HOTSPOT_SELECTED' &&
      event.hotspotId === 'hotspot_breaker',
    correctFinalInput: ({ context, event }) =>
      event.type === 'BREAKER_TOGGLED' &&
      [...context.breakerSequence, event.breakerId].every(
        (id, index) => id === BREAKER_ORDER[index],
      ) &&
      context.breakerSequence.length + 1 === 4,
    incorrectInput: ({ context, event }) =>
      event.type === 'BREAKER_TOGGLED' &&
      event.breakerId !== BREAKER_ORDER[context.breakerSequence.length],
    correctLockerCode: ({ event }) =>
      event.type === 'LOCKER_SUBMITTED' && isLockerCodeCorrect(event.answer),
    secondMapInspected: ({ context, event }) =>
      event.type === 'FLOOR_MAP_INSPECTED' &&
      !context.inspectedMaps.includes(event.source) &&
      context.inspectedMaps.length === 1,
    packetFourPlayed: ({ event }) =>
      event.type === 'PACKET_PLAYED' && event.packetId === 'audio_packet_04',
    correctFinalOrder: ({ event }) =>
      event.type === 'FINAL_ORDER_SUBMITTED' &&
      isFinalPacketOrderCorrect(event.packetIds),
    transmissionReady: ({ context }) => context.finalOrderReady,
    endingHasMoreLines: ({ context }) => context.endingLineIndex < 5,
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
    resetSession: assign(() => ({ ...initialContext })),
    selectTerminalMenu: assign({
      terminalMenuId: ({ event }) =>
        event.type === 'TERMINAL_MENU_SELECTED' ? event.menuId : 'system',
    }),
    closeInspection: assign({ selectedHotspotId: null }),
    confirmLogs: assign({
      storyStage: 'unlock_locker',
      selectedHotspotId: null,
      hintLevel: 0,
    }),
    unlockLocker: assign({
      storyStage: 'reveal_no_adjacent_room',
      inventory: ['item_screwdriver', 'item_staff_card', 'item_floor_map'],
      selectedHotspotId: null,
      hintLevel: 0,
    }),
    failLocker: assign({
      lockerFailures: ({ context }) => context.lockerFailures + 1,
    }),
    inspectMap: assign({
      inspectedMaps: ({ context, event }) =>
        event.type === 'FLOOR_MAP_INSPECTED' &&
        !context.inspectedMaps.includes(event.source)
          ? [...context.inspectedMaps, event.source]
          : context.inspectedMaps,
    }),
    revealNoRoom: assign({
      storyStage: 'inspect_audio',
      inspectedMaps: ({ context, event }) =>
        event.type === 'FLOOR_MAP_INSPECTED'
          ? [...new Set([...context.inspectedMaps, event.source])]
          : context.inspectedMaps,
      terminalMenuId: 'audio',
      hintLevel: 0,
    }),
    hearPacket: assign({
      heardPackets: ({ context, event }) =>
        event.type === 'PACKET_PLAYED' &&
        !context.heardPackets.includes(event.packetId)
          ? [...context.heardPackets, event.packetId]
          : context.heardPackets,
    }),
    advanceToAnalysis: assign({
      storyStage: 'analyze_voice',
      selectedHotspotId: null,
      hintLevel: 0,
    }),
    completeAnalysis: assign({
      storyStage: 'transmit_packets',
      terminalMenuId: 'system',
      selectedHotspotId: 'hotspot_terminal',
      locationId: 'location_east_wall',
      hintLevel: 0,
    }),
    acceptFinalOrder: assign({ finalOrderReady: true }),
    rejectFinalOrder: assign({ finalOrderReady: false }),
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
            TERMINAL_MENU_SELECTED: { actions: 'selectTerminalMenu' },
            PUZZLE_CLOSED: { actions: 'closeInspection' },
            LOGS_CONFIRMED: { actions: 'confirmLogs' },
            LOCKER_SUBMITTED: [
              { guard: 'correctLockerCode', actions: 'unlockLocker' },
              { actions: 'failLocker' },
            ],
            FLOOR_MAP_INSPECTED: [
              { guard: 'secondMapInspected', actions: 'revealNoRoom' },
              { actions: 'inspectMap' },
            ],
            PACKET_PLAYED: [
              {
                guard: 'packetFourPlayed',
                actions: ['hearPacket', 'advanceToAnalysis'],
              },
              { actions: 'hearPacket' },
            ],
            VOICE_ANALYSIS_STARTED: { actions: 'completeAnalysis' },
            FINAL_ORDER_SUBMITTED: [
              { guard: 'correctFinalOrder', actions: 'acceptFinalOrder' },
              { actions: 'rejectFinalOrder' },
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
      on: { RETURNED_TO_TITLE: { target: 'title', actions: 'resetSession' } },
    },
  },
});
