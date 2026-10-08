import { ChangeDetectionStrategy, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Test double for `lib-song-auto-complete`, so `formControlName` has a value accessor to bind to. */
@Component({
  selector: 'lib-song-auto-complete',
  template: '',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => StubSongAutoCompleteComponent),
    },
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class StubSongAutoCompleteComponent implements ControlValueAccessor {
  @Input() label: string | undefined;
  @Input() showId: string | undefined;
  writeValue(): void {}
  registerOnChange(): void {}
  registerOnTouched(): void {}
}
