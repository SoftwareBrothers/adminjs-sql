import { BaseProperty, PropertyType } from 'adminjs';

export type ColumnInfo = {
  name: string;
  isId: boolean;
  position: number;
  defaultValue?: string | number | boolean;
  isNullable: boolean;
  isEditable: boolean;
  type: PropertyType;
  referencedTable: string | null;
}

export class Property extends BaseProperty {
  private readonly _isPrimary: boolean;

  private readonly _isNullable: boolean;

  private readonly _isEditable: boolean;

  private readonly _referencedTable: string | null;

  private readonly _name: string;

  constructor(column: ColumnInfo) {
    const {
      name,
      isId,
      position,
      isNullable,
      isEditable,
      type,
      referencedTable,
    } = column;

    super({
      path: name,
      isId,
      position,
      type,
    });

    this._name = name;
    this._isPrimary = isId;
    this._isNullable = isNullable;
    this._isEditable = isEditable;
    this._referencedTable = referencedTable;
  }

  override isId(): boolean {
    return this._isPrimary;
  }

  override name(): string {
    return this._name;
  }

  override path(): string {
    return this._name;
  }

  override isEditable(): boolean {
    return this._isEditable && !this.isId();
  }

  override reference(): string | null {
    return this._referencedTable;
  }

  // eslint-disable-next-line class-methods-use-this
  override availableValues(): Array<string> | null {
    // Currently "availableValues" have to be set explicitly via resource options
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  override subProperties(): BaseProperty[] {
    return [];
  }

  override isRequired(): boolean {
    return !this._isNullable;
  }
}
