import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  templateUrl: './not-found.component.html',
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class NotFoundComponent {}
