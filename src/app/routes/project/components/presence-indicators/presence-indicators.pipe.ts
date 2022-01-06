import { Pipe, PipeTransform } from '@angular/core';

const AVATAR_WIDTH = 40;
const OVERLAP_AMOUNT = 8;

@Pipe({ name: 'presenceIndicatorLeftPositionPipe' })
export class PresenceIndicatorLeftPositionPipe implements PipeTransform {
  transform(index: number): string {
    if (index === 0) return '0px';
    return index * (AVATAR_WIDTH - OVERLAP_AMOUNT) + 'px';
  }
}
