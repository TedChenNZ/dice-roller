import { sortWith, ascend } from "ramda";
import { rollDice, simpleRoll } from "./roll";

export interface IMinionRoll {
  attackRolls: number[];
  damageRolls: number[];
  toHit: number;
  hit: boolean;
  damage: number;
}

export interface IMobDamageInput {
  mobSize: number;
  toHitMod: number;
  damageDice: string;
  ac: number;
  advantage: boolean;
  disadvantage: boolean;
  average?: boolean;
}

export interface IMobDamageResult {
  minionRolls: IMinionRoll[];
  totalHits: number;
  totalDamage: number;
}

export function rollAttack({
  toHitMod,
  ac,
  advantage,
  disadvantage
}: {
  toHitMod: number;
  ac: number;
  advantage: boolean;
  disadvantage: boolean;
}) {
  const rollOnce = (!advantage && !disadvantage) || (advantage && disadvantage);
  const attackRolls: number[] = sortWith(
    [ascend(i => i)],
    rollDice(rollOnce ? 1 : 2, 20)
  );

  const attackRoll = attackRolls[rollOnce || disadvantage ? 0 : 1];
  return {
    attackRolls,
    hit: attackRoll + toHitMod >= ac,
    toHit: attackRoll + toHitMod
  };
}

export function rollMobDamageResults({
  mobSize,
  toHitMod,
  damageDice,
  ac,
  advantage,
  disadvantage,
  average
}: IMobDamageInput): IMobDamageResult {
  const calculateMinionRoll: () => IMinionRoll = () => {
    const attackRoll = rollAttack({
      toHitMod,
      ac,
      advantage,
      disadvantage
    });
    const damageRoll = simpleRoll(damageDice, average);
    return {
      ...attackRoll,
      damageRolls: damageRoll.rolls,
      damage: attackRoll.hit ? damageRoll.sum : 0
    };
  };
  if (mobSize > 500) {
    throw new Error("Mob size cannot be over 500");
  }
  const minionResults: IMinionRoll[] = [];
  for (let i = 0; i < mobSize; i++) {
    minionResults.push(calculateMinionRoll());
  }
  return {
    minionRolls: minionResults,
    totalHits: minionResults.filter(r => r.hit).length,
    totalDamage: minionResults
      .filter(r => r.hit)
      .map(r => r.damage)
      .reduce((prev, curr) => prev + curr, 0)
  };
}
