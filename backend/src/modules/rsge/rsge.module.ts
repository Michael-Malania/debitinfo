import { Global, Module } from '@nestjs/common';
import { RsGeService } from './rsge.service';

@Global()
@Module({
  providers: [RsGeService],
  exports: [RsGeService],
})
export class RsGeModule {}
