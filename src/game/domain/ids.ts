export const hotspotIds = ['hotspot_door'] as const;

export type HotspotId = (typeof hotspotIds)[number];

export const locationIds = ['location_north_wall'] as const;

export type LocationId = (typeof locationIds)[number];
