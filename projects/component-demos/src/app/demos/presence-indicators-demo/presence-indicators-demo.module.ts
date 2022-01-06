import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresenceIndicatorsDemoComponent } from './presence-indicators-demo.component';
import { PresenceIndicatorsModule } from 'src/app/routes/project/components/presence-indicators/presence-indicators.module';

@NgModule({
  declarations: [PresenceIndicatorsDemoComponent],
  imports: [CommonModule, PresenceIndicatorsModule],
})
export class PresenceIndicatorsDemoModule {}
