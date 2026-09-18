import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from "@angular/common";
import CountdownComponent from "./countdown.component";



@NgModule({
  declarations: [CountdownComponent],
  imports: [
    CommonModule,
    DatePipe
  ],
  exports: [CountdownComponent]
})
export class CountdownModule { }
