import 'dotenv/config';
import { expect, test } from '@playwright/test';
import { RainbowSignupPage } from '../pages/RainbowSignupPage';
import { GmailHelper } from '../utils/gmail';

function uniqueGmail(baseEmail: string) {
  const [name, domain] = baseEmail.split('@');
  return `${name}+rainbow-${Date.now()}@${domain}`;
}

test.describe('Rainbow Sign Up', () => {
  test('TC01 - happy path: signup with Gmail verification code @smoke @regression', async ({ page }) => {
    const rainbow = new RainbowSignupPage(page);
    const gmail = new GmailHelper({
      user: process.env.GMAIL_USER!,
      appPassword: process.env.GMAIL_APP_PASSWORD!,
    });

    const email = uniqueGmail(process.env.GMAIL_USER!);
    const password = process.env.RAINBOW_PASSWORD!;

    await gmail.connect();
    try {
      await rainbow.open();
      await rainbow.assertEmailStep();

      await rainbow.fillEmail(email);
      await rainbow.submitEmail();

      await rainbow.assertVerificationStep();

      const code = await gmail.waitForVerificationCode({
        from: process.env.GMAIL_FROM_FILTER || undefined,
        subject: process.env.GMAIL_SUBJECT_FILTER || undefined,
        timeoutMs: 1200000,
      });

      await rainbow.fillVerificationCode(code);
      await rainbow.fillPassword(process.env.RAINBOW_PASSWORD!);
      await rainbow.acceptTerms();
      await rainbow.submitFinal();

      await expect(page).not.toHaveURL(/#\/firstConnect/);
    } finally {
      await gmail.close();
    }
  });

  test('TC02 - wrong verification code should not allow signup @regression @negative', async ({ page }) => {
    const rainbow = new RainbowSignupPage(page);

    await rainbow.open();
    await rainbow.assertEmailStep();

    await rainbow.fillEmail(uniqueGmail(process.env.GMAIL_USER!));
    await rainbow.submitEmail();
    await rainbow.assertVerificationStep();

    await rainbow.fillVerificationCode('000000');
    await rainbow.passwordInput.click();
    await rainbow.fillPassword(process.env.RAINBOW_PASSWORD!);
    await rainbow.acceptTerms();
    await rainbow.submitFinal();
    await expect(page.getByRole('main').getByText('Invalid or expired code')).toBeVisible();

  });

  test('TC03 - weak password should block continue @regression @negative', async ({ page }) => {
    const rainbow = new RainbowSignupPage(page);

    await rainbow.open();
    await rainbow.fillEmail(uniqueGmail(process.env.GMAIL_USER!));
    await rainbow.submitEmail();
    await rainbow.assertVerificationStep();

    await rainbow.fillVerificationCode('123456');
    await rainbow.fillPassword('123');

    await expect(rainbow.continueButton).toBeDisabled();
  });

  test('TC04 - terms checkbox not accepted should block continue @regression @negative', async ({ page }) => {
    const rainbow = new RainbowSignupPage(page);

    await rainbow.open();
    await rainbow.fillEmail(uniqueGmail(process.env.GMAIL_USER!));
    await rainbow.submitEmail();
    await rainbow.assertVerificationStep();

    await rainbow.fillVerificationCode('123456');
    await rainbow.fillPassword(process.env.RAINBOW_PASSWORD!);

    await expect(rainbow.continueButton).toBeDisabled();
  });
});