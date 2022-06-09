const fs = require('fs');
const { execSync } = require('child_process');
const { combineAllure } = require('../src/combine-allure');

beforeAll(() => {
  fs.cpSync(`${process.cwd()}/test/allure-report`, `${process.cwd()}/test/allure-report-test-1`, { recursive: true });
  fs.cpSync(`${process.cwd()}/test/allure-report`, `${process.cwd()}/test/allure-report-test-2`, { recursive: true });
});

afterAll(() => {
  fs.rmdirSync(`${process.cwd()}/test/allure-report-test-1`, { recursive: true, force: true });
  fs.rmdirSync(`${process.cwd()}/test/allure-report-test-2`, { recursive: true, force: true });
});

describe('Create a single HTML allure report file after generating the local files', () => {
  it('Generate single HTML file by calling combineAllure()', () => {
    combineAllure(`${process.cwd()}/test/allure-report-test-1`);
    expect(fs.existsSync(`${process.cwd()}/test/allure-report-test-1/complete.html`)).toBeTruthy();
  });

  it('Generate single HTML file by calling the combine.js script', () => {
    const res = execSync(`node ${process.cwd()}/combine.js ${process.cwd()}/test/allure-report-test-2`);
    console.log(res.toString('utf8'));
    expect(fs.existsSync(`${process.cwd()}/test/allure-report-test-2/complete.html`)).toBeTruthy();
  });
});
