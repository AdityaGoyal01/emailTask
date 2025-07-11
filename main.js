const EmailService = require('./emailService');
const MockEmailProvider = require('./mockEmailProvider');

const provider1 = new MockEmailProvider('Gmail', 1);
const provider2 = new MockEmailProvider('Outlook', 0.3);

const emailService = new EmailService(provider1, provider2);

(async () => {
  await emailService.send('email-001', 'user@example.com', 'Subject', 'Body');
  console.log('Status:', emailService.getStatus('email-001'));
})();
