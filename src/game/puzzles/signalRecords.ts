// The same recorded observations are used during investigation and after it.
// Pairing is derived from the visible signature, not a second answer table.
export const receiveRecords = [
  { id: 'r1', time: '02:11:04', signature: '短・長・短' },
  { id: 'r2', time: '02:14:32', signature: '長・短・短' },
  { id: 'r3', time: '02:17:18', signature: '短・短・長' },
] as const;

export const sourceRecords = [
  { id: 's-a', time: '02:37:18', signature: '短・短・長' },
  { id: 's-b', time: '02:31:04', signature: '短・長・短' },
  { id: 's-c', time: '02:34:32', signature: '長・短・短' },
] as const;

export const matchedRecords = receiveRecords.map((receive) => ({
  receive,
  source: sourceRecords.find(
    (source) => source.signature === receive.signature,
  )!,
}));
