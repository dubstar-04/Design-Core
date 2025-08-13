import { Logging } from '../../core/lib/logging';

// mock console.log for tests
const msg = 'testMessage';
let consoleValue = '';
console.log = function(msg) {
  consoleValue = msg;
};

test('Logging levelValue', () => {
  Logging.instance.setLevel('OFF');
  expect(Logging.instance.levelValue).toBe(0);
  Logging.instance.setLevel('ERROR');
  expect(Logging.instance.levelValue).toBe(1);
});

test('Logging setLevel', () => {
  Logging.instance.setLevel('OFF');
  expect(Logging.instance.levelValue).toBe(0);

  Logging.instance.setLevel('ERROR');
  expect(Logging.instance.levelValue).toBe(1);

  Logging.instance.setLevel('WARN');
  expect(Logging.instance.levelValue).toBe(2);

  Logging.instance.setLevel('DEBUG');
  expect(Logging.instance.levelValue).toBe(3);

  // Invalid level
  expect(() => {
    Logging.instance.setLevel('INVALID'); ;
  }).toThrow();
});

test('Logging debug', () => {
  consoleValue = '';

  Logging.instance.setLevel('OFF');
  Logging.instance.debug(msg);
  expect(consoleValue).toBe('');

  Logging.instance.setLevel('DEBUG');
  Logging.instance.debug(msg);
  expect(consoleValue).toBe(`Debug: ${msg}`);
});

test('Logging warn', () => {
  consoleValue = '';

  Logging.instance.setLevel('OFF');
  Logging.instance.warn(msg);
  expect(consoleValue).toBe('');

  Logging.instance.setLevel('WARN');
  Logging.instance.warn(msg);
  expect(consoleValue).toBe(`Warning: ${msg}`);
});


test('Logging error', () => {
  consoleValue = '';

  Logging.instance.setLevel('OFF');
  Logging.instance.error(msg);
  expect(consoleValue).toBe('');

  Logging.instance.setLevel('ERROR');
  Logging.instance.error(msg);
  expect(consoleValue).toBe(`Error: ${msg}`);
});
