import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { SupabaseService } from 'src/app/services/supabase.service';

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent {
  login = true;

  signupForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  loginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  constructor(private sb: SupabaseService) {}

  async signup(event: any, form: any) {
    console.log(event, form);

    const credentials = this.signupForm.value;
    if (credentials.email && credentials.password) {
      const { data, error } = await this.sb.client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
      });
      console.log(data);
    }
  }

  async logMeIn(event: any, form: any) {
    const credentials = this.loginForm.value;
    console.log(event, form, credentials);

    if (credentials.email && credentials.password) {
      const auth = await this.sb.client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      console.log(auth);
    }
  }
}
