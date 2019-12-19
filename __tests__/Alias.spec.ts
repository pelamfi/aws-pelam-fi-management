import { AliasesPerUser, aliasesPerUser } from '../src/Alias';

describe('Converting aliases file data', () => {

  it('accepts empty data', () => {
    expect(aliasesPerUser({aliases: []})).toStrictEqual({ users: [] } as AliasesPerUser);
  });

  it('accepts simple data', () => {
    expect(aliasesPerUser({aliases: [{localEmail: "aliasfoo", targets: ["targetfoo"]}]})).toStrictEqual({ users: [{localEmail: "targetfoo", aliases: ["aliasfoo"]}] } as AliasesPerUser);
  });

});