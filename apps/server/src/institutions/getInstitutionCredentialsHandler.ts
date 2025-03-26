import type { Request, Response } from "express";
import { getAggregatorWidgetAdapter } from "../adapters/getAggregatorWidgetAdapter";

export interface GetInstitutionCredentialsRequest extends Request {
  params: {
    institution_guid: string;
  };
}

export const getInstitutionCredentialsHandler = async (
  req: GetInstitutionCredentialsRequest,
  res: Response,
) => {
  req.context.current_job_id = null;
  const aggregatorInstitutionId = req.params.institution_guid;

  const aggregatorAdapter = getAggregatorWidgetAdapter(req);

  const credentials = await aggregatorAdapter.ListInstitutionCredentials(
    aggregatorInstitutionId,
  );

  res.send(
    credentials.map((c) => ({
      ...c,
      guid: c.id,
      field_type: c.field_type === "PASSWORD" ? 1 : 3,
    })),
  );
};
