import { BaseProperty, PropertyType } from 'adminjs';

import { PropertyInformation } from './types.js';
import { getColumnType } from './utils/helpers.js';

class Property extends BaseProperty {
  private info: PropertyInformation;

  constructor(info: PropertyInformation) {
    super({ path: info.column.name });
    this.info = info;
  }

  name(): string {
    return this.info.column.name;
  }

  isEnum(): boolean {
    return Boolean(this.info.column.enumValues);
  }

  foreignColumnName(): string | null {
    if (!this.reference()) return null;
    return null;
  }

  isEditable(): boolean {
    if (this.info.column.isAutoIncrementing) {
      return false;
    }

    if (this.isId()) {
      return false;
    }

    return !this.info.column.hasDefaultValue;
  }

  isVisible(): boolean {
    // fields containing password are hidden by default
    return !this.name()
      .match('password');
  }

  isId(): boolean {
    // todo
    return this.info.column.name === 'id';
  }

  reference(): string | null {
    return null;
  }

  availableValues(): Array<string> | null {
    return this.info.column.enumValues || null;
  }

  isArray(): boolean {
    // todo
    return false;
  }

  type(): PropertyType {
    if (this.reference()) {
      return 'reference' as PropertyType;
    }

    return getColumnType(this.info.column.dataType);
  }

  isSortable(): boolean {
    return this.type() !== 'mixed' && !this.isArray();
  }

  isRequired(): boolean {
    return this.info.column.isNullable;
  }
}

export default Property;
