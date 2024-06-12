import {Component} from '@angular/core';
import {Origin, Song, SongService} from '../../public-api';
import {Observable} from 'rxjs';

@Component({
  selector: 'lib-song-sync',
  templateUrl: './song-sync.component.html',
  styleUrls: ['./song-sync.component.css'],
})
export class SongSyncComponent {
  filesToSync: string[] = [];
  songsNotFoundInFiles: Song[] = [];
  processingFiles: number = 0;
  nothingFound: boolean = false;

  constructor(private songService: SongService) {}

  filesChanged(e: Event) {
    this.nothingFound = false;
    const target = e.target as HTMLInputElement;
    if (target?.files) {
      const files: FileList = target.files;
      const iterableFileNames: string[] = [];
      console.log(`filesChanged:`, files);
      this.songService.getSongs().subscribe((songs) => {
        console.log(`starting sync`);
        this.checkForNewSongs(files, iterableFileNames, songs);
        this.checkFilesForMissingSongs(songs, iterableFileNames);
        if (
          this.filesToSync.length < 1 &&
          this.songsNotFoundInFiles.length < 1
        ) {
          this.nothingFound = true;
        }
      });
    }
  }

  markAllMissingSongsBlocked() {
    this.processingFiles = this.songsNotFoundInFiles.length;
    while (this.songsNotFoundInFiles.length > 0) {
      const song = this.songsNotFoundInFiles.pop();
      if (song) {
        this.songService
          .updateSong({
            ...song,
            selectable: false,
          })
          .subscribe({
            next: (updatedSong) => {
              this.processingFiles--;
              console.log(
                `Song "${song.artist} - ${song.name}" is now blocked:`,
                updatedSong
              );
            },
            error: (error) => {
              this.processingFiles--;
              console.error(
                `Song "${song.artist} - ${song.name}" update failed:`,
                error
              );
            }
          });
      }
    }
  }

  createAllNewSongs() {
    this.processingFiles = this.filesToSync.length;
    while (this.filesToSync.length > 0) {
      const fileName = this.filesToSync.pop();
      if (fileName) {
        this.createNewSong(fileName).subscribe((song) => {
          this.processingFiles--;
          console.log(
            `New Song "${song.artist} - ${song.name}" was created:`,
            song
          );
        });
      }
    }
  }

  syncSingleFile(fileName: string) {
    this.processingFiles = 1;
    this.createNewSong(fileName).subscribe((song) => {
      this.filesToSync = this.filesToSync.filter((f) => f != fileName);
      this.processingFiles--;
      console.log(
        `New Song "${song.artist} - ${song.name}" was created:`,
        song
      );
    });
  }

  private createNewSong(fileName: string): Observable<Song> {
    const artist = fileName.substring(0, fileName.indexOf('-')).trim();
    const name = fileName
      .substring(fileName.indexOf('-') + 1, fileName.lastIndexOf('.'))
        .replace('[PTHQ]', '')
        .replace('[PT]', '')
        .replace('&amp;', '&')
        .trim()
      ;
    return this.songService.createSong({
      artist,
      name,
      deleted: false,
      selectable: true,
      origin: Origin.FROM_FILE_SYNC
    });
  }

  private checkFilesForMissingSongs(
    songs: Song[],
    iterableFileNames: string[]
  ) {
    songs
      .filter((song) => song.selectable)
      .forEach((song) => {
        const matchingFile = [...iterableFileNames].some((fileName) =>
          fileName.startsWith(`${song.artist} - ${song.name}`)
        );
        if (!matchingFile) {
          this.songsNotFoundInFiles.push(song);
        } else {
          console.log(
            `Song ${song.id} (${song.artist} - ${song.name}) found match in file:`,
            matchingFile
          );
        }
      });
  }

  private checkForNewSongs(
    files: FileList,
    iterableFileNames: string[],
    songs: Song[]
  ) {
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i].name;
      iterableFileNames.push(fileName);
      console.log(`${fileName} added to iterableFileNames`);

      const matchingSong = songs.find((song) =>
        fileName.startsWith(`${song.artist} - ${song.name}`)
      );
      if (!matchingSong) {
        this.filesToSync.push(fileName);
      } else {
        console.log(`${fileName} matches Song ${matchingSong.id}`);
      }
    }
  }
}
