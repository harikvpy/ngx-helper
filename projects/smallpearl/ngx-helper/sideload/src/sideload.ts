import { plural, singular } from 'pluralize';

/**
 * A function to merge sideloaded content into the main object thereby returning
 * a composite object.
 *
 * @param resp - the JSON response object, typically received from remote for
 * an HTTP request.
 * @param targetObjKey - the key name of the target object into which the
 * sideloaded data are to be merged.
 * @param idKey - idKey. Function assumes that all the objects use the same
 * key name as the unique object identifier.
 * @param sideloadDataMap: An array of [string, string], where the first
 * element specifies the property name of the target object and the second
 * element the sideload data element's key. This is useful when the the
 * target objet's property name that is to be merged with sideload data do not
 * match.
 * @returns Object with sideloaded data merged into the target object.
 */
export function sideloadToComposite(
  resp: any,
  targetObjKey: string,
  idKey: string = 'id',
  mergeStrategy: 'inplace' | 'append' = 'append',
  appendObjSuffix: string = 'Detail',
  sideloadDataMap?: Array<[string, string, string?]>
) {
  if (typeof resp !== 'object' && !Array.isArray(resp)) {
    return;
  }

  const targetObjKeySingular = singular(targetObjKey);
  const targetObjKeyPlural = plural(targetObjKey);

  const targetObjResponse = resp[targetObjKey];
  if (!targetObjResponse) {
    return;
  }

  // Normalize single target object into an array to simplify handling
  let entities: Array<any> = Array.isArray(targetObjResponse)
    ? targetObjResponse
    : [targetObjResponse];

  // standard keys that'll never be merged with sideloaded content
  const KEYS_TO_SKIP = new Set([
    'id',
    'number',
    'date',
    'time',
    'timestamp',
    'modified',
    'created',
    'createdAt',
    'updatedAt',
    'updated',
    'description',
    'notes',
    'desc',
    'description',
    'name',
    'firstName',
    'lastName',
    'fullName',
    'email',
    'telephone',
    'phone',
    'mobile',
    'address',
    'title',
    'content',
  ]);
  if (idKey) {
    KEYS_TO_SKIP.add(idKey);
  }
  const getSideloadPluralKey = (key: string) => {
    if (sideloadDataMap) {
      const entry = sideloadDataMap.find(([objKey]) => objKey === key);
      if (entry?.[1]) return entry[1];
    }
    // Prefer actual response keys to avoid pluralization mismatches
    if (resp.hasOwnProperty(key)) return key;
    const pluralKey = plural(key);
    if (resp.hasOwnProperty(pluralKey)) return pluralKey;
    return pluralKey;
  };
  const getSideloadDataKey = (key: string): string => {
    if (sideloadDataMap) {
      const entry = sideloadDataMap.find(([objKey]) => objKey === key);
      // Prefer explicit sideload data key if provided, else fallback to idKey
      if (entry) {
        return entry[2] ?? idKey;
      }
    }
    return idKey;
  };
  const isEntityKeyType = (value: string) =>
    typeof value === 'string' || typeof value === 'number';

  /**
   * Given an object, enumerates all keys of the object and for any key with
   * a matching sideload value, merges that into the 'obj', either by
   * replacing the matching key's value or by appending it as a new property.
   * If the value of a property is an object, recurses with the object as
   * first argument.
   * @param obj
   * @param mergeStrategy
   * @param appendObjSuffix
   * @returns
   */
  const mergeSideloadIntoObject = (
    obj: any,
    mergeStrategy: 'inplace' | 'append',
    appendObjSuffix: string = 'Detail'
  ) => {
    for (const key in obj) {
      if (
        // This check is needed to avoid infinite recursion, if one of the inner
        // objects has a key matching the targetObjKey's singular or plural form.
        key === targetObjKeySingular ||
        key === targetObjKeyPlural ||
        !Object.prototype.hasOwnProperty.call(obj, key) ||
        KEYS_TO_SKIP.has(key)
      ) {
        continue;
      }
      const value = obj[key];

      // Helper to get sideload data array for a key
      const getSideloadArray = (keyPlural: string) => {
        const data = resp[keyPlural];
        if (Array.isArray(data)) return data;
        if (data != null) return [data];
        return [];
      };

      if (Array.isArray(value) && value.length > 0) {
        if (isEntityKeyType(value[0])) {
          // Array of ids: merge sideloaded objects
          const keyPlural = getSideloadPluralKey(key);
          const sideloadId = getSideloadDataKey(key);
          const sideloadData = getSideloadArray(keyPlural);
          const matchingSideloadObjs = sideloadData.filter((so: any) =>
            value.includes(so?.[sideloadId])
          );
          if (matchingSideloadObjs.length > 0) {
            const targetKey =
              mergeStrategy === 'inplace'
                ? key
                : `${singular(key)}${appendObjSuffix}s`;
            obj[targetKey] = mergeSideloadIntoObjects(
              matchingSideloadObjs,
              mergeStrategy,
              appendObjSuffix
            );
          }
        } else {
          // Array of objects: recurse
          value.forEach((item: any) => {
            if (typeof item === 'object' && item !== null) {
              mergeSideloadIntoObject(item, mergeStrategy, appendObjSuffix);
            }
          });
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object: recurse
        mergeSideloadIntoObject(value, mergeStrategy, appendObjSuffix);
      } else if (isEntityKeyType(value)) {
        const keyPlural = getSideloadPluralKey(key);
        const sideloadId = getSideloadDataKey(key);
        const sideloadData = getSideloadArray(keyPlural);
        // The second check avoids duplicate merging of sideload data
        if (sideloadData.length > 0 && !Object.prototype.hasOwnProperty.call(obj, keyPlural)) {
          const matchingSideloadObj = sideloadData.find(
            (so: any) => so?.[sideloadId] === value
          );

          // Merge any FKs in the inner object with their sideloaded data
          const compositeSideloadObj = mergeSideloadIntoObject(
            matchingSideloadObj || {},
            mergeStrategy,
            appendObjSuffix
          );
          if (compositeSideloadObj) {
            const targetKey =
              mergeStrategy === 'inplace'
                ? key
                : `${singular(key)}${appendObjSuffix}`;
            obj[targetKey] = { ...compositeSideloadObj };
          }
          // if (matchingSideloadObj) {
          //   const targetKey =
          //     mergeStrategy === 'inplace'
          //       ? key
          //       : `${singular(key)}${appendObjSuffix}`;
          //   obj[targetKey] = { ...matchingSideloadObj };
          // }
        }
      }
    }
    return obj;
  };

  const mergeSideloadIntoObjects = (objs: Array<any>, mergeStrategy: 'inplace' | 'append', appendObjSuffix: string) => {
    return objs.map((obj) => {
      return mergeSideloadIntoObject(obj, mergeStrategy, appendObjSuffix);
    });
  };

  mergeSideloadIntoObjects(entities, mergeStrategy, appendObjSuffix);
  return resp[targetObjKey];
}
