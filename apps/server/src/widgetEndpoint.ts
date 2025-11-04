import { ComboJobTypes } from "@repo/utils";
import type { Request, Response } from "express";
import Joi from "joi";
import { aggregators, nonTestAggregators } from "./adapterSetup";
import fs from "node:fs";
import { get, set, del } from "./services/storageClient/redis";

import he from "he";
import path from "path";

const widgetSchema = Joi.object({
  connectionId: Joi.string(),
  institutionId: Joi.string(),
  jobTypes: Joi.string()
    .custom((value, helpers) => {
      const items = value.split(",") as ComboJobTypes[];
      const invalidItems = items.filter(
        (item) => !Object.values(ComboJobTypes).includes(item),
      );
      if (invalidItems.length > 0) {
        return helpers.error("any.invalid", { invalid: invalidItems });
      }
      return value;
    })
    .required(),
  aggregator: Joi.string().valid(...aggregators),
  singleAccountSelect: Joi.bool(),
  userId: Joi.string().required(), // Plaid doesn't need this but it's still required for securing the widget request
  token: Joi.string(),
  connectionToken: Joi.string(),
  aggregatorOverride: Joi.string().valid(...nonTestAggregators),
  targetOrigin: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .required(),
})
  .with("connectionId", ["institutionId", "aggregator"])
  .with("connectionToken", ["institutionId", "aggregator"])
  .when(Joi.object({ aggregator: Joi.exist() }).unknown(), {
    then: Joi.object({
      institutionId: Joi.required().messages({
        "any.required": "aggregator missing required peer institutionId",
      }),
    })
      .or("connectionToken", "connectionId")
      .messages({
        "object.missing":
          "aggregator missing required peer either connectionToken or connectionId",
      }),
  });

const setSecureToken = async ({
  prefix,
  token,
}: {
  prefix?: string;
  token?: string;
}): Promise<string | undefined> => {
  if (!token) {
    return undefined;
  }
  const uuid = crypto.randomUUID();
  const redisKey = `${prefix || "secured"}-${uuid}`;
  await set(redisKey, token, { EX: 60 * 5 });
  return uuid;
};

export interface WidgetParams {
  connectionId?: string;
  institutionId?: string;
  jobTypes: string;
  aggregator?: string;
  singleAccountSelect?: boolean;
  userId: string;
  token?: string;
  connectionToken?: string;
  aggregatorOverride?: string;
  targetOrigin: string;
}

export const validateWidgetParams = (
  params: unknown,
): { isValid: boolean; error?: string; validatedParams?: WidgetParams } => {
  const { error, value } = widgetSchema.validate(params);

  if (error) {
    return {
      isValid: false,
      error: he.encode(error.details[0].message),
    };
  }

  return {
    isValid: true,
    validatedParams: value as WidgetParams,
  };
};

export const createWidgetUrlHandler = async (req: Request, res: Response) => {
  const validation = validateWidgetParams(req.body);

  if (!validation.isValid) {
    res.status(400);
    res.send(validation.error);
    return;
  }

  const params = validation.validatedParams!;

  const { connectionId, userId } = params;
  const queryParams = new URLSearchParams();

  const connectionToken = await setSecureToken({
    prefix: "connection",
    token: connectionId,
  });

  if (connectionToken) {
    queryParams.append("connectionToken", connectionToken);
  }

  const authorizationHeaderToken = await setSecureToken({
    prefix: userId,
    token: req.headers?.authorization?.split(" ")?.[1],
  });

  if (authorizationHeaderToken) {
    queryParams.append("token", authorizationHeaderToken);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (key !== "connectionId" && value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  const protocol = req.protocol;
  const host = req.get("host");
  const baseUrl = `${protocol}://${host}/widget`;

  const widgetUrl = `${baseUrl}?${queryParams.toString()}`;

  res.json({ widgetUrl });
};

const setConnectionIdOnContext = async (
  req: Request,
): Promise<{ error?: string; connectionId?: string }> => {
  const connectionToken = req.query.connectionToken as string;
  const redisKey = `connection-${connectionToken}`;
  const storedConnectionId = await get(redisKey);
  if (storedConnectionId) {
    await del(redisKey);
    req.context.connectionId = storedConnectionId;
    return {};
  } else {
    return { error: "Invalid or expired connectionToken" };
  }
};

export const widgetHandler = async (req: Request, res: Response) => {
  const validation = validateWidgetParams({
    ...req.query,
  });

  if (!validation.isValid) {
    res.status(400);
    res.send(validation.error);
    return;
  }

  if (req.query.connectionToken) {
    const { error } = await setConnectionIdOnContext(req);
    if (error) {
      res.status(400).send(error);
      return;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (req as any).metricsPath = "/catchall";

  const html = fs.readFileSync(
    path.join(__dirname, "../../ui/dist/index.html"),
    "utf8",
  );
  res.send(html);
};
