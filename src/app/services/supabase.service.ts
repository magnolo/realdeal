import { Injectable } from '@angular/core';
import { SupabaseClient, createClient } from '@supabase/supabase-js';


@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  client: SupabaseClient;


  constructor() { 
    this.client = createClient(
      'https://mjdvtucgqzveqcqsknuz.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZHZ0dWNncXp2ZXFjcXNrbnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTY1Mzk1NTQsImV4cCI6MjAxMjExNTU1NH0.leu63hgQ4-bYpizVu3Y6zB9CwGfj2bvMAoni07Nerl4'
      
      );
  }
}
