import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
    selector: "lib-stats",
    templateUrl: "./stats.component.html",
    styleUrls: ["./stats.component.scss"],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StatsComponent {
}
