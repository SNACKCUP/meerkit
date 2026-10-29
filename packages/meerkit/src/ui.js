// 터미널 출력 도우미. 색은 터미널일 때만, NO_COLOR이면 쓰지 않는다.
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const paint = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));

export const bold = paint("1");
export const dim = paint("2");
export const red = paint("31");
export const green = paint("32");
export const yellow = paint("33");
export const cyan = paint("36");

export const ok = (msg) => console.log(`${green("✔")} ${msg}`);
export const fail = (msg) => console.log(`${red("✖")} ${msg}`);
export const warn = (msg) => console.log(`${yellow("!")} ${msg}`);
export const info = (msg) => console.log(msg);
export const step = (n, total, title) => console.log(`\n${bold(`[${n}/${total}]`)} ${title}`);
