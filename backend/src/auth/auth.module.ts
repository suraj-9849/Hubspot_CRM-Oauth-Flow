import { Module } from '@nestjs/common';
import { HubspotAuthController } from 'src/hubspot-auth/hubspot-auth.controller';

@Module({
    controllers: [HubspotAuthController],
})
export class AuthModule {}
