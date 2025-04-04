import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HubspotAuthController } from './hubspot-auth/hubspot-auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        HUBSPOT_CLIENT_ID: Joi.string().required(),
        HUBSPOT_CLIENT_SECRET: Joi.string().required(),
        HUBSPOT_REDIRECT_URI: Joi.string().required(),
        PORT: Joi.number().default(3000),
      }),
    }),
    AppModule,
  ],
  controllers: [HubspotAuthController],
})
export class AppModule {}
