import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "./prisma.service";
import { Show, Prisma, Shift, ShowState } from "@prisma/client";
import mqtt from "mqtt";
import * as os from "os";

const DEFAULT_MQTT_PORT = 3001;
const SHOW_STATE_CHANGE_TOPIC = "ShowStateChange";

@Injectable()
export class ShowService {
  private readonly mqttClient: mqtt.MqttClient;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const port = Number(
      this.configService.get("MQTT_PORT") ?? DEFAULT_MQTT_PORT,
    );
    this.mqttClient = mqtt.connect(`mqtt://${os.hostname()}:${port}`, {
      clientId: "show-service",
    });
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
  
  async currentShow(): Promise<Show | null> {
    return this.prisma.show.findFirst({
      where: {
        active: true,
        showState: {
          notIn: [
            ShowState.LISTED,
            ShowState.RACE_FINISHED
          ]
        }
      },
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
    const existingShow = await this.prisma.show.findUnique({ where });
    const updatedShow = await this.prisma.show.update({
      data,
      where,
    });

    if (existingShow && existingShow.showState !== updatedShow.showState) {
      this.publishShowStateChange(updatedShow);
    }

    return updatedShow;
  }

  private publishShowStateChange(show: Show) {
    this.mqttClient.publish(
      SHOW_STATE_CHANGE_TOPIC,
      JSON.stringify({ showId: show.id, state: show.showState }),
    );
  }

  async deleteShowWithRacesAndShifts(id: string) {
    const deleteRaces = this.prisma.race.deleteMany({
      where: {
        showId: Number(id),
      },
    });

    const relatedShifts: Shift[] = await this.prisma.shift.findMany({
      where: {
        showId: Number(id),
      },
    });

    const deleteShiftsRoles = this.prisma.shiftRole.deleteMany({
      where: {
        shiftId: {
          in: relatedShifts.map((shift) => shift.id),
        },
      },
    });

    const deleteShifts = this.prisma.shift.deleteMany({
      where: {
        id: {
          in: relatedShifts.map((shift) => shift.id),
        },
      },
    });

    const deleteShow = this.prisma.show.delete({
      where: {
        id: Number(id),
      },
    });

    return this.prisma.$transaction([
      deleteRaces,
      deleteShifts,
      deleteShiftsRoles,
      deleteShow,
    ]);
  }
}
