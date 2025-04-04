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

@Controller('integrations/hubspot')
export class HubspotAuthController {
  private clientId: string = process.env.HUBSPOT_CLIENT_ID!;
  private clientSecret: string = process.env.HUBSPOT_CLIENT_SECRET!;
  private redirectUri: string = process.env.HUBSPOT_REDIRECT_URI!;
  private accessToken: string = process.env.HUBSPOT_ACCESS_TOKEN!;

  @Get('authorize')
  redirectToHubspot(@Res() res: Response) {
    if (!this.clientId || !this.redirectUri) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ error: 'Missing HubSpot OAuth configuration.' });
    }

    const scope =
      'oauth crm.objects.contacts.write crm.objects.contacts.read crm.objects.companies.write crm.objects.companies.read';
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
      const { access_token: accessToken, refresh_token: refreshToken } =
        tokenResponse.data;
      return res.json({ accessToken, refreshToken });
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
  @Post('create-contact')
  async createContact(
    @Body() contactData: CreateContactDto,
    @Res() res: Response,
  ) {
    const payload = {
      properties: {
        firstname: contactData.firstName,
        lastname: contactData.lastName,
        email: contactData.email,
        phone: contactData.phone,
      },
    };

    try {
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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
    const payload = {
      properties: {
        name: companyData.name,
        domain: companyData.domain,
        phone: companyData.phone,
      },
    };

    try {
      const response = await axios.post(
        'https://api.hubapi.com/crm/v3/objects/companies',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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

  @Get('refresh-token')
  async refreshToken(
    @Query('refreshToken') refreshToken: string,
    @Res() res: Response,
  ) {
    if (!refreshToken) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json({ error: 'Refresh token not provided.' });
    }
    try {
      const params = new URLSearchParams();
      params.append('grant_type', 'refresh_token');
      params.append('client_id', this.clientId);
      params.append('client_secret', this.clientSecret);
      params.append('refresh_token', refreshToken);

      const tokenResponse = await axios.post(
        'https://api.hubapi.com/oauth/v1/token',
        params,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      );

      const { access_token, refresh_token } = tokenResponse.data;
      return res.json({ access_token, refresh_token });
    } catch (error: any) {
      console.error(
        'Refresh token error:',
        error.response?.data || error.message,
      );
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(error.response?.data || { error: 'Failed to refresh token.' });
    }
  }

  @Post('store-meeting')
  async storeMeeting(
    @Body() meetingData: CreateMeetingDto,
    @Res() res: Response,
  ) {
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

    try {
      const response = await axios.post(
        'https://api.hubapi.com/engagements/v1/engagements',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
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
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        error.response?.data || {
          error: 'Failed to store meeting in HubSpot',
        },
      );
    }
  }
}
