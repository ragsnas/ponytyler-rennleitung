import { ShowService } from "../prisma-api/show.service";
import { Show, Prisma } from "@prisma/client";
export declare class ShowController {
    private readonly showService;
    constructor(showService: ShowService);
    getShows(): Promise<Show[]>;
    getAllShows(): Promise<Show[]>;
    getCurrentShow(): Promise<Show>;
    getCurrentShows(): Promise<Show[]>;
    getOldShows(): Promise<Show[]>;
    getPostById(id: string): Promise<Show>;
    createShow(showData: Prisma.ShowCreateInput): Promise<Show>;
    updateShow(id: string, showData: Prisma.ShowUpdateInput): Promise<Show>;
    deleteShowById(id: string): Promise<any>;
}
