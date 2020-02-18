import * as AWS from 'aws-sdk'
import {Workmail} from './AwsWorkMailUtil';
import {EmailOperation} from './EmailOperation';
import {EntityMap, WorkmailEntityCommon} from './WorkmailMap';
import { EmailAddr } from "./EmailAddr";
import { addGroupToEntityMap } from './GetWorkmailMap';

export type EntityMapUpdate = (_: EntityMap) => EntityMap

const noEntityMapUpdate: (_: any) => EntityMapUpdate = _ => entityMap => entityMap

export function createAwsWorkmailRequest(workmail: Workmail, entityMap: EntityMap, op: EmailOperation): Promise<EntityMapUpdate> {

  function resolveEntityId(email: EmailAddr): WorkmailEntityCommon {
    const entity = entityMap.byEmail[email.email]
    if (entity !== undefined) {
      return entity
    }

    throw `Can't resolve ${email.email} to a Workmail entityId`
  }

  switch (op.kind) {
    case "AddGroup": {
      const request: AWS.WorkMail.Types.CreateGroupRequest = {OrganizationId: workmail.organizationId, Name: op.group.name}
      console.log(`add group ${op.group.name} (${op.group.email.email})`)
      return workmail.service.createGroup(request)
        .promise()
        .then(result => {
          if (result.GroupId === undefined) {
            console.log(`adding group ${op.group.name} failed, no entityId received`)
            return (x) => x
          } else {
            let entityId = result.GroupId
            let registerRequest: AWS.WorkMail.Types.RegisterToWorkMailRequest = {OrganizationId: workmail.organizationId, EntityId: entityId, Email: op.group.email.email}
            return workmail.service.registerToWorkMail(registerRequest)
              .promise()
              .then( () => 
                (entityMap: EntityMap) => addGroupToEntityMap(entityMap, op.group, entityId))
          }
        })
    }
    case "AddGroupMember": {
      const groupEntity = resolveEntityId(op.group.email)
      const userEntity = resolveEntityId(op.member.email)
      const request: AWS.WorkMail.Types.AssociateMemberToGroupRequest = {OrganizationId: workmail.organizationId, GroupId: groupEntity.entityId, MemberId: userEntity.entityId}
      console.log(`add group member ${op.member.email.email} to ${op.group.name}`)
      return workmail.service.associateMemberToGroup(request).promise().then(noEntityMapUpdate)
    }
    case "AddGroupAlias": {
      const groupEntity = resolveEntityId(op.alias.group.email)
      const aliasEmail = op.alias.email.email
      const request = {OrganizationId: workmail.organizationId, EntityId: groupEntity.entityId, Alias: aliasEmail}
      console.log(`add alias ${aliasEmail} to group to ${op.alias.group.name}`)
      return workmail.service.createAlias(request).promise().then(noEntityMapUpdate)
    }
    case "AddUserAlias": {
      const userEntity = resolveEntityId(op.alias.user.email)
      const aliasEmail = op.alias.email.email
      const request = {OrganizationId: workmail.organizationId, EntityId: userEntity.entityId, Alias: aliasEmail}
      console.log(`add alias ${aliasEmail} to user ${userEntity.name}`)
      return workmail.service.createAlias(request).promise().then(noEntityMapUpdate)
    }
    case "RemoveGroupAlias": {
      const groupEntity = resolveEntityId(op.alias.group.email)
      const aliasEmail = op.alias.email.email
      const request = {OrganizationId: workmail.organizationId, EntityId: groupEntity.entityId, Alias: aliasEmail}
      console.log(`remove alias ${aliasEmail} from group ${groupEntity.name}`)
      return workmail.service.deleteAlias(request).promise().then(noEntityMapUpdate)
    }
    case "RemoveUserAlias": {
      const userEntity = resolveEntityId(op.alias.user.email)
      const aliasEmail = op.alias.email.email
      const request = {OrganizationId: workmail.organizationId, EntityId: userEntity.entityId, Alias: aliasEmail}
      console.log(`remove alias ${aliasEmail} from user ${userEntity.name}`)
      return workmail.service.deleteAlias(request).promise().then(noEntityMapUpdate)
    }
  }
}