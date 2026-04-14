import { ImapFlow, FetchMessageObject } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';

export interface GmailConfig {
  user: string;
  appPassword: string;
}

export interface MailFilter {
  from?: string;
  subject?: string;
  timeoutMs?: number;
}

export class GmailHelper {
  private client: ImapFlow;

  constructor(private config: GmailConfig) {
    this.client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: {
        user: config.user,
        pass: config.appPassword,
      },
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async close(): Promise<void> {
    if (this.client.usable) {
      await this.client.logout();
    }
  }

  async waitForVerificationCode(filter: MailFilter = {}): Promise<string> {
    const timeoutMs = filter.timeoutMs ?? 1200000;
    const start = Date.now();
    await this.sleep(5000); 

    while (Date.now() - start < timeoutMs) {
      const code = await this.readLatestCode(filter);
      if (code) return code;

      await this.sleep(5000);
    } 

    throw new Error(`Verification code not found within ${timeoutMs / 1000}s`);
  }

  private async readLatestCode(filter: MailFilter): Promise<string | null> {
    const lock = await this.client.getMailboxLock('INBOX');

    try {
     const uidsResult = await this.client.search({
  since: new Date(Date.now() - 24 * 60 * 60 * 1000),
});

if (!uidsResult || !Array.isArray(uidsResult)) {  
  return null;
}

const uids: number[] = uidsResult;

      for (const uid of [...uids].reverse()) {
        const msgResult = await this.client.fetchOne(uid, {
  envelope: true,
  source: true, 
});

if (!msgResult || typeof msgResult === 'boolean') {
  continue;
}

const msg: FetchMessageObject = msgResult;

        if (!msg) continue;

        const subject: string = msg.envelope?.subject ?? '';
        const from: string =
          msg.envelope?.from?.[0]?.address ?? '';

        if (filter.subject && !subject.toLowerCase().includes(filter.subject.toLowerCase())) {
          continue;
        }

        if (filter.from && !from.toLowerCase().includes(filter.from.toLowerCase())) {
          continue;
        }

        if (!msg.source) continue;

        const parsed: ParsedMail = await simpleParser(msg.source);

        const body: string = `${parsed.text ?? ''}\n${parsed.html ?? ''}`;

        const code = this.extractCode(body);
        if (code) return code;
      }

      return null;
    } finally {
      lock.release();
    }
  }

  private extractCode(content: string): string | null {
    const match: RegExpMatchArray | null = content.match(/\b(\d{6})\b/);
    return match ? match[1] : null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}