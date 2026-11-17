import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, computed, signal } from "@angular/core";
import { Race, RaceAction, RaceService, RaceState } from "projects/backend-api/src/lib/race.service";
import { Show, ShowService, ShowState } from "projects/backend-api/src/lib/show.service";
import { MqttBrokerMessage, MqttBrokerService } from "projects/mqtt-broker/src/lib/mqtt-broker.service";
import { BikeData } from "projects/race-track/src/lib/race-track.component";
import { firstValueFrom, Subject, Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

const CIRCUMFERENCE_OF_CYLINDER_IN_MM = 110;
const FULL_250M_RACE_IN_PULSECOUNT = 250000 / CIRCUMFERENCE_OF_CYLINDER_IN_MM;
const BIKE_1_TOPIC = "Bike/1";
const BIKE_2_TOPIC = "Bike/2";
const RACE_STATE_CHANGE_TOPIC = "RaceStateChange";
const SHOW_STATE_CHANGE_TOPIC = "ShowStateChange";

interface RaceStateChangeMessage {
  raceId: string;
  state: RaceState;
}

interface BikeStateMessage {
  sequenz: number;
  pulsecount: number;
  timestamp: number;
}

interface ShowStateChangeMessage {
  showId: string;
  state: ShowState;
}

@Component({
    selector: "lib-state-machine",
    templateUrl: "state-machine.component.html",
    providers: [MqttBrokerService],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class StateMachineComponent implements OnInit, OnDestroy {

  public readonly currentRace = signal<Race | undefined>(undefined);
  public readonly currentRaceState = signal<RaceState | undefined>(undefined);
  public readonly currentShow = signal<Show | undefined>(undefined);
  public readonly currentShowState = signal<ShowState | undefined>(undefined);

  public readonly raceInProgress = computed(() => {
    const state = this.currentRaceState();
    return state === RaceState.RACING || state === RaceState.WAITING_TO_RACE;
  });
  public readonly videoDoneEnabled = computed(() => {
    const state = this.currentShowState();
    return state === ShowState.PLAYING_VIDEO || state === ShowState.VIDEO_FINISHED;
  });

  public bike1$: Subject<BikeData> = new Subject<BikeData>();
  public bike2$: Subject<BikeData> = new Subject<BikeData>();

  private mqttSubscription: Subscription | undefined;

  constructor(
    private raceService: RaceService,
    private showService: ShowService,
    private snackBar: MatSnackBar,
    private mqttBrokerService: MqttBrokerService,
  ) {
  }

  ngOnInit(): void {
    this.getCurrentShowAndRace();
    this.mqttSubscription = this.mqttBrokerService.messages$.subscribe(
      (message) => this.handleMqttMessage(message),
    );
    this.mqttBrokerService.connect(StateMachineComponent.brokerUrl());
  }

  ngOnDestroy(): void {
    this.mqttSubscription?.unsubscribe();
  }

  handleMqttMessage(message: MqttBrokerMessage): void {
    if (message.topic === RACE_STATE_CHANGE_TOPIC) {
      const raceStateChange: RaceStateChangeMessage = JSON.parse(message.payload);
      // ids arrive as numbers from the REST API but as strings in MQTT payloads
      const currentRaceId = this.currentRace()?.id;
      if (currentRaceId != null && String(raceStateChange.raceId) === String(currentRaceId)) {
        this.reloadCurrentRace();
      }
    } else if (message.topic === SHOW_STATE_CHANGE_TOPIC) {
      const showStateChange: ShowStateChangeMessage = JSON.parse(message.payload);
      const currentShowId = this.currentShow()?.id;
      if (currentShowId != null && String(showStateChange.showId) === String(currentShowId)) {
        this.reloadCurrentShow();
      }
    } else if (message.topic === BIKE_1_TOPIC) {
      this.bike1$.next(this.createBikeData(message));
    } else if (message.topic === BIKE_2_TOPIC) {
      this.bike2$.next(this.createBikeData(message))
    } else {
      console.log(`State Machine received unknown Topic: ${message.topic}`, message.payload);
    }
  }

  private createBikeData(message: MqttBrokerMessage): BikeData {
    const bikeStatus: BikeStateMessage = JSON.parse(message.payload);
    return {
      progressInMm: bikeStatus.pulsecount * CIRCUMFERENCE_OF_CYLINDER_IN_MM,
      progressInPercent: bikeStatus.pulsecount / FULL_250M_RACE_IN_PULSECOUNT,
      timeInSeconds: bikeStatus.timestamp / 1000,
      averageSpeedInKmh: (
        (bikeStatus.pulsecount * CIRCUMFERENCE_OF_CYLINDER_IN_MM) / 1000000
        /
        (bikeStatus.timestamp /1000/60/60)
      ),
    };
  }

  private async reloadCurrentRace() {
    const race = await firstValueFrom(this.raceService.getRace(this.currentRace()?.id));
    this.currentRace.set(race);
    this.currentRaceState.set(race.raceState);
  }

  private async reloadCurrentShow() {
    const show = await firstValueFrom(this.showService.getShow(this.currentShow()!.id!));
    this.currentShow.set(show);
    this.currentShowState.set(show.showState);
  }

  private static brokerUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/mqtt-ws`;
  }

  async getCurrentShowAndRace() {
    console.log(`Loading current show / race`);
    try {
      const show = await firstValueFrom(this.showService.getCurrentShow());
      this.currentShow.set(show);
      this.currentShowState.set(show.showState);
      const race = await firstValueFrom(this.raceService.getCurrentRace(show.id!));
      this.currentRace.set(race);
      this.currentRaceState.set(race?.raceState);
    } catch (error) {
      if ((error as { status?: number })?.status === 404) {
        // the backend answers 404 when no show is active
        this.currentShow.set(undefined);
        this.currentShowState.set(undefined);
        this.currentRace.set(undefined);
        this.currentRaceState.set(undefined);
        this.showError("There is no active show", error);
      } else {
        this.showError("Error loading the current show and race", error);
      }
    }
  }

  startCountdown() {
    this.runAction("countdown", "Error starting the countdown");
  }

  startRace() {
    this.runAction("start", "Error starting the race");
  }

  finishRace() {
    this.runAction("finish", "Error finishing the race");
  }

  stopRace() {
    this.runAction("stop", "Error stopping the race");
  }

  skipRace() {
    this.runAction("skip", "Error skipping the race", true);
  }

  /** The "lyrics" button: the winner was celebrated, on to the next race. */
  setRaceDone() {
    this.runAction("lyrics", "Error setting the race to done", true);
  }

  /** The "check" button: the video is over, on to the next race. */
  finishVideo() {
    this.runAction("video-done", "Error finishing the video", true);
  }

  getRandomStartWord(): string {
    // @TODO: Find Solution to generate Random Words for this!
    return "GO!";
  }

  /**
   * Asks the backend to apply the action to the current race. The backend
   * moves race and show together and only if the action fits the race's state
   * at that moment; what is shown afterwards is what it answers with.
   */
  private runAction(action: RaceAction, errorMessage: string, loadNextRace = false) {
    const race = this.currentRace();
    if (!race?.id) {
      return;
    }
    this.raceService.transition(race.id, action).subscribe({
      next: ({ race, show }) => {
        this.currentRace.set(race);
        this.currentRaceState.set(race.raceState);
        this.currentShow.set(show);
        this.currentShowState.set(show.showState);
        if (loadNextRace) {
          this.getCurrentShowAndRace();
        }
      },
      error: (error) => this.showError(errorMessage, error),
    });
  }

  private showError(message: string, error: unknown) {
    const reason = (error as { error?: { message?: string } })?.error?.message ?? JSON.stringify(error);
    this.snackBar.open(`${message}: ${reason}`, "OK", {
      duration: 10000, announcementMessage: `Error`, panelClass: "error",
    });
  }
}
