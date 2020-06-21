import * as AWS from 'aws-sdk';
import * as R from 'ramda';
import { EmailGroup } from './EmailMap';
import { WorkmailGroup, EntityMap, WorkmailEntityMap } from './WorkmailMap';

export function addGroupToEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: AWS.WorkMail.WorkMailIdentifier,
): EntityMap {
  // TODO: members should be set to reflect updated state. Possibly add them with AddGroupMember operations
  const workmailGroup: WorkmailGroup = {
    kind: 'WorkmailGroup',
    name: group.name,
    email: group.email,
    entityId,
    members: [],
  };
  const byId = R.assoc(entityId, workmailGroup, entityMap.byEmail);
  const byEmail = R.assoc(group.email.email, workmailGroup, entityMap.byEmail);
  return { byId, byEmail };
}

export function removeGroupFromEntityMap(
  entityMap: EntityMap,
  group: EmailGroup,
  entityId: AWS.WorkMail.WorkMailIdentifier,
): EntityMap {
  const byId: WorkmailEntityMap = R.dissoc(entityId, entityMap.byEmail);
  const byEmail: WorkmailEntityMap = R.dissoc(
    group.email.email,
    entityMap.byEmail,
  );
  return { byId, byEmail };
}
