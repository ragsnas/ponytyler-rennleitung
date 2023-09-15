import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterModule, Routes } from '@angular/router';
import { BackendApiModule } from 'projects/backend-api/src/public-api';
import { ButtonListModule } from 'projects/ui/button-list/src/public-api';
import { SongService } from '../../../backend-api/src/lib/song.service';
import { CreateSongComponent } from './song-input/create-song.component';
import { SongComponent } from './song/song.component';
import { SongsComponent } from './songs.component';

const routes: Routes = [
  { path: '', component: SongsComponent },
  { path: 'create', component: CreateSongComponent },
];

@NgModule({
  declarations: [SongsComponent, SongComponent, CreateSongComponent],
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
    BackendApiModule,
    ButtonListModule,
  ],
  providers: [SongService],
  exports: [SongsComponent],
})
export class SongModule {}
