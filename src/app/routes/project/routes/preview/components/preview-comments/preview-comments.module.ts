/*
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdCommonModule } from 'cd-common';
import { CdCommonPipeModule } from 'cd-common/pipes';
import {
  FilterResolvedPipe,
  TextFieldLinkContentPipe,
  TextFieldUserContentPipe,
  UnescapeHtmlPipe,
} from './comments-panel.pipe';
import { CommentBodyComponent } from './body/comment-body.component';
import { CommentComponent } from './comment.component';
import { CommentsPanelComponent } from './comments-panel.component';
import { CommentFooterComponent } from './footer/comment-footer.component';
import { CommentHeaderComponent } from './header/comment-header.component';
import { PreviewCommentsComponent } from './preview-comments.component';
import { CommentThreadComponent } from './thread/comment-thread.component';
import { TaggableTextFieldComponent } from './taggable-text-field/taggable-text-field.component';
import { ObserversModule } from '@angular/cdk/observers';
import { UserListModule } from 'src/app/routes/project/components/user-list/user-list.module';

@NgModule({
  declarations: [
    FilterResolvedPipe,
    UnescapeHtmlPipe,
    CommentsPanelComponent,
    CommentComponent,
    CommentThreadComponent,
    TaggableTextFieldComponent,
    CommentHeaderComponent,
    CommentFooterComponent,
    PreviewCommentsComponent,
    CommentBodyComponent,
    TextFieldLinkContentPipe,
    TextFieldUserContentPipe,
    FilterResolvedPipe,
  ],
  imports: [CommonModule, UserListModule, ObserversModule, CdCommonModule, CdCommonPipeModule],
  exports: [PreviewCommentsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PreviewCommentsModule {}
