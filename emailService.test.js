const EmailService = require('./emailService');
const MockEmailProvider = require('./mockEmailProvider');

test('sends email successfully', async () => {
  const provider1 = new MockEmailProvider('Provider1', 0);
  const provider2 = new MockEmailProvider('Provider2', 0);
  const emailService = new EmailService(provider1, provider2);

  const result = await emailService.send('email1', 'user@test.com', 'Hello', 'World');
  expect(result.status).toEqual('sent');
});

test('fails over to second provider', async () => {
  const provider1 = new MockEmailProvider('Provider1', 1);
  const provider2 = new MockEmailProvider('Provider2', 0);
  const emailService = new EmailService(provider1, provider2);

  const result = await emailService.send('email2', 'user@test.com', 'Hi', 'Body');
  expect(result.status).toEqual('sent');
});

test('prevents duplicate sends', async () => {
  const provider = new MockEmailProvider('Provider', 0);
  const emailService = new EmailService(provider, provider);

  await emailService.send('email3', 'a', 'b', 'c');
  const secondAttempt = await emailService.send('email3', 'a', 'b', 'c');
  expect(secondAttempt.status).toBe('sent');
});