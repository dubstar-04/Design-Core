import { Core } from '../../core/core/core.js';
import { EntityProperties } from '../../core/properties/entityProperties.js';
import { Property } from '../../core/properties/property.js';
import { Entity } from '../../core/entities/entity.js';

// initialise core
new Core();

/**
 * Minimal entity-like object for isolated EntityProperties tests.
 * @return {Object} plain object with layer and lineWidth fields
 */
function makeTarget() {
  return { layer: '0', lineWidth: 1 };
}

describe('EntityProperties.add / get', () => {
  test('get returns value after add', () => {
    const ep = new EntityProperties(makeTarget());
    ep.add('layer', { type: Property.Type.LIST, value: '0' });
    expect(ep.get('layer')).toBe('0');
  });

  test('get returns undefined for unknown property', () => {
    const ep = new EntityProperties(makeTarget());
    expect(ep.get('unknown')).toBeUndefined();
  });
});

describe('EntityProperties.set', () => {
  test('updates value in _store, readable via get', () => {
    const target = makeTarget();
    const ep = new EntityProperties(target);
    ep.add('layer', { type: Property.Type.LIST, value: target.layer });
    ep.set('layer', 'WALLS');
    expect(ep.get('layer')).toBe('WALLS');
  });

  test('no-op for unknown property', () => {
    const target = makeTarget();
    const ep = new EntityProperties(target);
    expect(() => ep.set('unknown', 'X')).not.toThrow();
  });

  test('no-op when property is readOnly', () => {
    const target = makeTarget();
    const ep = new EntityProperties(target);
    ep.add('type', { type: Property.Type.LABEL, value: 'Line', readOnly: true });
    ep.set('type', 'Circle');
    expect(ep.get('type')).toBe('Line');
  });
});

describe('EntityProperties.has', () => {
  test('returns true for registered property', () => {
    const ep = new EntityProperties(makeTarget());
    ep.add('layer', { type: Property.Type.LIST, value: '0' });
    expect(ep.has('layer')).toBe(true);
  });

  test('returns false for unregistered property', () => {
    const ep = new EntityProperties(makeTarget());
    expect(ep.has('layer')).toBe(false);
  });
});

describe('EntityProperties.remove', () => {
  test('removes a registered property', () => {
    const ep = new EntityProperties(makeTarget());
    ep.add('layer', { type: Property.Type.LIST, value: '0' });
    ep.remove('layer');
    expect(ep.has('layer')).toBe(false);
  });
});

describe('EntityProperties.list', () => {
  test('returns names of visible properties in registration order', () => {
    const ep = new EntityProperties(makeTarget());
    ep.add('layer', { type: Property.Type.LIST, value: '0' });
    ep.add('lineWidth', { type: Property.Type.NUMBER, value: 1 });
    ep.add('hidden', { type: Property.Type.LABEL, value: 'x', visible: false });
    expect(ep.list()).toEqual(['layer', 'lineWidth']);
  });
});

describe('EntityProperties.definition', () => {
  test('returns the Property descriptor', () => {
    const ep = new EntityProperties(makeTarget());
    ep.add('layer', { type: Property.Type.LIST, value: '0', dxfCode: 8 });
    const def = ep.definition('layer');
    expect(def).toBeInstanceOf(Property);
    expect(def.type).toBe(Property.Type.LIST);
    expect(def.dxfCode).toBe(8);
  });

  test('returns undefined for unknown property', () => {
    const ep = new EntityProperties(makeTarget());
    expect(ep.definition('unknown')).toBeUndefined();
  });
});

describe('Entity.properties integration', () => {
  test('entity has properties registered for layer, lineType, lineWidth, colour', () => {
    const e = new Entity();
    expect(e.properties.has('layer')).toBe(true);
    expect(e.properties.has('lineType')).toBe(true);
    expect(e.properties.has('lineWidth')).toBe(true);
    expect(e.properties.has('colour')).toBe(true);
  });

  test('properties values match entity fields at construction', () => {
    const e = new Entity({ layer: 'TEST', lineWidth: 5 });
    expect(e.properties.get('layer')).toBe('TEST');
    expect(e.properties.get('lineWidth')).toBe(5);
  });

  test('set updates _store value, readable via get', () => {
    const e = new Entity();
    e.properties.set('layer', 'DOORS');
    expect(e.properties.get('layer')).toBe('DOORS');
  });

  test('list returns the 4 registered property names', () => {
    const e = new Entity();
    expect(e.properties.list()).toEqual(['layer', 'lineType', 'lineWidth', 'colour']);
  });

  test('properties is non-enumerable on entity', () => {
    const e = new Entity();
    expect(Object.keys(e)).not.toContain('properties');
  });
});
