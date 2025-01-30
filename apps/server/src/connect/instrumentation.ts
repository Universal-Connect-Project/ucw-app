import { mapJobType } from "../utils";
import type { Context } from "../shared/contract";

export async function instrumentation(context: Context, input: any) {
  const { user_id } = input;
  context.user_id = user_id;

  if (!user_id) {
    return false;
  }

  if (Boolean(input.current_member_guid) && Boolean(input.current_aggregator)) {
    context.aggregator = input.current_aggregator;
    context.connection_id = input.current_member_guid;
  }

  context.job_type = mapJobType(input.job_type);
  context.scheme = "vcs";
  context.oauth_referral_source = "BROWSER";
  context.single_account_select = input.single_account_select;
  context.updated = true;
  return true;
}
