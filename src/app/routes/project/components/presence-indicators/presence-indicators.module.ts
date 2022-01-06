import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdCommonModule } from 'cd-common';
import { PresenceIndicatorsComponent } from './presence-indicators.component';
import { PipesModule } from 'src/app/routes/project/pipes/pipes.module';
import { PresenceIndicatorLeftPositionPipe } from './presence-indicators.pipe';
import { OverflowIndicatorsComponent } from './overflow-indicators/overflow-indicators.component';

@NgModule({
  declarations: [
    PresenceIndicatorsComponent,
    PresenceIndicatorLeftPositionPipe,
    OverflowIndicatorsComponent,
  ],
  imports: [CommonModule, CdCommonModule, PipesModule],
  exports: [PresenceIndicatorsComponent],
})
export class PresenceIndicatorsModule {}
