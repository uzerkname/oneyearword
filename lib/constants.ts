import { Period } from "./types";

export const MIN_DAY = 1;
export const MAX_DAY = 365;

export const PERIODS: Period[] = [
  { name: "Early World", periodIndex: 0, startDay: 1, endDay: 5, playlistId: "PL0QzUlsjD3k3RQG9IqnQm2lL9BC4J859k" },
  { name: "Patriarchs", periodIndex: 1, startDay: 6, endDay: 26, playlistId: "PL0QzUlsjD3k0FGQKAKHkgvKhQYw-vDKtr" },
  { name: "Egypt and Exodus", periodIndex: 2, startDay: 27, endDay: 51, playlistId: "PL0QzUlsjD3k2bI9HhmVEz8k4G2KSCq3d9" },
  { name: "Desert Wanderings", periodIndex: 3, startDay: 52, endDay: 80, playlistId: "PL0QzUlsjD3k1lJqkMKOBmYD3TAwJ28FT-" },
  { name: "Conquest and Judges", periodIndex: 4, startDay: 81, endDay: 98, playlistId: "PL0QzUlsjD3k1Pb7S8s6H4DkATBek-Em2g" },
  { name: "Messianic Checkpoint — John", periodIndex: 5, startDay: 99, endDay: 105, playlistId: "PL0QzUlsjD3k3Ia2NLkKHjUPXhx8PixJ2T" },
  { name: "Royal Kingdom", periodIndex: 6, startDay: 106, endDay: 153, playlistId: "PL0QzUlsjD3k34WN4Jypigb9rhP78Z0yKG" },
  { name: "Messianic Checkpoint — Mark", periodIndex: 7, startDay: 154, endDay: 161, playlistId: "PL0QzUlsjD3k1ah_aTj2AgWBGUWrHSYMNk" },
  { name: "Divided Kingdom", periodIndex: 8, startDay: 162, endDay: 183, playlistId: "PL0QzUlsjD3k2VUhmfdISIKDmdvDfEKs-1" },
  { name: "Exile", periodIndex: 9, startDay: 184, endDay: 257, playlistId: "PL0QzUlsjD3k2n6-dEeafHLfRxzdUh4LG-" },
  { name: "Messianic Checkpoint — Matthew", periodIndex: 10, startDay: 258, endDay: 266, playlistId: "PL0QzUlsjD3k31tFaKokDhTWlrcJd1fGXu" },
  { name: "Return", periodIndex: 11, startDay: 267, endDay: 281, playlistId: "PL0QzUlsjD3k0ZcAJTyelxDrdiq_aYs0TV" },
  { name: "Maccabean Revolt", periodIndex: 12, startDay: 282, endDay: 312, playlistId: "PL0QzUlsjD3k3GoB3WSZbo6EC2fPimveCD" },
  { name: "Messianic Fulfillment — Luke", periodIndex: 13, startDay: 313, endDay: 321, playlistId: "PL0QzUlsjD3k23YSnSJFpkOuV20_616mVc" },
  { name: "The Church", periodIndex: 14, startDay: 322, endDay: 365, playlistId: "PL0QzUlsjD3k0apt5Zy0HfPUWfWdrCaD-u" },
];

export function getPeriodForDay(day: number): Period | undefined {
  return PERIODS.find((p) => day >= p.startDay && day <= p.endDay);
}
