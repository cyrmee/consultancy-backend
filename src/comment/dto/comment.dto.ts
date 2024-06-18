import { Expose, Type } from 'class-transformer';
import { ApplicationDto } from '../../application/dto';
import { BasicEmployeeUserDto } from '../../auth/dto';

export class ParentCommentDto {
  @Expose() id: string;
  @Expose() text: string;
  @Expose() @Type(() => BasicEmployeeUserDto) user: BasicEmployeeUserDto;
}

export class CommentDto {
  @Expose() id: string;
  @Expose() text: string;
  @Expose() isEdited: boolean;
  @Expose() @Type(() => Date) createdAt: Date;
  @Expose() @Type(() => ApplicationDto) application: ApplicationDto;
  @Expose() @Type(() => BasicEmployeeUserDto) user: BasicEmployeeUserDto;
  @Expose() @Type(() => ParentCommentDto) parent: ParentCommentDto;
}
