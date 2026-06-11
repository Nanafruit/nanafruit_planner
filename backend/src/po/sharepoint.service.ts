import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface SharePointFile {
  itemId: string;
  name: string;
  webUrl: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

// Graph upload session chunks must be a multiple of 320 KiB; 5 MiB = 16 × 320 KiB
const CHUNK_SIZE = 5 * 1024 * 1024;

@Injectable()
export class SharePointService {
  private token: CachedToken | null = null;

  /** App-only token (client credentials) — cached until near expiry */
  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt - 60_000) {
      return this.token.accessToken;
    }

    const tenantId = process.env.AZURE_TENANT_ID;
    const response = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.AZURE_CLIENT_ID!,
          client_secret: process.env.AZURE_CLIENT_SECRET!,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default',
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      throw new InternalServerErrorException(
        `Failed to acquire Graph token: ${detail}`,
      );
    }

    const json = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.token = {
      accessToken: json.access_token,
      expiresAt: Date.now() + json.expires_in * 1000,
    };
    return this.token.accessToken;
  }

  async uploadFile(fileName: string, content: Buffer): Promise<SharePointFile> {
    const accessToken = await this.getAccessToken();
    const driveId = process.env.SHAREPOINT_DRIVE_ID;
    const folder = (process.env.SHAREPOINT_FOLDER_PATH ?? '').replace(
      /^\/+|\/+$/g,
      '',
    );
    const itemPath = folder ? `${folder}/${fileName}` : fileName;

    const sessionResponse = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${encodeURIComponent(itemPath).replace(/%2F/g, '/')}:/createUploadSession`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          item: {
            '@microsoft.graph.conflictBehavior': 'rename',
            name: fileName,
          },
        }),
      },
    );

    if (!sessionResponse.ok) {
      const detail = await sessionResponse.text();
      throw new InternalServerErrorException(
        `Failed to create SharePoint upload session: ${detail}`,
      );
    }

    const { uploadUrl } = (await sessionResponse.json()) as {
      uploadUrl: string;
    };

    let item: { id: string; name: string; webUrl: string } | null = null;
    for (let start = 0; start < content.length; start += CHUNK_SIZE) {
      const end = Math.min(start + CHUNK_SIZE, content.length);
      const chunk = content.subarray(start, end);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${start}-${end - 1}/${content.length}`,
        },
        body: new Uint8Array(chunk),
      });

      if (!uploadResponse.ok) {
        const detail = await uploadResponse.text();
        throw new InternalServerErrorException(
          `Failed to upload file to SharePoint: ${detail}`,
        );
      }

      // ชิ้นสุดท้ายจะตอบ 200/201 พร้อม driveItem
      if (uploadResponse.status === 200 || uploadResponse.status === 201) {
        item = (await uploadResponse.json()) as {
          id: string;
          name: string;
          webUrl: string;
        };
      }
    }

    if (!item) {
      throw new InternalServerErrorException(
        'SharePoint upload finished without returning the created item',
      );
    }
    return { itemId: item.id, name: item.name, webUrl: item.webUrl };
  }

  async deleteFile(itemId: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    const driveId = process.env.SHAREPOINT_DRIVE_ID;
    await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
  }
}
