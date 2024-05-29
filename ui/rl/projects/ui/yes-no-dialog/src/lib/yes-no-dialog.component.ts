import {Component, Input, OnInit} from '@angular/core';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'lib-yes-no-dialog',
  templateUrl: 'yes-no-dialog.component.html',
  styles: []
})
export class YesNoDialogComponent implements OnInit {
  @Input()
  title: string | undefined = '';

  @Input()
  text: string | undefined = '';

  @Input()
  optionYes: string | undefined= '';

  @Input()
  optionNo: string | undefined = '';


  constructor(public dialogRef: MatDialogRef<YesNoDialogComponent>) { }

  ngOnInit(): void {
  }

  yes() {
    this.dialogRef.close(true);
  }

  no() {
    this.dialogRef.close(false);
  }

}
