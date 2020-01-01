import * as R from 'ramda';
import {AliasesFileUsers} from './AliasesFile';
import {AwsEmailMap, AwsUserAlias, AwsEmail} from './AwsEmail';
import {emailAddDomain} from '../src/EmailUtil'

export default function aliasesFileToAwsMap(aliasesFileUsers: AliasesFileUsers, aliasesFileDomain: string, localUserToEntityId: ((localEmail: string) => AWS.WorkMail.WorkMailIdentifier|undefined)): AwsEmailMap {
  // TODO: Handle more than 100 aliases by creating groups
  let allAliases = R.flatten(aliasesFileUsers.users.map((localUser): AwsUserAlias[] => {
    let userEntityId = localUserToEntityId(localUser.localEmail)
    if (userEntityId === null) {
      throw `No AWS user for local user ${localUser.localEmail}`
    } else {
      return localUser.aliases.map( (alias): AwsUserAlias  => {
        let email = emailAddDomain(alias, aliasesFileDomain)
        return {kind: "AwsUserAlias", userEntityId: userEntityId || "", email}
      })
    }
  }))

  let allAliasesByEmail = R.groupBy((alias) => alias.email, allAliases)

  let [groups, regularAliases] = R.partition(alias => allAliasesByEmail[alias.email].length > 1, allAliases)

  console.log(groups) // TODO: Handle cases where multiple users have same alias, create groups

  return R.zipObj(regularAliases.map(a => a.email), regularAliases)
}