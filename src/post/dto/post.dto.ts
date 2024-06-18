import { Expose, Type } from 'class-transformer';

export class PostDto {
  @Expose() id: string;
  @Expose() title: string;
  @Expose() description: string;
  @Expose() image: string;
  @Expose() videoLink: string;
  @Expose() @Type(() => Date) createdAt: Date;
  @Expose() @Type(() => Date) updatedAt: Date;
}
