import { expect, Locator, Page } from '@playwright/test';

export class RainbowSignupPage {
  public emailInput: Locator;
  public codeInput: Locator;
public passwordInput: Locator;
  public termsCheckbox: Locator;
  public continueButton: Locator;

  constructor(private page: Page) {
    this.emailInput = page.getByRole('textbox', { name: 'Please enter your email' });
    this.codeInput = page.locator("#codeInput");
    this.passwordInput = page.locator("#pwdInput");
    this.termsCheckbox = page.locator('.dummyCheckboxClass');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }
async open() {
    await this.page.goto(process.env.RAINBOW_URL!, { waitUntil: 'networkidle' }); 
    const signUpLink = this.page.getByRole('button', { name: "Don't have an account?" });
    await signUpLink.click();
}

  async assertEmailStep() {
    await expect(this.page.getByRole('heading', { name: 'Create your Rainbow account' })).toBeVisible();
  }

  async assertVerificationStep() {
    await expect(this.page.getByText('Please enter your email')).toBeVisible();
  }

async fillEmail(email: string) {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.emailInput.clear();
    await this.emailInput.pressSequentially(email, { delay: 100 });
    await this.page.keyboard.press('Tab'); // خطوة إضافية لضمان تفعيل زر Continue
}

async submitEmail() {
    await this.continueButton.waitFor({ state: 'visible' });
    await expect(this.continueButton).toBeEnabled({ timeout: 15000 }); 
await this.continueButton.click({ force: true, timeout: 10000 });}

  async fillVerificationCode(code: string) {
    await this.codeInput.fill(code);
  }

 async fillPassword(password: string) {
  const input = this.page.locator('#pwdInput');

  await input.evaluate((el: HTMLInputElement) => {
    el.removeAttribute('readonly');
  });

  await input.focus();

  console.log(await input.getAttribute('readonly'));
  await input.fill(password);
}

  async acceptTerms() {
    await this.termsCheckbox.waitFor({ state: 'visible' });
    await this.termsCheckbox.check({ force: true }); // force تساعد في حال كان الـ checkbox مخفي خلف CSS معين
  }

  async submitFinal() {
    await this.continueButton.click();
  }
}