import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  Post,
  Body,
} from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { CreateContactDto } from './dto/CreateContact.dto';
import { CreateCompanyDto } from './dto/CreateCompany.dto';
import { CreateMeetingDto } from './dto/CreateMeeting.dto';

interface TokenData {
  accessToken: string;
  refreshToken: string;
  expirationTimestamp: number;
}

let tokenData: TokenData | null = null;

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
    const scope =
      'oauth crm.objects.contacts.write crm.objects.contacts.read scheduler.meetings.meeting-link.read crm.objects.companies.write crm.objects.companies.read';
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
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      const expirationTimestamp = Date.now() + expires_in * 1000;
      tokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expirationTimestamp,
      };
      return res.json({
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      });
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

  private async getValidAccessToken(): Promise<string> {
    if (tokenData && Date.now() < tokenData.expirationTimestamp) {
      return tokenData.accessToken;
    }
    if (!tokenData) {
      throw new Error('No token available, please authenticate first.');
    }
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('refresh_token', tokenData.refreshToken);

      const tokenResponse = await axios.post(
        'https://api.hubapi.com/oauth/v1/token',
        params,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;
      tokenData = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expirationTimestamp: Date.now() + expires_in * 1000,
      };
      return tokenData.accessToken;
    } catch (error: any) {
      console.error(
        'Error refreshing token:',
        error.response?.data || error.message,
      );
      throw new Error('Failed to refresh token');
    }
  }

  @Post('create-contact')
  async createContact(
    @Body() contactData: CreateContactDto,
    @Res() res: Response,
  ) {
    try {
      const validToken = await this.getValidAccessToken();
      const payload = {
        properties: {
          firstname: contactData.firstName,
          lastname: contactData.lastName,
          email: contactData.email,
          phone: contactData.phone,
        },
      };
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        payload,
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.json(response.data);
    } catch (error: any) {
      console.error(
        'Create contact error:',
        error.response?.data || error.message,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data || { error: 'Failed to create contact.' });
    }
  }

  @Post('create-company')
  async createCompany(
    @Body() companyData: CreateCompanyDto,
    @Res() res: Response,
  ) {
    try {
      const validToken = await this.getValidAccessToken();
      const payload = {
        properties: {
          name: companyData.name,
          domain: companyData.domain,
          phone: companyData.phone,
        },
      };
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/companies',
        payload,
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.json(response.data);
    } catch (error: any) {
      console.error(
        'Create company error:',
        error.response?.data || error.message,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data || { error: 'Failed to create company.' });
    }
  }

  @Post('store-meeting')
  async storeMeeting(
    @Body() meetingData: CreateMeetingDto,
    @Res() res: Response,
  ) {
    try {
      const validToken = await this.getValidAccessToken();
      const payload = {
        engagement: {
          active: true,
          type: 'MEETING',
          timestamp: Date.now(),
        },
        associations: {
          ...(meetingData.buyerContactId || meetingData.sellerContactId
            ? {
                contactIds: [
                  meetingData.buyerContactId,
                  meetingData.sellerContactId,
                ].filter(Boolean),
              }
            : {}),
          ...(meetingData.buyerCompanyId || meetingData.sellerCompanyId
            ? {
                companyIds: [
                  meetingData.buyerCompanyId,
                  meetingData.sellerCompanyId,
                ].filter(Boolean),
              }
            : {}),
        },
        metadata: {
          title: meetingData.title,
          body: meetingData.description,
          startTime: meetingData.startTime,
          endTime: meetingData.endTime,
          status: 'SCHEDULED',
        },
      };
      const response = await axios.post(
        'https://api.hubapi.com/engagements/v1/engagements',
        payload,
        {
          headers: {
            Authorization: `Bearer ${validToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return res.json(response.data);
    } catch (error: any) {
      console.error(
        'Store meeting error:',
        error.response?.data || error.message,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          error.response?.data || {
            error: 'Failed to store meeting in HubSpot',
          },
        );
    }
  }

  @Get('force-refresh')
  async forceRefresh(@Res() res: Response) {
    try {
      if (!tokenData) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ error: 'No token data available.' });
      }
      const newToken = await this.getValidAccessToken();
      return res.json({ accessToken: newToken, tokenData });
    } catch (error: any) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Failed to refresh token' });
    }
  }
}
