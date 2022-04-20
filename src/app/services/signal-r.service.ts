import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HubConnectionBuilder, HubConnection } from "@microsoft/signalr";
import { environment } from 'src/environments/environment';

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

    this.initiateNegotiation().subscribe(signalRConn => {
      const hubConnection: HubConnection = new HubConnectionBuilder()
        .withUrl(signalRConn.url, { accessTokenFactory: () => signalRConn.accessToken })
        .build();

      hubConnection.start().then((success) => {
        console.log('SignalR connection started');
        hubConnection.invoke('outageTracker', accountNumber, premiseId);
      }).catch((error) => {
        console.log('Error in starting the hub connection ', error);
      });

      hubConnection.on('broadcastOutageData', (outageData) => {
        console.log('SignalR broadcasted data');
        this.outageData$.next(outageData);
      });

      hubConnection.onclose(() => {
        console.log('SignalR connection closed');
      });
    });
  }

}
