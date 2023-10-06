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

  signUpError?: string;
  loginInError?: string;

  constructor(private sb: SupabaseService) {}

  async signup(event: any, form: any) {
    const credentials = this.signupForm.value;
    if (credentials.email && credentials.password) {
      this.signupForm.disable();
      try {
        const { data, error } = await this.sb.client.auth.signUp({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          this.signUpError = error.message;
        } else {
          this.signUpError = undefined;
        }
      } catch (e) {
        console.log({ e });
      }
      this.signupForm.enable();
    }
  }

  async logMeIn(event: any, form: any) {
    const credentials = this.loginForm.value;

    if (credentials.email && credentials.password) {
      this.loginForm.disable();

      try {
        const { data, error } = await this.sb.client.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });
        if (error) {
          this.loginInError = error.message;
  
        } else {
          this.loginInError = undefined;
        }
      } catch (e) {
        console.log({ e });
      }
      this.loginForm.enable();
    }
  }
}
