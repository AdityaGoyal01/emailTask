# 📧 Resilient Email Sending Service

## Overview
A JavaScript email service that:
- Retries on failure (with exponential backoff)
- Switches between two providers (fallback)
- Prevents duplicate sends (idempotency)
- Rate-limits email requests
- Tracks status of all attempts
- Includes circuit breaker + queue system

## Setup

```
npm install
npm install --save-dev jest
```

## Run Unit Tests

```
npx jest
```

## Usage

```js
const EmailService = require('./emailService');
const MockEmailProvider = require('./mockEmailProvider');

const provider1 = new MockEmailProvider('Gmail', 0.3);
const provider2 = new MockEmailProvider('Outlook', 0.3);

const emailService = new EmailService(provider1, provider2);

emailService.send('email-123', 'user@example.com', 'Subject', 'Body');
```