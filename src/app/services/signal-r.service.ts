import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { environment } from 'src/environments/environment';

import * as CryptoJS from 'crypto-js';

interface INegotiateResult {
  accessToken: string;
  url: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  outageData$ = new Subject();

  constructor(private http: HttpClient) { }

  initiateNegotiation(): Observable<INegotiateResult> {
    return this.http.get<INegotiateResult>(`${environment.signalrBaseUrl}/api/negotiate`);
  }

  getSignalRHubConnection(accountNumber: string, premiseId: string) {
    console.log('accountNumber - ', accountNumber, 'premiseId - ', premiseId);

    // this.initiateNegotiation().subscribe(signalRConn => {
    const hubConnection: HubConnection = new HubConnectionBuilder()
      .withUrl('https://processoutages.azurewebsites.net/api', { accessTokenFactory: () => { return this.generateAccessToken('yashvanta') } })
      .build();

    hubConnection.start().then(() => {
      console.log('SignalR connection started');

      hubConnection.invoke('GetOutageData', accountNumber, premiseId).then((outageData) => {
        this.outageData$.next(outageData);
      }).catch((error) => {
        console.log('Error in invoking the GetOutageData ', error);
      });

      hubConnection.invoke('SignalRTest', accountNumber, premiseId).then((msg) => {
        this.outageData$.next(msg);
      }).catch((error) => {
        console.log('Error in invoking the SignalRTest ', error);
      });

    }).catch((error) => {
      console.log('Error in starting the hub connection ', error);
    });

    hubConnection.on('broadcastOutageData', (outageData) => {
      console.log('SignalR broadcasted data');
      this.outageData$.next(outageData);
    });

    hubConnection.on('ReceiveMessage', (outageData) => {
      console.log('SignalR ReceiveMessage data', outageData);
      this.outageData$.next(outageData);
    });

    hubConnection.onclose(() => {
      console.log('SignalR connection closed');
    });
    // });
  }

  generateAccessToken(userName = 'Yashavanta') {
    var header = {
      "alg": "HS256",
      "typ": "JWT"
    };

    const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    var encodedHeader = this.base64url(stringifiedHeader);

    // customize your JWT token payload here 
    var data = {
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": userName,
      "exp": 1699819025,
      // 'admin': isAdmin
    };

    var stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
    var encodedData = this.base64url(stringifiedData);

    var token = encodedHeader + "." + encodedData;

    var secret = "myfunctionauthtest"; // do not expose your secret here

    var signature: CryptoJS.lib.WordArray = CryptoJS.HmacSHA256(token, secret);
    var signatureStr = this.base64url(signature);

    var signedToken = token + "." + signatureStr;

    return signedToken;
  }

  base64url(source: CryptoJS.lib.WordArray) {
    // Encode in classical base64
    let encodedSource = CryptoJS.enc.Base64.stringify(source);

    // Remove padding equal characters
    encodedSource = encodedSource.replace(/=+$/, '');

    // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');

    return encodedSource;
  }
}
