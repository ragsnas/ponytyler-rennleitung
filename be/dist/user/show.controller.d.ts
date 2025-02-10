import { ShowService } from "../prisma-api/show.service";
import { Show, Prisma } from "@prisma/client";
import { RaceService } from "../prisma-api/race.service";
export declare class ShowController {
    private readonly showService;
    private readonly raceService;
    constructor(showService: ShowService, raceService: RaceService);
    getShows(): Promise<Show[]>;
    getAllShows(): Promise<Show[]>;
    getCurrentShow(): Promise<Show>;
    getCurrentShows(): Promise<Show[]>;
    getOldShows(): Promise<Show[]>;
    getPostById(id: string): Promise<Show>;
    createShow(showData: Prisma.ShowCreateInput): Promise<Show>;
    repairRacesFor(id: string): Promise<any[]>;
    updateShow(id: string, showData: Prisma.ShowUpdateInput): Promise<Show>;
    deleteShowById(id: string): Promise<any>;
}
