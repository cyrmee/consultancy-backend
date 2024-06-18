import { Global, Module } from '@nestjs/common';
import { FileService } from './files.service';
import { CryptoService } from './crypto.service';
import { DateService } from './date.service';

@Global()
@Module({
  providers: [FileService, CryptoService, DateService],
  exports: [FileService, CryptoService, DateService],
})
export class CommonModule {}
