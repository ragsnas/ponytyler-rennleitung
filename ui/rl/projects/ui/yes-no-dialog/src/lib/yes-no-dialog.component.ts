import {Component, Inject, Input, OnInit} from '@angular/core';
import {MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef} from "@angular/material/legacy-dialog";

export interface DialogData {
  title: string;
  text: string;
  optionYes: string;
  optionNo: string;
}

@Component({
  selector: 'lib-yes-no-dialog',
  templateUrl: 'yes-no-dialog.component.html',
  styles: []
})
export class YesNoDialogComponent implements OnInit {

  title: string | undefined = '';
  text: string | undefined = '';
  optionYes: string | undefined= '';
  optionNo: string | undefined = '';

  constructor(
    public dialogRef: MatDialogRef<YesNoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {
    this.text = data.text;
    this.title = data.title;
    this.optionNo = data.optionNo;
    this.optionYes = data.optionYes;
  }

  ngOnInit(): void {
  }

  yes() {
    this.dialogRef.close(true);
  }

  no() {
    this.dialogRef.close(false);
  }

}
