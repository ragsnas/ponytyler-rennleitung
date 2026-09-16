import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MqttBrokerComponent } from './mqtt-broker.component';

const routes: Routes = [
  { path: '', component: MqttBrokerComponent },
];

@NgModule({
  declarations: [MqttBrokerComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
  ],
  exports: [MqttBrokerComponent],
})
export class MqttBrokerModule { }
