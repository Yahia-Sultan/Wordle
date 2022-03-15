import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-settings-content',
  templateUrl: './settings-content.component.html',
  styleUrls: ['./settings-content.component.css']
})
export class SettingsContentComponent implements OnInit {
  wordLength: number = 5;

  constructor() { }

  ngOnInit(): void {
  }

}
