import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, Routes } from '@angular/router';
import { BackendApiModule } from 'projects/backend-api/src/public-api';
import { ButtonListModule } from 'projects/ui/button-list/src/public-api';
import { SongSyncOriginModule } from 'projects/ui/song-sync-origin/src/public-api';
import { SongService } from 'projects/backend-api/src/lib/song.service';
import { CreateSongComponent } from './song-input/create-song.component';
import { SongSyncComponent } from './song-sync/song-sync.component';
import { SongComponent } from './song/song.component';
import { SongsComponent } from './songs.component';
import {EditSongComponent} from "./song-edit/edit-song.component";
import {MatSnackBarModule} from "@angular/material/snack-bar";
import {DuplicatesComponent} from "./duplicates/duplicates.component";
import {MatSelectModule} from "@angular/material/select";
import {MatSliderModule} from "@angular/material/slider";
import { MatChipsModule } from "@angular/material/chips";

const routes: Routes = [
  { path: '', component: SongsComponent },
  { path: 'duplicates', component: DuplicatesComponent },
  { path: 'create', component: CreateSongComponent },
  { path: 'sync', component: SongSyncComponent },
  { path: ':songId', component: EditSongComponent },
];

@NgModule({
  declarations: [
    SongsComponent,
    SongComponent,
    CreateSongComponent,
    SongSyncComponent,
    EditSongComponent,
    DuplicatesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatCheckboxModule,
    MatListModule,
    MatProgressSpinnerModule,
    BackendApiModule,
    ButtonListModule,
    SongSyncOriginModule,
    MatSelectModule,
    MatSliderModule,
    MatChipsModule,
  ],
  providers: [SongService],
  exports: [SongsComponent, EditSongComponent, DuplicatesComponent],
})
export class SongModule {}
