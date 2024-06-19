import { Controller, Get } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
// import * as webdav from "webdav";
// import { map, of } from "rxjs";

@Controller("filesearch")
export class FilesearchController {
  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Get("videos")
  async getVideos() {
    /*
        const nextCloudUsername = this.configService.get<string>(
          "NEXT_CLOUD_USERNAME",
        );
        const nextCloudAppPassword = this.configService.get<string>(
          "NEXT_CLOUD_APP_PASSWORD",
        );
            const client = await webdav.createClient(
          'https://cloud.ponytyler.de/remote.php/dav/',
          {
            authType: webdav.AuthType.Password,
            password: nextCloudAppPassword,
            username: nextCloudUsername,
          });*/
    /*const searchRequest = `<?xml version="1.0" encoding="UTF-8"?>
 <d:searchrequest xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
     <d:basicsearch>
         <d:select>
             <d:prop>
                 <oc:fileid/>
                 <d:displayname/>
                 <d:getcontenttype/>
                 <d:getetag/>
                 <oc:size/>
             </d:prop>
         </d:select>
         <d:from>
             <d:scope>
                 <d:href>/</d:href>
                 <d:depth>infinity</d:depth>
             </d:scope>
         </d:from>
         <d:where>
             <d:like>
                 <d:prop>
                     <d:getcontenttype/>
                 </d:prop>
                 <d:literal>video/%</d:literal>
             </d:like>
         </d:where>
         <d:orderby/>
    </d:basicsearch>
</d:searchrequest>`;
    const result: webdav.SearchResult = (await client.search('/', {
      data: searchRequest,
    })) as webdav.SearchResult;
    return of(result)
      .pipe(
        map((result: webdav.SearchResult) =>
          result.results.map((file: webdav.FileStat) => file.filename),
        ),
    ).toPromise();*/
  }
}
