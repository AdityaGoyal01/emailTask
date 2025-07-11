class MockEmailProvider {
  constructor(name, failRate = 0.3) {
    this.name = name;
    this.failRate = failRate;
  }

  async send(to, subject, body) {
    if (Math.random() < this.failRate) {
      throw new Error(`${this.name} failed to send`);
    }
    console.log(`[${this.name}] Email sent to ${to}`);
  }
}

module.exports = MockEmailProvider;