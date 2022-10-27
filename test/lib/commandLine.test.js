
import {CommandLine} from '../../core/lib/commandLine.js';
import {Core} from '../../core/core.js';

const core = new Core();
const commandline = new CommandLine(core);

test('Send keypress to the commandline', () => {
  commandline.handleKeys('L');
  expect(commandline.command).toBe('L');
});

test.todo('Set update function');

test.todo('Test clear prompt function');

test.todo('Test reset prompt function');
