import {gettext as _} from 'gettext';

export class Strings {
  // Error Strings
  static Error = {
    ERROR: 'Error',
  };

  // Warning Strings
  static Warning = {
    WARNING: 'Warning',
  };

  // Input Strings
  static Input = {
    BASEPOINT: _('Select Base Point:'),
    BOUNDARY: _('Select boundary edges:'),
    CENTER: _('Pick the centre point:'),
    START: _('Pick the start point:'),
    END: _('Pick the end point:'),
    POINT: _('Select a point:'),
    POINTORRADIUS: _('Pick another point or Enter radius:'),
    POSITION: _('Pick position:'),
    POINTORQUIT: _('Pick another point or press ESC to quit:'),
    HEIGHT: _('Enter height:'),
    STRING: _('Enter text:'),
    NONE: '',
    SELECTENTITIES: _('Select Items:'),
    SELECTED: _('Item(s) selected - Add more or press Enter to accept:'),
    DESTINATIONORDISTANCE: _('Select Destination or Enter Distance:'),
    SELECTORQUIT: _('Select another object or press ESC to quit:'),
  };
};
