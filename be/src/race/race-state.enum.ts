// Split out of race.controller.ts: race.service.ts also needs this enum, and
// having it live in the controller created a circular import between the
// two files that silently corrupted RaceController's DI metadata depending
// on which of the two modules happened to load first.
export enum RaceState {
  WAITING_FOR_OPPONENT = "WAITING_FOR_OPPONENT",
  CANCELED = "CANCELED",
  LISTED = "LISTED",
  WAITING_TO_RACE = "WAITING_TO_RACE",
  RACING = "RACING",
  RACED = "RACED",
  ERROR = "ERROR",
  VIDEO_PLAYING = "VIDEO_PLAYING",
  DONE = "DONE",
}
