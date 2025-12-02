import { l as get } from './utils-D3IkxnGP.js';
import { a2 as getQueryResources, a3 as post, a4 as Picsure, a5 as resources, u as user } from './User-CeJunCPd.js';
import { f as features, b as branding } from './configuration-BAm0JRx1.js';
import { b as addConsents } from './Dictionary-Cym6J1qH.js';
import { Q as QueryV2, m as QueryV3, j as genomicFilters, c as filters, h as hasGenomicFilter, k as filterTree, e as advancedFilteringEnabled } from './Filter-DSKDPPqy.js';
import { e as exports } from './Export-DV6CwdT5.js';

async function loadAllConcepts() {
  const studies = await post(`${Picsure.Search}/${get(resources).hpdsOpen}`, {
    query: "\\_studies_consents\\"
  });
  const consentPaths = Object.keys(studies?.results?.phenotypes);
  return consentPaths;
}
const harmonizedPath = "\\DCC Harmonized data set";
const harmonizedConsentPath = "\\_harmonized_consent\\";
const topmedConsentPath = "\\_topmed_consents\\";
function getQueryRequestV2(addConsents2 = true, resourceUUID = get(resources).hpdsAuth, expectedResultType = "COUNT", mutateMethod = (q) => q) {
  return getBlankQueryRequestV2(
    !addConsents2,
    resourceUUID,
    expectedResultType,
    (query) => {
      [...get(genomicFilters), ...get(filters)].forEach((filter) => {
        if (filter.filterType === "Categorical") {
          if (filter.displayType === "restrict") {
            query.addCategoryFilter(filter.id, filter.categoryValues);
          } else {
            query.addRequiredField(filter.id);
          }
        } else if (filter.filterType === "numeric") {
          query.addNumericFilter(filter.id, filter.min || "", filter.max || "");
        } else if (filter.filterType === "genomic") {
          query.addCategoryVariantInfoFilters({
            Gene_with_variant: filter.Gene_with_variant,
            Variant_consequence_calculated: filter.Variant_consequence_calculated,
            Variant_frequency_as_text: filter.Variant_frequency_as_text
          });
        } else if (filter.filterType === "snp") {
          query.addSnpFilter(filter.snpValues);
        } else if (filter.filterType === "AnyRecordOf") {
          query.addAnyRecordOfMulti(filter.concepts);
        }
      });
      get(exports).forEach((exportedField) => {
        if (exportedField.conceptPath) {
          query.addField(exportedField.conceptPath);
        }
      });
      return mutateMethod(query);
    }
  );
}
function getBlankQueryRequestV2(isOpenAccess = false, resourceUUID = get(resources).hpdsAuth, expectedResultType = "COUNT", mutateMethod = (q) => q) {
  let query = new QueryV2();
  if (features.useQueryTemplate && !isOpenAccess) {
    const queryTemplate = get(user).queryTemplate;
    if (queryTemplate) {
      query = new QueryV2(structuredClone(queryTemplate));
    }
  }
  query = mutateMethod(query);
  if (features.requireConsents && !isOpenAccess) {
    query = updateConsentFilters(query);
  }
  query.expectedResultType = expectedResultType;
  return {
    query,
    resourceUUID
  };
}
const updateConsentFilters = (query) => {
  if (!hasHarmonizedPath(query.categoryFilters) && !hasHarmonizedPath(query.numericFilters) && !fieldsIncludeHarmonizedPath(query.fields) && !fieldsIncludeHarmonizedPath(query.requiredFields)) {
    query.removeCategoryFilter(harmonizedConsentPath);
  }
  if (!get(hasGenomicFilter)) {
    query.removeCategoryFilter(topmedConsentPath);
  }
  return query;
};
const hasHarmonizedPath = (obj) => {
  return Object.keys(obj).some((concept) => concept.includes(harmonizedPath));
};
const fieldsIncludeHarmonizedPath = (arr) => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};
const parseNumber = (input) => {
  if (input === null || input === void 0) return void 0;
  if (typeof input === "number") return Number.isFinite(input) ? input : void 0;
  const trimmed = input.trim();
  if (trimmed === "") return void 0;
  const normalized = trimmed.replace(/[,_\s\u00A0\u202F]/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : void 0;
};
function serializeQueryV3(query) {
  return JSON.parse(
    JSON.stringify(query, (key, value) => {
      if (key === "type") return void 0;
      return value;
    })
  );
}
function getClausesFromTree(tree) {
  if (tree.root.children.length === 0) return null;
  const groupClause = (operator) => ({
    type: "PhenotypicSubquery",
    operator,
    phenotypicClauses: [],
    not: false
  });
  const mapNode = (node) => {
    if (tree.isGroup(node)) {
      const newGroup = groupClause(node.operator);
      newGroup.phenotypicClauses = node.children.map(mapNode);
      return newGroup;
    }
    return convertPhenotypicFilterToClause(node);
  };
  return mapNode(tree.root);
}
function getQueryRequestV3(addConsents2 = true, resourceUUID = get(resources).hpdsAuth, expectedResultType = "COUNT", mutateMethod = (q) => q) {
  return getBlankQueryRequestV3(
    !addConsents2,
    resourceUUID,
    expectedResultType,
    (query) => {
      query.phenotypicClause = getClausesFromTree(get(filterTree));
      get(genomicFilters).forEach((filter) => {
        if (filter.filterType === "snp") {
          convertSnpFilterToClause(filter).forEach((genomicFilter) => {
            query.genomicFilters.push(genomicFilter);
          });
        } else if (filter.filterType === "genomic") {
          convertGenomicFilterToClause(filter).forEach((genomicFilter) => {
            query.genomicFilters.push(genomicFilter);
          });
        }
      });
      return mutateMethod(query);
    }
  );
}
function getBlankQueryRequestV3(isOpenAccess = false, resourceUUID = get(resources).hpdsAuth, expectedResultType = "COUNT", mutateMethod = (q) => q) {
  let query = new QueryV3();
  query.expectedResultType = expectedResultType;
  query = mutateMethod(query);
  if (features.requireConsents && !isOpenAccess) {
    addAuthorizationFiltersV3(query);
  }
  return {
    query: serializeQueryV3(query),
    resourceUUID
  };
}
function addAuthorizationFiltersV3(query) {
  if (features.useQueryTemplate) {
    const queryTemplate = get(user).queryTemplate;
    if (queryTemplate) {
      const consents = queryTemplate.categoryFilters;
      if (consents) {
        const consentsValues = consents["\\_consents\\"] || [];
        if (consentsValues.length > 0) {
          query.authorizationFilters.push({
            conceptPath: "\\_consents\\",
            values: consentsValues
          });
        }
        const harmonizedConsents = consents["\\_harmonized_consent\\"] || [];
        if (harmonizedConsents.length > 0) {
          query.authorizationFilters.push({
            conceptPath: "\\_harmonized_consent\\",
            values: harmonizedConsents
          });
        }
        const topmedConsents = consents["\\_topmed_consents\\"] || [];
        if (topmedConsents.length > 0) {
          query.authorizationFilters.push({
            conceptPath: "\\_topmed_consents\\",
            values: topmedConsents
          });
        }
      }
    }
  }
  if (features.requireConsents) {
    const hasHarmonizedInSelect = selectIncludesHarmonizedPathV3(query.select || []);
    const hasHarmonizedInPhenotype = phenotypicClauseIncludesHarmonizedPath(query.phenotypicClause);
    const hasAnyHarmonized = hasHarmonizedInSelect || hasHarmonizedInPhenotype;
    if (!hasAnyHarmonized) {
      query.authorizationFilters = (query.authorizationFilters || []).filter(
        (af) => af.conceptPath !== harmonizedConsentPath
      );
    }
    const hasGenomic = (query.genomicFilters || []).length > 0;
    if (!hasGenomic) {
      query.authorizationFilters = (query.authorizationFilters || []).filter(
        (af) => af.conceptPath !== topmedConsentPath
      );
    }
  }
}
const selectIncludesHarmonizedPathV3 = (arr) => {
  return arr.some((concept) => concept.includes(harmonizedPath));
};
const phenotypicClauseIncludesHarmonizedPath = (clause) => {
  if (!clause) return false;
  if (clause.type === "PhenotypicFilter") {
    const filterClause = clause;
    return !!filterClause.conceptPath && filterClause.conceptPath.includes(harmonizedPath);
  }
  const sub = clause;
  return (sub.phenotypicClauses || []).some(phenotypicClauseIncludesHarmonizedPath);
};
const convertPhenotypicFilterToClause = (filter) => {
  const newFilterClause = {
    type: "PhenotypicFilter",
    phenotypicFilterType: convertFilterTypeToClauseType(filter.filterType),
    conceptPath: filter.id,
    not: false
  };
  switch (filter.filterType) {
    case "AnyRecordOf":
      newFilterClause.phenotypicFilterType = "ANY_RECORD_OF";
      newFilterClause.values = filter.concepts;
      break;
    case "required":
      newFilterClause.phenotypicFilterType = "REQUIRED";
      break;
    case "numeric":
      if (filter.min === void 0 && filter.max === void 0) {
        newFilterClause.phenotypicFilterType = "REQUIRED";
      }
      if (filter.min !== void 0) {
        newFilterClause.min = parseNumber(filter.min);
      }
      if (filter.max !== void 0) {
        newFilterClause.max = parseNumber(filter.max);
      }
      break;
    case "Categorical":
      if (!filter.categoryValues?.length) {
        newFilterClause.phenotypicFilterType = "REQUIRED";
      } else {
        newFilterClause.values = filter.categoryValues;
      }
      break;
  }
  return newFilterClause;
};
const convertGenomicFilterToClause = (filter) => {
  const genomicFilters2 = [];
  const hasMinMax = filter.min !== void 0 && filter.min !== "" || filter.max !== void 0 && filter.max !== "";
  const hasCategoricalValues = filter.Gene_with_variant && filter.Gene_with_variant.length > 0 || filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0 || filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0;
  if (hasMinMax && !hasCategoricalValues) {
    const min = filter.min ? parseNumber(filter.min) : void 0;
    const max = filter.max ? parseNumber(filter.max) : void 0;
    return convertNumericGenomicFilterToClause("genomic_range", min, max);
  }
  if (filter.Gene_with_variant && filter.Gene_with_variant.length > 0) {
    genomicFilters2.push({
      key: "Gene_with_variant",
      values: filter.Gene_with_variant
    });
  }
  if (filter.Variant_consequence_calculated && filter.Variant_consequence_calculated.length > 0) {
    genomicFilters2.push({
      key: "Variant_consequence_calculated",
      values: filter.Variant_consequence_calculated
    });
  }
  if (filter.Variant_frequency_as_text && filter.Variant_frequency_as_text.length > 0) {
    genomicFilters2.push({
      key: "Variant_frequency_as_text",
      values: filter.Variant_frequency_as_text
    });
  }
  return genomicFilters2;
};
const convertSnpFilterToClause = (snps) => {
  const genomicFilters2 = [];
  (snps.snpValues || []).forEach((snp) => {
    genomicFilters2.push({
      key: snp.search,
      values: snp.constraint.split(",")
    });
  });
  return genomicFilters2;
};
const convertNumericGenomicFilterToClause = (key, min, max) => {
  if (min !== void 0 && max !== void 0) {
    return [{ key, min, max }];
  } else if (min !== void 0) {
    return [{ key, min }];
  } else if (max !== void 0) {
    return [{ key, max }];
  }
  return [];
};
function convertFilterTypeToClauseType(filterType) {
  switch (filterType) {
    case "Categorical":
    case "numeric":
      return "FILTER";
    case "AnyRecordOf":
      return "ANY_RECORD_OF";
    case "required":
      return "REQUIRED";
    case "snp":
      return "FILTER";
  }
  return "FILTER";
}
const PLUS_MINUS = "±";
function parseCount(count) {
  let value;
  let suffix;
  if (String(count).startsWith("<")) {
    suffix = 3;
    value = 0;
  } else {
    const [rawValue, rawSuffix] = String(count).split(PLUS_MINUS);
    value = parseInt(rawValue.replaceAll(",", "")) || 0;
    suffix = parseInt(rawSuffix ?? "") || 0;
  }
  return { value, suffix };
}
function normalizeCounts(countInput) {
  return countInput.flatMap((x) => typeof x === "object" ? Object.values(x) : x);
}
function countResult(results, asString = true) {
  const counts = normalizeCounts(results);
  if (counts.length === 0) return !features.federated ? void 0 : asString ? "0" : 0;
  if (counts.length === 1 && counts[0]?.toString().startsWith("<")) return counts[0];
  const parsed = counts.map(parseCount);
  const total = parsed.reduce((sum, { value }) => value > 0 ? sum + value : sum, 0);
  const maxSuffix = Math.max(...parsed.map(({ suffix }) => suffix), 0);
  if (!asString) return total;
  return maxSuffix > 0 ? `${total.toLocaleString()}${PLUS_MINUS}${maxSuffix}` : total.toLocaleString();
}
function rejectIfQueryError(result) {
  return result?.errorType ? Promise.reject("api error") : result;
}
const StatPromise = {
  list: (stat) => Object.entries(stat.result).map(([resourceName, promise]) => ({
    promise,
    resourceName
  })),
  rejected: (result) => result.status === "rejected",
  fullfiled: (result) => result.status === "fulfilled",
  valueOrZero: (result) => result.status === "fulfilled" ? result.value : 0
};
function getStatFields(key) {
  const statKeys = branding?.statFields ? Object.keys(branding?.statFields) : [];
  return statKeys.includes(key) ? branding?.statFields[key] : [];
}
function dictionaryRequest(isOpenAccess = false) {
  const request = { facets: [], search: "", consents: [] };
  return !isOpenAccess ? addConsents(request) : request;
}
function getFacetCategoryCount(category) {
  return function({ isOpenAccess }) {
    const request = dictionaryRequest(isOpenAccess);
    return post(Picsure.Facets, request).then((res) => {
      const facetCat = res.find((facetCat2) => facetCat2.name === category);
      if (!facetCat) {
        return 0;
      }
      if (isOpenAccess) {
        return facetCat.facets.length;
      }
      const facetsForUser = facetCat.facets.filter((facet) => facet.count > 0);
      return facetsForUser.length;
    }).then(rejectIfQueryError);
  };
}
function getConceptCount({ isOpenAccess }) {
  const request = dictionaryRequest(isOpenAccess);
  return post(`${Picsure.Concepts}?page_number=1&page_size=1`, request).then((res) => {
    return res.totalElements || Promise.reject("total not found");
  });
}
function blank({ addFilters, isOpenAccess, resource }) {
  const request = addFilters ? getQueryRequestV2(!isOpenAccess, resource, "COUNT") : getBlankQueryRequestV2(isOpenAccess, resource, "COUNT");
  return post(Picsure.QueryV2Sync, request).then(rejectIfQueryError);
}
function hardcoded({ stat }) {
  return Promise.resolve(stat?.value || 0);
}
async function getOpenPatientCount({
  addFilters,
  isOpenAccess,
  resource
}) {
  let request;
  const concepts = await loadAllConcepts();
  const addConceptsV3 = (query) => {
    query.select = concepts;
    return query;
  };
  const addConceptsV2 = (query) => {
    query.setCrossCountFields(concepts);
    return query;
  };
  if (isOpenAccess && features.explorer.enableOrQueries && get(advancedFilteringEnabled)) {
    request = addFilters ? getQueryRequestV3(!isOpenAccess, get(resources).hpdsOpenV3, "CROSS_COUNT", addConceptsV3) : getBlankQueryRequestV3(
      isOpenAccess,
      get(resources).hpdsOpenV3,
      "CROSS_COUNT",
      addConceptsV3
    );
  } else {
    request = addFilters ? getQueryRequestV2(!isOpenAccess, resource, "CROSS_COUNT", addConceptsV2) : getBlankQueryRequestV2(isOpenAccess, resource, "CROSS_COUNT", addConceptsV2);
  }
  return post(Picsure.QueryV2Sync, request).then(rejectIfQueryError).then((counts) => countResult([counts["\\_studies_consents\\"] || 0]));
}
function getAuthPatientCount({
  addFilters,
  isOpenAccess,
  resource
}) {
  const request = addFilters ? getQueryRequestV2(!isOpenAccess, resource, "COUNT") : getBlankQueryRequestV2(isOpenAccess, resource, "COUNT");
  return post(Picsure.QueryV2Sync, request).then(rejectIfQueryError);
}
function patientCount(options) {
  return options.isOpenAccess ? getOpenPatientCount(options) : getAuthPatientCount(options);
}
function getCrossCounts(field, type) {
  return function({
    addFilters,
    isOpenAccess,
    resource
  }) {
    const fields = getStatFields(field).map((f) => f.conceptPath);
    if (fields.length === 0) return Promise.reject(`${field} feilds were not configured`);
    const request = addFilters ? getQueryRequestV2(!isOpenAccess, resource, type) : getBlankQueryRequestV2(isOpenAccess, resource, type);
    const query = request.query;
    query.setCrossCountFields(fields);
    return post(Picsure.QueryV2Sync, request).then(rejectIfQueryError);
  };
}
function getConsentCount(type) {
  return function({
    addFilters,
    isOpenAccess,
    resource
  }) {
    const fields = getStatFields("query:consent");
    if (fields.length === 0) return Promise.reject("consent feilds were not configured");
    const categoryMap = fields.reduce(
      (map, field) => ({
        ...map,
        [field.conceptPath]: [...map[field.conceptPath] || [], field.id]
      }),
      {}
    );
    const request = addFilters ? getQueryRequestV2(!isOpenAccess, resource, type) : getBlankQueryRequestV2(isOpenAccess, resource, type);
    Object.entries(categoryMap).forEach(
      ([conceptPath, fieldList]) => request.query.addCategoryFilter(conceptPath, fieldList)
    );
    return post(Picsure.QueryV2Sync, request).then(rejectIfQueryError);
  };
}
const requestMap = {
  "dict:facets:dataset_id": getFacetCategoryCount("dataset_id"),
  "dict:concepts": getConceptCount,
  "query:blank": blank,
  "query:biosample": getCrossCounts("query:biosample", "OBSERVATION_CROSS_COUNT"),
  "query:genomic": getCrossCounts("query:genomic", "CROSS_COUNT"),
  "query:consent": getConsentCount("COUNT"),
  "query:patientCount": patientCount,
  hardcoded
};
function getResultList(isOpenAccess, list) {
  const validStats = list.filter((stat) => !!requestMap[stat.key]);
  if (validStats.length === 0) return [];
  return validStats.reduce((list2, stat) => {
    const statList = [...list2];
    statList.push({
      ...stat,
      auth: !isOpenAccess,
      result: getQueryResources(isOpenAccess).reduce((statMap, { name, uuid }) => {
        const newMap = { ...statMap };
        newMap[name] = requestMap[stat.key]({
          isOpenAccess,
          stat,
          resource: uuid,
          addFilters: true
        });
        return newMap;
      }, {})
    });
    return statList;
  }, []);
}

export { StatPromise as S, getStatFields as a, getQueryRequestV2 as b, countResult as c, getResultList as g };
//# sourceMappingURL=StatBuilder-C-7IIq7L.js.map
