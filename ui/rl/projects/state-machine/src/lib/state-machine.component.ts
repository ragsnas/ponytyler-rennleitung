import { Component, OnDestroy, OnInit } from "@angular/core";
import { Race, RaceService, RaceState } from "projects/backend-api/src/lib/race.service";
import { Show, ShowService, ShowState } from "projects/backend-api/src/lib/show.service";
import { MqttBrokerMessage, MqttBrokerService } from "projects/mqtt-broker/src/lib/mqtt-broker.service";
import { firstValueFrom, Subscription } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";

const RACE_STATE_CHANGE_TOPIC = "RaceStateChange";
const SHOW_STATE_CHANGE_TOPIC = "ShowStateChange";

interface RaceStateChangeMessage {
  raceId: string;
  state: RaceState;
}

interface ShowStateChangeMessage {
  showId: string;
  state: ShowState;
}

@Component({
  selector: "lib-state-machine",
  templateUrl: "state-machine.component.html",
  providers: [MqttBrokerService],
})
export class StateMachineComponent implements OnInit, OnDestroy {

  public currentRace: Race | undefined;
  public currentRaceState: RaceState | undefined;
  public currentShow: Show | undefined;
  public currentShowState: ShowState | undefined;

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
      (message) => this.handleMqttMessage(message)
    );
    this.mqttBrokerService.connect(StateMachineComponent.brokerUrl());
  }

  ngOnDestroy(): void {
    this.mqttSubscription?.unsubscribe();
  }

  handleMqttMessage(message: MqttBrokerMessage): void {
    if (message.topic === RACE_STATE_CHANGE_TOPIC) {
      const raceStateChange: RaceStateChangeMessage = JSON.parse(message.payload);
      if (this.currentRace?.id && raceStateChange.raceId === this.currentRace.id) {
        this.reloadCurrentRace();
      }
    } else if (message.topic === SHOW_STATE_CHANGE_TOPIC) {
      const showStateChange: ShowStateChangeMessage = JSON.parse(message.payload);
      if (this.currentShow?.id && showStateChange.showId === this.currentShow.id) {
        this.reloadCurrentShow();
      }
    }
  }

  private async reloadCurrentRace() {
    this.currentRace = await firstValueFrom(this.raceService.getRace(this.currentRace?.id));
    this.currentRaceState = this.currentRace.raceState;
  }

  private async reloadCurrentShow() {
    this.currentShow = await firstValueFrom(this.showService.getShow(this.currentShow!.id!));
    this.currentShowState = this.currentShow.showState;
  }

  private static brokerUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.host}/mqtt-ws`;
  }

  async getCurrentShowAndRace() {
    console.log(`Loading current show / race`);
    this.currentShow = await firstValueFrom(this.showService.getCurrentShow());
    if (this.currentShow && this.currentShow.id) {
      console.log(`Current Show:`, this.currentShow);
      this.currentShowState = this.currentShow.showState;
      this.currentRace = await firstValueFrom(this.raceService.getCurrentRace(this.currentShow.id));
    }
    if (this.currentRace) {
      console.log(`Current Race:`, this.currentRace);
      this.currentRaceState = this.currentRace.raceState;
    }
  }

  async startCountdown() {
    if(this.currentShow && this.currentRace) {
      this.updateRaceAndShow(
        { ...this.currentRace, raced: true, raceState: RaceState.WAITING_TO_RACE },
        { ...this.currentShow, showState: ShowState.RACE },
        () => {},
        `Error Starting Race`
      );
    }
  }

  async startRace() {
    if(this.currentShow && this.currentRace) {
      this.updateRaceAndShow(
        { ...this.currentRace, raced: true, raceState: RaceState.RACING },
        { ...this.currentShow, showState: ShowState.RACE },
        () => {},
        `Error Starting Race`
      );
    }
  }

  async finishRace() {
    if(this.currentShow && this.currentRace) {
      this.updateRaceAndShow(
        { ...this.currentRace, raced: true, raceState: RaceState.RACED },
        { ...this.currentShow, showState: ShowState.RACE_FINISHED },
        () => {},
        `Error Starting Race`
      );
    }
  }

  stopRace() {
    if(this.currentShow && this.currentRace) {
      this.updateRaceAndShow(
        { ...this.currentRace, raced: true, raceState: RaceState.LISTED },
        { ...this.currentShow, showState: ShowState.BEFORE_RACE },
        () => {},
        `Error Stopping Race`,
      );
    }
  }

  skipRace() {
    if(this.currentShow && this.currentRace) {
      this.updateRaceAndShow(
        { ...this.currentRace, raced: true, raceState: RaceState.CANCELED },
        { ...this.currentShow, showState: ShowState.BEFORE_RACE },
        () => { this.getCurrentShowAndRace() },
        `Error Skipping Race`,
      );
    }
  }

  setRaceDone() {
    if(this.currentShow && this.currentRace) {
      this.updateRaceAndShow(
        { ...this.currentRace, raced: true, raceState: RaceState.DONE },
        { ...this.currentShow, showState: ShowState.BEFORE_RACE },
        () => { this.getCurrentShowAndRace() },
        `Error setting Race Done`,
      );
    }
  }

  getRandomStartWord(): string {
    // @TODO: Find Solution to generate Random Words for this!
    return 'GO!';
  }

  private async updateRaceAndShow(
    race: Race,
    show: Show,
    successFunction: () => void,
    errorMessage: string) {
    await this.updateShow(
      show,
      () => {},
      errorMessage);
    await this.updateRace(
      race,
      successFunction,
      errorMessage);
  }

  private async updateShow(show: Show, successFunction: () => void, errorMessage: string) {
    await this.showService.updateShow(show).subscribe({
      next: () => {
        this.currentShow = show;
        this.currentShowState = show.showState;
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
        this.currentRace = race;
        this.currentRaceState = race.raceState;
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
