export const hotspotIds = [
  'hotspot_door',
  'hotspot_clock',
  'hotspot_intercom',
  'hotspot_terminal',
  'hotspot_analysis_panel',
  'hotspot_desk',
  'hotspot_breaker',
  'hotspot_locker',
] as const;
export type HotspotId = (typeof hotspotIds)[number];

export const locationIds = [
  'location_north_wall',
  'location_east_wall',
  'location_south_wall',
  'location_west_wall',
] as const;
export type LocationId = (typeof locationIds)[number];

export const breakerIds = [
  'breaker_1',
  'breaker_2',
  'breaker_3',
  'breaker_4',
] as const;
export type BreakerId = (typeof breakerIds)[number];

export const BREAKER_ORDER: readonly BreakerId[] = [
  'breaker_3',
  'breaker_1',
  'breaker_4',
  'breaker_2',
];
