import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';

import { devTools } from '@ngneat/elf-devtools';
import { ApplicationRef } from '@angular/core';

devTools();

platformBrowserDynamic().bootstrapModule(AppModule)
.then((moduleRef) => {
  devTools({
    postTimelineUpdate: () => moduleRef.injector.get(ApplicationRef).tick()
  });})
  .catch(err => console.error(err));
