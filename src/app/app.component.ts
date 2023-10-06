import { ChangeDetectorRef, Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
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

  constructor(private cdr: ChangeDetectorRef, private sb: SupabaseService) {}

  handleInserts = (payload: any) => {
    contentStore.update(updateEntities(payload.new.id, payload.new));
  };

  ngOnInit(): void {
    contentStore.pipe(selectAllEntities()).subscribe((contents) => {
      console.log(contents);
      this.contents = contents;
      this.cdr.detectChanges();
    });

    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    // Create a function to handle inserts
    // this.signIn();
    this.listToUser()
    // this.getData();
    // this.listenToContent();
    this.subscribeToChannel();
  }

  async listToUser(){
    this.sb.client.auth.onAuthStateChange((event, session) => {
      this.user = session?.user
    })
  }

  async signIn() {
    const { data, error } = await this.sb.client.auth.signInWithPassword({
      email: 'manfred.walder@23degrees.io',
      password: 'Valdvald12',
    });
  }

  async getData() {
    let { data, error } = await this.sb.client.from('Content').select('*');
    console.log(data);

    if (data) {
      contentStore.update(setEntities(data));
    }
  }

  async listenToContent() {
    // Listen to inserts
    const channel = this.sb.client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
        },
        this.handleInserts
      )
      .subscribe();
  }

  addConent(event: any) {
    console.log(event, this.contentForm.value);
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
    const channel = this.sb.client.channel('any');

    channel
      .on('broadcast', { event: 'cursor-pos' }, (payload) => {
        this.userLeft = payload['payload'].x;
        this.userTop = payload['payload'].y;
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          document.onmousemove = (event) => {
            channel.send({
              type: 'broadcast',
              event: 'cursor-pos',
              payload: { x: event.clientX, y: event.clientY },
            });
          };
        }
      });

    
  }

  trackFn = (idx: number, item: any) => {
    return item.id ?? idx;
  };

  logout(){
    this.sb.client.auth.signOut()
  }
}
