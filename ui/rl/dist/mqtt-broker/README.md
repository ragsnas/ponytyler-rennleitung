# MqttBroker

This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.0.

It hosts the "MQTT Broker" page, which connects over WebSocket to the MQTT
broker embedded in the NestJS backend (see `be/src/mqtt/README.md`) and
displays every message published to it, live.

## Code scaffolding

Run `ng generate component component-name --project mqtt-broker` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module --project mqtt-broker`.
> Note: Don't forget to add `--project mqtt-broker` or else it will be added to the default project in your `angular.json` file. 

## Build

Run `ng build mqtt-broker` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test mqtt-broker` to execute the unit tests via [Karma](https://karma-runner.github.io).
