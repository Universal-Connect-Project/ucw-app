import {
  CachedInstitution,
  JobTypeSupports,
  MappedJobTypes,
  Providers,
} from "./contract";
import { getAvailableProviders } from "./providers";

const institutionProvidersSupportEverything: CachedInstitution = {
  url: "testUrl",
  id: "testId",
  logo: "",
  is_test_bank: false,
  routing_numbers: [],
  name: "test",
  keywords: [],
  mx: {
    id: "mx",
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true,
  },
  sophtron: {
    id: "sophtron",
    supports_aggregation: true,
    supports_oauth: true,
    supports_identification: true,
    supports_verification: true,
    supports_history: true,
  },
};

const allProviders = [Providers.MX, Providers.SOPHTRON];

const filterOutProvider = (provider: Providers) =>
  allProviders.filter((currentProvider) => currentProvider !== provider);

const generateProviderTests = (provider: Providers) =>
  // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
  describe(`getAvailableProviders tests for provider: ${provider}`, () => {
    it(`doesnt return ${provider} if it's not in the supported providers`, () => {
      const providersWithoutCurrentProvider = filterOutProvider(provider);

      expect(
        getAvailableProviders({
          institution: institutionProvidersSupportEverything,
          jobType: MappedJobTypes.AGGREGATE,
          shouldRequireFullSupport: false,
          supportedProviders: providersWithoutCurrentProvider,
        }),
      ).toEqual(providersWithoutCurrentProvider);
    });

    it(`doesnt return ${provider} if it's not in the institution`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {},
          } as any,
          jobType: MappedJobTypes.AGGREGATE,
          shouldRequireFullSupport: false,
          supportedProviders: allProviders,
        }),
      ).toEqual(filterOutProvider(provider));
    });

    it(`doesnt return ${provider} if job type is all and supports_verification is falsy`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_verification: false,
            },
          },
          jobType: MappedJobTypes.ALL,
          shouldRequireFullSupport: false,
          supportedProviders: allProviders,
        }),
      ).toEqual(filterOutProvider(provider));
    });

    it(`doesnt return ${provider} if job type is all and supports_identification is falsy`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_identification: false,
            },
          },
          jobType: MappedJobTypes.ALL,
          shouldRequireFullSupport: false,
          supportedProviders: allProviders,
        }),
      ).toEqual(filterOutProvider(provider));
    });

    it(`doesnt return ${provider} if job type is verification and supports_verification is falsy`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_verification: false,
            },
          },
          jobType: MappedJobTypes.VERIFICATION,
          shouldRequireFullSupport: false,
          supportedProviders: allProviders,
        }),
      ).toEqual(filterOutProvider(provider));
    });

    it(`doesnt return ${provider} if job type is identity and supports_identity is falsy`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              supports_identification: false,
            },
          },
          jobType: MappedJobTypes.IDENTITY,
          shouldRequireFullSupport: false,
          supportedProviders: allProviders,
        }),
      ).toEqual(filterOutProvider(provider));
    });

    it(`returns ${provider} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is falsy, and shouldRequireFullSupport is false`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              [JobTypeSupports.FULLHISTORY]: false,
            },
          },
          jobType: MappedJobTypes.FULLHISTORY,
          shouldRequireFullSupport: false,
          supportedProviders: allProviders,
        }),
      ).toEqual(allProviders);
    });

    it(`returns ${provider} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is true, and shouldRequireFullSupport is true`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              [JobTypeSupports.FULLHISTORY]: true,
            },
          },
          jobType: MappedJobTypes.FULLHISTORY,
          shouldRequireFullSupport: true,
          supportedProviders: allProviders,
        }),
      ).toEqual(allProviders);
    });

    it(`doesnt return ${provider} if job type is fullhistory, ${JobTypeSupports.FULLHISTORY} is falsy, and shouldRequireFullSupport is true`, () => {
      expect(
        getAvailableProviders({
          institution: {
            ...institutionProvidersSupportEverything,
            [provider]: {
              ...institutionProvidersSupportEverything.mx,
              [JobTypeSupports.FULLHISTORY]: false,
            },
          },
          jobType: MappedJobTypes.FULLHISTORY,
          shouldRequireFullSupport: true,
          supportedProviders: allProviders,
        }),
      ).toEqual(filterOutProvider(provider));
    });
  });

describe("providers", () => {
  describe("getAvailableProviders", () => {
    it("returns all the providers if they support each of the job types", () => {
      Object.values(MappedJobTypes).forEach((mappedJobType) => {
        expect(
          getAvailableProviders({
            institution: institutionProvidersSupportEverything,
            jobType: mappedJobType,
            shouldRequireFullSupport: true,
            supportedProviders: allProviders,
          }),
        ).toEqual(allProviders);
      });
    });

    generateProviderTests(Providers.MX);

    generateProviderTests(Providers.SOPHTRON);
  });
});
