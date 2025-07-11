class CircuitBreaker {
  constructor(failureThreshold = 3, cooldownTime = 5000) {
    this.failureCount = 0;
    this.failureThreshold = failureThreshold;
    this.cooldownTime = cooldownTime;
    this.lastFailureTime = null;
  }

  canRequest() {
    if (this.failureCount < this.failureThreshold) return true;
    const now = Date.now();
    return now - this.lastFailureTime > this.cooldownTime;
  }

  recordSuccess() {
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }
}

class EmailService {
  constructor(provider1, provider2) {
    this.providers = [
      { provider: provider1, breaker: new CircuitBreaker() },
      { provider: provider2, breaker: new CircuitBreaker() }
    ];
    this.providerIndex = 0;
    this.sentEmails = new Set();
    this.rateLimit = {
      limit: 5,
      interval: 1000,
      sentTimestamps: []
    };
    this.statusMap = new Map();
    this.queue = [];
    this.processingQueue = false;
  }

  async send(emailId, to, subject, body) {
    if (this.sentEmails.has(emailId)) {
      this._log(`Duplicate send attempt for ${emailId}`);
      return this.statusMap.get(emailId);
    }
    return new Promise((resolve) => {
      this.queue.push({ emailId, to, subject, body, resolve });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.processingQueue) return;
    this.processingQueue = true;

    while (this.queue.length > 0) {
      const { emailId, to, subject, body, resolve } = this.queue.shift();

      if (!this._checkRateLimit()) {
        this._log(`Rate limit exceeded, retrying ${emailId} later`);
        this.queue.unshift({ emailId, to, subject, body });
        await this._sleep(500);
        continue;
      }

      let attempt = 0;
      const maxRetries = 3;
      let delay = 500;

      for (let i = 0; i < this.providers.length; i++) {
        const current = this.providers[this.providerIndex];
        if (!current.breaker.canRequest()) {
          this._log(`Circuit breaker open for Provider ${this.providerIndex + 1}`);
          this.providerIndex = (this.providerIndex + 1) % this.providers.length;
          continue;
        }

        while (attempt < maxRetries) {
          try {
            await current.provider.send(to, subject, body);
            this._log(`Email ${emailId} sent via Provider ${this.providerIndex + 1}`);
            current.breaker.recordSuccess();
            this.sentEmails.add(emailId);
            this._recordRateLimit();
            const status = { status: 'sent', provider: this.providerIndex + 1 };
            this.statusMap.set(emailId, status);
            break;
          } catch (err) {
            this._log(`Provider ${this.providerIndex + 1} failed: ${err.message}`);
            current.breaker.recordFailure();
            attempt++;
            await this._sleep(delay);
            delay *= 2;
          }
        }

        if (this.statusMap.has(emailId)) break;
        this.providerIndex = (this.providerIndex + 1) % this.providers.length;
        attempt = 0;
        delay = 500;
      }

      if (!this.statusMap.has(emailId)) {
        this._log(`All providers failed for ${emailId}`);
        const status = { status: 'failed', reason: 'All providers failed' };
        this.statusMap.set(emailId, status);
      }
      if (resolve) {
        resolve(this.statusMap.get(emailId));
      }
    }

    this.processingQueue = false;
  }

  getStatus(emailId) {
    return this.statusMap.get(emailId) || { status: 'unknown' };
  }

  _recordRateLimit() {
    this.rateLimit.sentTimestamps.push(Date.now());
  }

  _checkRateLimit() {
    const now = Date.now();
    const timestamps = this.rateLimit.sentTimestamps.filter(ts => now - ts < this.rateLimit.interval);
    this.rateLimit.sentTimestamps = timestamps;
    return timestamps.length < this.rateLimit.limit;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

module.exports = EmailService;