import { jwtDecode } from "jwt-decode";

interface DecodedVc {
  vc: {
    credentialSubject: object;
  };
}

export const decodeVcData = (jwt: string): DecodedVc => {
  return jwtDecode(jwt);
};

export const getDataFromVCJwt = (jwt: string) => {
  const decodedVcData = decodeVcData(jwt);
  return decodedVcData?.vc?.credentialSubject;
};
