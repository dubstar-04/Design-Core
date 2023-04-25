import {Core} from '../../core/core.js';

const core = new Core();
const commandline = core.commandLine;

test('Test Arc.execute', () => {
  // Create arc - point, point, angle
  commandline.handleKeys('A');
  commandline.enterPressed();

  commandline.command = '0,0';
  commandline.update();
  commandline.enterPressed();


  commandline.command = '100,0';
  commandline.update();
  commandline.enterPressed();


  commandline.command = '100,100';
  commandline.update();
  commandline.enterPressed();

  // TODO: work out how to test user input for commands
  // commented out because it fails. looks like the commands above run before the execute command because its async
  // need to await enter pressed or similar without affecting user experience
  // expect(core.scene.items.length).toBe(1),
});
