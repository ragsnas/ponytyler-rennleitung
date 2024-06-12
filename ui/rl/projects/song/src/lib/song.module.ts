import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
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
import {MatLegacySnackBarModule as MatSnackBarModule} from "@angular/material/legacy-snack-bar";
import {DuplicatesComponent} from "./duplicates/duplicates.component";
import {MatLegacySelectModule as MatSelectModule} from "@angular/material/legacy-select";

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
    MatSelectModule
  ],
  providers: [SongService],
  exports: [SongsComponent, EditSongComponent, DuplicatesComponent],
})
export class SongModule {}
