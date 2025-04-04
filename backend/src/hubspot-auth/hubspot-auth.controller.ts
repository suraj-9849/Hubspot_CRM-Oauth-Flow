import { Controller, Get, Query, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';

@Controller('integrations/hubspot')
export class HubspotAuthController {
  private clientId: string = process.env.HUBSPOT_CLIENT_ID!;
  private clientSecret: string = process.env.HUBSPOT_CLIENT_SECRET!;
  private redirectUri: string = process.env.HUBSPOT_REDIRECT_URI!;
  @Get('authorize')
  redirectToHubspot(@Res() res: Response) {
    if (!this.clientId || !this.redirectUri) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Missing HubSpot OAuth configuration.' });
    }

    const scope = 'oauth crm.objects.companies.read';
    const authorizationUrl = `https://app.hubspot.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(
      this.redirectUri,
    )}&scope=${encodeURIComponent(scope)}`;

    return res.redirect(authorizationUrl);
  }

  @Get('oauth2callback')
  async handleHubspotCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'Authorization code not provided.' });
    }

    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('redirect_uri', this.redirectUri);
      params.append('code', code);
      const tokenResponse = await axios.post(
        'https://api.hubapi.com/oauth/v1/token',
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token: accessToken } = tokenResponse.data;
      return res.json({ accessToken });
    } catch (error: any) {
      console.error(
        'Token exchange error:',
        error.response?.data || error.message,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data || { error: 'Token exchange failed.' });
    }
  }
}
