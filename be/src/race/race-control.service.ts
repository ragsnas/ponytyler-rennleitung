import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Race, Show } from "@prisma/client";
import { PrismaService } from "../prisma-api/prisma.service";
import { RaceService } from "../prisma-api/race.service";
import { ShowService } from "../prisma-api/show.service";
import { isRaceAction, planTransition } from "./race-transitions";

/**
 * Applies the operator's race actions (see race-transitions.ts): the race and
 * its show move together in one transaction, only if the action fits the
 * state the race is in at that moment. Nothing is announced on MQTT unless
 * the transaction has committed.
 */
@Injectable()
export class RaceControlService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly raceService: RaceService,
    private readonly showService: ShowService,
  ) {}

  /** Returns the race (with its songs) and the show as they are now. */
  async transition(
    raceId: number,
    action: unknown,
    now = new Date(),
  ): Promise<{ race: Race; show: Show }> {
    if (!isRaceAction(action)) {
      throw new BadRequestException(`Unknown race action "${String(action)}"`);
    }

    const { raceChanges, showChanges } = await this.prisma.$transaction(
      async (tx) => {
        const found = await tx.race.findUnique({ where: { id: raceId } });
        if (!found) {
          throw new NotFoundException(`Race ${raceId} not found`);
        }
        await this.raceService.lockShow(tx, found.showId);
        // judge the race as it is now: another update may have just committed
        const race = await tx.race.findUnique({ where: { id: raceId } });
        if (!race) {
          throw new NotFoundException(`Race ${raceId} not found`);
        }

        const plan = planTransition(action, race.raceState, now);
        if (plan.ok === false) {
          throw new ConflictException(plan.message);
        }

        const raceChanges = await this.raceService.setStateInTransaction(
          tx,
          race,
          plan.race,
        );
        const showChanges = await this.showService.updateShowInTransaction(
          tx,
          { id: race.showId },
          { showState: plan.showState },
        );
        return { raceChanges, showChanges };
      },
    );

    this.raceService.publishChanges(raceChanges);
    this.showService.publishChanges(showChanges);
    return { race: raceChanges.updatedRace, show: showChanges.updatedShow };
  }
}
