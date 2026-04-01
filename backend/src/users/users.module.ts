import { Module } from '@nestjs/common'
import { RedisModule } from '../redis'
import { UsersController } from './users.controller'
import { UsersService } from './users.service'

@Module({
  imports: [RedisModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
