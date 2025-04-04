import { Test, TestingModule } from '@nestjs/testing';
import { HubspotAuthController } from './hubspot-auth.controller';

describe('HubspotAuthController', () => {
  let controller: HubspotAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HubspotAuthController],
    }).compile();

    controller = module.get<HubspotAuthController>(HubspotAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
