import { createActor } from 'xstate';
import { describe, expect, it } from 'vitest';

import { gameMachine } from '../../src/game/machine/gameMachine';
import { createPowerRestoredProgress } from '../../src/game/save/saveManager';

const poweredActor = () => {
  const actor = createActor(gameMachine).start();
  actor.send({
    type: 'PROGRESS_RESTORED',
    progress: createPowerRestoredProgress(),
  });
  return actor;
};

describe('full story progression', () => {
  it('rejects a wrong locker code and grants all items only for 0237', () => {
    const actor = poweredActor();
    actor.send({ type: 'LOGS_CONFIRMED' });
    actor.send({ type: 'LOCKER_SUBMITTED', answer: '0217' });
    expect(actor.getSnapshot().context.lockerFailures).toBe(1);
    expect(actor.getSnapshot().context.inventory).toEqual([]);
    actor.send({ type: 'LOCKER_SUBMITTED', answer: '0237' });
    expect(actor.getSnapshot().context.inventory).toEqual([
      'item_screwdriver',
      'item_staff_card',
      'item_floor_map',
    ]);
  });

  it('reaches the ending without allowing an incorrect final packet order', () => {
    const actor = poweredActor();
    actor.send({ type: 'LOGS_CONFIRMED' });
    actor.send({ type: 'LOCKER_SUBMITTED', answer: '0237' });
    actor.send({ type: 'FLOOR_MAP_INSPECTED', source: 'inventory' });
    actor.send({ type: 'FLOOR_MAP_INSPECTED', source: 'security' });
    expect(actor.getSnapshot().context.storyStage).toBe('inspect_audio');
    actor.send({ type: 'PACKET_PLAYED', packetId: 'audio_packet_04' });
    actor.send({ type: 'VOICE_ANALYSIS_STARTED' });
    actor.send({
      type: 'FINAL_ORDER_SUBMITTED',
      packetIds: [
        'audio_packet_04',
        'audio_packet_03',
        'audio_packet_02',
        'audio_packet_01',
      ],
    });
    actor.send({ type: 'TRANSMISSION_CONFIRMED' });
    expect(actor.getSnapshot().context.storyStage).toBe('transmit_packets');
    actor.send({
      type: 'FINAL_ORDER_SUBMITTED',
      packetIds: [
        'audio_packet_01',
        'audio_packet_02',
        'audio_packet_03',
        'audio_packet_04',
      ],
    });
    actor.send({ type: 'TRANSMISSION_CONFIRMED' });
    expect(actor.getSnapshot().context.storyStage).toBe('ending');
    for (let index = 0; index < 6; index += 1)
      actor.send({ type: 'ENDING_ADVANCED' });
    expect(actor.getSnapshot().context.storyStage).toBe('completed');
  });
});
