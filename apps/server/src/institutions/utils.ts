import type {
  CachedInstitution,
  InstitutionSearchResponseItem,
} from "../shared/contract";

export const mapCachedInstitution = (
  ins: CachedInstitution,
): InstitutionSearchResponseItem => {
  const supportsOauth =
    ins?.mx?.supports_oauth || ins?.sophtron?.supports_oauth;
  // || ins.finicity.supports_oauth || ins.akoya.supports_oauth
  return {
    guid: ins.id,
    name: ins.name,
    url: ins.url,
    logo_url: ins.logo,
    supports_oauth: supportsOauth,
  };
};
