// Get the current date in UTC
export const getUnixDate = (date: Date | string | number): number => {
  const newDate = new Date(date);
  newDate.setUTCHours(0, 0, 0, 0); // Set to midnight UTC

  return newDate.getTime(); // Timestamp in UTC
};

export function toYMD(date: Date | string | number): string {
  date = new Date(date);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

type DateFormat = "clean" | "short" | "medium" | "long" | "full" | "custom";

interface CustomFormatOptions {
  weekday?: "narrow" | "short" | "long";
  year?: "numeric" | "2-digit";
  month?: "numeric" | "2-digit" | "narrow" | "short" | "long";
  day?: "numeric" | "2-digit";
}

export function formatDate(
  date: Date,
  format: DateFormat,
  customOptions?: CustomFormatOptions,
): string {
  const optionsMap: { [key in DateFormat]: Intl.DateTimeFormatOptions } = {
    clean: { month: "short", day: "numeric" },
    short: { year: "2-digit", month: "2-digit", day: "2-digit" },
    medium: { year: "numeric", month: "short", day: "numeric" },
    long: { year: "numeric", month: "long", day: "numeric" },
    full: { weekday: "long", year: "numeric", month: "long", day: "numeric" },
    custom: customOptions || {},
  };

  const options = optionsMap[format];

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function sortObjectByDateKeys(obj: { [key: string]: any }) {
  const sortedKeys = Object.keys(obj).sort((a, b) => {
    const dateA = new Date(`${a}T00:00:00`);
    const dateB = new Date(`${b}T00:00:00`);
    return dateA.getTime() - dateB.getTime();
  });

  const sortedObj: { [key: string]: any } = {};
  for (const key of sortedKeys) {
    sortedObj[key] = obj[key];
  }

  return sortedObj;
}
