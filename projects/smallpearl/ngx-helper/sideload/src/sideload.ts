import { plural, singular } from 'pluralize';

/**
 * A function merge sideloaded content into the main object thereby returning
 * a composite object.
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
 * @returns
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

  const allRespKeys = Object.keys(resp);
  const targetObjResponse = resp[targetObjKey];
  if (!targetObjResponse) {
    return;
  }

  // all sideload keys, except the targetObjKey
  allRespKeys.splice(
    allRespKeys.findIndex((k) => k === targetObjKey),
    1
  );
  const allRespKeysSingular = allRespKeys.map(k => singular(k));

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
    'description',
    'notes',
    'desc',
  ]);
  if (idKey) {
    KEYS_TO_SKIP.add(idKey);
  }

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
      if (KEYS_TO_SKIP.has(key)) {
        continue;
      }
      const value = obj[key];
      if (typeof value === 'object') {
        mergeSideloadIntoObject(value, mergeStrategy, appendObjSuffix);
      } else if (typeof value !== 'number' || typeof value !== 'string') {
        let keyPlural = plural(key);
        let sideloadId = idKey;
        if (sideloadDataMap) {
          const sideloadDataMapEntry = sideloadDataMap.find(([objKey, sideloadDataKey]) => objKey.localeCompare(key) === 0);
          if (sideloadDataMapEntry) {
            keyPlural = sideloadDataMapEntry[1];
            if (sideloadDataMapEntry.length > 2) {
              sideloadId = sideloadDataMapEntry[2] as string;
              // console.log(`sideloadId for ${keyPlural}: ${sideloadId}`)
            }
          }
        }
        if (!allRespKeys.find((sk) => sk.localeCompare(keyPlural) == 0)) {
          continue;
        }
        // console.log(`sideloadId for ${keyPlural}: ${sideloadId}`)
        const sideloadData = Array.isArray(resp[keyPlural])
          ? resp[keyPlural]
          : [resp[keyPlural]];
        const matchingSideloadObj = sideloadData.find(
          (so: any) => so[sideloadId] === value
        );
        if (matchingSideloadObj) {
          obj[mergeStrategy === 'inplace' ? key : `${key}${appendObjSuffix}`] =
            matchingSideloadObj;
        }
      }
    }
    return obj;
  };

  entities.forEach((entity) => {
    mergeSideloadIntoObject(entity, mergeStrategy, appendObjSuffix);
  });

  return resp[targetObjKey];
}
