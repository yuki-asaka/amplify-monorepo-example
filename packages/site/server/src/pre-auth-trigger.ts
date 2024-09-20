import { PreAuthenticationTriggerEvent } from 'aws-lambda';

export const handler = async (
  event: PreAuthenticationTriggerEvent
): Promise<PreAuthenticationTriggerEvent> => {
  console.info('PreAuthenticationTriggerEvent received:', JSON.stringify(event));

  // ここで必要な処理を追加できます

  return event;
};
