import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, of } from 'rxjs';

import { StateMachineComponent } from './state-machine.component';
import { Race, RaceService, RaceState } from 'projects/backend-api/src/lib/race.service';
import { Show, ShowService, ShowState } from 'projects/backend-api/src/lib/show.service';
import { MqttBrokerMessage, MqttBrokerService } from 'projects/mqtt-broker/src/lib/mqtt-broker.service';

describe('StateMachineComponent', () => {
  let component: StateMachineComponent;
  let fixture: ComponentFixture<StateMachineComponent>;
  let raceService: jasmine.SpyObj<RaceService>;
  let showService: jasmine.SpyObj<ShowService>;
  let mqttBrokerService: jasmine.SpyObj<MqttBrokerService>;
  let messages$: Subject<MqttBrokerMessage>;

  const currentShow: Show = { id: 'show-1', name: 'Test Show', date: new Date() };
  const currentRace: Race = { id: 'race-1', showId: 'show-1', person1: 'A', person2: 'B', orderNumber: '0', bikeWon: 0, raceState: RaceState.RACING };

  beforeEach(async () => {
    showService = jasmine.createSpyObj('ShowService', ['getCurrentShow', 'getShow', 'updateShow']);
    showService.getCurrentShow.and.returnValue(of(currentShow));

    raceService = jasmine.createSpyObj('RaceService', ['getCurrentRace', 'getRace', 'updateRace']);
    raceService.getCurrentRace.and.returnValue(of(currentRace));

    messages$ = new Subject<MqttBrokerMessage>();
    mqttBrokerService = jasmine.createSpyObj('MqttBrokerService', ['connect'], {
      connected$: new Subject<boolean>(),
      messages$,
    });

    await TestBed.configureTestingModule({
      declarations: [StateMachineComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: RaceService, useValue: raceService },
        { provide: ShowService, useValue: showService },
        { provide: MatSnackBar, useValue: jasmine.createSpyObj('MatSnackBar', ['open']) },
      ],
    })
      .overrideComponent(StateMachineComponent, {
        set: { providers: [{ provide: MqttBrokerService, useValue: mqttBrokerService }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StateMachineComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('connects to the mqtt broker on init', () => {
    fixture.detectChanges();
    expect(mqttBrokerService.connect).toHaveBeenCalled();
  });

  it('reloads the current race when a RaceStateChange message matches the current race id', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const reloadedRace: Race = { ...currentRace, raceState: RaceState.RACED };
    raceService.getRace.and.returnValue(of(reloadedRace));

    messages$.next({
      topic: 'RaceStateChange',
      payload: JSON.stringify({ raceId: 'race-1', state: RaceState.RACED }),
      receivedAt: new Date(),
    });
    await fixture.whenStable();

    expect(raceService.getRace).toHaveBeenCalledWith('race-1');
    expect(component.currentRace()).toEqual(reloadedRace);
    expect(component.currentRaceState()).toEqual(RaceState.RACED);
  });

  it('reloads the current race when the backend returns a numeric id but the message carries it as string', async () => {
    const numericIdRace = { ...currentRace, id: 60 as unknown as string };
    component.currentRace.set(numericIdRace);
    fixture.detectChanges();
    await fixture.whenStable();
    component.currentRace.set(numericIdRace);

    const reloadedRace: Race = { ...numericIdRace, raceState: RaceState.RACED };
    raceService.getRace.and.returnValue(of(reloadedRace));

    messages$.next({
      topic: 'RaceStateChange',
      payload: JSON.stringify({ raceId: '60', state: RaceState.RACED }),
      receivedAt: new Date(),
    });
    await fixture.whenStable();

    expect(raceService.getRace).toHaveBeenCalled();
    expect(component.currentRaceState()).toEqual(RaceState.RACED);
  });

  it('does not reload when the RaceStateChange message is for a different race', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    messages$.next({
      topic: 'RaceStateChange',
      payload: JSON.stringify({ raceId: 'some-other-race', state: RaceState.RACED }),
      receivedAt: new Date(),
    });

    expect(raceService.getRace).not.toHaveBeenCalled();
    expect(component.currentRace()).toEqual(currentRace);
  });

  it('ignores messages on unrelated topics', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    messages$.next({
      topic: 'Bike/1',
      payload: JSON.stringify({ raceId: 'race-1' }),
      receivedAt: new Date(),
    });

    expect(raceService.getRace).not.toHaveBeenCalled();
  });

  it('reloads the current show when a ShowStateChange message matches the current show id', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    const reloadedShow: Show = { ...currentShow, showState: ShowState.RACE };
    showService.getShow.and.returnValue(of(reloadedShow));

    messages$.next({
      topic: 'ShowStateChange',
      payload: JSON.stringify({ showId: 'show-1', state: ShowState.RACE }),
      receivedAt: new Date(),
    });
    await fixture.whenStable();

    expect(showService.getShow).toHaveBeenCalledWith('show-1');
    expect(component.currentShow()).toEqual(reloadedShow);
    expect(component.currentShowState()).toEqual(ShowState.RACE);
  });

  it('does not reload when the ShowStateChange message is for a different show', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    messages$.next({
      topic: 'ShowStateChange',
      payload: JSON.stringify({ showId: 'some-other-show', state: ShowState.RACE }),
      receivedAt: new Date(),
    });

    expect(showService.getShow).not.toHaveBeenCalled();
    expect(component.currentShow()).toEqual(currentShow);
  });

  describe('control buttons', () => {
    const START = 0;
    const STOP = 2;
    const RACE_DONE = 3;
    const VIDEO_DONE = 4;

    async function render(raceState: RaceState | undefined, showState: ShowState | undefined) {
      fixture.detectChanges();
      await fixture.whenStable();
      component.currentRaceState.set(raceState);
      component.currentShowState.set(showState);
      fixture.detectChanges();
      return Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));
    }

    it('enables start and disables stop while no race is running', async () => {
      const buttons = await render(RaceState.LISTED, ShowState.BEFORE_RACE);

      expect(buttons[START].disabled).toBeFalse();
      expect(buttons[STOP].disabled).toBeTrue();
    });

    for (const raceState of [RaceState.RACING, RaceState.WAITING_TO_RACE]) {
      it(`disables start and enables stop while the race is ${raceState}`, async () => {
        const buttons = await render(raceState, ShowState.RACE);

        expect(buttons[START].disabled).toBeTrue();
        expect(buttons[STOP].disabled).toBeFalse();
      });
    }

    it('enables start and disables stop when there is no race state', async () => {
      const buttons = await render(undefined, undefined);

      expect(buttons[START].disabled).toBeFalse();
      expect(buttons[STOP].disabled).toBeTrue();
    });

    it('enables the race-done button only when the show state is RACE_FINISHED', async () => {
      expect((await render(RaceState.RACED, ShowState.RACE_FINISHED))[RACE_DONE].disabled).toBeFalse();
      expect((await render(RaceState.RACED, ShowState.RACE))[RACE_DONE].disabled).toBeTrue();
    });

    for (const showState of [ShowState.PLAYING_VIDEO, ShowState.VIDEO_FINISHED]) {
      it(`enables the video-done button while the show state is ${showState}`, async () => {
        expect((await render(RaceState.DONE, showState))[VIDEO_DONE].disabled).toBeFalse();
      });
    }

    it('disables the video-done button for other show states', async () => {
      expect((await render(RaceState.DONE, ShowState.BEFORE_RACE))[VIDEO_DONE].disabled).toBeTrue();
      expect((await render(RaceState.DONE, undefined))[VIDEO_DONE].disabled).toBeTrue();
    });
  });
});
