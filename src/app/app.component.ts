import { Component } from '@angular/core';
import { SignalRService } from './services/signal-r.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Angular SignalR Connect';
  accountNumber = '';
  premiseId = '';
  outageData: any;

  constructor(private signalRService: SignalRService) {
  }

  ngOnInit() {
    this.signalRService.outageData$.subscribe((outageData) => {
      this.outageData = outageData;
    });
  }

  onClickGetOutageData() {
    this.signalRService.getSignalRHubConnection(this.accountNumber, this.premiseId);
  }
}
