import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, computed, signal } from "@angular/core";
import { Race, RaceService, RaceState } from "projects/backend-api/src/lib/race.service";
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
    const show = await firstValueFrom(this.showService.getCurrentShow());
    this.currentShow.set(show);
    if (show && show.id) {
      console.log(`Current Show:`, show);
      this.currentShowState.set(show.showState);
      this.currentRace.set(await firstValueFrom(this.raceService.getCurrentRace(show.id)));
    }
    const race = this.currentRace();
    if (race) {
      console.log(`Current Race:`, race);
      this.currentRaceState.set(race.raceState);
    }
  }

  async startCountdown() {
    const race = this.currentRace();
    const show = this.currentShow();
    if (show && race) {
      this.updateRaceAndShow(
        { ...race, raced: true, raceState: RaceState.WAITING_TO_RACE },
        { ...show, showState: ShowState.RACE },
        () => {
        },
        `Error Starting Race`,
      );
    }
  }

  async startRace() {
    const race = this.currentRace();
    const show = this.currentShow();
    if (show && race) {
      this.updateRaceAndShow(
        { ...race, raced: true, raceState: RaceState.RACING, raceStartedAt: new Date() },
        { ...show, showState: ShowState.RACE },
        () => {
        },
        `Error Starting Race`,
      );
    }
  }

  async finishRace() {
    const race = this.currentRace();
    const show = this.currentShow();
    if (show && race) {
      this.updateRaceAndShow(
        { ...race, raced: true, raceState: RaceState.RACED },
        { ...show, showState: ShowState.RACE_FINISHED },
        () => {
        },
        `Error Starting Race`,
      );
    }
  }

  stopRace() {
    const race = this.currentRace();
    const show = this.currentShow();
    if (show && race) {
      this.updateRaceAndShow(
        { ...race, raced: true, raceState: RaceState.LISTED },
        { ...show, showState: ShowState.BEFORE_RACE },
        () => {
        },
        `Error Stopping Race`,
      );
    }
  }

  skipRace() {
    const race = this.currentRace();
    const show = this.currentShow();
    if (show && race) {
      this.updateRaceAndShow(
        { ...race, raced: true, raceState: RaceState.CANCELED },
        { ...show, showState: ShowState.BEFORE_RACE },
        () => {
          this.getCurrentShowAndRace();
        },
        `Error Skipping Race`,
      );
    }
  }

  setRaceDone() {
    const race = this.currentRace();
    const show = this.currentShow();
    if (show && race) {
      this.updateRaceAndShow(
        { ...race, raced: true, raceState: RaceState.DONE },
        { ...show, showState: ShowState.BEFORE_RACE },
        () => {
          this.getCurrentShowAndRace();
        },
        `Error setting Race Done`,
      );
    }
  }

  getRandomStartWord(): string {
    // @TODO: Find Solution to generate Random Words for this!
    return "GO!";
  }

  private async updateRaceAndShow(
    race: Race,
    show: Show,
    successFunction: () => void,
    errorMessage: string) {
    await this.updateShow(
      show,
      () => {
      },
      errorMessage);
    await this.updateRace(
      race,
      successFunction,
      errorMessage);
  }

  private async updateShow(show: Show, successFunction: () => void, errorMessage: string) {
    await this.showService.updateShow(show).subscribe({
      next: () => {
        this.currentShow.set(show);
        this.currentShowState.set(show.showState);
        successFunction();
      },
      error: (error) => {
        this.snackBar.open(`${errorMessage}: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, announcementMessage: `Error`, panelClass: "error",
        });
      },
    });
  }

  private async updateRace(
    race: Race,
    successFunction: () => void,
    errorMessage: string) {
    await this.raceService.updateRace(race).subscribe({
      next: () => {
        this.currentRace.set(race);
        this.currentRaceState.set(race.raceState);
        successFunction();
      },
      error: (error) => {
        this.snackBar.open(`${errorMessage}: ${JSON.stringify(error)}`, "OK", {
          duration: 10000, announcementMessage: `Error`, panelClass: "error",
        });
      },
    });
  }
}
