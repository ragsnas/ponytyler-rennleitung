import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Song, SongService } from '../../../backend-api/src/lib/song.service';

@Component({
  selector: 'lib-song-songs',
  templateUrl: './songs.component.html',
  styleUrls: ['./songs.component.scss']
})
export class SongsComponent implements OnInit {
  songs$: BehaviorSubject<Song[]> = new BehaviorSubject<Song[]>([]);

  constructor(private songService: SongService) { }


  ngOnInit(): void {
    this.loadSongs();
    let songs = [
      {
          "artist": "Wheatus",
          "songName": "Teenage Dirtbag"
      },
      {
          "artist": "Wham!",
          "songName": "Club Tropicana"
      },
      {
          "artist": "Wet Wet Wet",
          "songName": "Love Is All Around"
      },
      {
          "artist": "Violent Femmes",
          "songName": "Blister In The Sun"
      },
      {
          "artist": "U2",
          "songName": "With Or Without You"
      },
      {
          "artist": "U2",
          "songName": "One"
      },
      {
          "artist": "Toto",
          "songName": "Africa"
      },
      {
          "artist": "Tina Turner",
          "songName": "Private dancer"
      },
      {
          "artist": "Tic Tac Toe",
          "songName": "Ich find dich Scheisse"
      },
      {
          "artist": "The Pointer Sisters",
          "songName": "Jump"
      },
      {
          "artist": "The Pointer Sisters",
          "songName": "I'm So Excited"
      },
      {
          "artist": "The Killers",
          "songName": "Mr. Brightside"
      },
      {
          "artist": "The Cure",
          "songName": "Friday I'm In Love"
      },
      {
          "artist": "The Boomtown Rats",
          "songName": "I Don-'t Like Mondays"
      },
      {
          "artist": "The Bangles",
          "songName": "Eternal Flame"
      },
      {
          "artist": "Team Scheisse",
          "songName": "Karstadtdetektiv"
      },
      {
          "artist": "Taylor Swift",
          "songName": "Shake It Off [PT]"
      },
      {
          "artist": "Taylor Dayne",
          "songName": "Tell It To My Heart"
      },
      {
          "artist": "tATu",
          "songName": "All The Things She Said"
      },
      {
          "artist": "Talking Heads",
          "songName": "Burning Down The House"
      },
      {
          "artist": "Take That",
          "songName": "Never Forget"
      },
      {
          "artist": "Take That",
          "songName": "Back for Good"
      },
      {
          "artist": "Starship",
          "songName": "Nothing's Gonna Stop Us Now"
      },
      {
          "artist": "Spice Girls",
          "songName": "Wannabe"
      },
      {
          "artist": "Spandau Ballet",
          "songName": "Gold"
      },
      {
          "artist": "Soft Cell",
          "songName": "Tainted Love"
      },
      {
          "artist": "Simple Minds",
          "songName": "Don't You Forget About Me"
      },
      {
          "artist": "Simon &amp; Garfunkel",
          "songName": "The Sound Of Silence"
      },
      {
          "artist": "Shakespears Sister",
          "songName": "Hello"
      },
      {
          "artist": "Scooter",
          "songName": "Hyper Hyper"
      },
      {
          "artist": "Sandra",
          "songName": "Everlasting Love"
      },
      {
          "artist": "Roxette",
          "songName": "Listen To Your Heart"
      },
      {
          "artist": "Roxette",
          "songName": "It Must Have Been Love"
      },
      {
          "artist": "Robyn",
          "songName": "Dancing On My Own"
      },
      {
          "artist": "Robbie Williams",
          "songName": "Angels"
      },
      {
          "artist": "Rihanna",
          "songName": "S&amp;M"
      },
      {
          "artist": "Rihanna",
          "songName": "Diamonds"
      },
      {
          "artist": "Rick Astley",
          "songName": "Never gonna give you up"
      },
      {
          "artist": "Radiohead",
          "songName": "Creep"
      },
      {
          "artist": "R.E.M.",
          "songName": "Losing My Religion"
      },
      {
          "artist": "Queen &amp; Bowie",
          "songName": "Under Pressure"
      },
      {
          "artist": "Queen",
          "songName": "The Show Must Go On"
      },
      {
          "artist": "Queen",
          "songName": "Don't Stop Me Now"
      },
      {
          "artist": "Queen",
          "songName": "Bohemian Rhapsody"
      },
      {
          "artist": "Prince",
          "songName": "Purple Rain"
      },
      {
          "artist": "Prince",
          "songName": "Purple Rain"
      },
      {
          "artist": "Prince",
          "songName": "Kiss"
      },
      {
          "artist": "Pink",
          "songName": "So What"
      },
      {
          "artist": "Pet Shop Boys",
          "songName": "Always On My Mind"
      },
      {
          "artist": "Patti Smith Group",
          "songName": "Because The Night"
      },
      {
          "artist": "Pat Benatar",
          "songName": "We Belong"
      },
      {
          "artist": "New Order",
          "songName": "Blue Monday"
      },
      {
          "artist": "Nena",
          "songName": "99 Luftballons"
      },
      {
          "artist": "Nelly Furtado",
          "songName": "Maneater"
      },
      {
          "artist": "Mötley Crüe",
          "songName": "Kickstart My Heart"
      },
      {
          "artist": "Minor Threat",
          "songName": "Out Of Step"
      },
      {
          "artist": "Miley Cyrus",
          "songName": "Wrecking Ball"
      },
      {
          "artist": "Michael Jackson",
          "songName": "Billy Jean"
      },
      {
          "artist": "Men At Work",
          "songName": "Down Under"
      },
      {
          "artist": "Meatloaf",
          "songName": "I'd Do Anything for Love"
      },
      {
          "artist": "Madonna",
          "songName": "Material Girl"
      },
      {
          "artist": "Madonna",
          "songName": "Like a Prayer"
      },
      {
          "artist": "Macklemore &amp; Ryan Lewis",
          "songName": "Thrift Shop"
      },
      {
          "artist": "Lizzo",
          "songName": "2 Be Loved (Am I Ready)"
      },
      {
          "artist": "Laura Branigan",
          "songName": "Self Control"
      },
      {
          "artist": "Kylie Minogue",
          "songName": "I Should Be So Lucky"
      },
      {
          "artist": "Kim Wilde",
          "songName": "You keep me hanging on"
      },
      {
          "artist": "Kim Wilde",
          "songName": "Kids In America"
      },
      {
          "artist": "Kim Carnes",
          "songName": "Bette Davis Eyes"
      },
      {
          "artist": "Kelis",
          "songName": "Milkshake"
      },
      {
          "artist": "Katy Perry",
          "songName": "Roar"
      },
      {
          "artist": "Katy Perry",
          "songName": "Firework"
      },
      {
          "artist": "Katrina And The Waves",
          "songName": "Walking On Sunshine"
      },
      {
          "artist": "Kate Bush",
          "songName": "Wuthering Heights"
      },
      {
          "artist": "Kate Bush",
          "songName": "Running Up That Hill"
      },
      {
          "artist": "Justin Timberlake",
          "songName": "Cry Me A River"
      },
      {
          "artist": "Journey",
          "songName": "Don't Stop Believin'"
      },
      {
          "artist": "Joan Jett &amp; The Blackhearts",
          "songName": "I Love Rock`n´roll"
      },
      {
          "artist": "Jax",
          "songName": "Victoria’s Secret (feat. Harper)"
      },
      {
          "artist": "Irene Cara",
          "songName": "Flashdance (What A Feeling)"
      },
      {
          "artist": "Idina Menzel",
          "songName": "Let It Go"
      },
      {
          "artist": "Icona Pop",
          "songName": "I Love It"
      },
      {
          "artist": "Haddaway",
          "songName": "What Is Love"
      },
      {
          "artist": "Goldfrapp",
          "songName": "Ooh La La"
      },
      {
          "artist": "Gloria Gaynor",
          "songName": "I Will Survive"
      },
      {
          "artist": "Fatboy Slim",
          "songName": "Praise You"
      },
      {
          "artist": "Eurythmics",
          "songName": "Sweet Dreams"
      },
      {
          "artist": "Europe",
          "songName": "Final Countdown"
      },
      {
          "artist": "Erasure",
          "songName": "Always"
      },
      {
          "artist": "Erasure",
          "songName": "A Little Respect"
      },
      {
          "artist": "Enrique Iglesias",
          "songName": "Hero"
      },
      {
          "artist": "Elton John",
          "songName": "I'm Still Standing"
      },
      {
          "artist": "Electric Callboy",
          "songName": "We Got the Moves"
      },
      {
          "artist": "Electric Callboy",
          "songName": "Pump It"
      },
      {
          "artist": "Electric Callboy",
          "songName": "Hypa Hypa"
      },
      {
          "artist": "Echt",
          "songName": "Sag Mal, Weinst Du"
      },
      {
          "artist": "Drake",
          "songName": "Hotline Bling"
      },
      {
          "artist": "Dirty Dancing",
          "songName": "I'Ve Had The Time Of My Life"
      },
      {
          "artist": "Dirty Dancing",
          "songName": "I Had The Time Of My Life"
      },
      {
          "artist": "Die Sterne",
          "songName": "Was Hat Dich Bloß So Ruiniert"
      },
      {
          "artist": "Die Ärzte",
          "songName": "Zu spät"
      },
      {
          "artist": "Die Ärzte",
          "songName": "Westerland"
      },
      {
          "artist": "Die Antwoord",
          "songName": "Banana Brain"
      },
      {
          "artist": "Depeche Mode",
          "songName": "Enjoy The Silence"
      },
      {
          "artist": "Deichkind",
          "songName": "Arbeit nervt"
      },
      {
          "artist": "Dead or Alive",
          "songName": "You Spin Me Round"
      },
      {
          "artist": "David Hasselhoff",
          "songName": "Looking for Freedom"
      },
      {
          "artist": "David Hasselhoff",
          "songName": "Looking for Freedom"
      },
      {
          "artist": "David Bowie",
          "songName": "Heroes"
      },
      {
          "artist": "Chumbawamba",
          "songName": "Tubthumping"
      },
      {
          "artist": "Christina Aguilera",
          "songName": "Fighter"
      },
      {
          "artist": "Chesney Hawkes",
          "songName": "The One And Only"
      },
      {
          "artist": "Charly Lownoise &amp; Mental Theo",
          "songName": "Wonderfull Days"
      },
      {
          "artist": "Charly Lownoise &amp; Mental Theo",
          "songName": "Wonderful Days"
      },
      {
          "artist": "Charly Lownoise &amp; Mental",
          "songName": "Theo Wonderfull Days"
      },
      {
          "artist": "Carly Rae Jepsen",
          "songName": "Call Me Maybe"
      },
      {
          "artist": "Bronski Beat",
          "songName": "Smalltown boy"
      },
      {
          "artist": "Britney Spears",
          "songName": "Toxic"
      },
      {
          "artist": "Britney Spears",
          "songName": "Baby One More Time"
      },
      {
          "artist": "Boston",
          "songName": "More Than A Feeling"
      },
      {
          "artist": "Bonnie Tyler",
          "songName": "Total Eclipse of the Heart"
      },
      {
          "artist": "Bonnie Tyler",
          "songName": "Holding Out For A Hero"
      },
      {
          "artist": "Blümchen",
          "songName": "Herz An Herz"
      },
      {
          "artist": "Blümchen",
          "songName": "Boomerang"
      },
      {
          "artist": "Blondie",
          "songName": "Heart Of Glass"
      },
      {
          "artist": "Billy Idol",
          "songName": "Rebel Yell .mp4"
      },
      {
          "artist": "Billy Idol",
          "songName": "Rebel Yell"
      },
      {
          "artist": "Beyoncé",
          "songName": "Single ladies"
      },
      {
          "artist": "Belinda Carlisle",
          "songName": "Heaven Is A Place On Earth"
      },
      {
          "artist": "Beastie Boys",
          "songName": "Fight for your Right"
      },
      {
          "artist": "Barry Manilow",
          "songName": "Mandy"
      },
      {
          "artist": "Backstreet Boys",
          "songName": "Quit playing games with my heart"
      },
      {
          "artist": "Backstreet Boys",
          "songName": "Everybody"
      },
      {
          "artist": "Amy Winehouse",
          "songName": "Rehab"
      },
      {
          "artist": "Alphaville",
          "songName": "Forever Young"
      },
      {
          "artist": "Air Supply",
          "songName": "All Out of Love"
      },
      {
          "artist": "Aha",
          "songName": "Take on me"
      },
      {
          "artist": "Aerosmith",
          "songName": "I Don't Want To Miss A Thing"
      },
      {
          "artist": "Adele",
          "songName": "Someone Like You"
      },
      {
          "artist": "ACDC",
          "songName": "Thunderstruck"
      },
      {
          "artist": "ABBA",
          "songName": "Take A Chance On Me"
      },
      {
          "artist": "ABBA",
          "songName": "Super Trouper"
      },
      {
          "artist": "ABBA",
          "songName": "Money Money Money"
      },
      {
          "artist": "ABBA",
          "songName": "Gimme Gimme Gimme"
      },
      {
          "artist": "2 Unlimited",
          "songName": "No Limits"
      },
  ];
  /**
    songs.forEach(song => {
      this.songService.createSong({
        artist: song.artist,
        name: song.songName,
        selectable: true,
        deleted: false
      });
    }); */
  }

  deleteSong(song: Song) {
    this.songService.updateSong({...song, deleted: true}).subscribe({
      next: result => {
        this.loadSongs();
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
      }
    });
  }

  blockSong(song: Song) {
    this.songService.updateSong({...song, selectable: false}).subscribe({
      next: result => {
        this.loadSongs();
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
      }
    });
  }

  unblockSong(song: Song) {
    this.songService.updateSong({...song, selectable: true}).subscribe({
      next: result => {
        this.loadSongs();
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
      }
    });
  }

  loadSongs() {
    this.songService.getSongs().subscribe({
      next: result => {
        this.songs$.next(result);
        console.log(`Result:`, result);
        
      },
      error: error => {
        console.log(`error:`, error);
        
      }
    })   
  }

}
