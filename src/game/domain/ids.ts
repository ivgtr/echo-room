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
