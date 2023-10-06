import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { createClient } from '@supabase/supabase-js';

import { createStore } from '@ngneat/elf';
import {
  selectAllEntities,
  setEntities,
  updateEntities,
  withEntities,
} from '@ngneat/elf-entities';
import { take } from 'rxjs';
import { SupabaseService } from './services/supabase.service';
import { animate, style, transition, trigger } from '@angular/animations';

interface Content {
  id: number;
  typeSpecific: any;
  slug: string;
}

const contentStore = createStore({ name: 'content' }, withEntities<Content>());

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('slideInBottom', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', height: 0, overflow: 'hidden' }),
        animate(
          '250ms ease-out',
          style({ transform: 'translateX(0)', height: '*' })
        ),
      ]),
      transition(':leave', [
        style({ transform: 'translateX(100%)', height: '*' }),
        animate(
          '250ms ease-out',
          style({ transform: 'translateX(100%)', height: 0 })
        ),
      ]),
    ]),
  ],
})
export class AppComponent {
  title = 'supabase-frontend';
  contents: any[] = [];
  contentForm = new FormGroup({
    slug: new FormControl(''),
    typeSpecific: new FormControl(''),
  });

  userLeft = 0;
  userTop = 0;
  user?: any;
  remoteUser: any[] = [];

  messages: any[] = [];

  chatOpen = false;

  messagesForm = new FormGroup({
    text: new FormControl('', [Validators.required, Validators.minLength(4)]),
  });

  constructor(private cdr: ChangeDetectorRef, private sb: SupabaseService) {}

  handleInserts = (payload: any) => {
    // console.log(payload);
    if(payload.eventType === 'DELETE'){
      const id = payload.old.id;
      const idx = this.messages.findIndex((msg) => msg.id === id);
      if(idx > -1 ){
        this.messages.splice(idx, 1)
      }
    }
    else{
      if(!this.chatOpen) this.chatOpen = true;
      this.messages = [...this.messages, payload.new];
    };
  }

  ngOnInit(): void {
    // contentStore.pipe(selectAllEntities()).subscribe((contents) => {
    //   console.log(contents);
    //   this.contents = contents;
    //   this.cdr.detectChanges();
    // });

    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // Create a function to handle inserts
    // this.signIn();
    this.listToUser();
    // this.getData();
    // this.listenToContent();
    // this.subscribeToChannel();
  }

  async listToUser() {
    this.sb.client.auth.onAuthStateChange((event, session) => {
      this.user = session?.user;
      if (this.user) {
        this.subscribeToChannel();
      }
    });
  }

  async getData() {
    let { data, error } = await this.sb.client.from('messages').select('*');
    // console.log(data);
    this.messages = data || [];
  }

  async listenToContent() {
    // Listen to inserts
    const channel = this.sb.client.channel('table-db-changes');

    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        this.handleInserts
      )
      .subscribe();
  }

  addConent(event: any) {
    // console.log(event, this.contentForm.value);
    this.insertData();
  }

  async insertData() {
    const { data, error } = await this.sb.client
      .from('Content')
      .insert([this.contentForm.value])
      .select();
  }

  async udpate(id: number, key: string, value: any) {
    const { data, error } = await this.sb.client
      .from('Content')
      .update({ [key]: value })
      .eq('id', id)
      .select();
  }

  subscribeToChannel() {
    const channel = this.sb.client.channel('23channel', {
      config: {
        presence: {
          key: this.user.id,
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();

        const users = Object.keys(newState)
          .map((key, idx) => {
            // console.log({ go: newState[key] });
            return newState[key][0];
          })

          .filter((item: any, idx) => item['user_id'] !== this.user.id);

        this.remoteUser = users.map((user) => ({
          ...user,
          x: 0,
          y: 0,
          visible: false,
        }));
      })
      // .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      //   console.log('join', key, newPresences);

      //   // newPresences.forEach(async (pres) => {

      //   //   const { data, error } = await this.sb.client.from('users').select('name').eq('id', pres.presence_ref )
      //   // console.log({user: data})
      //   // })
      // })
      // .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      //   console.log('leave', key, leftPresences);
      // })
      .on('broadcast', { event: 'cursor-pos' }, (payload) => {
        const p = payload['payload'];

        const idx = this.remoteUser.findIndex(
          (user: any) => user.user_email === p.user_email
        );
        if (idx > -1) {
          this.remoteUser[idx].visible = true;
          this.remoteUser[idx].x = p.x;
          this.remoteUser[idx].y = p.y;
        }
        // this.userLeft = payload['payload'].x;
        // this.userTop = payload['payload'].y;
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          document.onmousemove = (event) => {
            channel.send({
              type: 'broadcast',
              event: 'cursor-pos',
              payload: {
                x: event.clientX,
                y: event.clientY,
                user_email: this.user.email,
              },
            });
          };

          await channel.track({
            user_id: this.user.id,
            user_email: this.user.email,
          });
          this.getData();
          this.listenToContent();
          // console.log(presenceTrackStatus);
        }
      });
  }

  trackFn = (idx: number, item: any) => {
    return item.id ?? idx;
  };

  logout() {
    this.sb.client.auth.signOut();
  }

  async sendMessage() {
    if (this.messagesForm.value['text']) {
      this.messagesForm.disable();
      const { error } = await this.sb.client
        .from('messages')
        .insert({
          user: this.user.email,
          text: this.messagesForm.value['text'],
        });

      this.messagesForm.reset();
      this.messagesForm.enable();
    }
  }

  async deleteMessage(id: any) {
    const { error } = await this.sb.client
      .from('messages')
      .delete()
      .eq('id', id);
  }
}
