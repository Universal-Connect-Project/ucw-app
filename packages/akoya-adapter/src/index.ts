import { AkoyaAdapter } from "./adapter";
import type { AdapterDependencies } from "./models";

export const getAkoyaAdapterMapObject = (dependencies: AdapterDependencies) => {
  return {
    akoya: {
      testAdapterId: "akoya_sandbox",
      dataAdapter: () => {
        throw new Error("Data adapter not implemented for Akoya");
      },
      createWidgetAdapter: () =>
        new AkoyaAdapter({
          sandbox: false,
          dependencies,
        }),
    },
    akoya_sandbox: {
      dataAdapter: () => {
        throw new Error("Data adapter not implemented for Akoya");
      },
      createWidgetAdapter: () =>
        new AkoyaAdapter({
          sandbox: true,
          dependencies,
        }),
    },
  };
};

export { testInstitutions } from "./testInstitutions";
