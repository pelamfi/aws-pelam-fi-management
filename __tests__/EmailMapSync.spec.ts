import { emailMapSync } from '../src/EmailMapSync';
import { EmailMap, EmailUser, EmailGroup } from '../src/EmailMap';
import { EmailOperation } from '../src/EmailOperation';
import { emailFrom } from '../src/Email';

const userEmail1 = emailFrom('user1@bar');
const userEmail2 = emailFrom('user2@bar');
const email1 = emailFrom('foo@bar');
const user1: EmailUser = { kind: 'EmailUser', email: userEmail1 };
const user2: EmailUser = { kind: 'EmailUser', email: userEmail2 };

describe('Generating operations to synchronize two EmailMaps', () => {
  it('accepts empty data', () => {
    expect(emailMapSync({}, {})).toStrictEqual([]);
  });

  it('creates alias', () => {
    const current: EmailMap = {};
    const target: EmailMap = {
      email1: { kind: 'EmailUserAlias', email: email1, user: user1 },
    };
    const expected: EmailOperation[] = [
      {
        kind: 'AddUserAlias',
        alias: { kind: 'EmailUserAlias', user: user1, email: email1 },
      },
    ];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });

  it('removes alias', () => {
    const current: EmailMap = {
      email1: { kind: 'EmailUserAlias', email: email1, user: user1 },
    };
    const target: EmailMap = {};
    const expected: EmailOperation[] = [
      {
        kind: 'RemoveUserAlias',
        alias: { kind: 'EmailUserAlias', user: user1, email: email1 },
      },
    ];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });
  it('removes and creates same alias for another user', () => {
    const current: EmailMap = {
      email1: { kind: 'EmailUserAlias', email: email1, user: user1 },
    };
    const target: EmailMap = {
      email1: { kind: 'EmailUserAlias', email: email1, user: user2 },
    };
    const expected: EmailOperation[] = [
      {
        kind: 'RemoveUserAlias',
        alias: { kind: 'EmailUserAlias', user: user1, email: email1 },
      },
      {
        kind: 'AddUserAlias',
        alias: { kind: 'EmailUserAlias', user: user2, email: email1 },
      },
    ];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });

  it('Does not do anything if alias is already there for correct user', () => {
    const current: EmailMap = {
      email1: { kind: 'EmailUserAlias', email: email1, user: user1 },
    };
    const target: EmailMap = {
      email1: { kind: 'EmailUserAlias', email: email1, user: user1 },
    };
    const expected: EmailOperation[] = [];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });

  it('Does not do anything if group is not changed', () => {
    const current: EmailMap = {
      email1: {
        kind: 'EmailGroup',
        email: email1,
        name: 'foogroup',
        members: [user1],
      },
    };
    const target: EmailMap = {
      email1: {
        kind: 'EmailGroup',
        email: email1,
        name: 'foogroup',
        members: [user1],
      },
    };
    const expected: EmailOperation[] = [];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });

  it('Removes and recreates a group if members have changed', () => {
    const group1: EmailGroup = {
      kind: 'EmailGroup',
      email: email1,
      name: 'foogroup',
      members: [user1],
    };
    const group1b: EmailGroup = {
      kind: 'EmailGroup',
      email: email1,
      name: 'foogroup',
      members: [user1, user2],
    };
    const current: EmailMap = { email1: group1 };
    const target: EmailMap = { email1: group1b };
    const expected: EmailOperation[] = [
      { kind: 'RemoveGroup', group: group1 },
      { kind: 'AddGroup', group: group1b },
      { kind: 'AddGroupMember', group: group1b, member: user1 },
      { kind: 'AddGroupMember', group: group1b, member: user2 },
    ];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });

  it('Removes a group if it does not exist anmyore', () => {
    const group1: EmailGroup = {
      kind: 'EmailGroup',
      email: email1,
      name: 'foogroup',
      members: [user1],
    };
    const current: EmailMap = { email1: group1 };
    const target: EmailMap = {};
    const expected: EmailOperation[] = [{ kind: 'RemoveGroup', group: group1 }];
    expect(emailMapSync(current, target)).toStrictEqual(expected);
  });
});
