import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  templateUrl: './unauthorized.component.html',
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterLink]
  })
export class UnauthorizedComponent {}