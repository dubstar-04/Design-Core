
import { Colours } from '../lib/colours.js'

test('Get hex colour from acad colour 0', () => {
    expect(Colours.getHexColour(0)).toBe('BYBLOCK');
});


test('Get hex colour from acad colour 255', () => {
    expect(Colours.getHexColour(255)).toBe('#FFFFFF'); 
});