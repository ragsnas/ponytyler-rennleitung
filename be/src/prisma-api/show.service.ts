import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { Show, Prisma, ShowState } from "@prisma/client";
import mqtt from "mqtt";
import * as os from "os";

const DEFAULT_MQTT_PORT = 3001;
const SHOW_STATE_CHANGE_TOPIC = "ShowStateChange";
/** First key of the advisory lock that serialises show updates. */
const SHOW_LOCK_NAMESPACE = 2;

@Injectable()
export class ShowService implements OnModuleDestroy {
  private readonly mqttClient: mqtt.MqttClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const port = Number(
      this.configService.get("MQTT_PORT") ?? DEFAULT_MQTT_PORT,
    );
    this.mqttClient = mqtt.connect(`mqtt://${os.hostname()}:${port}`, {
      clientId: "be-show-service",
    });
  }

  onModuleDestroy() {
    this.mqttClient.end();
  }

  async show(
    ShowWhereUniqueInput: Prisma.ShowWhereUniqueInput,
  ): Promise<Show | null> {
    return this.prisma.show.findUnique({
      where: ShowWhereUniqueInput,
    });
  }

  async shows(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.ShowWhereUniqueInput;
    where?: Prisma.ShowWhereInput;
    orderBy?: Prisma.ShowOrderByWithRelationInput;
  }): Promise<Show[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.show.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  /**
   * The one definition of "current show": the newest active show (by date,
   * undated last, then by id). More than one show can be flagged active, e.g.
   * one that another show took over keeps `active: true`.
   */
  async getCurrentShow(): Promise<Show | null> {
    return this.prisma.show.findFirst({
      where: { active: true },
      orderBy: [{ date: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    });
  }

  async showsOrderedByActiveAndDate(): Promise<Show[]> {
    return this.prisma.show.findMany({
      orderBy: [{ active: "desc" }, { date: "desc" }],
    });
  }

  async createShow(data: Prisma.ShowCreateInput): Promise<Show> {
    return this.prisma.show.create({
      data,
    });
  }

  async updateShow(params: {
    where: Prisma.ShowWhereUniqueInput;
    data: Prisma.ShowUpdateInput;
  }): Promise<Show> {
    const { where, data } = params;

    // One transaction; the MQTT events are published once it has committed.
    const { existingShow, updatedShow, resetShows } =
      await this.prisma.$transaction(async (tx) => {
        // at most one show is active: serialise concurrent updates
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SHOW_LOCK_NAMESPACE}::int, 0::int)`;
        const existingShow = await tx.show.findUnique({ where });
        const updatedShow = await tx.show.update({ data, where });
        const resetShows = this.isActiveState(updatedShow.showState)
          ? await tx.show.updateManyAndReturn({
              where: {
                id: { not: updatedShow.id },
                showState: {
                  notIn: [ShowState.LISTED, ShowState.SHOW_FINISHED],
                },
              },
              data: { showState: ShowState.LISTED },
            })
          : [];
        return { existingShow, updatedShow, resetShows };
      });

    if (existingShow && existingShow.showState !== updatedShow.showState) {
      this.publishShowStateChange(updatedShow);
    }
    resetShows.forEach((show) => this.publishShowStateChange(show));

    return updatedShow;
  }

  private isActiveState(showState: ShowState): boolean {
    return (
      showState !== ShowState.LISTED && showState !== ShowState.SHOW_FINISHED
    );
  }

  private publishShowStateChange(show: Show) {
    this.mqttClient.publish(
      SHOW_STATE_CHANGE_TOPIC,
      JSON.stringify({ showId: show.id.toString(), state: show.showState }),
    );
  }

  /** Races, shifts, shift roles and encore songs go with the show (`onDelete: Cascade`). */
  async deleteShowWithRacesAndShifts(id: string): Promise<Show> {
    return this.prisma.show.delete({
      where: { id: Number(id) },
    });
  }
}
