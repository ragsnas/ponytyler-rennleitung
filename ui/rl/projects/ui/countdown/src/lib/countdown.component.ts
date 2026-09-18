import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
  selector: "lib-countdown",
  templateUrl: "./countdown.component.html",
})
class CountdownComponent implements OnInit {

  @Input()
  startWord: string = 'GO!';

  @Input()
  countDownFrom: number = 3;

  @Output()
  countDownFinished = new EventEmitter<void>();

  public startDate: Date = new Date();
  public now: Date = new Date();
  public currentTimeInSeconds = (new Date()).getSeconds();
  public countDown: number = this.countDownFrom;
  public interval: ReturnType<typeof setTimeout> | undefined = undefined;

  ngOnInit(): void {
    this.interval = setInterval(() => {
      if (this.countDown > 0) {
        this.now = new Date();
        this.currentTimeInSeconds = this.now.getSeconds();
        this.countDown--;
      } else {
        this.countDownFinished.emit();
        clearInterval(this.interval);
      }
    }, 1000);
  }
}

export default CountdownComponent;
