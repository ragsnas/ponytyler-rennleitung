import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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
import { SongService } from '../../../backend-api/src/lib/song.service';
import { CreateSongComponent } from './song-input/create-song.component';
import { SongSyncComponent } from './song-sync/song-sync.component';
import { SongComponent } from './song/song.component';
import { SongsComponent } from './songs.component';

const routes: Routes = [
  { path: '', component: SongsComponent },
  { path: 'create', component: CreateSongComponent },
  { path: 'sync', component: SongSyncComponent },
];

@NgModule({
  declarations: [
    SongsComponent,
    SongComponent,
    CreateSongComponent,
    SongSyncComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    HttpClientModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatCheckboxModule,
    MatListModule,
    MatProgressSpinnerModule,
    BackendApiModule,
    ButtonListModule,
  ],
  providers: [SongService],
  exports: [SongsComponent],
})
export class SongModule {}
