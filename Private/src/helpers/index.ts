export function msToHMS( ms: number ) : string {
    if (ms !== null) {
      return new Date(Number(ms)).toISOString().slice(11,19);
    }
    return ''
}

export function intl(string: string, intl_dir: Record<string, string>) {
  const translated = intl_dir[string];
  if (translated) return translated;
  return string;
}

export const bodypart = {
  Head: "Headshot",
  LeftArm: "Left Arm",
  RightArm: "Right Arm",
  LeftLeg: "Left Leg",
  RightLeg: "Right Leg",
  Chest: "Thorax",
};