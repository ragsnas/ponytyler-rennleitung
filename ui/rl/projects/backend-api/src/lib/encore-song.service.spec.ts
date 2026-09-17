import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { environment } from 'src/environments/environment';

import { EncoreSong, EncoreSongService } from './encore-song.service';

describe('EncoreSongService', () => {
  let service: EncoreSongService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(EncoreSongService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches the encore songs for a show', () => {
    const encoreSongs = [{ id: 1, showId: '5', songId: '10', order: 0 }];

    service.getEncoreSongsForShow('5').subscribe((result: EncoreSong[]) => {
      expect(result).toEqual(encoreSongs);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}api/encore-song/for-show/5`);
    expect(req.request.method).toBe('GET');
    req.flush(encoreSongs);
  });

  it('creates an encore song for a show from the selected song', () => {
    const song = { id: 10, name: 'Some Song', artist: 'Some Artist', deleted: false, selectable: true } as never;

    service.createEncoreSong({ showId: '5', song }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}api/encore-song`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ showId: '5', songId: 10 });
    req.flush({});
  });
});
