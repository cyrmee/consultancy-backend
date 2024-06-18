import { Expose } from 'class-transformer';

export class AdDto {
  @Expose() id: string;
  @Expose() image: string;
}
