import * as R from 'ramda';
import * as AWS from 'aws-sdk'
import { EmailMap, EmailAddr, EmailGroup, Email, EmailUser } from './EmailMap'
import { filterUndef } from './UndefUtil';

export interface WorkmailEntityCommon {
  readonly entityId: AWS.WorkMail.WorkMailIdentifier,
  readonly name: string,
  readonly email?: EmailAddr
}

export type WorkmailUser = {kind: "WorkmailUser"} & WorkmailEntityCommon
export type WorkmailGroup = {kind: "WorkmailGroup"} & WorkmailEntityCommon
export type WorkmailEntity = WorkmailUser | WorkmailGroup

export type WorkmailEntityMap = {readonly [index: string]: WorkmailEntity}

export type EntityMap = {
  readonly byId: WorkmailEntityMap
  readonly byEmail: WorkmailEntityMap
}

export type WorkmailMap = {
  readonly entityMap: EntityMap,
  readonly emailMap: EmailMap
}

export function workmailMapFromEntities(entities: [WorkmailEntity, EmailAddr[]][]): WorkmailMap {

  const byId = R.zipObj(entities.map(entity => entity[0].entityId), entities.map(p => p[0]))

  const entitiesByEmails: WorkmailEntityMap[] = entities.map(entityPair => {
    const [entity, aliases] = entityPair
    const mainEmail = entity.email
    const emails: EmailAddr[] = [...(mainEmail === undefined ? [] : [mainEmail]), ...aliases]
    const pairs: [EmailAddr, WorkmailEntity][] = emails.map(email => [email, entity])
    return R.zipObj(pairs.map(p => p[0].email), pairs.map(p => p[1]))
  })

  const byEmail = R.mergeAll(entitiesByEmails)

  const entityMap: EntityMap = {byId, byEmail}

  const emailMapParts = entities.map((entityPair): Email[]|undefined => {
    const [entity, aliases] = entityPair
    const mainEmail = entity.email
    if (mainEmail === undefined) {
      return undefined
    }
    switch (entity.kind) {
      case "WorkmailGroup": {
          const group: EmailGroup = {kind: "EmailGroup", email: mainEmail, name: entity.name, members: []} // members are fetched later
          const aliasesObjs: Email[] = aliases.map(email => ({kind: "EmailGroupAlias", email, group}))
          return [group, ...aliasesObjs]
      }
      case "WorkmailUser": {
          const user: EmailUser = {kind: "EmailUser", email: mainEmail}
          const aliasesObjs: Email[] = aliases.map(email => ({kind: "EmailUserAlias", email, user}))
          return [user, ...aliasesObjs]
        }
      }
  })

  const emailMapItems = R.flatten(filterUndef(emailMapParts))
  const emailMap: EmailMap = R.zipObj(emailMapItems.map(i => i.email.email), emailMapItems)

  return {entityMap, emailMap}
}
